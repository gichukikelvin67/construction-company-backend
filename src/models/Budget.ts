import mongoose,{Document,Schema}from "mongoose";

export type BudgetCategory=
|"materials"
|"labour"
|"equipment"
|"transport"
|"permits"
|"utilities"
|"other";

export interface IBudgetCategory{
    category:BudgetCategory;
    amount:number;
    description?: string;
}

export interface IBudget extends Document{
    project:mongoose.Types.ObjectId;
    company:mongoose.Types.ObjectId;
    categories:IBudgetCategory[];
    totalBudget:number;
    createdBy:mongoose.Types.ObjectId;
}
const budgetCategorySchema=new Schema<IBudgetCategory>(
    {
        category:{
            type:String,
            enum:[
                "materials",
                "labour",
                "equipment",
                "transport",
                "permits",
                "utilities",
                "other",
            ],
            required:true,
        },


        amount:{
            type:Number,
            required:true,
            min:0,
        },

        description:{
            type:String,
            trim:true,
            maxlength:300,
        }
    },
    { _id:false}
);

const budgetSchema=new Schema<IBudget>(
    {
        project:{
            type:Schema.Types.ObjectId,
            ref:"Project",
            required:true,
            unique:true,
            index:true,
        },

        company:{
            type:Schema.Types.ObjectId,
            ref:"Company",
            required:true,
            index:true,
        },

        categories:{
            type:[budgetCategorySchema],
            required:true,
            validate:{
                validator:(categories:IBudgetCategory[])=>
                    categories.length >0,
                message: "At least one budget category is required",
            }
        },

        totalBudget:{
            type:Number,
            required: true,
            min:0,
        },

        createdBy:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true,
        }
    },
    {
        timestamps:true,
    }
)

budgetSchema.index({
    company:1,
    project:1,
})

const Budget=mongoose.model<IBudget>("Budget",budgetSchema);

export default Budget;