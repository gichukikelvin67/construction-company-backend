import {Request,Response} from "express";
import bcrypt from "bcryptjs";
import Company from "../models/Company.js";
import User from "../models/User.js";


export const register=async(
    req:Request,
    res:Response

):Promise<void>=>{
    try{
        const{CompanyName, name,email, password,phone}=req.body;

        if(!CompanyName || !name || !email ||!password || ! phone){
            res.status(400).json({
                success:false,
                message:"All fields are required",
            });

            return;
        }
            const existingUser=await User.findOne({email});

            if(existingUser){
                res.status(409).json({
                    success:false,
                    message:"A user with this email already exists",
                })
                return;

            }
            const existingCompany=await Company.findOne({
                email,
            })

            if(existingCompany){
                res.status(409).json({
                    success:false,
                    message:"A company with this email already exists",
                })

                return;
            }
            const hashedPassword=await bcrypt.hash(password,12);
            const company=await Company.create({

                
                    name:CompanyName,
                    email,
                    phone,
                


            })

            const user=await User.create({
                name,
                email,
                password:hashedPassword,
                company:company._id,
                role:"admin",
            })

            res.status(201).json({
                success:true,
                message:"Company and admin account created successfully",
                user:{
                    id: user._id,
                    name: user.name,
                    email:user.email,
                    role:user.role,
                    company:user.company,
                },
            })

        }catch (error){
console.error("Registration error:",error);
res.status(500).json({
    success:false,
    message:"Something went wrong during registration",

})
        }
    }

