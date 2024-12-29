/**
 * Type definitions for the logger service.
 */

export type LogLevel = "info" | "warn" | "error" | "debug" | "log";

export interface LogData {
	level: LogLevel;
	message: string;
	timestamp: string;
	url?: string;
	userAgent?: string;
	metadata?: Record<string, unknown>;
	apiKey?: string;
	prefix?: string;
	emoji?: string;
	stackTrace?: string;
}
