import { NextRequest } from "next/server";
import { SearchJobService } from "@/services/search-job-service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/jobs/[id]
 * Retrieves job details, status, and progress
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const job = await SearchJobService.getJobById(params.id);
    return createSuccessResponse(job);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/jobs/[id]
 * Deletes a search job
 */
export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  try {
    await SearchJobService.deleteJob(params.id);
    return createSuccessResponse({ message: `Search job '${params.id}' deleted successfully` });
  } catch (error) {
    return handleApiError(error);
  }
}
