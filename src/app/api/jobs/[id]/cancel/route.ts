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
 * POST /api/jobs/[id]/cancel
 * Cancels a search job
 */
export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const job = await SearchJobService.cancelJob(params.id);
    return createSuccessResponse(job);
  } catch (error) {
    return handleApiError(error);
  }
}
