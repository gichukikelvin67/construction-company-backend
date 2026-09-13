import {z}from "zod";

export const createExpenseSchema=z. object({
  projectId:z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid project ID"),

  category:z.enum([
    "materials",
    "transport",
    "fuel",
    "equipment",
    "labour",
    "permits",
    "utilities",
    "other",
  ]),

  description:z
  .string()
  .trim()
  .min(2,"Description is required")
  .max(300, "Description is to long"),


  amount:z
  .number()
  .positive("Amount must be greater than zero"),

  expenseDate:z
  .string()
  .datetime("Invalid expense date"),


  receiptNumber:z
  .string()
  .trim()
  .max(100, "Receipt number is too long")
  .optional(),

  notes:z
  .string()
  .trim()
  .max(500, "Notes are too long" )
  .optional(),
})

export const updateExpenseSchema = z.object({
  category: z
    .enum([
      "materials",
      "transport",
      "fuel",
      "equipment",
      "labour",
      "permits",
      "utilities",
      "other",
    ])
    .optional(),

  description: z
    .string()
    .trim()
    .min(2, "Description is required")
    .max(300, "Description is too long")
    .optional(),

  amount: z
    .number()
    .positive("Amount must be greater than zero")
    .optional(),

  expenseDate: z
    .string()
    .datetime("Invalid expense date")
    .optional(),

  receiptNumber: z
    .string()
    .trim()
    .max(100, "Receipt number is too long")
    .optional(),

  notes: z
    .string()
    .trim()
    .max(500, "Notes are too long")
    .optional(),
});