import { z } from "zod";

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
