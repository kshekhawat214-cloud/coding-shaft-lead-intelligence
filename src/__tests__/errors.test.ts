import { describe, it, expect } from "vitest";
import {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  ExternalProviderError,
  DatabaseError,
} from "../lib/errors";

describe("Application Errors Hierarchy", () => {
  it("should create AppError with default status 500", () => {
    const error = new AppError("Something went wrong");
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("INTERNAL_SERVER_ERROR");
    expect(error.isOperational).toBe(true);
  });

  it("should create ValidationError with status 400", () => {
    const error = new ValidationError("Missing location field", { field: "location" });
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe("VALIDATION_ERROR");
    expect(error.details).toEqual({ field: "location" });
  });

  it("should create NotFoundError with status 404", () => {
    const error = new NotFoundError("Lead not found");
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe("NOT_FOUND");
  });

  it("should create UnauthorizedError with status 401", () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe("UNAUTHORIZED");
  });

  it("should create ForbiddenError with status 403", () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe("FORBIDDEN");
  });

  it("should create ConflictError with status 409", () => {
    const error = new ConflictError("Business already exists");
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe("CONFLICT");
  });

  it("should create RateLimitError with status 429", () => {
    const error = new RateLimitError();
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe("RATE_LIMIT_EXCEEDED");
  });

  it("should create ExternalProviderError with status 502 and provider context", () => {
    const error = new ExternalProviderError("GooglePlaces", "Quota exceeded", { quota: 0 });
    expect(error.statusCode).toBe(502);
    expect(error.code).toBe("EXTERNAL_PROVIDER_ERROR");
    expect(error.provider).toBe("GooglePlaces");
    expect(error.message).toContain("GooglePlaces");
  });

  it("should create DatabaseError with status 500", () => {
    const error = new DatabaseError("Connection timeout");
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe("DATABASE_ERROR");
  });
});
