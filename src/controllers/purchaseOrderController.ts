import{Response}from "express";

import  mongoose from "mongoose";

import PurchaseOrder from "../models/PurchaseOrder.js";
import Supplier from "../models/Supplier.js";
import Project from "../models/Project.js";
import Material  from "../models/Material.js";

import { AuthenticatedRequest } from "../middleware/authMiddleware.js";


//Generate the next purchase order number

const generatePONumber=async (companyId:string): Promise<string>=>{
    const latestPO=await PurchaseOrder.findOne({
        company:companyId,

    }).sort({createdAt: -1});

    if(!latestPO){
        return "PO-0001";
    }

    const lastNumber=parseInt(
        latestPO.poNumber.replace("PO-",""),
        10
    )

    const nextNumber=lastNumber +1;

    return `PO-${nextNumber.toString().padStart(4,"0")}`
}

//create purchase order

export const createPurchaseOrder=async(
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
            supplierId,
            projectId,
            items,
            notes,
        }=req.body;

        //verify supplier

        if(!mongoose.Types.ObjectId.isValid(supplierId)){
            res.status(400).json({
                success:false,
                message:"Invalid supplier ID",
            })

            return;
        }

        const supplier=await Supplier.findOne({
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


        //verify project

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
            isActive:true,
        })

        if(!project){
            res.status(404).json({
               success:false,
               message:"Project not found"
            })

            return;
        }

        //verify materials

        const materialIds=items.map(
            (item:{materialId:string})=>item.materialId
        );

        const materials=await Material.find({
            _id:{$in: materialIds},
            company:req.user.company,
            isActive:true,
        })

        if(materials.length !==materialIds.length){
            res.status(404).json({
                success:false,
                message:"One or more materials were not found",
            })
            return;
        }

        //Build purchase order items

        const purchaseOrderItems=items.map(
            (item:{
                materialId:string;
                quantity:number;
                unitCost:number;
            })=>{
                const totalCost=item.quantity *item.unitCost;
                return{
                    material:item.materialId,
                    quantity:item.quantity,
                    unitCost:item.unitCost,
                    totalCost,
                }
            }
        )

        //calculate total

        const subtotal=purchaseOrderItems.reduce(
            (total:number,
                item:{

     material: string;
      quantity: number;
      unitCost: number;
      totalCost: number;


                }
            )=>total + item.totalCost,
            0
        )

        const totalAmount=subtotal;

        //Generate PO number

        const poNumber=await generatePONumber(
            req.user.company
        )

//create purchase order

const purchaseOrder=await purchaseOrderItems.create({
    poNumber,
    supplier:supplierId,
    project: projectId,
    company:req.user.company,

    items:purchaseOrderItems,

    subtotal,
    totalAmount,

    status:"draft",

    requestedBy:req.user.id,
    notes,
})

//return result

res.status(201).json({
    success:true,
    message:"Purchase order created successfully",
    purchaseOrder,
})

    }catch(error){
        console.error("Create purchase order error:",error);

        res.status(500).json({
            success:false,
            message:"Failed to create purchase order",
        })
    }
}