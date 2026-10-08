import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createWorkerAssignmentSchema = z.object({
  projectId: z
    .string()
    .regex(objectIdRegex, "Invalid project ID"),

  workerId: z
    .string()
    .regex(objectIdRegex, "Invalid worker ID"),

  roleOnProject: z
    .string()
    .trim()
    .min(2, "Project role is required")
    .max(100, "Project role is too long"),

  startDate: z
    .string()
    .datetime("Invalid start date"),

  endDate: z
    .string()
    .datetime("Invalid end date")
    .optional(),

  agreedDailyRate: z
    .number()
    .nonnegative("Daily rate cannot be negative"),
});

export const updateWorkerAssignmentSchema = z.object({
  roleOnProject: z
    .string()
    .trim()
    .min(2, "Project role is required")
    .max(100, "Project role is too long")
    .optional(),

  startDate: z
    .string()
    .datetime("Invalid start date")
    .optional(),

  endDate: z
    .string()
    .datetime("Invalid end date")
    .optional(),

  agreedDailyRate: z
    .number()
    .nonnegative("Daily rate cannot be negative")
    .optional(),

  status: z
    .enum(["active", "completed", "cancelled"])
    .optional(),
});