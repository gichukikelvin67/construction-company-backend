import { z } from "zod";

export const createStockMovementSchema = z.object({
  materialId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid material ID"),

  supplierId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid supplier ID")
    .optional(),

  projectId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid project ID")
    .optional(),

  type: z.enum([
    "receipt",
    "issue",
    "return",
    "adjustment",
  ]),

  adjustmentDirection:z
  .enum([
    "increase","decrease"
  ])
  .optional(),

  quantity: z
    .number()
    .positive("Quantity must be greater than zero"),

  unitCost: z
    .number()
    .min(0, "Unit cost cannot be negative")
    .optional(),

  referenceNumber: z
    .string()
    .trim()
    .max(100, "Reference number is too long")
    .optional(),

  notes: z
    .string()
    .trim()
    .max(500, "Notes are too long")
    .optional(),

  movementDate: z
    .string()
    .datetime("Invalid movement date"),
});