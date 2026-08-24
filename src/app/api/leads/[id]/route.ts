import { NextRequest } from "next/server";
import { BusinessRepository } from "@/repositories/business-repository";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/leads/[id]
 * Full enriched detail view for one business lead
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const business = await BusinessRepository.getBusinessDetail(params.id);

    if (!business) {
      return handleApiError({ name: "NotFoundError", message: "Business not found" });
    }

    return createSuccessResponse(business);
  } catch (error) {
    return handleApiError(error);
  }
}
