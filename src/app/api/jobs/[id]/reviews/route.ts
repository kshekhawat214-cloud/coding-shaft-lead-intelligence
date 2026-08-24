import { NextRequest } from "next/server";
import { ReviewIntelligenceService } from "@/services/review-intelligence-service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

/**
 * POST /api/jobs/[id]/reviews
 * Runs review intelligence for all businesses in a job
 */
export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const result = await ReviewIntelligenceService.analyzeJobBusinesses(params.id);
    return createSuccessResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
