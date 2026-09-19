import { z} from "zod";

export const createUserSchema=z.object({
    name:z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(150, "Name is too long"),

    email:z
    .string()
    .trim()
    .email("Invalid email address")
    .max(150, "Email is too long"),

    phone: z
  .string()
  .trim()
  .min(7, "Phone number is too short")
  .max(20, "Phone number is too long"),
    

    password:z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),

    role:z .enum([
        "project_manager",
        "site_supervisor",
        "accountant",
        "storekeeper",
    ]),
})
export const updateUserRoleSchema = z.object({
  role: z.enum([
    "project_manager",
    "site_supervisor",
    "accountant",
    "storekeeper",
  ]),
});