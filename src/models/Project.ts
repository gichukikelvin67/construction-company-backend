import mongoose,{Document,Schema}from "mongoose";
import { maxLength } from "zod";

export type ProjectStatus=
| "planning"
| "active"
| "on_hold"
| "completed"
| "cancelled";


export interface IProject extends Document{
    name:string;
    description?: string;
    company:mongoose.Types.ObjectId;
    location:string;
    clientName:string;

    budget:number;
    startDate:Date;
    expectedEndDate:Date;
    status:ProjectStatus;

    createdBy:mongoose.Types.ObjectId;
}

const projectSchema=new Schema<IProject>(
    {
        name:{
            type:String,
            required:true,
            trim:true,
            minlength:2,
            maxlength:150,
        },

        description:{
            type:String,
            trim:true,
            maxlength:2000,
        },

        company:{
            type:Schema.Types.ObjectId,
            ref:"Company",
            required:true,
            index:true,
        },

        location:{
            type:String,
            required:true,
            trim:true,
            maxlength:300,
        },

        clientName:{
            type:String,
            required:true,
            trim:true,
            maxLength:150,
        },
        budget:{
            type:Number,
            required:true,
            min:0,
        },

        startDate:{
            type:Date,
            required:true,
        },

        expectedEndDate:{
            type:Date,
            required:true,
        },
        status:{
            type:String,
            enum:[
                "planning",
                "active",
                "on_hold",
                "completed",
                "cancelled",
            ],

            default:"planning",
            index:true,
        },
        createdBy:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
    },
    {
        timestamps:true,
    }
)
projectSchema.index({
    company:1,
    createdAt: -1,
})

const Project=mongoose.model<IProject>(
    "Project",
    projectSchema
)
export default Project;