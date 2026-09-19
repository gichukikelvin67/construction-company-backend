import {Response}from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

import User from "../models/User.js";
import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

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

    user.isActive = !user.isActive;

    await user.save();

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

    user.role = role;

    await user.save();

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