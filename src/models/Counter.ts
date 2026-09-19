import mongoose,{Document,Schema}from "mongoose";

export interface ICounter extends Document{
    company:mongoose.Types.ObjectId;
    name:string;
    sequence:number;
}

const counterSchema=new Schema<ICounter>(
    {
        company:{
            type:Schema.Types.ObjectId,
            ref:"Company",
            required:true,
            index:true,
        },

        name:{
            type:String,
            required:true,
            trim:true,
        },
        sequence:{
              type:Number,
              required:true,
              min:0,
              default:0,
        }
    },

    {
        timestamps:true,
    }
)

counterSchema.index(
    {company:1 , name:1},
    {unique:true}
);

const Counter=mongoose.model<ICounter>(
    "Counter",
    counterSchema
)
export default Counter;