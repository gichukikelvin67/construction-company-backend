import {z}from "zod";

const objectId=(fieldName:string)=>
    z
   .string()
    .regex(
      /^[0-9a-fA-F]{24}$/,
      `Invalid ${fieldName}`
    );
export const createInvoiceSchema=z

.object({
    projectId:objectId("project ID").optional(),
    supplierId:objectId("supplier ID").optional(),

    invoiceNumber:z
    .string()
    .trim()
    .min(1,"Invoice number is required")
    .max(100, "Invoice number cannot exceed 100 characters"),

    type:z.enum(["supplier","client","project"]),

    description:z
    .string()
    .trim()
    .max(2000, "Description cannot exceed 200 characters")
    .optional(),

    issueDate:z
    .string()
    .datetime("Invalid issue date"),

    dueDate:z
    .string()
    .datetime("Invalid due date")
    .optional(),

    subtotal:z
    .number()
    .min(0, "Subtotal cannot be negative"),

    taxAmount:z
    .number()
    .min(0,"Tax amount cannot be negative")
    .default(0),
})
.refine(
    (data)=>{
        if(!data.dueDate){
            return true;
        }
        return new Date(data.dueDate)>= new Date(data.issueDate);
    },
    {
        message:"Due date cannot be before issue date",
        path:["dueDate"],
    }
)
.refine(
    (data)=>{
        if(data.type==="supplier"){
            return Boolean(data.supplierId);
        }
        return true;
    },
    {
        message:"Supplier is required for supplier invoices",
        path:["SupplierId"],
    }
);
export const updateInvoiceSchema=z
.object({
    description:z
    .string()
    .trim()
    .max(2000)
    .optional(),

    dueDate:z
    .string()
    .datetime("Invalid due date")
    .optional(),

    status:z
    .enum([
        "draft",
        "issued",
        "cancelled",
    ])
    .optional(),

})
.refine(
    (data)=>
        Object.values(data).some(
            (value)=>value !== undefined
        ),
        {
            message:"At least one field must be provided ",
            path:["description"],
        }
)