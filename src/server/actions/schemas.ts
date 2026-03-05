import { z } from "zod";
import { ALLOWED_FILE_TYPES, BYTES_IN_A_MEGABYTE, FILE_UPLOAD_MAX_SIZE } from "@/config/file";

// File Schemas

export const fileSchema = z
	.instanceof(File)
	.refine((file) => file.size <= FILE_UPLOAD_MAX_SIZE, {
		message: `File size too large. Maximum allowed size is ${FILE_UPLOAD_MAX_SIZE / BYTES_IN_A_MEGABYTE}MB.`,
	})
	.refine((file) => ALLOWED_FILE_TYPES.includes(file.type), {
		message: "Invalid file type.",
	});

export type FileSchemaType = z.infer<typeof fileSchema>;

// Project Schemas
export const createProjectSchema = z.object({
	name: z.string().min(1, "Project name is required"),
	teamId: z.string().min(1, "Team ID is required"),
	userId: z.string().min(1, "User ID is required"),
});

export const updateProjectSchema = z.object({
	projectId: z.string().min(1, "Project ID is required"),
	name: z.string().min(1, "Project name is required"),
});

export const projectIdSchema = z.object({
	projectId: z.string().min(1, "Project ID is required"),
});

export const projectMemberSchema = z.object({
	projectId: z.string().min(1, "Project ID is required"),
	userId: z.string().min(1, "User ID is required"),
	role: z.string().min(1, "Role is required"),
});

// Team Schemas
export const createTeamSchema = z.object({
	userId: z.string().min(1, "User ID is required"),
	name: z.string().min(1, "Team name is required"),
});

export const updateTeamSchema = z.object({
	teamId: z.string().min(1, "Team ID is required"),
	name: z.string().min(1, "Team name is required"),
});

export const teamIdSchema = z.object({
	teamId: z.string().min(1, "Team ID is required"),
});

export const teamMemberSchema = z.object({
	teamId: z.string().min(1, "Team ID is required"),
	userId: z.string().min(1, "User ID is required"),
	role: z.string().min(1, "Role is required"),
});

// User Schemas
export const userIdSchema = z.object({
	userId: z.string().min(1, "User ID is required"),
});

export const userSchema = z.object({
	id: z.string().min(1, "User ID is required"),
	email: z.string().email("Invalid email address"),
	name: z.string().optional().nullable(),
	image: z.string().url("Invalid image URL").optional().nullable(),
});

export const updateProfileSchema = z.object({
	userId: z.string().min(1, "User ID is required"),
	data: z.object({
		name: z.string().optional().nullable(),
		image: z.string().url("Invalid image URL").optional().nullable(),
	}),
});

// API Key Schemas
export const createApiKeySchema = z.object({
	projectId: z.string().min(1, "Project ID is required"),
	expiresIn: z.number().optional(),
});

export const createGuestApiKeySchema = z.object({
	expiresIn: z.number().optional(),
});

export const apiKeyIdSchema = z.object({
	apiKeyId: z.string().min(1, "API Key ID is required"),
});

export const validateApiKeySchema = z.object({
	apiKey: z.string().min(1, "API Key is required"),
});
