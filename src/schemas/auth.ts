import { z } from "zod";

export const signInSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .email("Please enter a valid email address."),
  password: z.string({ required_error: "Password is required" }).min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

export const signInActionSchema = signInSchema.extend({
  redirectTo: z.string().optional(),
  redirect: z.boolean().optional(),
});

export const signUpSchema = signInSchema;

export const forgotPasswordSchema = signInSchema.pick({ email: true });
