export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_SEVERITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface LogContext {
  module?: string;
  jobId?: string;
  businessId?: string;
  requestId?: string;
  durationMs?: number;
  [key: string]: unknown;
}

export class Logger {
  private module: string;
  private minLevel: LogLevel;

  constructor(module = "App", minLevel: LogLevel = "info") {
    this.module = module;
    this.minLevel = minLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVEL_SEVERITY[level] >= LOG_LEVEL_SEVERITY[this.minLevel];
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error | unknown
  ) {
    const timestamp = new Date().toISOString();
    const mergedContext = {
      module: this.module,
      ...context,
    };

    const isProduction = process.env.NODE_ENV === "production";

    if (isProduction) {
      const payload: Record<string, unknown> = {
        timestamp,
        level: level.toUpperCase(),
        message,
        ...mergedContext,
      };

      if (error) {
        if (error instanceof Error) {
          payload.error = {
            name: error.name,
            message: error.message,
            stack: error.stack,
          };
        } else {
          payload.error = String(error);
        }
      }

      return JSON.stringify(payload);
    }

    // Pretty development format
    const colors: Record<LogLevel, string> = {
      debug: "\x1b[34m", // blue
      info: "\x1b[32m",  // green
      warn: "\x1b[33m",  // yellow
      error: "\x1b[31m", // red
    };
    const reset = "\x1b[0m";
    const levelStr = `${colors[level]}[${level.toUpperCase()}]${reset}`;
    const ctxStr = Object.keys(mergedContext).length > 0 ? ` | ctx: ${JSON.stringify(mergedContext)}` : "";
    const errStr = error instanceof Error ? `\n  ${error.stack || error.message}` : error ? `\n  ${String(error)}` : "";

    return `${timestamp} ${levelStr} [${this.module}] ${message}${ctxStr}${errStr}`;
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog("debug")) {
      console.debug(this.formatMessage("debug", message, context));
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog("info")) {
      console.info(this.formatMessage("info", message, context));
    }
  }

  warn(message: string, context?: LogContext, error?: Error | unknown) {
    if (this.shouldLog("warn")) {
      console.warn(this.formatMessage("warn", message, context, error));
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    if (this.shouldLog("error")) {
      console.error(this.formatMessage("error", message, context, error));
    }
  }

  child(subModule: string, defaultContext?: LogContext): Logger {
    const childLogger = new Logger(`${this.module}:${subModule}`, this.minLevel);
    return childLogger;
  }
}

export const logger = new Logger(
  "LeadIntelligence",
  (process.env.LOG_LEVEL as LogLevel) || "info"
);
