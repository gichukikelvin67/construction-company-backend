import {z}from "zod";

const objectId=(field:string)=>
    z.string().regex(/^[0-9a-fA-F]{24}$/, `Invalid ${field}`);

const purchaseOrderItemSchema=z.object({
    materialId:objectId("material ID"),
    quantity:z
    .number()
    .positive("Quantity must be greater than zero"),

    unitCost:z
    .number()
    .nonnegative("Unit cost cannot be negative"),

});

export const createPurchaseOrderSchema=z.object({
   supplierId:objectId("supplier ID"),

   projectId:objectId("project ID"),

   items:z

   .array(purchaseOrderItemSchema)
   .min(1, "At least one material is required"),


   notes:z
   .string()
   .trim()
   .max(1000,"Notes are too long")
   .optional(),
})

export const receivePurchaseOrderSchema = z.object({
  items: z
    .array(
      z.object({
        materialId: objectId("material ID"),

        quantity: z
          .number()
          .positive("Received quantity must be greater than zero"),
      })
    )
    .min(1, "At least one material is required"),

  notes: z
    .string()
    .trim()
    .max(500, "Notes are too long")
    .optional(),
});

export const rejectPurchaseOrderSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Rejection reason must be at least 5 characters")
    .max(500, "Rejection reason is too long"),
});

export const cancelPurchaseOrderSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, "Cancellation reason must be at least 5 characters")
    .max(500, "Cancellation reason is too long"),
});

