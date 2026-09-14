import {Response}from "express";

import mongoose from "mongoose";
import Material from "../models/Material.js";

import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

//create material

export const createMaterial=async(
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
            code,
            description,
            unit,
            minimumStock,
        }=req.body;

        //check whether this material already exists

        const existingMaterial=await Material.findOne({
            company:req.user.company,
            name,
        })

        if(existingMaterial){
            res.status(409).json({
                success:false,
                message:"A material with this name already exists",
            })
            return;
        }
    //if a code was provided ,make sure it is unique

    if(code){
        const existingCode=await Material.findOne({
            company:req.user.company,
            code,
        })

        if(existingCode){
            res.status(409).json({
                success:false,
                message:"A material with this code already exists",
            })
            return;
        }
    }

    const material=await Material.create({
        name,
        code,
        description,
        unit,
        minimumStock,
        company:req.user.company,
        createdBy:req.user.id,
    });
    res.status(201).json({
        success:true,
        message:"Material created succefully",
        material,
    })
}catch(error){
    console.error("Create material error:",error);

    res.status(500).json({
        success:false,
        message:"Unable to create material",
    });
}
}

//GET ALL MATERIALS

export const getMaterials=async(
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


        const materials=await Material.find({
            company:req.user.company,
            isActive:true,
        })
        .populate("createdBy", "name email")
        .sort({name: 1});

        res.status(200).json({
            success:true,
            count:materials.length,
            materials,
        })
    }catch(error){
        console.error("Get materilas error:",error);

        res.status(500).json({
            success:false,
            message:"Unable to retrieve materials",
        })
    }
}
//GET SINGLE MATERIALS
export const getMaterial=async(
    req:AuthenticatedRequest,
    res:Response
):Promise<void>=>{
    try{
        if(!req.user){

            res.status(401).json({
                success:false,
                message:"Authentication required",
            })
            return;
        }

        const materialId=req.params.id as string;

        if(!mongoose.Types.ObjectId.isValid(materialId)){
            res.status(400).json({
                success:false,
                message:"Invalid material ID",
            })
            return;
        }

        const material=await Material.findOne({
            _id:materialId,
            company:req.user.company,
            isActive:true,
        }).populate("CreatedBy","name email");

        if(!material){
            res.status(404).json({
                success:false,
                message:"Material not found",
            })
            return;
        }

        res.status(200).json({
            success:true,
            material,
        })
    }catch(error){
        console.error("Get material error:",error);

        res.status(500).json({
          success:false,
          message:"Unable to retrieve material",
        })
    }
}