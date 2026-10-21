import { z } from "zod";

export const createMaterialSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Material name is required")
    .max(150, "Material name is too long"),

  code: z
    .string()
    .trim()
    .max(50, "Material code is too long")
    .optional(),

  description: z
    .string()
    .trim()
    .max(300, "Description is too long")
    .optional(),

  unit: z.enum([
    "kg",
    "ton",
    "bag",
    "piece",
    "litre",
    "metre",
    "square_metre",
    "cubic_metre",
    "box",
    "roll",
    "carton",
    "millilitre",
    "drum",
    "bundle",
    "sheet",
    "pair",
    "set",
    "bar",
    "packet",
    "gram",
  ]),

  minimumStock: z
    .number()
    .min(0, "Minimum stock cannot be negative"),
});