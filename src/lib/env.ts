import { z } from "zod";

const emptyToUndefined = (val: unknown) => 
  typeof val === "string" && val.trim() === "" ? undefined : val;

const envSchema = z.object({
  NODE_ENV: z.preprocess(
    emptyToUndefined,
    z.enum(["development", "test", "production"]).default("development")
  ),
  PORT: z.preprocess(emptyToUndefined, z.coerce.number().default(3000)),
  NEXT_PUBLIC_APP_URL: z.preprocess(
    emptyToUndefined,
    z.string().default("http://localhost:3000")
  ),
  LOG_LEVEL: z.preprocess(
    emptyToUndefined,
    z.enum(["debug", "info", "warn", "error"]).default("info")
  ),

  // Database (PostgreSQL / Supabase)
  DATABASE_URL: z.preprocess(
    emptyToUndefined,
    z.string().min(1, "DATABASE_URL is required").default("postgresql://postgres:postgres@localhost:5432/coding_shaft_leads?schema=public")
  ),
  DIRECT_URL: z.preprocess(emptyToUndefined, z.string().optional()),

  // AI Provider (Gemini)
  GEMINI_API_KEY: z.preprocess(emptyToUndefined, z.string().optional().default("")),

  // Business Discovery
  GOOGLE_PLACES_API_KEY: z.preprocess(emptyToUndefined, z.string().optional().default("")),

  // Google Sheets
  GOOGLE_SERVICE_ACCOUNT_EMAIL: z.preprocess(emptyToUndefined, z.string().optional().default("")),
  GOOGLE_PRIVATE_KEY: z.preprocess(emptyToUndefined, z.string().optional().default("")),
  GOOGLE_SHEETS_SPREADSHEET_ID: z.preprocess(emptyToUndefined, z.string().optional().default("")),

  // Rate Limiting & Safety Defaults
  MAX_SEARCH_RESULTS_DEFAULT: z.preprocess(emptyToUndefined, z.coerce.number().default(20)),
  DISCOVERY_RATE_LIMIT_PER_MINUTE: z.preprocess(emptyToUndefined, z.coerce.number().default(60)),
  RESEARCH_REQUEST_TIMEOUT_MS: z.preprocess(emptyToUndefined, z.coerce.number().default(15000)),
});

export type Env = z.infer<typeof envSchema>;

let parsedEnv: Env | null = null;

export function getEnv(): Env {
  if (parsedEnv) {
    return parsedEnv;
  }

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.warn("⚠️ Environment validation warning, falling back to safe defaults:", result.error.format());
    try {
      parsedEnv = envSchema.parse({
        DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/coding_shaft_leads?schema=public",
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      });
      return parsedEnv;
    } catch {
      return {
        NODE_ENV: "production",
        PORT: 3000,
        NEXT_PUBLIC_APP_URL: "http://localhost:3000",
        LOG_LEVEL: "info",
        DATABASE_URL: process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/coding_shaft_leads?schema=public",
        DIRECT_URL: process.env.DIRECT_URL,
        GEMINI_API_KEY: "",
        GOOGLE_PLACES_API_KEY: "",
        GOOGLE_SERVICE_ACCOUNT_EMAIL: "",
        GOOGLE_PRIVATE_KEY: "",
        GOOGLE_SHEETS_SPREADSHEET_ID: "",
        MAX_SEARCH_RESULTS_DEFAULT: 20,
        DISCOVERY_RATE_LIMIT_PER_MINUTE: 60,
        RESEARCH_REQUEST_TIMEOUT_MS: 15000,
      };
    }
  }

  parsedEnv = result.data;
  return parsedEnv;
}

export const env = getEnv();
