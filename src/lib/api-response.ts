import { NextResponse } from "next/server";
import { AppError } from "./errors";
import { logger } from "./logger";

export interface ApiResponseSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
  timestamp: string;
}

export interface ApiResponseError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}

export type ApiResponse<T> = ApiResponseSuccess<T> | ApiResponseError;

export function createSuccessResponse<T>(
  data: T,
  meta?: Record<string, unknown>,
  status = 200
): NextResponse<ApiResponseSuccess<T>> {
  return NextResponse.json(
    {
      success: true,
      data,
      meta,
      timestamp: new Date().toISOString(),
    },
    { status }
  );
}

export function createErrorResponse(
  error: unknown,
  fallbackMessage = "An unexpected error occurred"
): NextResponse<ApiResponseError> {
  const timestamp = new Date().toISOString();

  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      logger.error(`[API Error 5xx] ${error.message}`, error, {
        code: error.code,
        details: error.details,
      });
    } else {
      logger.warn(`[API Error 4xx] ${error.message}`, {
        code: error.code,
        statusCode: error.statusCode,
        details: error.details,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        timestamp,
      },
      { status: error.statusCode }
    );
  }

  // Unhandled error
  logger.error(`[Unhandled API Error]`, error);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message:
          process.env.NODE_ENV === "production"
            ? fallbackMessage
            : error instanceof Error
            ? error.message
            : fallbackMessage,
      },
      timestamp,
    },
    { status: 500 }
  );
}

export function handleApiError(error: unknown) {
  return createErrorResponse(error);
}
