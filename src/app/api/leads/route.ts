import { NextRequest } from "next/server";
import { BusinessRepository } from "@/repositories/business-repository";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";

/**
 * GET /api/leads
 * Lists all persisted businesses (qualified leads) with filters and pagination
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);
    const classification = searchParams.get("classification") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search") || undefined;
    const orderBy = (searchParams.get("orderBy") || "createdAt") as "score" | "name" | "createdAt";

    const result = await BusinessRepository.listLeads({
      page: isNaN(page) ? 1 : page,
      limit: isNaN(limit) ? 20 : limit,
      classification,
      status,
      search,
      orderBy,
    });

    return createSuccessResponse(result.businesses, { pagination: result.pagination });
  } catch (error) {
    return handleApiError(error);
  }
}
