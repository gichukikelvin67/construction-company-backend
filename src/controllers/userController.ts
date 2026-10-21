import {Response}from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Session from "../models/Session.js";
import User from "../models/User.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { createAuditLog } from "../utils/auditLogger.js";
import cloudinary from "../config/cloudinary.js";
import { uploadProfilePhoto as uploadProfilePhotoToCloud } from "../services/profilePhotoService.js";

export const createUser=async(
    req:AuthenticatedRequest,
    res:Response
):Promise<void>=>{
    try{
        if(!req.user){
            res.status(401).json({
                success:false,
                message:"Authentication required"
            })
            return;
        }
        const {name,email,phone,password,role}=req.body;
        //Only administration can create company users
        if(req.user.role !== "admin"){
            res.status(403).json({
                success:false,
                message:"Only administration can create users",
            })
            return;
        }
        //Check whether the wmail is already being used

        const existingUser=await User.findOne({
            email:email.toLowerCase(),
        })
        if(existingUser){
            res.status(409).json({
                success:false,
                message:"A user with this email already exists"
            })
            return;
        }
        //Hash the password before storing it
        const hashedPassword=await bcrypt.hash(password,12);
        //Create the user inside the admin company
        const user=await User.create({
            name,
            email:email.toLowerCase(),
            phone,
            password:hashedPassword,
            role,
            company:req.user.company,
            isActive:true,
            emailVerified:false,
        })
        await createAuditLog({
  companyId: req.user.company,
  userId: req.user.id,
  action: "create",
  resource: "user",
  resourceId: user._id.toString(),
  description: `Created user ${user.name} with role ${user.role}`,
});
        res.status(201).json({
            success:true,
            message:"User created successfully",
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                role:user.role,
                company:user.company,
                isActive:user.isActive,
                emailVerified:user.emailVerified,
            },
        })
    }catch(error){
        console.error("Create user error:",error);
        res.status(500).json({
            success:false,
            message:"Failed to create user",
        })
    }
}
export const getUsers = async (
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

    const users = await User.find({
      company: req.user.company,
    })
      .select(
        "_id name email phone role isActive emailVerified createdAt updatedAt"
      )
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Get users error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve users",
    });
  }
};
export const updateUserStatus = async (
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

    const userId = req.params.id;

    if (typeof userId !== "string") {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
      return;
    }

    // Prevent an administrator from disabling their own account
    if (userId === req.user.id) {
      res.status(400).json({
        success: false,
        message: "You cannot change your own account status",
      });
      return;
    }

    const user = await User.findOne({
      _id: userId,
      company: req.user.company,
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }
     const previousStatus=user.isActive;
    user.isActive = !user.isActive;

    await user.save();
    await createAuditLog({
  companyId: req.user.company,
  userId: req.user.id,
  action: user.isActive ? "activate" : "deactivate",
  resource: "user",
  resourceId: user._id.toString(),
  description: user.isActive
    ? `Activated user ${user.name}`
    : `Deactivated user ${user.name}`,
  metadata: {
    previousStatus,
    newStatus: user.isActive,
  },
});

    res.status(200).json({
      success: true,
      message: user.isActive
        ? "User activated successfully"
        : "User deactivated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Update user status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update user status",
    });
  }
};

export const updateUserRole = async (
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

    const userId = req.params.id;

    if (typeof userId !== "string") {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
      return;
    }

    // An administrator cannot change their own role
    if (userId === req.user.id) {
      res.status(400).json({
        success: false,
        message: "You cannot change your own role",
      });
      return;
    }

    const user = await User.findOne({
      _id: userId,
      company: req.user.company,
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    const { role } = req.body;
    const previousRole=user.role;
    user.role = role;
    await user.save();


await createAuditLog({
  companyId: req.user.company,
  userId: req.user.id,
  action: "update",
  resource: "user",
  resourceId: user._id.toString(),
  description: `Changed ${user.name}'s role from ${previousRole} to ${user.role}`,
  metadata: {
    previousRole,
    newRole: user.role,
  },
});

    res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Update user role error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update user role",
    });
  }
};

//Get users by id
export const getUserById=async(
    req:AuthenticatedRequest,
    res:Response
):Promise<void> =>{
    try{
        if(!req.user){
         res.status(401).json({
            success:false,
            message:"Authentication required",
         })
         return;
        }

        const userId=req.params.id;

        if(typeof userId !== "string"){
            res.status(400).json({
                success:false,
                messsage:"Invalid user ID",
            })

            return;
        }
        if(!mongoose.Types.ObjectId.isValid(userId)){
            res.status(400).json({
                success:false,
                message:"Invalid user ID",
            })
            return;
        }
        const user=await User.findOne({
            _id:userId,
            company:req.user.company,
        }).select(
            "_id name email phone role isActive emailVerified createdAt updatedAt"
        );
        if(!user){
            res.status(404).json({
                success:false,
                message:"User not found",
            })
            return;
        }
        res.status(200).json({
            success:true,
            user,
        })
        
    }catch(error){
        console.error("Get user error:",error);

        res.status(500).json({
            success:false,
            message:"Failed to retrieve user",
        })
    }
}
export const updateUserProfile=async(
    req:AuthenticatedRequest,
    res:Response
):Promise<void> =>{
    try{
        if(!req.user){
            res.status(401).json({
                success:false,
                message:"Authentication required",
            })
            return;
        }
        const userId=req.params.id;
        if(typeof userId !== "string"){
            res.status(400).json({
                success:false,
                message:"Invalid user ID",
            })
            return;
        }
        if(!mongoose.Types.ObjectId.isValid(userId)){
            res.status(400).json({
                success:false,
                message:"Invalid user ID",
            })
            return;
        }
        const{name, email,phone}=req.body;
        
        const user=await User.findOne({
            _id: userId,
            company:req.user.company,
        })
        if(!user){
            res.status(404).json({
                success:false,
                message:"User not found",
            })
            return;
        }
        const previousValues = {
  name: user.name,
  email: user.email,
  phone: user.phone,
};
        //Check whether new email belongs to another user
        if(email !==undefined){
            const normalizedEmail=email.toLowerCase();
            const existingUser=await User.findOne({
                email:normalizedEmail,
                _id:{$ne:userId},
            })
            if(existingUser){
                res.status(409).json({
                    success:false,
                    message:"A user with email already exists",
                })
                return;
            }
            user.email=normalizedEmail;
        }

        if(name !==undefined){
            user.name=name;
        }
        if(phone !==undefined){
            user.phone=phone;
        }
        await user.save();
        await createAuditLog({
  companyId: req.user.company,
  userId: req.user.id,
  action: "update",
  resource: "user",
  resourceId: user._id.toString(),
  description: `Updated profile for user ${user.name}`,
  metadata: {
    previousValues,
    updatedValues: {
      name: user.name,
      email: user.email,
      phone: user.phone,
    },
  },
});

        res.status(200).json({
            success:true,
            message:"User profile updated successfully",
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                phone:user.phone,
                role:user.role,
                isActive:user.isActive,
                emailVerified:user.emailVerified,
            },
        })
    }catch(error){
        console.error("Update user profile error:",error);
        res.status(500).json({
            success:false,
            message:"Failed to update user profile",
        })
    }
}
// Get the authenticated user's own profile.
export const getMyProfile = async (
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

    const user = await User.findOne({
      _id: req.user.id,
      company: req.user.company,
    }).select(
      "_id name email phone role company isActive emailVerified profilePhoto createdAt updatedAt"
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Profile not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get own profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve profile",
    });
  }
};

// Update the authenticated user's own personal details.
export const updateMyProfile = async (
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

    const { name, phone } = req.body;

    if (
      name === undefined &&
      phone === undefined
    ) {
      res.status(400).json({
        success: false,
        message: "Provide a name or phone number to update",
      });
      return;
    }

    if (
      name !== undefined &&
      (typeof name !== "string" || !name.trim())
    ) {
      res.status(400).json({
        success: false,
        message: "Name must be a non-empty string",
      });
      return;
    }

    if (
      phone !== undefined &&
      typeof phone !== "string"
    ) {
      res.status(400).json({
        success: false,
        message: "Phone number must be a string",
      });
      return;
    }

    const user = await User.findOne({
      _id: req.user.id,
      company: req.user.company,
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Profile not found",
      });
      return;
    }

    const previousValues = {
      name: user.name,
      phone: user.phone,
    };

    if (name !== undefined) {
      user.name = name.trim();
    }

    if (phone !== undefined) {
      user.phone = phone.trim();
    }

    await user.save();

    await createAuditLog({
      companyId: req.user.company,
      userId: req.user.id,
      action: "update",
      resource: "user",
      resourceId: user._id.toString(),
      description: `Updated personal profile for ${user.name}`,
      metadata: {
        previousValues,
        updatedValues: {
          name: user.name,
          phone: user.phone,
        },
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    console.error("Update own profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
    });
  }
};

// Upload or replace the authenticated user's profile photo.
export const uploadMyProfilePhoto = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  let uploadedPublicId: string | undefined;

  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!req.file) {
      res.status(400).json({
        success: false,
        message: "Select a profile photo to upload",
      });
      return;
    }

    const user = await User.findOne({
      _id: req.user.id,
      company: req.user.company,
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Profile not found",
      });
      return;
    }

    const uploaded = await uploadProfilePhotoToCloud(
      req.file.buffer
    );

    uploadedPublicId = uploaded.publicId;

    const previousPublicId = user.profilePhotoPublicId;

    user.profilePhoto = uploaded.url;
    user.profilePhotoPublicId = uploaded.publicId;

    try {
      await user.save();
    } catch (error) {
      await cloudinary.uploader.destroy(uploaded.publicId, {
        resource_type: "image",
        invalidate: true,
      }).catch((cleanupError) => {
        console.error(
          "Failed to clean up an uncommitted profile photo:",
          cleanupError
        );
      });

      throw error;
    }

    if (
      previousPublicId &&
      previousPublicId !== uploaded.publicId
    ) {
      try {
        await cloudinary.uploader.destroy(previousPublicId, {
          resource_type: "image",
          invalidate: true,
        });
      } catch (cleanupError) {
        console.error(
          "Failed to remove the previous profile photo:",
          cleanupError
        );
      }
    }

    await createAuditLog({
      companyId: req.user.company,
      userId: req.user.id,
      action: "update",
      resource: "user",
      resourceId: user._id.toString(),
      description: `Updated profile photo for ${user.name}`,
    });

    res.status(200).json({
      success: true,
      message: "Profile photo updated successfully",
      profilePhoto: user.profilePhoto,
    });
  } catch (error) {
    console.error("Upload profile photo error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to upload profile photo",
    });
  }
};

// Remove the authenticated user's profile photo.
export const removeMyProfilePhoto = async (
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

    const user = await User.findOne({
      _id: req.user.id,
      company: req.user.company,
    });

    if (!user) {
      res.status(404).json({
        success: false,
        message: "Profile not found",
      });
      return;
    }

    if (!user.profilePhoto && !user.profilePhotoPublicId) {
      res.status(200).json({
        success: true,
        message: "No profile photo to remove",
        profilePhoto: null,
      });
      return;
    }

    const previousPhoto = user.profilePhoto;
    const previousPublicId = user.profilePhotoPublicId;

    user.profilePhoto = null;
    user.profilePhotoPublicId = null;

    await user.save();

    if (previousPublicId) {
      try {
        await cloudinary.uploader.destroy(previousPublicId, {
          resource_type: "image",
          invalidate: true,
        });
      } catch (cleanupError) {
        console.error(
          "Failed to delete removed profile photo from Cloudinary:",
          cleanupError
        );
      }
    }

    await createAuditLog({
      companyId: req.user.company,
      userId: req.user.id,
      action: "update",
      resource: "user",
      resourceId: user._id.toString(),
      description: `Removed profile photo for ${user.name}`,
      metadata: {
        hadProfilePhoto: Boolean(previousPhoto),
      },
    });

    res.status(200).json({
      success: true,
      message: "Profile photo removed successfully",
      profilePhoto: null,
    });
  } catch (error) {
    console.error("Remove profile photo error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to remove profile photo",
    });
  }
};
export const getMyRegionalPreferences = async (
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

    const user = await User.findById(req.user.id).select(
      "language timezone currency"
    );

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      preferences: {
        language: user.language ?? "en",
        timezone: user.timezone ?? "Africa/Nairobi",
        currency: user.currency ?? "KES",
      },
    });
  } catch (error) {
    console.error("Get regional preferences error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve regional preferences",
    });
  }
};

export const updateMyRegionalPreferences = async (
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

    const { language, timezone, currency } = req.body;

    const allowedLanguages = ["en", "sw"];
    const allowedTimezones = ["Africa/Nairobi", "UTC"];
    const allowedCurrencies = ["KES", "USD"];

    if (
      !allowedLanguages.includes(language) ||
      !allowedTimezones.includes(timezone) ||
      !allowedCurrencies.includes(currency)
    ) {
      res.status(400).json({
        success: false,
        message: "Invalid language, timezone, or currency preference",
      });
      return;
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    user.language = language;
    user.timezone = timezone;
    user.currency = currency;

    await user.save();

    await createAuditLog({
      companyId: user.company.toString(),
      userId: user._id.toString(),
      action: "update",
      resource: "user",
      resourceId: user._id.toString(),
      description: "Updated regional preferences",
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.status(200).json({
      success: true,
      message: "Regional preferences saved successfully",
      preferences: {
        language: user.language,
        timezone: user.timezone,
        currency: user.currency,
      },
    });
  } catch (error) {
    console.error("Update regional preferences error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save regional preferences",
    });
  }
};
export const deactivateMyAccount = async (
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

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({
        success: false,
        message: "User not found",
      });
      return;
    }

    if (!user.isActive) {
      res.status(400).json({
        success: false,
        message: "Your account is already deactivated",
      });
      return;
    }

    user.isActive = false;
    await user.save();

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

    await createAuditLog({
      companyId: user.company.toString(),
      userId: user._id.toString(),
      action: "deactivate",
      resource: "user",
      resourceId: user._id.toString(),
      description: `User ${user.name} deactivated their own account`,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    res.clearCookie("refreshToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/auth",
    });

    res.status(200).json({
      success: true,
      message: "Account deactivated successfully",
    });
  } catch (error) {
    console.error("Deactivate account error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to deactivate account",
    });
  }
};