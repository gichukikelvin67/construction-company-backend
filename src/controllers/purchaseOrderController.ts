import{Response}from "express";

import  mongoose from "mongoose";

import PurchaseOrder from "../models/PurchaseOrder.js";
import Supplier from "../models/Supplier.js";
import Project from "../models/Project.js";
import Material  from "../models/Material.js";
import StockMovement from "../models/StockMovement.js";
import Counter from "../models/Counter.js";

import { AuthenticatedRequest } from "../middleware/authMiddleware.js";
import { createAuditLog } from "../utils/auditLogger.js";


//Generate the next purchase order number

const generatePONumber=async (companyId:string): Promise<string>=>{
    const counter=await Counter.findOneAndUpdate({
        company: new mongoose.Types.ObjectId(companyId),
        name:"purchase_order",

    },
       {
        $inc:{sequence:1},
        $setOnInsert:{
            company:new mongoose.Types.ObjectId(companyId),
            name:"purchase_order",
        },
       },
       {
        new:true,
        upsert:true,
       }
    );

    if(!counter){
        throw new Error("Failed to generate purchase order number");
    }

     return`PO-${counter.sequence.toString().padStart(4, "0")}`
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

    items,

    subtotal,
    totalAmount:subtotal,

    status:"draft",

    requestedBy:req.user.id,
    notes,
})

await createAuditLog({
  companyId: req.user.company,
  userId: req.user.id,
  action: "create",
  resource: "purchase_order",
  resourceId: purchaseOrder._id.toString(),
  description: `Created purchase order ${purchaseOrder.poNumber}`,
  metadata: {
    totalAmount: purchaseOrder.totalAmount,
    supplierId: purchaseOrder.supplier.toString(),
    projectId: purchaseOrder.project.toString(),
  },
});

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
        await createAuditLog({
  companyId: req.user.company,
  userId: req.user.id,
  action: "update",
  resource: "purchase_order",
  resourceId: purchaseOrder._id.toString(),
  description: `Submitted purchase order ${purchaseOrder.poNumber} for approval`,
  metadata: {
    previousStatus: "draft",
    newStatus: "pending_approval",
  },
});

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

    if(purchaseOrder?.requestedBy.toString()===req.user.id){
        res.status(403).json({
            success:false,
            message:"You cannot approve your own purchase order",
        })
        return;
    }
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
    await createAuditLog({
  companyId: req.user.company,
  userId: req.user.id,
  action: "approve",
  resource: "purchase_order",
  resourceId: purchaseOrder._id.toString(),
  description: `Approved purchase order ${purchaseOrder.poNumber}`,
  metadata: {
    totalAmount: purchaseOrder.totalAmount,
    supplierId: purchaseOrder.supplier.toString(),
    projectId: purchaseOrder.project.toString(),
  },
});

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

    await createAuditLog({
  companyId: req.user.company,
  userId: req.user.id,
  action: "reject",
  resource: "purchase_order",
  resourceId: purchaseOrder._id.toString(),
  description: `Rejected purchase order ${purchaseOrder.poNumber}`,
  metadata: {
    totalAmount: purchaseOrder.totalAmount,
    rejectionReason: purchaseOrder.rejectionReason,
  },
});

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
    const session=await mongoose.startSession();
    try {

        session.startTransaction();
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
        }).session(session);

        if (!purchaseOrder) {
            await session.abortTransaction();

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
            await session.abortTransaction();
            res.status(400).json({
                success: false,
                message: `Materials cannot be received because the purchase order status is "${purchaseOrder.status}"`,
            });

            return;
        }

        // Make sure every received material exists on the PO
        //combine duplicate material entires from the request

        const requestedQuantities=new Map<string,number>();

        for (const receivedItem of items) {

            const currentQuantity=
            requestedQuantities.get(receivedItem.materialId)|| 0;

            requestedQuantities.set(
                receivedItem.materialId,
                currentQuantity + receivedItem.quantity
            )
        }

        for(const[materialId,requestedQuantity]of requestedQuantities){
            const poItem = purchaseOrder.items.find(
                (item) =>
                    item.material.toString() ===
                    materialId
            );

            if (!poItem) {
                await session.abortTransaction();

                res.status(400).json({
                    success: false,
                    message: `Material ${materialId} is not part of this purchase order`,
                });

                return;
            }

            const receivedQuantity=poItem.receivedQuantity || 0;

            const remainingQuantity =
                poItem.quantity - receivedQuantity;

            if (requestedQuantity > remainingQuantity) {
                await session.abortTransaction();

                res.status(400).json({
                    success: false,
                    message:
                        `Cannot receive ${requestedQuantity}. ` +
                        `Only ${remainingQuantity} remaining for this material.`,
                });

                return;
            }
        }

         // Update PO quantities
    for (const [materialId, requestedQuantity] of requestedQuantities) {
      const poItem = purchaseOrder.items.find(
        (item) => item.material.toString() === materialId
      );

      if (!poItem) {
        continue;
      }

      poItem.receivedQuantity =
        (poItem.receivedQuantity || 0) + requestedQuantity;
    }

    // Create stock movements
    for (const [materialId, requestedQuantity] of requestedQuantities) {
      const poItem = purchaseOrder.items.find(
        (item) => item.material.toString() === materialId
      );

      if (!poItem) {
        continue;
      }

      const receiptReference =
        `${purchaseOrder.poNumber}-RECEIPT-${new mongoose.Types.ObjectId().toString()}`;

      await StockMovement.create(
        [
          {
            material: materialId,
            supplier: purchaseOrder.supplier,
            project: purchaseOrder.project,
            company: req.user.company,
            type: "receipt",
            quantity: requestedQuantity,
            unitCost: poItem.unitCost,
            referenceNumber: receiptReference,
            notes:
              notes ||
              `Receipt for ${purchaseOrder.poNumber}`,
            movementDate: new Date(),
            createdBy: req.user.id,
          },
        ],
        { session }
      );
    }

    // Determine whether everything has been received
    const fullyReceived = purchaseOrder.items.every(
      (item) =>
        (item.receivedQuantity || 0) >= item.quantity
    );

    purchaseOrder.status = fullyReceived
      ? "received"
      : "partially_received";

    // Save the PO inside the transaction
    await purchaseOrder.save({ session });

    // Everything succeeded
    await session.commitTransaction();

    await session.commitTransaction();

await createAuditLog({
  companyId: req.user.company,
  userId: req.user.id,
  action: "receive",
  resource: "purchase_order",
  resourceId: purchaseOrder._id.toString(),
  description: `Received materials for purchase order ${purchaseOrder.poNumber}`,
  metadata: {
    status: purchaseOrder.status,
    items: Array.from(requestedQuantities.entries()).map(
      ([materialId, quantity]) => ({
        materialId,
        quantity,
      })
    ),
  },
});

    res.status(200).json({
      success: true,
      message: fullyReceived
        ? "Purchase order fully received"
        : "Purchase order partially received",
      purchaseOrder,
    });
  } catch (error) {
    if(session.inTransaction()){
    await session.abortTransaction();
    }
    console.error(
      "Receive purchase order error:",
      error
    );

    res.status(500).json({
      success: false,
      message:
      error instanceof Error
      ?error.message
      :"Failed to receive purchase order",
    });
  } finally {
    await session.endSession();
  }
};
export const getPurchaseOrderById = async (
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

    const id  = req.params.id;

    if (typeof id !== "string") {
      res.status(400).json({
        success: false,
        message: "Invalid purchase order ID",
      });
      return;
    }

    if(!mongoose.Types.ObjectId.isValid(id)){
        res.status(400).json({
            success:false,
            message:"Invalid purchase order ID",
        })
        return;
    }

    const purchaseOrder = await PurchaseOrder.findOne({
      _id: id,
      company: req.user.company,
    })
      .populate("supplier", "name phone email address contactPerson")
      .populate("project", "name location clientName status")
      .populate("requestedBy", "name email role")
      .populate("approvedBy", "name email role")
      .populate("items.material", "name code unit");

    if (!purchaseOrder) {
      res.status(404).json({
        success: false,
        message: "Purchase order not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      purchaseOrder,
    });
  } catch (error) {
    console.error("Get purchase order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to retrieve purchase order",
    });
  }
};

export const cancelPurchaseOrder=async(
    req:AuthenticatedRequest,
    res:Response
):Promise<void> =>{
    try{
        if(!req.user){
            res.status(400).json({
                success:false,
                message:"Authentication required",
            })
            return;
        }

        const {id}=req.params;

        if(typeof id !=="string"){
            res.status(400).json({
                success:false,
                message:"Invalid purchase order ID",
            })
            return;
        }

        if(!mongoose.Types.ObjectId.isValid(id)){
            res.status(400).json({
                success:false,
                message:"Invalid purchase order ID",
            })

            return;
        }

        const purchaseOrder=await PurchaseOrder.findOne({
            _id:id,
            company:req.user.company,
        })

        if(!purchaseOrder){
            res.status(404).json({
                success:false,
                message:"Purchase order not found",
            })
            return;
        }

        if(purchaseOrder.status==="received"){
            res.status(400).json({
                success:false,
                message:"A fully received purchase order cannot be cancelled",
            })
            return;
        }

        if(purchaseOrder.status ==="cancelled"){
            res.status(400).json({
                success:false,
                message:"Purchase order is already cancelled",
            })

            return;
        }

        const {reason}=req.body;

          const previousStatus = purchaseOrder.status;
        purchaseOrder.status="cancelled";
        purchaseOrder.cancelledBy=new mongoose.Types.ObjectId(req.user.id);
        purchaseOrder.cancelledAt=new Date();
        purchaseOrder.cancellationReason=reason;

        await purchaseOrder.save();

        await createAuditLog({
  companyId: req.user.company,
  userId: req.user.id,
  action: "cancel",
  resource: "purchase_order",
  resourceId: purchaseOrder._id.toString(),
  description: `Cancelled purchase order ${purchaseOrder.poNumber}`,
  metadata: {
    previousStatus,
    newStatus: "cancelled",
    cancellationReason: purchaseOrder.cancellationReason,
    totalAmount: purchaseOrder.totalAmount,
  },
});


        const  message=
        previousStatus==="partially_received"
        ? "purchase order canceeled .Already received materials remain in stock."
        : "Purchase order cancelled successfully";

        res.status(200).json({
            success:true,
            message,
            PurchaseOrder,
        })
    }catch(error){
        console.error("Cancel purchsase order error:",error);

        res.status(500).json({
            success:false,
            message:"Failed to cancel purchase order",
        })
    }
}
export const updatePurchaseOrder = async (
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

    const { supplierId, projectId, items, notes } = req.body;

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

    if (purchaseOrder.status !== "draft") {
      res.status(400).json({
        success: false,
        message:
          `Only draft purchase orders can be edited. ` +
          `This purchase order is currently "${purchaseOrder.status}".`,
      });
      return;
    }

    // Update supplier if provided
    if (supplierId !== undefined) {
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
        isActive: true,
      });

      if (!supplier) {
        res.status(400).json({
          success: false,
          message: "Supplier not found or inactive",
        });
        return;
      }

      purchaseOrder.supplier = supplier._id;
    }

    // Update project if provided
    if (projectId !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(projectId)) {
        res.status(400).json({
          success: false,
          message: "Invalid project ID",
        });
        return;
      }

      const project = await Project.findOne({
        _id: projectId,
        company: req.user.company,
      });

      if (!project) {
        res.status(400).json({
          success: false,
          message: "Project not found",
        });
        return;
      }

      purchaseOrder.project = project._id;
    }

    // Update materials/items if provided
    if (items !== undefined) {
      const materialIds = items.map(
        (item: {
          materialId: string;
          quantity: number;
          unitCost: number;
        }) => item.materialId
      );

      const materials = await Material.find({
        _id: { $in: materialIds },
        company: req.user.company,
        isActive: true,
      });

      if (materials.length !== materialIds.length) {
        res.status(400).json({
          success: false,
          message: "One or more materials were not found or are inactive",
        });
        return;
      }

      const materialMap = new Map(
        materials.map((material) => [
          material._id.toString(),
          material,
        ])
      );

      const updatedItems = items.map(
        (item: {
          materialId: string;
          quantity: number;
          unitCost: number;
        }) => ({
          material: new mongoose.Types.ObjectId(item.materialId),
          quantity: item.quantity,
          receivedQuantity: 0,
          unitCost: item.unitCost,
          totalCost: item.quantity * item.unitCost,
        })
      );

      const subtotal = updatedItems.reduce(
        (total: number, item: {totalCost:number})=>
            total + item.totalCost,
        0
      );

      purchaseOrder.items = updatedItems;
      purchaseOrder.subtotal = subtotal;
      purchaseOrder.totalAmount = subtotal;
    }

    // Update notes if provided
    if (notes !== undefined) {
      purchaseOrder.notes = notes;
    }

    await purchaseOrder.save();

    const updatedPurchaseOrder = await PurchaseOrder.findById(
      purchaseOrder._id
    )
      .populate("supplier", "name phone email address contactPerson")
      .populate("project", "name location clientName status")
      .populate("requestedBy", "name email role")
      .populate("items.material", "name code unit");

    res.status(200).json({
      success: true,
      message: "Purchase order updated successfully",
      purchaseOrder: updatedPurchaseOrder,
    });
  } catch (error) {
    console.error("Update purchase order error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update purchase order",
    });
  }
};