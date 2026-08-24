import { NextRequest } from "next/server";
import { ReviewIntelligenceService } from "@/services/review-intelligence-service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";
import { NotFoundError } from "@/lib/errors";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/businesses/[id]/reviews
 * Returns the saved review snapshot and insight for a business
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const [snapshot, insight] = await Promise.all([
      prisma.reviewSnapshot.findFirst({
        where: { businessId: params.id },
        orderBy: { retrievedAt: "desc" },
      }),
      prisma.reviewInsight.findFirst({
        where: { businessId: params.id },
        orderBy: { generatedAt: "desc" },
      }),
    ]);

    if (!snapshot && !insight) {
      throw new NotFoundError(
        "No review intelligence found. POST to this endpoint to trigger analysis."
      );
    }

    return createSuccessResponse({ snapshot, insight });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/businesses/[id]/reviews
 * Triggers fresh review intelligence analysis for a single business
 */
export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const result = await ReviewIntelligenceService.analyzeBusinessReviews(params.id);
    return createSuccessResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
