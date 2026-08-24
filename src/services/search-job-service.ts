import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { NotFoundError, ValidationError, ConflictError } from "@/lib/errors";
import {
  CreateSearchJobInput,
  createSearchJobSchema,
  JobStatusType,
  canTransitionJob,
} from "@/domain/search-job";
import { JobStatus, SearchMode } from "@prisma/client";

const log = logger.child("SearchJobService");

export interface ListJobsParams {
  status?: JobStatusType;
  page?: number;
  limit?: number;
}

export class SearchJobService {
  /**
   * Creates and queues a new search job
   */
  static async createJob(input: CreateSearchJobInput, userId?: string) {
    const validated = createSearchJobSchema.parse(input);

    log.info(`Creating search job for location "${validated.locationQuery}"`, {
      categories: validated.categories,
      searchMode: validated.searchMode,
      radiusMeters: validated.radiusMeters,
    });

    const job = await prisma.searchJob.create({
      data: {
        userId: userId ?? null,
        locationQuery: validated.locationQuery,
        latitude: validated.latitude ?? null,
        longitude: validated.longitude ?? null,
        radiusMeters: validated.radiusMeters,
        categories: validated.categories,
        maxBusinesses: validated.maxBusinesses,
        minimumRating: validated.minimumRating ?? null,
        minimumReviewCount: validated.minimumReviewCount ?? null,
        searchMode: validated.searchMode as SearchMode,
        status: JobStatus.QUEUED,
        progress: 0.0,
      },
    });

    log.info(`Search job created successfully with ID: ${job.id}`);
    return job;
  }

  /**
   * Retrieve a job by ID
   */
  static async getJobById(id: string) {
    const job = await prisma.searchJob.findUnique({
      where: { id },
      include: {
        researchRuns: {
          orderBy: { startedAt: "desc" },
          take: 10,
        },
      },
    });

    if (!job) {
      throw new NotFoundError(`Search job with ID '${id}' not found`);
    }

    return job;
  }

  /**
   * List search jobs with optional filtering and pagination
   */
  static async listJobs(params: ListJobsParams = {}) {
    const { status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where = status ? { status: status as JobStatus } : {};

    const [jobs, totalCount] = await Promise.all([
      prisma.searchJob.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.searchJob.count({ where }),
    ]);

    return {
      jobs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }

  /**
   * Update job progress and optionally transition status
   */
  static async updateProgress(id: string, progress: number, newStatus?: JobStatusType) {
    const currentJob = await this.getJobById(id);

    const clampedProgress = Math.max(0, Math.min(1.0, progress));

    if (newStatus && newStatus !== currentJob.status) {
      if (!canTransitionJob(currentJob.status as JobStatusType, newStatus)) {
        throw new ConflictError(
          `Cannot transition search job from '${currentJob.status}' to '${newStatus}'`
        );
      }
    }

    const updateData: {
      progress: number;
      status?: JobStatus;
      startedAt?: Date;
      completedAt?: Date;
    } = {
      progress: clampedProgress,
    };

    if (newStatus) {
      updateData.status = newStatus as JobStatus;
      if (newStatus === "RUNNING" && !currentJob.startedAt) {
        updateData.startedAt = new Date();
      }
      if (["COMPLETED", "FAILED", "CANCELLED"].includes(newStatus)) {
        updateData.completedAt = new Date();
      }
    }

    return prisma.searchJob.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Cancel an active or queued search job
   */
  static async cancelJob(id: string) {
    const currentJob = await this.getJobById(id);

    if (!canTransitionJob(currentJob.status as JobStatusType, "CANCELLED")) {
      throw new ConflictError(
        `Cannot cancel search job in '${currentJob.status}' status`
      );
    }

    log.info(`Canceling search job: ${id}`);

    return prisma.searchJob.update({
      where: { id },
      data: {
        status: JobStatus.CANCELLED,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Mark a search job as failed with an error message
   */
  static async failJob(id: string, errorMessage: string) {
    log.error(`Search job failed: ${id}`, { error: errorMessage });

    return prisma.searchJob.update({
      where: { id },
      data: {
        status: JobStatus.FAILED,
        errorMessage,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Mark a search job as completed
   */
  static async completeJob(id: string) {
    log.info(`Completing search job: ${id}`);

    return prisma.searchJob.update({
      where: { id },
      data: {
        status: JobStatus.COMPLETED,
        progress: 1.0,
        completedAt: new Date(),
      },
    });
  }

  /**
   * Delete a search job
   */
  static async deleteJob(id: string) {
    await this.getJobById(id);
    log.info(`Deleting search job: ${id}`);
    return prisma.searchJob.delete({
      where: { id },
    });
  }
}
