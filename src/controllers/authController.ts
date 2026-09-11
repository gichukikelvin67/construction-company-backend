import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Company from "../models/Company.js";
import User from "../models/User.js";
import Session from "../models/Session.js";
import { hashToken } from "../utils/hashToken.js";
import {
  generateAccessToken,
  generateRefreshToken
} from "../utils/generateTokens.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import jwt from "jsonwebtoken";
import { sendPasswordResetEmail } from "../services/emailService.js";

import { generateVerificationToken } from "../utils/generateVerificationToken.js";
import { sendVerificationEmail } from "../services/emailService.js";
import { success } from "zod";


export const register = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { companyName, name, email, password, phone } = req.body;

    if (!companyName || !name || !email || !password || !phone) {
      res.status(400).json({
        success: false,
        message: "All fields are required",
      });

      return;
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: "A user with this email already exists",
      });

      return;
    }

    const existingCompany = await Company.findOne({
      email,
    });

    if (existingCompany) {
      res.status(409).json({
        success: false,
        message: "A company with this email already exists",
      });

      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verificationToken = generateVerificationToken();

const verificationTokenHash = hashToken(
  verificationToken
);

    const company = await Company.create({
      name: companyName,
      email,
      phone,
    });

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      company: company._id,
      role: "admin",

      emailVerified:false,
      emailVerificationToken:verificationTokenHash,
      emailVerificationExpires:new Date(
        Date.now() +15 *60 *1000
      ),
    });
    await sendVerificationEmail(
  email,
  name,
  verificationToken
);

    res.status(201).json({
      success: true,
      message: "Account created successfully.Please check your email to verify your account.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong during registration",
    });
  }
};

export const login =async(
    req:Request,
    res:Response
):Promise<void> =>{
    try{
        const {email,password}=req.body;

        if(!email || !password){
            res.status(400).json({
                success:false,
                message:"Email and password are required",
            })
            return;

        }
        const user=await User.findOne({email: email.toLowerCase().trim(),}).select("+password");

        if(!user){
            res.status(401).json({
                success:false,
                message:"Invalid email or password",
            })
            return;
        }

        if(!user.isActive){
            res.status(403).json({
                success:false,
                message: "This account has been created",
            })
            return;
        }

        const passwordMatches=await bcrypt.compare(
            password,
            user.password
        )
        if(!passwordMatches){
            res.status(401).json({
                success:false,
                message:"invalid email or password",
            })
            return;
        }

        const accessToken=generateAccessToken(
            user._id.toString()
        )

        const refreshToken=generateRefreshToken(
            user._id.toString()
        )
const refreshTokenHash = hashToken(refreshToken);

await Session.create({
  user: user._id,
  refreshTokenHash,
  expiresAt: new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000
  ),
  revokedAt: null,
});


        res.cookie("refreshToken", refreshToken,{
            httpOnly:true,
            secure:process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 7 * 24 * 60 *60 *1000,
            path: "/api/auth",
        })

        

        res.status(200).json({
            success:true,
            message:"Login successful",
            accessToken,
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                role:user.role,
                company:user.company,
            },
        })

    }catch (error){
        console.error("Login error:", error);

        res.status(500).json({
            success:false,
            message:
            error instanceof Error
            ?error.message
            
            :"Something went wrong during login",
        })
    }
}

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });

      return;
    }

    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });

      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};

export const refreshAccessToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      res.status(401).json({
        success: false,
        message: "Refresh token not found",
      });

      return;
    }

    const secret = process.env.JWT_REFRESH_SECRET;

    if (!secret) {
      throw new Error("JWT_REFRESH_SECRET is not defined");
    }

    const decoded = jwt.verify(
      refreshToken,
      secret
    ) as {
      userId: string;
    };

    const refreshTokenHash = hashToken(refreshToken);

    /*
     * Find the session belonging to this refresh token.
     */
    const session = await Session.findOne({
      refreshTokenHash,
      user: decoded.userId,
    });

    /*
     * No session means this refresh token was never
     * issued by our application.
     */
    if (!session) {
      res.status(401).json({
        success: false,
        message: "Refresh token is not recognized",
      });

      return;
    }

    /*
     * If the token was already revoked, somebody is
     * trying to use an old refresh token.
     */
    if (session.revokedAt) {
      console.warn(
        `Refresh token reuse detected for user ${decoded.userId}`
      );

      /*
       * Revoke every active session belonging to this user.
       */
      await Session.updateMany(
        {
          user: decoded.userId,
          revokedAt: null,
        },
        {
          $set: {
            revokedAt: new Date(),
          },
        }
      );

      /*
       * Remove the suspicious refresh token from
       * the browser.
       */
      res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/api/auth",
      });

      res.status(401).json({
        success: false,
        message:
          "Refresh token reuse detected. Please log in again.",
      });

      return;
    }

    /*
     * Check whether the refresh token has expired
     * in our database.
     */
    if (session.expiresAt < new Date()) {
      session.revokedAt = new Date();

      await session.save();

      res.status(401).json({
        success: false,
        message: "Refresh token has expired",
      });

      return;
    }

    /*
     * Find the user.
     */
    const user = await User.findById(decoded.userId);

    if (!user) {
      session.revokedAt = new Date();

      await session.save();

      res.status(401).json({
        success: false,
        message: "User no longer exists",
      });

      return;
    }

    /*
     * Disabled users cannot refresh their session.
     */
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: "Your account has been disabled",
      });

      return;
    }

    /*
     * The old refresh token has now been used.
     * Kill it permanently.
     */
    session.revokedAt = new Date();

    await session.save();

    /*
     * Create a completely new pair of tokens.
     */
    const newAccessToken = generateAccessToken(
      user._id.toString()
    );

    const newRefreshToken = generateRefreshToken(
      user._id.toString()
    );

    /*
     * Never store the actual refresh token.
     * Store only its SHA-256 hash.
     */
    const newRefreshTokenHash = hashToken(
      newRefreshToken
    );

    /*
     * Create a new session for the new refresh token.
     */
    await Session.create({
      user: user._id,
      refreshTokenHash: newRefreshTokenHash,
      expiresAt: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ),
      revokedAt: null,
    });

    /*
     * Replace the old browser cookie with the new one.
     */
    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth",
    });

    res.status(200).json({
      success: true,
      accessToken: newAccessToken,
    });
  } catch (error) {
    console.error("Refresh token error:", error);

    res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};
//logout
export const logout = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (refreshToken) {
      const refreshTokenHash = hashToken(refreshToken);

      await Session.findOneAndUpdate(
        {
          refreshTokenHash,
          revokedAt: null,
        },
        {
          revokedAt: new Date(),
        }
      );
    }

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth",
    });

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong during logout",
    });
  }
};

//VERIFY EMAIL
export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({
        success: false,
        message: "Verification token is required",
      });

      return;
    }

    // Hash the token received from the user
    const tokenHash = hashToken(token);

    // Find the user using the hashed token
    const user = await User.findOne({
      emailVerificationToken: tokenHash,
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid verification token",
      });

      return;
    }

    // Check whether the token has expired
    if (
      !user.emailVerificationExpires ||
      user.emailVerificationExpires < new Date()
    ) {
      res.status(400).json({
        success: false,
        message: "Verification token has expired",
      });

      return;
    }

    // Check if the email was already verified
    if (user.emailVerified) {
      res.status(400).json({
        success: false,
        message: "Email is already verified",
      });

      return;
    }

    // Mark email as verified
    user.emailVerified = true;

    // Delete the verification token
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);

    res.status(500).json({
      success: false,
      message: "Something went wrong during email verification",
    });
  }
};

export const forgotPassword=async(
    req:Request,
    res:Response
):Promise<void> =>{
    try{
        const{email}=req.body;

        if (!email){
            res.status(400).json({
                success:false,
                message:"Email is required",
            })
            return;
        }

        const normalizedEmail=email.toLowerCase().trim();

        const user=await User.findOne({
            email:normalizedEmail,
        })
        //Always return same response.
        //this prevents attacker drom discovering which emails
        //have accounts in our system.

        if(!user){
            res.status(200).json({
               success:true,
               message:"If an account with that email exists,a password reset link has been sent"
            })
            return;
        }
        const resetToken=generateVerificationToken();
        const resetTokenHash=hashToken(resetToken);

        user.passwordResetToken=resetTokenHash;
        user.passwordResetExpires=new Date(
            Date.now() + 15 * 60 *1000
        )
        await user.save();

        await sendPasswordResetEmail(
            user.email,
            user.name,
            resetToken
        )
        res.status(200).json({
            success:true,
            message:"If an account with that email exists, a password reset link has been sent.",

        })
    }catch(error){
        console.error("Forgot password error:", error);

        res.status(500).json({
            success:false,
            message:"Unable to process reset request",
        })
    }
}
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({
        success: false,
        message: "Token and new password are required",
      });
      return;
    }

    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
      return;
    }

    const tokenHash = hashToken(token);

    const user = await User.findOne({
      passwordResetToken: tokenHash,
    }).select("+password");

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired password reset link",
      });
      return;
    }

    if (
      !user.passwordResetExpires ||
      user.passwordResetExpires < new Date()
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired password reset link",
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    user.password = hashedPassword;

    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    user.passwordChangedAt = new Date();

    await user.save();

    // Destroy all existing login sessions.
    // This means somebody who already had access to the
    // account must log in again with the new password.
    await Session.updateMany(
      {
        user: user._id,
        revokedAt: null,
      },
      {
        $set: {
          revokedAt: new Date(),
        },
      }
    );

    res.status(200).json({
      success: true,
      message:
        "Password reset successfully. Please log in with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to reset password",
    });
  }
};