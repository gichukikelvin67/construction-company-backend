import { z } from "zod";

export const createProjectAssignmentSchema = z
  .object({
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

    role: z
      .string()
      .trim()
      .min(2, "Assignment role is required")
      .max(100, "Assignment role is too long"),

    dailyRate: z
      .number()
      .nonnegative("Daily rate cannot be negative"),

    startDate: z
      .string()
      .datetime("Invalid start date"),

    endDate: z
      .string()
      .datetime("Invalid end date")
      .optional(),
  })
  .refine(
    (data) => {
      if (!data.endDate) {
        return true;
      }

      return (
        new Date(data.endDate) >=
        new Date(data.startDate)
      );
    },
    {
      message: "End date cannot be before start date",
      path: ["endDate"],
    }
  );


  export const updateProjectAssignmentSchema = z.object({
  role: z
    .string()
    .trim()
    .min(2, "Assignment role is required")
    .max(100, "Assignment role is too long")
    .optional(),

  dailyRate: z
    .number()
    .nonnegative("Daily rate cannot be negative")
    .optional(),

  endDate: z
    .string()
    .datetime("Invalid end date")
    .optional(),

  status: z
    .enum(["active", "completed", "removed"])
    .optional(),
});