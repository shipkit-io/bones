import { z } from "zod";

/**
 * GitHub reserved names that cannot be used as repository names
 */
const GITHUB_RESERVED_NAMES = [
	".git",
	".github",
	"api",
	"www",
	"admin",
	"root",
	"master",
	"main",
	"undefined",
	"null",
	"con",
	"prn",
	"aux",
	"nul",
	"com1",
	"com2",
	"com3",
	"com4",
	"com5",
	"com6",
	"com7",
	"com8",
	"com9",
	"lpt1",
	"lpt2",
	"lpt3",
	"lpt4",
	"lpt5",
	"lpt6",
	"lpt7",
	"lpt8",
	"lpt9",
] as const;

/**
 * Dangerous patterns that could indicate injection attempts
 */
const DANGEROUS_PATTERNS = [
	/[<>:"/\\|?*]/, // Characters not allowed in filenames
	/\$\{.*\}/, // Template literals
	/\$\(.*\)/, // Command substitution
	/`.*`/, // Backticks
	/;|&&|\|\|/, // Command chaining
] as const;

/**
 * Validates a project name for use as a GitHub repository name
 * Follows GitHub's repository naming rules:
 * - Can only contain alphanumeric characters, hyphens, underscores, and dots
 * - Cannot start or end with a dot
 * - Cannot have consecutive dots
 * - Cannot be a reserved name
 * - Must be between 1 and 100 characters
 */
const projectNameValidation = z
	.string({ required_error: "Project name is required" })
	.min(1, { message: "Project name is required" })
	.max(100, { message: "Project name must be between 1 and 100 characters" })
	.trim()
	.refine(
		(name) => {
			// GitHub repository name rules:
			// - Can only contain alphanumeric characters, hyphens, underscores, and dots
			// - Cannot start or end with a dot
			// - Cannot have consecutive dots
			const validNamePattern = /^[a-zA-Z0-9]([a-zA-Z0-9\-_.])*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/;
			return validNamePattern.test(name);
		},
		{
			message:
				"Project name can only contain letters, numbers, hyphens, underscores, and dots. It cannot start or end with a dot.",
		}
	)
	.refine((name) => !name.includes(".."), {
		message: "Project name cannot contain consecutive dots",
	})
	.refine((name) => !GITHUB_RESERVED_NAMES.includes(name.toLowerCase() as any), {
		message: "This project name is reserved and cannot be used",
	})
	.refine(
		(name) => {
			// Check for dangerous patterns that could indicate injection attempts
			return !DANGEROUS_PATTERNS.some((pattern) => pattern.test(name));
		},
		{
			message: "Project name contains invalid characters",
		}
	);

/**
 * Schema for deployment form data
 */
export const deploymentSchema = z.object({
	projectName: projectNameValidation,
});

/**
 * Type inference for deployment form data
 */
export type DeploymentFormData = z.infer<typeof deploymentSchema>;

/**
 * Validates a project name and returns detailed error information
 * @param projectName - The project name to validate
 * @returns An object with validation result and error message if invalid
 */
export function validateProjectName(projectName: string): {
	isValid: boolean;
	error?: string;
} {
	try {
		deploymentSchema.parse({ projectName });
		return { isValid: true };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				isValid: false,
				error: error.errors[0]?.message || "Invalid project name",
			};
		}
		return {
			isValid: false,
			error: "Invalid project name",
		};
	}
}
