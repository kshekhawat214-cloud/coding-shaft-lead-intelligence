import { NextRequest } from "next/server";
import { WebsiteAuditService } from "@/services/website-audit-service";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

/**
 * POST /api/jobs/[id]/audit
 * Triggers website audits for all businesses in a search job that have a website
 */
export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const result = await WebsiteAuditService.auditJobBusinesses(params.id);
    return createSuccessResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
