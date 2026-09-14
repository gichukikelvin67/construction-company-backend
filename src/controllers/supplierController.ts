import{Response}from "express";

import mongoose from "mongoose";

import Supplier from "../models/Supplier.js";

import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { success } from "zod";

//create supplier
export const createSupplier=async(
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

        const{
            name,
            phone,
            email,
            address,
            contactPerson,
            notes,
        }=req.body;

        const existingSupplier=await Supplier.findOne({
            company:req.user.company,
            $or:[
                {name},
                ...(email ? [{email}]:[]),
            ],
        })

        if(existingSupplier){
            res.status(409).json({
                success:false,
                message:"A supplier with these details already exists",
            })
            return;
        }

        const supplier=await Supplier.create({
            name,
            phone,
            email,
            address,
            contactPerson,
            notes,
            company:req.user.company,
            createdBy:req.user.id,
        })

        res.status(201).json({
            success:true,
            message:"Supplier created successfully",
            supplier,
        })
    }catch(error){
        console.error("Create supplier error:",error);

        res.status(500).json({
            success:false,
            message:"Unable to create supplier",
        })
    }
}

//create all supplier

export const getSuppliers=async(
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

        const suppliers=await Supplier.find({
            company:req.user.company,
        })
        .populate("createdBy","name email")
        .sort({createdAt: -1});

        res.status(200).json({
            success:true,
            count:getSuppliers.length,
            suppliers,
        })
    }catch(error){
        console.error("Get suppliers error:", error);

        res.status(500).json({
            success:false,
            message:"Unable to retrieve suppliers",
        })
    }
}

//get single supplier

export const getSupplier=async(
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

         const supplierId=req.params.id as string;

         if(!mongoose.Types.ObjectId.isValid(supplierId)){
            res.status(400).json({
                success:false,
                message:"Invalid supplier ID",
            })

            return;
         }
         const supplier=await Supplier.findOne({
            _id: supplierId,
            company:req.user.company,

         }).populate("createdBy","name email");

         if(!supplier){
            res.status(404).json({
                success:false,
                message:"Supplier not found",
            })
            return;
         }

         res.status(200).json({
            success:true,
            supplier,
         })
    }catch(error){
        console.error("Get supplier error:",error);

        res.status(500).json({
            success:false,
            message:"Unable to retrieve supplier",
        })
    }
}

