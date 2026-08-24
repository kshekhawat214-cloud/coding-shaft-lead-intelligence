import { PrismaClient } from "@prisma/client";
import { logger } from "./logger";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? [
            { emit: "event", level: "query" },
            { emit: "event", level: "error" },
            { emit: "event", level: "info" },
            { emit: "event", level: "warn" },
          ]
        : [{ emit: "event", level: "error" }],
  });

  if (process.env.NODE_ENV === "development") {
    client.$on("error" as never, (e: unknown) => {
      logger.error("[Prisma Error]", e);
    });
  }

  return client;
}

export const prisma = globalThis.prismaGlobal ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}

export async function checkDatabaseConnection(): Promise<{
  connected: boolean;
  latencyMs?: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    // Ping the database
    await prisma.$queryRaw`SELECT 1`;
    const latencyMs = Date.now() - start;
    return { connected: true, latencyMs };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.warn(`Database connection check failed: ${errorMsg}`);
    return { connected: false, error: errorMsg };
  }
}
