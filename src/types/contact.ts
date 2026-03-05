import { z } from "zod";

export const contactFormSchema = z.object({
	name: z.string().min(2, "Name must be at least 2 characters"),
	contactInfo: z.string().optional(),
	message: z.string().min(10, "Message must be at least 10 characters"),
	newsletter: z.boolean(),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
