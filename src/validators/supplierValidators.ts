import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Supplier name is required")
    .max(150, "Supplier name is too long"),

  phone: z
    .string()
    .trim()
    .min(7, "Invalid phone number")
    .max(20, "Phone number is too long"),

  email: z
    .string()
    .trim()
    .email("Invalid email address")
    .optional(),

  address: z
    .string()
    .trim()
    .max(300, "Address is too long")
    .optional(),

  contactPerson: z
    .string()
    .trim()
    .max(150, "Contact person name is too long")
    .optional(),

  notes: z
    .string()
    .trim()
    .max(500, "Notes are too long")
    .optional(),
});