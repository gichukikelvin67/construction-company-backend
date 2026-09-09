import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import Company from "../models/Company.js";
import User from "../models/User.js";
import {
  generateAccessToken,
  generateRefreshToken
} from "../utils/generateTokens.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

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
    });

    res.status(201).json({
      success: true,
      message: "Company and admin account created successfully",
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