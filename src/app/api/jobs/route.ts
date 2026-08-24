import { NextRequest } from "next/server";
import { SearchJobService } from "@/services/search-job-service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";
import { createSearchJobSchema, JobStatusType } from "@/domain/search-job";

export const dynamic = "force-dynamic";

/**
 * POST /api/jobs
 * Creates and queues a new search job
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validatedInput = createSearchJobSchema.parse(body);

    const job = await SearchJobService.createJob(validatedInput);

    return createSuccessResponse(job, undefined, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/jobs
 * Lists search jobs with pagination and optional status filter
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const statusParam = searchParams.get("status") as JobStatusType | null;
    const pageParam = parseInt(searchParams.get("page") || "1", 10);
    const limitParam = parseInt(searchParams.get("limit") || "20", 10);

    const result = await SearchJobService.listJobs({
      status: statusParam || undefined,
      page: isNaN(pageParam) ? 1 : pageParam,
      limit: isNaN(limitParam) ? 20 : Math.min(100, Math.max(1, limitParam)),
    });

    return createSuccessResponse(result.jobs, { pagination: result.pagination });
  } catch (error) {
    return handleApiError(error);
  }
}
