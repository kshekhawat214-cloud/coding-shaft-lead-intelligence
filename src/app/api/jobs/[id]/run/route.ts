import { NextRequest } from "next/server";
import { DiscoveryOrchestrator } from "@/services/discovery-orchestrator";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * POST /api/jobs/[id]/run
 * Triggers the business discovery engine for a search job
 */
export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const result = await DiscoveryOrchestrator.runDiscoveryForJob(params.id);
    return createSuccessResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
