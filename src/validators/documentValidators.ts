import {z}from "zod";
const objectId=(fieldName:string)=>
    z
  .string()
    .regex(
      /^[0-9a-fA-F]{24}$/,
      `Invalid ${fieldName}`
    );

export const createDocumentSchema = z.object({
  projectId: objectId("project ID"),

  name: z
    .string()
    .trim()
    .min(2, "Document name must be at least 2 characters")
    .max(200, "Document name cannot exceed 200 characters"),

  description: z
    .string()
    .trim()
    .max(2000, "Description cannot exceed 2000 characters")
    .optional(),

  category: z.enum([
    "contract",
    "invoice",
    "receipt",
    "plan",
    "inspection_report",
    "site_photo",
    "other",
  ]),

  fileUrl: z
    .string()
    .trim()
    .url("Invalid file URL"),

  fileName: z
    .string()
    .trim()
    .min(1, "File name is required")
    .max(255, "File name cannot exceed 255 characters"),

  fileType: z
    .string()
    .trim()
    .min(1, "File type is required")
    .max(100, "File type cannot exceed 100 characters"),

  fileSize: z
    .number()
    .int()
    .min(1, "File size must be greater than 0"),
});

export const updateDocumentSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Document name must be at least 2 characters")
      .max(200, "Document name cannot exceed 200 characters")
      .optional(),

    description: z
      .string()
      .trim()
      .max(2000, "Description cannot exceed 2000 characters")
      .optional(),

    category: z
      .enum([
        "contract",
        "invoice",
        "receipt",
        "plan",
        "inspection_report",
        "site_photo",
        "other",
      ])
      .optional(),
  })
  .refine(
    (data) => Object.values(data).some((value) => value !== undefined),
    {
      message: "At least one field must be provided",
      path: ["name"],
    }
  );