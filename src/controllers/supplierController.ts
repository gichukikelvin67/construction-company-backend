import{Response}from "express";

import mongoose from "mongoose";

import Supplier from "../models/Supplier.js";

import { AuthenticatedRequest } from "../middleware/authMiddleware.js";

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
            count:suppliers.length,
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

/* UPDATE SUPPLIER */

export const updateSupplier = async (
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

    const supplierId = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      res.status(400).json({
        success: false,
        message: "Invalid supplier ID",
      });
      return;
    }

    const supplier = await Supplier.findOne({
      _id: supplierId,
      company: req.user.company,
    });

    if (!supplier) {
      res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
      return;
    }

    const { name, phone, email, address, contactPerson, notes } = req.body;

const nextName = name ?? supplier.name;
const nextEmail = email ?? supplier.email;

const duplicateConditions: Record<string, unknown>[] = [
  {
    name: {
      $regex: `^${nextName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      $options: "i",
    },
  },
];

if (nextEmail) {
  duplicateConditions.push({
    email: {
      $regex: `^${nextEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
      $options: "i",
    },
  });
}

const duplicate = await Supplier.findOne({
  _id: { $ne: supplier._id },
  company: req.user.company,
  $or: duplicateConditions,
});


    if (duplicate) {
      res.status(409).json({
        success: false,
        message: "Another supplier with these details already exists",
      });
      return;
    }

    if (name !== undefined) supplier.name = name;
    if (phone !== undefined) supplier.phone = phone;
    if (email !== undefined) supplier.email = email;
    if (address !== undefined) supplier.address = address;
    if (contactPerson !== undefined) supplier.contactPerson = contactPerson;
    if (notes !== undefined) supplier.notes = notes;

    await supplier.save();

    res.status(200).json({
      success: true,
      message: "Supplier updated successfully",
      supplier,
    });
  } catch (error) {
    console.error("Update supplier error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update supplier",
    });
  }
};


/* ACTIVATE / DEACTIVATE SUPPLIER */

export const updateSupplierStatus = async (
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

    const supplierId = req.params.id as string;

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      res.status(400).json({
        success: false,
        message: "Invalid supplier ID",
      });
      return;
    }

    const supplier = await Supplier.findOne({
      _id: supplierId,
      company: req.user.company,
    });

    if (!supplier) {
      res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
      return;
    }

    supplier.isActive = req.body.isActive;
    await supplier.save();

    res.status(200).json({
      success: true,
      message: supplier.isActive
        ? "Supplier activated successfully"
        : "Supplier deactivated successfully",
      supplier,
    });
  } catch (error) {
    console.error("Update supplier status error:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update supplier status",
    });
  }
};


