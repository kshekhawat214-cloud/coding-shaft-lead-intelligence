import { NextRequest } from "next/server";
import { SocialIntelligenceService } from "@/services/social-intelligence-service";
import { OpportunityEngine } from "@/services/opportunity-engine";
import { LeadScoringEngine } from "@/services/lead-scoring-engine";
import { createSuccessResponse, handleApiError } from "@/lib/api-response";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: { id: string };
}

/**
 * POST /api/jobs/[id]/enrich
 * Full enrichment pipeline for all businesses in a job:
 *   Social → Opportunities → Lead Scores
 * Runs after Discovery + Audit + Reviews are already complete.
 */
export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const jobId = params.id;

    // Stage 1: Social Intelligence
    const socialResult = await SocialIntelligenceService.discoverJobSocials(jobId);

    // Stage 2: Opportunity Analysis
    const oppResult = await OpportunityEngine.runForJob(jobId);

    // Stage 3: Lead Scoring
    const scoreResult = await LeadScoringEngine.scoreJobLeads(jobId);

    return createSuccessResponse({
      jobId,
      stages: {
        social: socialResult,
        opportunities: oppResult,
        scoring: scoreResult,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/businesses/[id]/enrich  (via this same handler pattern)
 * Single-business enrichment pipeline
 */
export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const jobs = await prisma.researchRun.findMany({
      where: { jobId: params.id, researchType: "DISCOVERY" },
      select: { businessId: true },
    });
    return createSuccessResponse({ jobId: params.id, businessCount: jobs.length });
  } catch (error) {
    return handleApiError(error);
  }
}
