type LogLevel = "info" | "warn" | "error";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
  const entry: LogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(context ? { context } : {}),
  };

  if (process.env.NODE_ENV === "production") {
    console[level === "info" ? "log" : level](JSON.stringify(entry));
  } else {
    const prefix = { info: "ℹ️", warn: "⚠️", error: "❌" }[level];
    console[level === "info" ? "log" : level](
      `${prefix} [${entry.timestamp}] ${message}`,
      context ?? ""
    );
  }
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) =>
    log("info", message, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    log("warn", message, context),
  error: (message: string, context?: Record<string, unknown>) =>
    log("error", message, context),
};
