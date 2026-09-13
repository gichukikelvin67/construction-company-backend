import { z } from "zod";

export const createAttendanceSchema = z.object({
  projectId: z
    .string()
    .regex(
      /^[0-9a-fA-F]{24}$/,
      "Invalid project ID"
    ),

  workerId: z
    .string()
    .regex(
      /^[0-9a-fA-F]{24}$/,
      "Invalid worker ID"
    ),

  date: z
    .string()
    .datetime("Invalid attendance date"),

  status: z.enum([
    "present",
    "absent",
    "half_day",
    "leave",
  ]),

  notes: z
    .string()
    .trim()
    .max(500, "Notes are too long")
    .optional(),
});