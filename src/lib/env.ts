import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  LOG_LEVEL: z
    .enum(["debug", "info", "warn", "error"])
    .default("info"),

  // Database (PostgreSQL / Supabase)
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required")
    .default("postgresql://postgres:postgres@localhost:5432/coding_shaft_leads?schema=public"),
  DIRECT_URL: z.string().optional(),

  // AI Provider (Gemini)
  GEMINI_API_KEY: z.string().optional().default(""),

  // Business Discovery
  GOOGLE_PLACES_API_KEY: z.string().optional().default(""),

  // Google Sheets
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.string().optional().default(""),
  GOOGLE_PRIVATE_KEY: z.string().optional().default(""),
  GOOGLE_SHEETS_SPREADSHEET_ID: z.string().optional().default(""),

  // Rate Limiting & Safety Defaults
  MAX_SEARCH_RESULTS_DEFAULT: z.coerce.number().default(20),
  DISCOVERY_RATE_LIMIT_PER_MINUTE: z.coerce.number().default(60),
  RESEARCH_REQUEST_TIMEOUT_MS: z.coerce.number().default(15000),
});

export type Env = z.infer<typeof envSchema>;

let parsedEnv: Env | null = null;

export function getEnv(): Env {
  if (parsedEnv) {
    return parsedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formattedErrors = result.error.format();
    const errorDetails = Object.entries(formattedErrors)
      .filter(([key]) => key !== "_errors")
      .map(([key, value]) => `  - ${key}: ${(value as { _errors: string[] })._errors.join(", ")}`)
      .join("\n");

    const message = `Environment validation failed:\n${errorDetails}`;
    
    // In production or test, surface validation issues
    if (process.env.NODE_ENV === "production") {
      throw new Error(message);
    } else {
      console.warn(`[WARN] ${message}`);
      // Fallback with defaults where possible
      parsedEnv = envSchema.parse({
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/coding_shaft_leads?schema=public",
      });
      return parsedEnv;
    }
  }

  parsedEnv = result.data;
  return parsedEnv;
}

export const env = getEnv();
