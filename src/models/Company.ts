import mongoose,{Document,Schema} from "mongoose";

export interface ICompany extends Document{
name:string;
email:string;
phone:string;
address?:string;
isActive:boolean;
}

const comapnySchema= new Schema<ICompany>(
    {
        name:{
            type:String,
            required:true,
            trim:true,
        },

        email:{
            type:String,
            required:true,
            unique:true,
            lowercase:true,
            trim:true,
        },

        phone:{
            type:String,
            required:true,
            trim:true,
        },

        isActive:{
            type:Boolean,
            default:true,
        },
    },
    {
        timestamps:true,
    }
)

const Company=mongoose.model<ICompany>("Company",comapnySchema);
export default Company;
