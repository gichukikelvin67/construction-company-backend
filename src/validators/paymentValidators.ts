import { z } from "zod";

const objectId = (fieldName: string) =>
  z
    .string()
    .regex(
      /^[0-9a-fA-F]{24}$/,
      `Invalid ${fieldName}`
    );

export const createPaymentSchema = z.object({
  invoiceId: objectId("invoice ID"),

  paymentReference: z
    .string()
    .trim()
    .min(1, "Payment reference is required")
    .max(150, "Payment reference cannot exceed 150 characters"),

  amount: z
    .number()
    .positive("Payment amount must be greater than zero"),

  paymentDate: z
    .string()
    .datetime("Invalid payment date"),

  method: z.enum([
    "cash",
    "bank_transfer",
    "mpesa",
    "card",
    "cheque",
  ]),

  notes: z
    .string()
    .trim()
    .max(2000, "Notes cannot exceed 2000 characters")
    .optional(),
});