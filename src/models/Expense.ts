import mongoose,{Document,Schema} from "mongoose";

export type ExpenseCategory=
|"materials"
|"transport"
|"fuel"
|"equipment"
|"labour"
|"permits"
|"utilities"
|"other";

export interface IExpense extends Document{
    project:mongoose.Types.ObjectId;
    company:mongoose.Types.ObjectId;

    category:ExpenseCategory;
    description:string;
    amount:number;

    expenseDate:Date;

    receiptNumber?:string;
    notes?:string;

    recordedBy:mongoose.Types.ObjectId;
}

const expenseSchema=new Schema<IExpense>(
    {
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

        category:{
            type:String,
            enum:[
                "materials",
                "transport",
                "fuel",
                "equipment",
                "labour",
                "permits",
                "utilities",
                "other",
            ],

            required:true,
            index:true,
        },

        description:{
            type:String,
            required:true,
            trim:true,
            minlength:2,
            maxlength:300,

        },

        amount:{
            type:Number,
            required:true,
            min:0,
        },

        expenseDate:{
            type:Date,
            required:true,
            index:true,
        },

        receiptNumber:{
            type:String,
            trim:true,
            maxlength:100,
        },

        notes:{
            type:String,
            trim:true,
            maxlength:500,
        },

        recordedBy:{
            type:Schema.Types.ObjectId,
            ref:"User",
            required:true,
        },
    },
    {
        timestamps:true,
    }
)

expenseSchema.index({
    company :1,
    project:1,
    expenseDate: -1,
});

expenseSchema.index({
    company:1,
    project:1,
    category:1,
})

const Expense=mongoose.model<IExpense>(
    "Expense",
    expenseSchema
)

export default Expense;
