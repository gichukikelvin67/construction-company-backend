import mongoose,{Document,Schema}from "mongoose";

export type PurchaseOrderStatus=
|"draft"
|"pending_approval"
|"approved"
|"rejected"
|"partially_received"
|"received"
|"cancelled";

export interface IPurchaseOrderItem{
      material: mongoose.Types.ObjectId;
  quantity: number;
  unitCost: number;
  totalCost: number;
}

export interface IPurchaseOrder extends Document{
    poNumber:string;
    supplier:mongoose.Types.ObjectId;
    project:mongoose.Types.ObjectId;
    company:mongoose.Types.ObjectId;

    items:IPurchaseOrderItem[];

    subtotal:number;
    totalAmount:number;

    status:PurchaseOrderStatus;

    requestedBy:mongoose.Types.ObjectId;
    approvedBy:mongoose.Types.ObjectId;
    approvedAt?:Date;

    rejectionReason?:string;
    notes?:string;
}

const purchaseOrderItemSchema=new Schema<IPurchaseOrderItem>(
    {
        material:{
            type:Schema.Types.ObjectId,
            ref:"Material",
            required:true,
        },

        quantity:{
            type:Number,
            required:true,
            min:0,

        },

        unitCost:{
            type:Number,
            required:true,
            min:0,
        },

        totalCost:{
            type:Number,
            required:true,
            min:0,
        },


    },

   {_id:false}
);


const purchaseOrderSchema=new Schema<IPurchaseOrder>(
    {
        poNumber:{
            type: String,
            required:true,
            trim:true,
            uppercase:true,
        },

        supplier:{
            type:Schema.Types.ObjectId,
            ref:"Supplier",
            required:true,
            index:true,
        },

        project:{
            type:Schema.Types.ObjectId,
            ref:"Project",
            required:true,
            index:true,
        },

        company:{
            type:Schema.Types.ObjectId,
            ref:"Company",
            required:true,
            index:true,
        },

        items:{
            type:[purchaseOrderItemSchema],
            required:true,
            validate:{
                validator:(items:IPurchaseOrderItem[])=> items.length >0,
                message:"A purchase order must contain at least one item",
            },
        },

        subtotal:{
            type:Number,
            required:true,
            min:0,
        },

        totalAmount:{
            type:Number,
            required:true,
            min:0,
        },

        status:{
            type:String,
            enum:[
                "draft",
                "pending_approval",
                "approved",
                "rejected",
                "partially_received",
                "received",
                "cancelled",
            ],
            default:"draft",
            index:true,
        },

        requestedBy:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },

        approvedBy:{
            type:Schema.Types.ObjectId,
            ref:"User",
        },
        approvedAt:{
            type:Date,
        },

        rejectionReason:{
            type:String,
            trim:true,
            maxlength:500,
        },

        notes:{
            type:String,
            trim:true,
            maxLength:1000,
        },
    },
    {
        timestamps:true,
    }
);

purchaseOrderSchema.index(
    {company:1 ,poNumber:1},
    {unique:true}
);

purchaseOrderSchema.index({
    comapny:1,
    status:1,
    createdAt:-1,
});

purchaseOrderSchema.index({
    company:1,
    project:1,
    createdAt:-1,
});

const PurchaseOrder=mongoose.model<IPurchaseOrder>(
    "purchaseOrder",
    purchaseOrderSchema
);

export default PurchaseOrder;
