import { z } from "zod";

export const SearchModeEnum = z.enum([
  "BROAD",
  "NO_WEBSITE",
  "WEAK_WEBSITE",
  "HIGH_REPUTATION",
  "HIGH_AUTOMATION_POTENTIAL",
  "PREMIUM_BUSINESS",
  "CUSTOM",
]);

export type SearchModeType = z.infer<typeof SearchModeEnum>;

export const JobStatusEnum = z.enum([
  "QUEUED",
  "RUNNING",
  "PARTIAL",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
]);

export type JobStatusType = z.infer<typeof JobStatusEnum>;

export const createSearchJobSchema = z.object({
  locationQuery: z
    .string()
    .min(2, "Location query must be at least 2 characters")
    .max(200, "Location query cannot exceed 200 characters")
    .trim(),
  categories: z
    .array(z.string().min(1).trim())
    .min(1, "At least one business category is required")
    .max(10, "You can select up to 10 categories"),
  radiusMeters: z
    .number()
    .int()
    .min(500, "Radius must be at least 500 meters (0.5 km)")
    .max(50000, "Radius cannot exceed 50,000 meters (50 km)")
    .default(10000),
  maxBusinesses: z
    .number()
    .int()
    .min(1, "Must discover at least 1 business")
    .max(100, "Max businesses per job is 100")
    .default(20),
  minimumRating: z
    .number()
    .min(0, "Rating cannot be below 0")
    .max(5, "Rating cannot exceed 5")
    .optional()
    .nullable(),
  minimumReviewCount: z
    .number()
    .int()
    .min(0, "Review count cannot be negative")
    .optional()
    .nullable(),
  searchMode: SearchModeEnum.default("BROAD"),
  targetServices: z.array(z.string()).optional().default([]),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
});

export type CreateSearchJobInput = z.infer<typeof createSearchJobSchema>;

export const VALID_JOB_TRANSITIONS: Record<JobStatusType, JobStatusType[]> = {
  QUEUED: ["RUNNING", "CANCELLED", "FAILED"],
  RUNNING: ["PARTIAL", "COMPLETED", "FAILED", "CANCELLED"],
  PARTIAL: ["COMPLETED", "FAILED"],
  COMPLETED: [],
  FAILED: [],
  CANCELLED: [],
};

export function canTransitionJob(from: JobStatusType, to: JobStatusType): boolean {
  if (from === to) return true;
  const allowed = VALID_JOB_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}
