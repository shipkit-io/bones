import { logger } from "@/lib/logger";
import { z } from "zod";

export interface ValidationError {
    code: "VALIDATION_ERROR";
    message: string;
    fieldErrors?: Record<string, string[]>;
}

export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    error?: ValidationError;
}

export class ValidationService {
    /**
     * Validates data against a schema and returns a strongly typed result
     */
    static async validate<T>(
        schema: z.ZodType<T>,
        data: unknown,
    ): Promise<ValidationResult<T>> {
        try {
            const validatedData = await schema.parseAsync(data);
            return {
                success: true,
                data: validatedData,
            };
        } catch (error) {
            if (error instanceof z.ZodError) {
                const fieldErrors = Object.entries(error.formErrors.fieldErrors).reduce(
                    (acc, [key, value]) => {
                        acc[key] = Array.isArray(value) ? value : [value as string];
                        return acc;
                    },
                    {} as Record<string, string[]>,
                );

                logger.error("Validation error", { error: fieldErrors });

                return {
                    success: false,
                    error: {
                        code: "VALIDATION_ERROR",
                        message: "Validation failed",
                        fieldErrors,
                    },
                };
            }

            logger.error("Unexpected validation error", { error });

            return {
                success: false,
                error: {
                    code: "VALIDATION_ERROR",
                    message: "An unexpected validation error occurred",
                },
            };
        }
    }

    /**
     * Validates data and throws an error if validation fails
     */
    static async validateOrThrow<T>(
        schema: z.ZodType<T>,
        data: unknown,
    ): Promise<T> {
        const result = await this.validate(schema, data);
        if (!result.success) {
            throw result.error;
        }
        return result.data as T;
    }
}

export const validationService = new ValidationService();
