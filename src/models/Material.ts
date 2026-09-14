import mongoose,{Document,Schema} from "mongoose";
export type MaterialUnit=
|"Kg"
|"ton"
|"bag"
|"price"
|"liter"
|"meter"
|"square_meter"
|"cubic_meter"
|"box";

export interface IMaterial extends Document{
    name:string;
    code?:string;
    description?:string;

    unit:MaterialUnit;
    minimumStock:number;

    company:mongoose.Types.ObjectId;
    createdBy:mongoose.Types.ObjectId;

    isActive:boolean;
}

const materialSchema=new Schema<IMaterial>(
    {
        name:{
            type:String,
            required:true,
            trim:true,
            minlength:2,
            maxlength:150,
        },

        code:{
            type:String,
            trim:true,
            uppercase:true,
            maxlength:50,
        },

        description:{
            type:String,
            trim:true,
            maxlength:300,
        },

        unit:{
            type:String,
            enum:[
                "kg",
                "ton",
                "bag",
                "piece",
                "litre",
                "meter",
                "square_metre",
                "cubic_metre",
                "box",
            ],
            required:true,
        },

            minimumStock:{
                type:Number,
                required:true,
                min:0,
                default:0,
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
            },
        },

        {
            timestamps:true,
        }
);

materialSchema.index({
    company:1,
    name:1,
});

materialSchema.index({
    company:1,
    code:1,
});

materialSchema.index({
    company:1,
    isActive:1,
});
const Material=mongoose.model<IMaterial>(
    "Material",
    materialSchema
);

export default Material;