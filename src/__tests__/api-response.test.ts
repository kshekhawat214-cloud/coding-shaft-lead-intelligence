import { describe, it, expect } from "vitest";
import {
  createSuccessResponse,
  createErrorResponse,
} from "../lib/api-response";
import { ValidationError, NotFoundError } from "../lib/errors";

describe("API Response Wrapper", () => {
  it("should create a standard success response", async () => {
    const response = createSuccessResponse({ id: "123", name: "Test Lead" }, { total: 1 });
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data).toEqual({ id: "123", name: "Test Lead" });
    expect(body.meta).toEqual({ total: 1 });
    expect(body.timestamp).toBeDefined();
  });

  it("should create a standard error response for AppError", async () => {
    const error = new ValidationError("Invalid category parameter", { field: "category" });
    const response = createErrorResponse(error);
    expect(response.status).toBe(400);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toBe("Invalid category parameter");
    expect(body.error.details).toEqual({ field: "category" });
    expect(body.timestamp).toBeDefined();
  });

  it("should create 404 response for NotFoundError", async () => {
    const error = new NotFoundError("Search job not found");
    const response = createErrorResponse(error);
    expect(response.status).toBe(404);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("should handle generic unknown errors gracefully", async () => {
    const genericError = new Error("Unexpected crash");
    const response = createErrorResponse(genericError);
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
  });
});
