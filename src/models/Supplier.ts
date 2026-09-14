import mongoose,{Document,Schema} from "mongoose";

export interface ISupplier extends Document{
    name:string;
    phone:string;
    email:string;
    address?:string;
    contactPerson?:string;
    notes?:string;

    company:mongoose.Types.ObjectId;
    createdBy:mongoose.Types.ObjectId;

    isActive:boolean;

}

const supplierSchema=new Schema<ISupplier>(
    {
        name:{
            type:String,
            required:true,
            trim:true,
            minlength:2,
            maxlength:150,
        },

        phone:{
            type:String,
            required:true,
            trim:true,
            maxlength:20,
        },

        email:{
            type:String,
            lowercase:true,
            trim:true,
            maxlength:150,
        },

        address:{
            type:String,
            trim:true,
            maxlength:300,
        },

        contactPerson:{
            type:String,
            trim:true,
            maxlength:150,
        },

        notes:{
            type:String,
            trim:true,
            maxlength:500,

        },

        company:{
            type:Schema.Types.ObjectId,
            ref:"Company",
            required:true,
            index:true,
        },

        createdBy:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },

        isActive:{
            type:Boolean,
            default:true,
            index:true,
        }
    },

    {
        timestamps:true,
    },
)

//helps find suppliers belonging to a company

supplierSchema.index({
    company:1,
    createdAt: -1,
})
//Helps filter active suppliers

supplierSchema.index({
    company:1,
    isActive:1,
})

const Supplier=mongoose.model<ISupplier>(
    "Supplier",
    supplierSchema
)

export default Supplier;