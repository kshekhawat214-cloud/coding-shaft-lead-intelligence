export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code = "INTERNAL_SERVER_ERROR",
    details?: unknown,
    isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ValidationError extends AppError {
  constructor(message = "Invalid input provided", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found", details?: unknown) {
    super(message, 404, "NOT_FOUND", details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Unauthorized access", details?: unknown) {
    super(message, 401, "UNAUTHORIZED", details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Forbidden action", details?: unknown) {
    super(message, 403, "FORBIDDEN", details);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Resource conflict", details?: unknown) {
    super(message, 409, "CONFLICT", details);
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Rate limit exceeded. Please retry later.", details?: unknown) {
    super(message, 429, "RATE_LIMIT_EXCEEDED", details);
  }
}

export class ExternalProviderError extends AppError {
  public readonly provider: string;

  constructor(provider: string, message: string, details?: unknown) {
    super(`External provider '${provider}' error: ${message}`, 502, "EXTERNAL_PROVIDER_ERROR", {
      provider,
      ...(details ? { details } : {}),
    });
    this.provider = provider;
  }
}

export class DatabaseError extends AppError {
  constructor(message = "Database operation failed", details?: unknown) {
    super(message, 500, "DATABASE_ERROR", details);
  }
}
