import { z } from "zod";

export const isSpamSchema = z.object({
  content: z
    .string()
    .min(5, { message: "Content must be at least 5 characters" }),
  sender: z.string().optional(),
});
