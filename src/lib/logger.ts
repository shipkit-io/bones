import { trace as otelTrace, type Span, SpanStatusCode, type Tracer } from "@opentelemetry/api";
import type { Log } from "evlog";
import type { LogLevel } from "../types/logger";
import { isEvlogEnabled } from "./evlog";
import pc from "./utils/pico-colors";

const tracer: Tracer = otelTrace.getTracer("bones-nextjs-app");

const _isServer = typeof window === "undefined";

/**
 * evlog trial (LAC-3361): when the flag is on, log calls become evlog wide
 * events instead of the span-per-log hack below. Loaded lazily so client
 * bundles and non-trial deployments never pull evlog; isEvlogEnabled() is
 * always false in the browser. Until the import settles (microtasks at module
 * load), calls fall back to the legacy path.
 */
let evlogLog: Log | null = null;
if (isEvlogEnabled()) {
  void import("evlog")
    .then((mod) => {
      evlogLog = mod.log;
    })
    .catch(() => {
      evlogLog = null;
    });
}

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

    const error = args.find((arg) => arg instanceof Error);
    const metadata = args.find((arg) => typeof arg === "object" && !(arg instanceof Error)) as
      Record<string, unknown> | undefined;

    if (evlogLog) {
      // evlog has no "log" level; console.log-style calls map to info. evlog
      // owns console output on this path (pretty in dev, JSON in prod).
      const evlogLevel = level === "log" ? "info" : level;
      evlogLog[evlogLevel]({
        message,
        ...metadata,
        ...(error ? { error: error.message, stack: error.stack } : {}),
      });
      return;
    }

    const span: Span = tracer.startSpan(`log.${level}`);
    span.setAttribute("log.message", message);
    span.setAttribute("log.level", level);

    if (error) {
      span.recordException(error);
      span.setStatus({ code: SpanStatusCode.ERROR });
    }

    if (metadata) {
      Object.entries(metadata).forEach(([key, value]) => {
        span.setAttribute(`log.metadata.${key}`, JSON.stringify(value));
      });
    }

    span.end();

    const consoleMethod = (console[level] ?? console.log).bind(console);
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

  const _consoleMethod: LoggingMethod =
    prefixType in LOGGING_METHOD ? LOGGING_METHOD[prefixType] : "info";

  const _prefix = prefixes[prefixType];
  // If there's no message, don't print the prefix but a new line
  if (message.length === 0) {
  } else {
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
  throw new Error(`Panic: ${message.join(" ")}`);
}
