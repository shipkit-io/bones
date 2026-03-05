"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

/**
 * Error types for server action failures
 */
export enum ServerActionError {
	NETWORK_ERROR = "NETWORK_ERROR",
	PROXY_BLOCKED = "PROXY_BLOCKED",
	TIMEOUT = "TIMEOUT",
	SERVER_ERROR = "SERVER_ERROR",
	UNKNOWN = "UNKNOWN",
}

export interface ServerActionResult<T = any> {
	success: boolean;
	data?: T;
	error?: string;
	errorType?: ServerActionError;
}

export interface ServerActionOptions {
	/** Timeout in milliseconds (default: 10000) */
	timeout?: number;
	/** Number of retry attempts (default: 2) */
	retries?: number;
	/** Delay between retries in milliseconds (default: 1000) */
	retryDelay?: number;
	/** Show toast notifications on error (default: true) */
	showToast?: boolean;
	/** Custom error messages */
	errorMessages?: {
		network?: string;
		proxy?: string;
		timeout?: string;
		server?: string;
		unknown?: string;
	};
	/** Fallback function when server action fails */
	fallback?: () => Promise<ServerActionResult<any>> | ServerActionResult<any>;
	/** Custom loading state handler */
	onLoadingChange?: (loading: boolean) => void;
}

/**
 * Detects if an error is likely due to corporate proxy blocking
 */
function isProxyError(error: any): boolean {
	if (!error) return false;

	const errorString = error.toString().toLowerCase();
	const message = error.message?.toLowerCase() || "";

	// Common proxy blocking indicators
	const proxyIndicators = [
		"403",
		"forbidden",
		"proxy",
		"blocked",
		"filtered",
		"corporate",
		"network policy",
		"access denied",
		"unauthorized",
		"security policy",
	];

	return proxyIndicators.some(
		(indicator) => errorString.includes(indicator) || message.includes(indicator)
	);
}

/**
 * Detects if an error is a network/connectivity issue
 */
function isNetworkError(error: any): boolean {
	if (!error) return false;

	const errorString = error.toString().toLowerCase();
	const message = error.message?.toLowerCase() || "";

	const networkIndicators = [
		"network",
		"fetch",
		"connection",
		"timeout",
		"unreachable",
		"offline",
		"no internet",
		"dns",
		"abort",
	];

	return networkIndicators.some(
		(indicator) => errorString.includes(indicator) || message.includes(indicator)
	);
}

/**
 * Categorizes the error type
 */
function categorizeError(error: any): ServerActionError {
	if (isProxyError(error)) {
		return ServerActionError.PROXY_BLOCKED;
	}

	if (isNetworkError(error)) {
		return ServerActionError.NETWORK_ERROR;
	}

	if (error.name === "TimeoutError" || error.message?.includes("timeout")) {
		return ServerActionError.TIMEOUT;
	}

	if (error.message?.includes("500") || error.message?.includes("server")) {
		return ServerActionError.SERVER_ERROR;
	}

	return ServerActionError.UNKNOWN;
}

/**
 * Creates a timeout promise that rejects after the specified time
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
	const timeoutPromise = new Promise<never>((_, reject) => {
		setTimeout(() => {
			reject(new Error(`Operation timed out after ${timeoutMs}ms`));
		}, timeoutMs);
	});

	return Promise.race([promise, timeoutPromise]);
}

/**
 * Wraps a server action with error handling, retries, and fallbacks
 */
export function withServerActionHandling<T extends any[], R>(
	serverAction: (...args: T) => Promise<R>,
	options: ServerActionOptions = {}
) {
	const {
		timeout = 10000,
		retries = 2,
		retryDelay = 1000,
		showToast = true,
		errorMessages = {},
		fallback,
		onLoadingChange,
	} = options;

	return async (...args: T): Promise<ServerActionResult<R>> => {
		onLoadingChange?.(true);

		let lastError: any;

		// Attempt the server action with retries
		for (let attempt = 0; attempt <= retries; attempt++) {
			try {
				const result = await withTimeout(serverAction(...args), timeout);
				onLoadingChange?.(false);

				return {
					success: true,
					data: result,
				};
			} catch (error) {
				lastError = error;
				console.error(`Server action attempt ${attempt + 1} failed:`, error);

				// Don't retry on the last attempt
				if (attempt < retries) {
					await new Promise((resolve) => setTimeout(resolve, retryDelay));
				}
			}
		}

		// All attempts failed, categorize the error
		const errorType = categorizeError(lastError);

		// Try fallback if available
		if (fallback) {
			try {
				console.log("Attempting fallback for server action");
				const fallbackResult = await fallback();
				onLoadingChange?.(false);

				if (fallbackResult.success) {
					if (showToast) {
						toast.info("Using offline mode due to connectivity issues");
					}
					return fallbackResult;
				}
			} catch (fallbackError) {
				console.error("Fallback also failed:", fallbackError);
			}
		}

		// Generate appropriate error message
		let errorMessage: string;
		switch (errorType) {
			case ServerActionError.PROXY_BLOCKED:
				errorMessage =
					errorMessages.proxy ||
					"This action was blocked by your network security. Please contact your IT administrator or try again later.";
				break;
			case ServerActionError.NETWORK_ERROR:
				errorMessage =
					errorMessages.network ||
					"Network connection issue. Please check your internet connection and try again.";
				break;
			case ServerActionError.TIMEOUT:
				errorMessage = errorMessages.timeout || "The request timed out. Please try again.";
				break;
			case ServerActionError.SERVER_ERROR:
				errorMessage = errorMessages.server || "Server error occurred. Please try again later.";
				break;
			default:
				errorMessage = errorMessages.unknown || "An unexpected error occurred. Please try again.";
		}

		if (showToast) {
			toast.error(errorMessage);
		}

		onLoadingChange?.(false);

		return {
			success: false,
			error: errorMessage,
			errorType,
		};
	};
}

/**
 * Hook for handling server actions with loading states
 */
export function useServerAction<T extends any[], R>(
	serverAction: (...args: T) => Promise<R>,
	options: ServerActionOptions = {}
) {
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const wrappedAction = useCallback(
		withServerActionHandling(serverAction, {
			...options,
			onLoadingChange: (loading) => {
				setIsLoading(loading);
				options.onLoadingChange?.(loading);
			},
		}),
		[serverAction, options]
	);

	const execute = useCallback(
		async (...args: T) => {
			setError(null);
			const result = await wrappedAction(...args);

			if (!result.success) {
				setError(result.error || "Unknown error");
			}

			return result;
		},
		[wrappedAction]
	);

	return {
		execute,
		isLoading,
		error,
		clearError: () => setError(null),
	};
}

/**
 * Higher-order component that wraps forms with server action error handling
 */
export function withServerActionForm<P extends object>(
	WrappedComponent: React.ComponentType<P>,
	options: ServerActionOptions = {}
) {
	return function ServerActionFormWrapper(props: P) {
		return (
			<div className="server-action-wrapper">
				<WrappedComponent {...props} />
			</div>
		);
	};
}
