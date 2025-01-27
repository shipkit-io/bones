import { REGEX_PATTERNS } from "@/lib/utils/regex-patterns";
import { z } from "zod";

export const userSchema = z.object({
	name: z.string().min(1, { message: "Name is required" }),

	email: z.string().email("Please enter a valid email address."),
	password: z.string({ required_error: "Password is required" }).min(6, {
		message: "Password must be at least 6 characters.",
	}),

	location: z
		.string()
		.min(1, { message: "Enter a valid zip code or location" }),
	phone: z.string().regex(REGEX_PATTERNS.phone, {
		message: "Please enter a valid phone number.",
	}),
	website: z
		.string()
		.regex(REGEX_PATTERNS.url, { message: "Please enter a valid website URL." })
		.optional()
		.or(z.literal("")),

	acceptTerms: z
		.union([z.boolean(), z.string()])
		.refine(
			(value) => {
				if (typeof value === "boolean") {
					return value === true;
				}
				return false;
			},
			{
				message: "You must accept the terms and conditions",
			},
		)
		.transform((value) => {
			if (typeof value === "string") {
				return value === "true" || value === "on";
			}
			return value;
		}),
});

export const userSignUpSchema = userSchema.pick({
	email: true,
	password: true,
});

export const userApplySchema = userSchema
	.pick({
		email: true,
		password: true,
		acceptTerms: true,
	})
	.extend({
		// Optional fields
		name: userSchema.shape.name.optional(),
		location: userSchema.shape.location.optional(),
		phone: userSchema.shape.phone.optional(),
		website: userSchema.shape.website.optional(),
	});
