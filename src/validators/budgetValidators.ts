import {z}from "zod";

export const createBudgetSchema=z.object({
    projectId:z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Invalid project ID"),

    categories:z

    .array(
        z.object({
            category:z.enum([
                "materials",
                "labour",
                "equipment",
                "transport",
                "permits",
                "utilities",
                "other",
            ]),

            amount:z
            .number()
            .positive("Budget amount must be greater than zero"),

            description:z
            .string()
            .trim()
            .max(300, "Description is too long")
            .optional(),

        })
    )

    .min(1, "At least one budget category is required"),
})