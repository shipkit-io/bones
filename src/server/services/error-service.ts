import { logger } from "@/lib/logger";

export type ErrorCode =
    | "VALIDATION_ERROR"
    | "NOT_FOUND"
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "CONFLICT"
    | "INTERNAL_SERVER_ERROR"
    | "BAD_REQUEST"
    | "RATE_LIMITED";

export interface AppError extends Error {
    code: ErrorCode;
    message: string;
    cause?: unknown;
    metadata?: Record<string, unknown>;
}

export class ErrorService {
    /**
     * Creates a standardized error object
     */
    static createError(
        code: ErrorCode,
        message: string,
        cause?: unknown,
        metadata?: Record<string, unknown>,
    ): AppError {
        const error = new Error(message) as AppError;
        error.code = code;
        error.cause = cause;
        error.metadata = metadata;
        return error;
    }

    /**
     * Handles an error by logging it and returning a standardized error response
     */
    static handleError(error: unknown): AppError {
        // If it's already an AppError, just return it
        if (ErrorService.isAppError(error)) {
            logger.error(error.message, {
                code: error.code,
                cause: error.cause,
                metadata: error.metadata,
            });
            return error;
        }

        // Convert Error objects to AppError
        if (error instanceof Error) {
            const appError = ErrorService.createError(
                "INTERNAL_SERVER_ERROR",
                error.message,
                error,
            );
            logger.error(error.message, {
                code: appError.code,
                cause: error,
            });
            return appError;
        }

        // Handle unknown errors
        const appError = ErrorService.createError(
            "INTERNAL_SERVER_ERROR",
            "An unexpected error occurred",
            error,
        );
        logger.error("Unknown error", { error });
        return appError;
    }

    /**
     * Type guard to check if an error is an AppError
     */
    static isAppError(error: unknown): error is AppError {
        return (
            error instanceof Error &&
            "code" in error &&
            typeof (error as AppError).code === "string"
        );
    }

    /**
     * Throws a NOT_FOUND error
     */
    static throwNotFound(
        message: string,
        metadata?: Record<string, unknown>,
    ): never {
        throw ErrorService.createError("NOT_FOUND", message, undefined, metadata);
    }

    /**
     * Throws an UNAUTHORIZED error
     */
    static throwUnauthorized(
        message: string,
        metadata?: Record<string, unknown>,
    ): never {
        throw ErrorService.createError(
            "UNAUTHORIZED",
            message,
            undefined,
            metadata,
        );
    }

    /**
     * Throws a FORBIDDEN error
     */
    static throwForbidden(
        message: string,
        metadata?: Record<string, unknown>,
    ): never {
        throw ErrorService.createError("FORBIDDEN", message, undefined, metadata);
    }

    /**
     * Throws a CONFLICT error
     */
    static throwConflict(
        message: string,
        metadata?: Record<string, unknown>,
    ): never {
        throw ErrorService.createError("CONFLICT", message, undefined, metadata);
    }

    /**
     * Throws a BAD_REQUEST error
     */
    static throwBadRequest(
        message: string,
        metadata?: Record<string, unknown>,
    ): never {
        throw ErrorService.createError("BAD_REQUEST", message, undefined, metadata);
    }

    /**
     * Throws a RATE_LIMITED error
     */
    static throwRateLimited(
        message: string,
        metadata?: Record<string, unknown>,
    ): never {
        throw ErrorService.createError(
            "RATE_LIMITED",
            message,
            undefined,
            metadata,
        );
    }
}
