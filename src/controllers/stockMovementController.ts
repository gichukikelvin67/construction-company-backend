import { Response } from "express";

import mongoose from "mongoose";

import StockMovement from "../models/StockMovement.js";
import Material from "../models/Material.js";
import Supplier from "../models/Supplier.js";
import Project from "../models/Project.js";

import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

//GET CURRENT STOCK

const calculateCurrentStock=async(
    materialId:string,
    companyId: string
):Promise<number> =>{
    const movements=await StockMovement.find({
        material:materialId,
        company:companyId,
    })

    let stock=0;

    for(const movement of movements){
        if(
            movement.type==="receipt"||
            movement.type==="return"
        ){

            stock += movement.quantity;
        }

        if(movement.type ==="issue"){
            stock -=movement.quantity;
        }

        if(movement.type==="adjustment"){
            stock +=movement.quantity;
        }
    }
    return stock;
}

// GET MATERIAL CURRENT STOCK

export const getMaterialStock = async (
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

    const  materialId  = req.params.materialId;

    if (typeof materialId !== "string") {
      res.status(400).json({
        success: false,
        message: "Invalid material ID",
      });
      return;
    }

    const material = await Material.findOne({
      _id: materialId,
      company: req.user.company,
      isActive: true,
    });

    if (!material) {
      res.status(404).json({
        success: false,
        message: "Material not found",
      });
      return;
    }

    const currentStock = await calculateCurrentStock(
      materialId,
      req.user.company
    );

    res.status(200).json({
      success: true,
      material: {
        id: material._id,
        name: material.name,
        code: material.code,
        unit: material.unit,
        minimumStock: material.minimumStock,
      },
      currentStock,
      lowStock: currentStock <= material.minimumStock,
    });
  } catch (error) {
    console.error("Get material stock error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to get material stock",
    });
  }
};
// GET MATERIAL MOVEMENT HISTORY

export const getMaterialMovements = async (
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

    const materialId  = req.params.materialId;

    if (typeof materialId !== "string") {
      res.status(400).json({
        success: false,
        message: "Invalid material ID",
      });
      return;
    }

    const material = await Material.findOne({
      _id: materialId,
      company: req.user.company,
      isActive: true,
    });

    if (!material) {
      res.status(404).json({
        success: false,
        message: "Material not found",
      });
      return;
    }

    const movements = await StockMovement.find({
      material: materialId,
      company: req.user.company,
    })
      .populate("supplier", "name phone")
      .populate("project", "name location")
      .populate("createdBy", "name email")
      .sort({ movementDate: -1 });

    res.status(200).json({
      success: true,
      material: {
        id: material._id,
        name: material.name,
        code: material.code,
        unit: material.unit,
      },
      count: movements.length,
      movements,
    });
  } catch (error) {
    console.error("Get material movements error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to get material movements",
    });
  }
};


//CREATE STOCK MOVEMENT

export const createStockMovement=async(
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
            materialId,
            supplierId,
            projectId,
            type,
            quantity,
            unitCost,
            referenceNumber,
            notes,
            movementDate,
        }=req.body;

        //find material belonging to the  company

        const material=await Material.findOne({
            _id: materialId,
            company:req.user.company,
            isActive:true
        })

        if(!material){
            res.status(404).json({
                success:false,
                message:"Material not found",
            })

            return;
        }
        //receipt requires supplier
        if(type==="receipt"&& !supplierId){
            res.status(400).json({
                success:false,
                message:"A supplier is required for a receipt",
            })
            return;
        }

        //issue and return require project
        if(
        (type==="issue" ||type ==="return")&& !projectId
        ){
            res.status(400).json({
                success:false,
                message:"A project is required for this movement",
            })
            return;
        }

        //validate supplier

        if(supplierId){
            if(!mongoose.Types.ObjectId.isValid(supplierId)){
                res.status(400).json({
                    success:false,
                    message:"Invalid supplier ID",
                })
                return;
            }

            const supplier= await Supplier.findOne({
                _id:supplierId,
                company:req.user.company,
                isActive:true,
            })
            if(!supplier){
                res.status(404).json({
                    success:false,
                    message:"Supplier not found",
                })
                return;
            }
    }

    //validate project

    if(projectId){
        if(!mongoose.Types.ObjectId.isValid(projectId)){
            res.status(400).json({
                success:false,
                message:"Invalid project ID",
            })
            return;
        }

        const project=await Project.findOne({
            _id:projectId,
            company:req.user.company,
            
        })

        if(!project){
            res.status(404).json({
                success:false,
                message:"Project not found",
            })
            return;
        }

    }

    // check stock before issuing material
    if(type==="issue"){
        const currentStock=await calculateCurrentStock(
            materialId,
            req.user.company
        );

        if(quantity>currentStock){
            res.status(400).json({
                success:true,
                message:"Insufficient stock",
                currentStock,
                requestedQuantity:quantity,
            })
            return;
        }
    }

    const movement=await StockMovement.create({
        material:materialId,
        supplier:supplierId || undefined,
        project:projectId || undefined,
        company:req.user.company,
        type,
        quantity,
        unitCost,
        referenceNumber,
        notes,
        movementDate,
        createdBy:req.user.id,
    });

    res.status(201).json({
        success:true,
        message:"Stock movement recorded successfully",
        movement,
    });

    }catch(error){
        console.error("Create stock movement error:",error);

        res.status(500).json({
            success:false,
            message:"Unable to record stock movememt",
        })
    }
}
