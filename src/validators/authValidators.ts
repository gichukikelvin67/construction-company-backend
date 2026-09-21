import{ z }from "zod";

export const registerSchema=z.object({
    companyName:z
    .string()
    .trim()
    .min(2, "Company name must be at least 2 characters"),

    name:z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters"),


    email:z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .transform((email)=> email.toLowerCase()),

password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),

  phone: z
    .string()
    .trim()
    .regex(
      /^(?:\+254|0)7\d{8}$/,
      "Please provide a valid Kenyan phone number"
    ),

})
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .transform((email) => email.toLowerCase()),

  password: z
    .string()
    .min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please provide a valid email address")
    .transform((email) => email.toLowerCase()),
});

export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, "Reset token is required"),

  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password is too long"),
});

export const verifyEmailSchema = z.object({
  token: z
    .string()
    .min(1, "Verification token is required"),
});

export const changePasswordSchema=z.object({
  currentPassword:z
  .string()
  .min(1,"Current password is required"),

  newPassword:z
  .string()
  .min(8,"New password must be at least 8 characters")
  .max(100, "New password is too long"),
})