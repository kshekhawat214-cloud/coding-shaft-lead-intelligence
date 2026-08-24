import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/db";
import { CODING_SHAFT_SERVICES } from "@/domain/services-catalog";
import { env } from "@/lib/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const dbHealth = await checkDatabaseConnection();

  const isHealthy = dbHealth.connected;
  const status = isHealthy ? "healthy" : "degraded";
  const statusCode = isHealthy ? 200 : 503;

  const payload = {
    status,
    timestamp: new Date().toISOString(),
    version: "0.1.0",
    environment: env.NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
    checks: {
      database: {
        status: dbHealth.connected ? "connected" : "disconnected",
        latencyMs: dbHealth.latencyMs ?? null,
        error: dbHealth.error ?? null,
      },
      servicesCatalog: {
        status: "ready",
        totalServices: CODING_SHAFT_SERVICES.length,
      },
      envValidation: {
        status: "valid",
      },
    },
    meta: {
      responseTimeMs: Date.now() - startTime,
    },
  };

  return NextResponse.json(payload, { status: statusCode });
}
