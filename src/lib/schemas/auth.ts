import { z } from "zod";

export const signInSchema = z.object({
	email: z
		.string({ required_error: "Email is required" })
		.email("Please enter a valid email address."),
	password: z.string({ required_error: "Password is required" }).min(4, {
		message: "Password must be at least 4 characters.",
	}),
});

export const signInActionSchema = signInSchema.extend({
	redirectTo: z.string().optional(),
	redirect: z.boolean().optional(),
});

export const signUpSchema = signInActionSchema;

export const forgotPasswordSchema = signInSchema.pick({ email: true });

export const resetPasswordSchema = z
	.object({
		token: z.string({ required_error: "Reset token is required." }),
		password: z.string({ required_error: "Password is required" }).min(4, {
			message: "Password must be at least 4 characters.",
		}),
		passwordConfirm: z.string({ required_error: "Please confirm your password." }),
	})
	.refine((data) => data.password === data.passwordConfirm, {
		message: "Passwords do not match.",
		path: ["passwordConfirm"],
	});
