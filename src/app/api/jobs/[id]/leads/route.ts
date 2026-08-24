import { NextRequest } from "next/server";
import { BusinessRepository } from "@/repositories/business-repository";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/jobs/[id]/leads
 * Lists all businesses discovered and persisted by a specific search job
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const businesses = await BusinessRepository.listByJobId(params.id);
    return createSuccessResponse(businesses, { total: businesses.length });
  } catch (error) {
    return handleApiError(error);
  }
}
