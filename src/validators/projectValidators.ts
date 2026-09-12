import {z}from "zod";

export const createProjectSchema=z
.object({
    name:z
    .string()
    .trim()
    .min(2,"Project name must be atleast 2 characters")
    .max(150, "Project name is too long"),


    description:z
    .string()
    .trim()
    .max(2000, "Descripton is too long")
    .optional(),


    location:z

    .string()
    .trim()
    .min(2, "Location is required")
    .max(150, "Client name is too long"),


    clientName:z
    .string()
    .trim()
    .min(2, "Client name is required")
    .max(150, "Client name is too long"),

    budget:z
    .number()
    .nonnegative("Budget cannot be negative"),

    startDate:z
    .string()
    .datetime("Invalid start date"),

    expectedEndDate:z

    .string()
    .datetime("Invalid expected end date"),

    status:z
    .enum([
        "planning",
        "active",
        "on_hold",
        "completed",
        "cancelled",

    ])

    .default("planning"),

})
.refine(
    (data)=>
        new  Date(data.expectedEndDate) >=
    new Date(data.startDate),
    {
        message:"Expected end date cannot be before start date",
        path:["expectedEndDate"],
    }
)

export const updateProjectSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Project name must be at least 2 characters")
      .max(150, "Project name is too long")
      .optional(),

    description: z
      .string()
      .trim()
      .max(2000, "Description is too long")
      .optional(),

    location: z
      .string()
      .trim()
      .min(2, "Location is required")
      .max(300, "Location is too long")
      .optional(),

    clientName: z
      .string()
      .trim()
      .min(2, "Client name is required")
      .max(150, "Client name is too long")
      .optional(),

    budget: z
      .number()
      .nonnegative("Budget cannot be negative")
      .optional(),

    startDate: z
      .string()
      .datetime("Invalid start date")
      .optional(),

    expectedEndDate: z
      .string()
      .datetime("Invalid expected end date")
      .optional(),

    status: z
      .enum([
        "planning",
        "active",
        "on_hold",
        "completed",
        "cancelled",
      ])
      .optional(),
  })
  .refine(
    (data) => {
      if (!data.startDate || !data.expectedEndDate) {
        return true;
      }

      return (
        new Date(data.expectedEndDate) >=
        new Date(data.startDate)
      );
    },
    {
      message: "Expected end date cannot be before start date",
      path: ["expectedEndDate"],
    }
  );
