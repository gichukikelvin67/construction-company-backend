import mongoose,{Document,Schema}from "mongoose";
export type WeatherCondition=
|"sunny"
|"cloudy"
|"rainy"
|"stormy"
|"windy"

export  interface IDailyReport  extends Document{
 company:mongoose.Types.ObjectId;
 project:mongoose.Types.ObjectId;
 reportDate:Date;
 weather?:WeatherCondition;
 workersPresent:number;
 workCompleted:string;
 workPlanned?:string;
 materialsUsed?:string;
 equipmentUsed?:string;
 delays?:string;
 safetyIncidents?:string;
 notes?:string;
 submittedBy:mongoose.Types.ObjectId;
 updatedBy?:mongoose.Types.ObjectId;
}
const dailyReportSchema =new Schema<IDailyReport>(
    {
        company:{
            type:Schema.Types.ObjectId,
            ref:"Company",
            required:true,
            index:true,
        },
        project:{
            type:Schema.Types.ObjectId,
            ref:"Project",
            required:true,
            index:true,
        },

        reportDate:{
            type:Date,
            required:true,
            index:true,
        },
        weather:{
            type:String,
            enum:["sunny","cloudy","rainy","stormy","windy"],
        },
        workersPresent:{
            type:Number,
            required:true,
            min:0,

        },

        workCompleted:{
            type:String,
            required:true,
            trim:true,
            maxLength:5000,

        },
        workPlanned:{
            type:String,
            trim:true,
            maxlength:5000,
        },
        materialsUsed:{
            type:String,
            trim:true,
            maxlength:5000,
        },
        equipmentUsed:{
            type:String,
            trim:true,
            maxLength:5000,
        },
        delays:{
            type:String,
            trim:true,
            maxlength:5000,
        },
        safetyIncidents:{
            type:String,
            trim:true,
            maxLength:5000,
        },
        notes:{
            type:String,
            trim:true,
            maxLength:5000,
        },
        submittedBy:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
        updatedBy:{
            type:Schema.Types.ObjectId,
            ref:"User",
        }
    },
    {
        timestamps:true,
    }
)
//Aproject should have only one officila report per day

dailyReportSchema.index(
    {
        company:-1,
        project:1,
        reportDate:1,
    },
    {
    unique:true,
    },
)
dailyReportSchema.index(
    {
    company:1,
    project:1,
    reportDate:1,
    },

)
const DailyReport=mongoose.model<IDailyReport>(
    "DailyReport",
    dailyReportSchema
);
export default DailyReport;