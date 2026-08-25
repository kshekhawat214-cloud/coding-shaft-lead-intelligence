import { NextRequest } from "next/server";
import { WebsiteAuditService } from "@/services/website-audit-service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";
import { NotFoundError } from "@/lib/errors";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface RouteParams {
  params: { id: string };
}

/**
 * GET /api/businesses/[id]/audit
 * Returns the latest saved website audit for a business
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const profile = await prisma.website.findUnique({
      where: { businessId: params.id },
    });

    if (!profile) {
      throw new NotFoundError("No website audit found for this business. Run a POST to start one.");
    }

    return createSuccessResponse(profile);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/businesses/[id]/audit
 * Triggers a fresh website audit for a single business and persists the result
 */
export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const result = await WebsiteAuditService.auditBusiness(params.id);
    return createSuccessResponse(result.audit, {
      businessId: result.businessId,
      savedToDb: result.savedToDb,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
