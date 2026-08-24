import { osmDiscoveryProvider } from "@/infrastructure/discovery/osm-overpass-provider";
import { normalizeRawCandidate } from "@/domain/discovery-normalizer";
import { deduplicateBusinesses } from "@/domain/deduplication";
import { SearchJobService } from "./search-job-service";
import { BusinessRepository } from "@/repositories/business-repository";
import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { DiscoveredBusinessDTO } from "@/domain/types";
import { ResearchType, RunStatus } from "@prisma/client";

const log = logger.child("DiscoveryOrchestrator");

export interface DiscoveryExecutionResult {
  jobId: string;
  location: string;
  totalRawFound: number;
  totalDeduplicated: number;
  totalPersisted: number;
  totalNew: number;
  totalUpdated: number;
  persistenceErrors: number;
  qualifiedBusinesses: DiscoveredBusinessDTO[];
  source: string;
  completedAt: string;
}

export class DiscoveryOrchestrator {
  /**
   * Run discovery for a given SearchJob ID
   */
  static async runDiscoveryForJob(jobId: string): Promise<DiscoveryExecutionResult> {
    const job = await SearchJobService.getJobById(jobId);

    log.info(`Starting business discovery for search job: ${jobId}`, {
      location: job.locationQuery,
      categories: job.categories,
      searchMode: job.searchMode,
      radiusMeters: job.radiusMeters,
    });

    // 1. Mark job as RUNNING and record ResearchRun
    await SearchJobService.updateProgress(jobId, 0.1, "RUNNING");

    const categoriesArray: string[] = Array.isArray(job.categories)
      ? (job.categories as string[])
      : typeof job.categories === "string"
      ? JSON.parse(job.categories)
      : ["Local Business"];

    const researchRun = await prisma.researchRun.create({
      data: {
        jobId,
        researchType: ResearchType.DISCOVERY,
        source: "OpenStreetMap",
        status: RunStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    try {
      // 2. Discover raw businesses from OpenStreetMap
      await SearchJobService.updateProgress(jobId, 0.3);

      const discoveryOutput = await osmDiscoveryProvider.discover({
        locationQuery: job.locationQuery,
        categories: categoriesArray,
        radiusMeters: job.radiusMeters,
        maxBusinesses: job.maxBusinesses,
        latitude: job.latitude ?? undefined,
        longitude: job.longitude ?? undefined,
      });

      await SearchJobService.updateProgress(jobId, 0.6);

      // 3. Normalize candidates
      const normalizedCandidates: DiscoveredBusinessDTO[] = discoveryOutput.rawCandidates.map(
        (cand) => normalizeRawCandidate(cand, discoveryOutput.location)
      );

      // 4. Deduplicate candidates
      const deduplicated = deduplicateBusinesses(normalizedCandidates);

      // 5. Apply search mode filters if specified
      let filtered = deduplicated;

      if (job.searchMode === "NO_WEBSITE") {
        const withoutWeb = deduplicated.filter((b) => !b.websiteUrl);
        // If some without website found, prioritize them
        if (withoutWeb.length > 0) {
          filtered = withoutWeb;
        }
      }

      // Limit to target max businesses
      const qualified = filtered.slice(0, job.maxBusinesses);

      await SearchJobService.updateProgress(jobId, 0.75);

      // 6. Persist discovered businesses to database (idempotent upsert)
      const persistResult = await BusinessRepository.bulkUpsert(qualified, jobId);

      // 7. Associate persisted businesses with this search job
      const persistedIds = persistResult.businesses.map((b) => b.businessId);
      if (persistedIds.length > 0) {
        await BusinessRepository.associateWithJob(persistedIds, jobId);
      }

      await SearchJobService.updateProgress(jobId, 0.95);

      // 8. Complete ResearchRun and SearchJob
      await prisma.researchRun.update({
        where: { id: researchRun.id },
        data: {
          status: RunStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      await SearchJobService.completeJob(jobId);

      log.info(
        `Discovery job ${jobId} completed: ${qualified.length} qualified leads, ${persistResult.totalNew} new, ${persistResult.totalUpdated} updated`
      );

      return {
        jobId,
        location: discoveryOutput.location.displayName,
        totalRawFound: discoveryOutput.rawCandidates.length,
        totalDeduplicated: deduplicated.length,
        totalPersisted: persistResult.totalNew + persistResult.totalUpdated,
        totalNew: persistResult.totalNew,
        totalUpdated: persistResult.totalUpdated,
        persistenceErrors: persistResult.errors.length,
        qualifiedBusinesses: qualified,
        source: discoveryOutput.source,
        completedAt: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log.error(`Discovery job ${jobId} failed: ${errorMessage}`, error);

      await prisma.researchRun.update({
        where: { id: researchRun.id },
        data: {
          status: RunStatus.FAILED,
          errorMessage,
          completedAt: new Date(),
        },
      });

      await SearchJobService.failJob(jobId, errorMessage);
      throw error;
    }
  }
}
