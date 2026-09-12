import { z } from "zod";

export const createWorkerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Worker name must be at least 2 characters")
    .max(150, "Worker name is too long"),

  phone: z
    .string()
    .trim()
    .regex(
      /^(?:\+254|0)7\d{8}$/,
      "Please provide a valid Kenyan phone number"
    ),

  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .transform((email) => email.toLowerCase())
    .optional(),

  nationalId: z
    .string()
    .trim()
    .min(5, "National ID is too short")
    .max(30, "National ID is too long")
    .optional(),

  jobTitle: z
    .string()
    .trim()
    .min(2, "Job title is required")
    .max(100, "Job title is too long"),

  dailyRate: z
    .number()
    .nonnegative("Daily rate cannot be negative"),

  emergencyContactName: z
    .string()
    .trim()
    .min(2, "Emergency contact name is too short")
    .max(150, "Emergency contact name is too long")
    .optional(),

  emergencyContactPhone: z
    .string()
    .trim()
    .regex(
      /^(?:\+254|0)7\d{8}$/,
      "Please provide a valid emergency contact phone number"
    )
    .optional(),
});
// updating workers without deleting
export const updateWorkerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Worker name must be at least 2 characters")
    .max(150, "Worker name is too long")
    .optional(),

  phone: z
    .string()
    .trim()
    .regex(
      /^(?:\+254|0)7\d{8}$/,
      "Please provide a valid Kenyan phone number"
    )
    .optional(),

  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .transform((email) => email.toLowerCase())
    .optional(),

  nationalId: z
    .string()
    .trim()
    .min(5, "National ID is too short")
    .max(30, "National ID is too long")
    .optional(),

  jobTitle: z
    .string()
    .trim()
    .min(2, "Job title is required")
    .max(100, "Job title is too long")
    .optional(),

  dailyRate: z
    .number()
    .nonnegative("Daily rate cannot be negative")
    .optional(),

  status: z
    .enum(["active", "inactive", "suspended"])
    .optional(),

  emergencyContactName: z
    .string()
    .trim()
    .min(2, "Emergency contact name is too short")
    .max(150, "Emergency contact name is too long")
    .optional(),

  emergencyContactPhone: z
    .string()
    .trim()
    .regex(
      /^(?:\+254|0)7\d{8}$/,
      "Please provide a valid emergency contact phone number"
    )
    .optional(),
});