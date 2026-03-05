import { trace as otelTrace, type Span, SpanStatusCode, type Tracer } from "@opentelemetry/api";
import pc from "./utils/pico-colors";
import type { LogData, LogLevel } from "../types/logger";

const tracer: Tracer = otelTrace.getTracer("bones-nextjs-app");

const isServer = typeof window === "undefined";

const _createLogger =
	(level: LogLevel) =>
	(...args: unknown[]): void => {
		const message = args
			.map((arg) => {
				if (arg === null) return "null";
				if (arg === undefined) return "undefined";
				if (typeof arg === "string") return arg;
				if (typeof arg === "number") return arg.toString();
				if (typeof arg === "boolean") return arg.toString();
				if (typeof arg === "bigint") return arg.toString();
				if (typeof arg === "symbol") return arg.toString();
				if (typeof arg === "function") return "[Function]";
				// Must be an object at this point
				try {
					return JSON.stringify(arg);
				} catch {
					return "[Object]";
				}
			})
			.join(" ");

		const span: Span = tracer.startSpan(`log.${level}`);
		span.setAttribute("log.message", message);
		span.setAttribute("log.level", level);

		const error = args.find((arg) => arg instanceof Error);
		if (error) {
			span.recordException(error);
			span.setStatus({ code: SpanStatusCode.ERROR });
		}

		const metadata = args.find((arg) => typeof arg === "object" && !(arg instanceof Error)) as
			| Record<string, unknown>
			| undefined;
		if (metadata) {
			Object.entries(metadata).forEach(([key, value]) => {
				span.setAttribute(`log.metadata.${key}`, JSON.stringify(value));
			});
		}

		span.end();

		const consoleMethod = console[level] ?? console.log;
		consoleMethod(...args);
	};

export const logger = {
	info: _createLogger("info"),
	warn: _createLogger("warn"),
	error: _createLogger("error"),
	debug: _createLogger("debug"),
	log: _createLogger("log"),
};

const prefixes = {
	info: pc.white("ℹ"),
	warn: pc.yellow("⚠"),
	error: pc.red("✖"),
	wait: pc.magenta("○"),
	ready: pc.green("✓"),
	event: pc.magenta("◆"),
	trace: pc.white("›"),
} as const;

const LOGGING_METHOD = {
	info: "info",
	warn: "warn",
	error: "error",
	wait: "info",
	ready: "info",
	event: "info",
	trace: "trace",
} as const;

type PrefixType = keyof typeof prefixes;
type LoggingMethod = keyof typeof LOGGING_METHOD;

function prefixedLog(prefixType: PrefixType, ...message: unknown[]) {
	if ((message[0] === "" || message[0] === undefined) && message.length === 1) {
		message.shift();
	}

	const consoleMethod: LoggingMethod =
		prefixType in LOGGING_METHOD ? LOGGING_METHOD[prefixType] : "info";

	const prefix = prefixes[prefixType];
	// If there's no message, don't print the prefix but a new line
	if (message.length === 0) {
		console[consoleMethod]("");
	} else {
		console[consoleMethod](` ${prefix}`, ...message);
	}
}

export function info(...message: unknown[]) {
	prefixedLog("info", ...message);
}

export function warn(...message: unknown[]) {
	prefixedLog("warn", ...message);
}

export function error(...message: unknown[]) {
	prefixedLog("error", ...message);
}

export function wait(...message: unknown[]) {
	prefixedLog("wait", ...message);
}

export function ready(...message: unknown[]) {
	prefixedLog("ready", ...message);
}

export function event(...message: unknown[]) {
	prefixedLog("event", ...message);
}

export function trace(...message: unknown[]) {
	prefixedLog("trace", ...message);
}

const warnOnceMessages = new Set();

export function warnOnce(...message: unknown[]) {
	const key = JSON.stringify(message);
	if (!warnOnceMessages.has(key)) {
		warnOnceMessages.add(key);
		warn(...message);
	}
}

export function panic(...message: unknown[]) {
	error(...message);
	// process.exit(1) is not supported in Edge Runtime
	// Throwing an error instead to halt execution
	throw new Error("Panic: " + message.join(" "));
}
