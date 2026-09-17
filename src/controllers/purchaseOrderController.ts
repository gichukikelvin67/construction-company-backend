import{Response}from "express";

import  mongoose from "mongoose";

import PurchaseOrder from "../models/PurchaseOrder.js";
import Supplier from "../models/Supplier.js";
import Project from "../models/Project.js";
import Material  from "../models/Material.js";
import StockMovement from "../models/StockMovement.js";

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

const purchaseOrder=await PurchaseOrder.create({
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

//Submit a purcahse order for approval

export const submitPurchaseOrder=async(
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

        const purchaseOrderId=req.params.id;

        if(typeof purchaseOrderId !== "string"){
            res.status(400).json({
                success:false,
                message:"Invalid purchase order ID",
            })
            return;
        }

        if(!mongoose.Types.ObjectId.isValid(purchaseOrderId)){
            res.status(400).json({
                success:false,
                message:"Invalid purchase order ID",
            })
            return;
        }

        //Find the PO belonging to this company

        const purchaseOrder=await PurchaseOrder.findOne({
            _id:purchaseOrderId,
            company:req.user.company,
        })

        if(!purchaseOrder){
            res.status(404).json({
                success:false,
                message:"Purchase order not found",
            })
            return;
        }

        //A PO can only be submmitted frpm draft

        if(purchaseOrder.status !== "draft"){
            res.status(400).json({
                success:false,
                message:`Purchase order cannot be submitted because its current status is "${purchaseOrder.status}"`,

            })
            return;
        }
        //Change Status
        purchaseOrder.status="pending_approval";

        await purchaseOrder.save();

        res.status(200).json({
            success:true,
            message:"Purchase order submitted for approval",
            purchaseOrder,
        })
    
    }catch(error){
        console.error("Submit purchase order error:",error);

        res.status(500).json({
            success:false,
            message:"Failed to submit purchase order",
        })
    }
}

//get all purcahse order for the users company

export const getPurchaseOrders=async(
    req:AuthenticatedRequest,
    res:Response
):Promise<void>=>{
    try{
        if(!req.user){
            res.status(400).json({
                success:false,
                message:"Authentication required",
            })

            return;
        }

        const purchaseOrders=await PurchaseOrder.find({
            company:req.user.company,
        })
        .populate("supplier", "name phone email")
        .populate("project", "name location")
        .populate("requestedBy", "name email role" )
        .populate("approvedBy", "name email role")
        .sort({createdAt: -1});

        res.status(200).json({
            success:true,
            count: purchaseOrders.length,
            purchaseOrders,
        })
    }catch(error){
        console.error("Get purchase orders error:",error)

        res.status(500).json({
            success:false,
            message:"Failed to retrieve purchase orders"
        })
    }
}

//approve purchase order

export const approvePurchaseOrder=async(
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

    const purchaseOrderId=req.params.id;

    if(typeof purchaseOrderId  !=="string"){
        res.status(400).json({
            success:false,
            message:"Invalid purchase order ID",
        })
        return;
    }

    if(!mongoose.Types.ObjectId.isValid(purchaseOrderId)){
        res.status(400).json({
            success:false,
            message:"Invalid purchase order ID",
        })

        return;
    }

    const purchaseOrder=await PurchaseOrder.findOne({
        _id: purchaseOrderId,
        company:req.user.company,
    })
    if(!purchaseOrder){
        res.status(404).json({
            success:false,
            message:"Purchase order not found",
        })
        return;
    }

    //A po can only be approved when pending approval

    if(purchaseOrder.status !== "pending_approval"){
        res.status(400).json({
            success:false,
            message:`Purchase order cannot be approved because its current status is "${purchaseOrder.status}"`,

        })
        return;
    }

    //Record approva information

    purchaseOrder.status="approved";
    purchaseOrder.approvedBy=new mongoose.Types.ObjectId(
        req.user.id
    )

    purchaseOrder.approvedAt=new Date();
    await purchaseOrder.save();

    res.status(200).json({
        success:true,
        message:"Purchase order approved successfully",
        purchaseOrder,
    });

} catch (error){
    console.error("Approve purchase order error:",error);

    res.status(500).json({
        success:false,
        message:"Failed to approve purchase order",
    });

}
};

// Reject a purchase order
export const rejectPurchaseOrder = async (
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

    const purchaseOrderId = req.params.id;

    if (typeof purchaseOrderId !== "string") {
      res.status(400).json({
        success: false,
        message: "Invalid purchase order ID",
      });
      return;
    }

    if (!mongoose.Types.ObjectId.isValid(purchaseOrderId)) {
      res.status(400).json({
        success: false,
        message: "Invalid purchase order ID",
      });
      return;
    }

    const { reason } = req.body;

    if (
      typeof reason !== "string" ||
      reason.trim().length < 3
    ) {
      res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
      return;
    }

    const purchaseOrder = await PurchaseOrder.findOne({
      _id: purchaseOrderId,
      company: req.user.company,
    });

    if (!purchaseOrder) {
      res.status(404).json({
        success: false,
        message: "Purchase order not found",
      });
      return;
    }

    // A PO can only be rejected when pending approval
    if (purchaseOrder.status !== "pending_approval") {
      res.status(400).json({
        success: false,
        message: `Purchase order cannot be rejected because its current status is "${purchaseOrder.status}"`,
      });
      return;
    }

    purchaseOrder.status = "rejected";
    purchaseOrder.rejectionReason = reason.trim();

    await purchaseOrder.save();

    res.status(200).json({
      success: true,
      message: "Purchase order rejected",
      purchaseOrder,
    });
  } catch (error) {
    console.error(
      "Reject purchase order error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to reject purchase order",
    });
  }
};

// Receive materials from an approved purchase order

export const receivePurchaseOrder = async (
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

        const purchaseOrderId = req.params.id;

        if (typeof purchaseOrderId !== "string") {
            res.status(400).json({
                success: false,
                message: "Invalid purchase order ID",
            });

            return;
        }

        if (!mongoose.Types.ObjectId.isValid(purchaseOrderId)) {
            res.status(400).json({
                success: false,
                message: "Invalid purchase order ID",
            });

            return;
        }

        const { items, notes } = req.body;

        // Find the purchase order
        const purchaseOrder = await PurchaseOrder.findOne({
            _id: purchaseOrderId,
            company: req.user.company,
        });

        if (!purchaseOrder) {
            res.status(404).json({
                success: false,
                message: "Purchase order not found",
            });

            return;
        }

        // Only approved or partially received POs can receive materials
        if (
            purchaseOrder.status !== "approved" &&
            purchaseOrder.status !== "partially_received"
        ) {
            res.status(400).json({
                success: false,
                message: `Materials cannot be received because the purchase order status is "${purchaseOrder.status}"`,
            });

            return;
        }

        // Make sure every received material exists on the PO
        for (const receivedItem of items) {
            const poItem = purchaseOrder.items.find(
                (item) =>
                    item.material.toString() ===
                    receivedItem.materialId
            );

            if (!poItem) {
                res.status(400).json({
                    success: false,
                    message: `Material ${receivedItem.materialId} is not part of this purchase order`,
                });

                return;
            }

            const remainingQuantity =
                poItem.quantity - poItem.receivedQuantity;

            if (receivedItem.quantity > remainingQuantity) {
                res.status(400).json({
                    success: false,
                    message:
                        `Cannot receive ${receivedItem.quantity}. ` +
                        `Only ${remainingQuantity} remaining for this material.`,
                });

                return;
            }
        }

        // Create stock receipts
        for (const receivedItem of items) {
            const poItem = purchaseOrder.items.find(
                (item) =>
                    item.material.toString() ===
                    receivedItem.materialId
            );

            if (!poItem) {
                continue;
            }

            // Update received quantity
            poItem.receivedQuantity += receivedItem.quantity;

            // Create inventory receipt
            await StockMovement.create({
                material: receivedItem.materialId,

                supplier: purchaseOrder.supplier,

                project: purchaseOrder.project,

                company: req.user.company,

                type: "receipt",

                quantity: receivedItem.quantity,

                unitCost: poItem.unitCost,

                referenceNumber: `${purchaseOrder.poNumber}-RECEIPT`,

                notes:
                    notes ||
                    `Receipt for ${purchaseOrder.poNumber}`,

                movementDate: new Date(),

                createdBy: req.user.id,
            });
        }

        // Determine whether everything has been received
        const fullyReceived = purchaseOrder.items.every(
            (item) =>
                item.receivedQuantity >= item.quantity
        );

        if (fullyReceived) {
            purchaseOrder.status = "received";
        } else {
            purchaseOrder.status = "partially_received";
        }

        await purchaseOrder.save();

        res.status(200).json({
            success: true,
            message: fullyReceived
                ? "Purchase order fully received"
                : "Purchase order partially received",
            purchaseOrder,
        });

    } catch (error) {
        console.error(
            "Receive purchase order error:",
            error
        );

        res.status(500).json({
            success: false,
            message: "Failed to receive purchase order",
        });
    }
};