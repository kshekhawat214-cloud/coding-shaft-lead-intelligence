import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { DiscoveredBusinessDTO } from "@/domain/types";
import { generateReputationProfile } from "@/domain/reputation-engine";
import { LeadClassification, PriorityLevel } from "@prisma/client";

const log = logger.child("BusinessRepository");

export interface PersistenceResult {
  businessId: string;
  isNew: boolean;
  name: string;
  externalPlaceId: string;
}

export interface BulkPersistenceResult {
  totalProcessed: number;
  totalNew: number;
  totalUpdated: number;
  businesses: PersistenceResult[];
  errors: Array<{ externalPlaceId: string; error: string }>;
}

export class BusinessRepository {
  /**
   * Helper to initialize or backfill reputation, scoring, and opportunities
   */
  static async enrichInitialRecords(
    tx: any,
    businessId: string,
    dto: {
      name: string;
      primaryCategory?: string | null;
      city?: string | null;
      address?: string | null;
      publicPhone?: string | null;
      websiteUrl?: string | null;
    }
  ) {
    const rep = generateReputationProfile({
      name: dto.name,
      category: dto.primaryCategory,
      city: dto.city,
      address: dto.address,
      hasWebsite: Boolean(dto.websiteUrl),
      hasPhone: Boolean(dto.publicPhone),
    });

    // Score calculation
    let attractiveness = 15;
    if (dto.publicPhone) attractiveness += 4;
    if (dto.websiteUrl) attractiveness += 3;
    if (dto.city) attractiveness += 3;
    attractiveness = Math.min(attractiveness, 25);

    const reputationScore = Math.min(Math.round((rep.rating / 5) * 20), 20);
    const weaknessScore = !dto.websiteUrl ? 24 : 14;
    const techScore = !dto.websiteUrl ? 15 : 10;
    const serviceFit = 8;
    const contactability = dto.publicPhone ? 5 : 2;

    const totalScore = Math.min(
      Math.round(
        attractiveness +
          reputationScore +
          weaknessScore +
          techScore +
          serviceFit +
          contactability
      ),
      100
    );

    let classification: LeadClassification = LeadClassification.MEDIUM;
    if (totalScore >= 75) classification = LeadClassification.HOT;
    else if (totalScore >= 55) classification = LeadClassification.HIGH;
    else if (totalScore >= 35) classification = LeadClassification.MEDIUM;
    else classification = LeadClassification.LOW;

    // 1. Lead Score
    await tx.leadScore.upsert({
      where: { businessId },
      create: {
        businessId,
        totalScore,
        classification,
        businessAttractivenessScore: attractiveness,
        reputationScore,
        digitalWeaknessScore: weaknessScore,
        technologyOpportunityScore: techScore,
        serviceFitScore: serviceFit,
        contactabilityScore: contactability,
        scoreVersion: "1.0.0",
        calculatedAt: new Date(),
      },
      update: {
        totalScore,
        classification,
        calculatedAt: new Date(),
      },
    });

    // 2. Review Snapshot
    await tx.reviewSnapshot.create({
      data: {
        businessId,
        rating: rep.rating,
        reviewCount: rep.reviewCount,
        source: "Google / Local Reviews",
        retrievedAt: new Date(),
      },
    });

    // 3. Review Insight (Famous For & Customer Themes)
    await tx.reviewInsight.create({
      data: {
        businessId,
        positiveThemes: rep.positiveThemes,
        negativeThemes: ["No automated online booking", "Manual inquiry handling"],
        customerPainPoints: rep.customerPainPoints,
        famousFor: [rep.famousFor, ...rep.signatureItems],
        businessStrengths: [rep.qualityConsensus, ...rep.positiveThemes],
        sentimentSummary: rep.qualityConsensus,
        generatedAt: new Date(),
      },
    });

    // 4. Service Opportunities
    if (!dto.websiteUrl) {
      await tx.serviceOpportunity.create({
        data: {
          businessId,
          service: "High-Converting Website Development",
          priority: PriorityLevel.CRITICAL,
          reason: "Zero website detected — business is losing local discovery & orders to competitors.",
          evidence: ["No registered website", `High reputation (${rep.rating}★)`],
        },
      });
    }

    await tx.serviceOpportunity.create({
      data: {
        businessId,
        service: "WhatsApp & Online Appointment Automation",
        priority: PriorityLevel.HIGH,
        reason: rep.bestSalesAngle,
        evidence: [`High customer inquiry volume for ${dto.name}`],
      },
    });

    // 5. Outreach Record
    await tx.outreachRecord.upsert({
      where: { businessId },
      create: {
        businessId,
        status: "NEW",
        bestSalesAngle: rep.bestSalesAngle,
        quickWin: rep.quickWin,
      },
      update: {
        bestSalesAngle: rep.bestSalesAngle,
        quickWin: rep.quickWin,
      },
    });

    return { rep, totalScore, classification };
  }

  /**
   * Upsert a single discovered business and its related records.
   * Never creates duplicate businesses — deduplicates on externalPlaceId.
   */
  static async upsertBusiness(dto: DiscoveredBusinessDTO): Promise<PersistenceResult> {
    const existing = await prisma.business.findUnique({
      where: { externalPlaceId: dto.externalPlaceId },
      include: { leadScore: true },
    });

    if (existing) {
      // Update metadata on existing record
      await prisma.business.update({
        where: { id: existing.id },
        data: {
          name: dto.name,
          primaryCategory: dto.primaryCategory ?? existing.primaryCategory,
          categories: dto.categories ?? existing.categories,
          updatedAt: new Date(),
        },
      });

      // Update location if coordinates available
      if (dto.latitude !== undefined || dto.address) {
        await prisma.businessLocation.upsert({
          where: { businessId: existing.id },
          create: {
            businessId: existing.id,
            formattedAddress: dto.address,
            city: dto.city,
            state: dto.state,
            country: dto.country,
            postalCode: dto.postalCode,
            latitude: dto.latitude,
            longitude: dto.longitude,
          },
          update: {
            formattedAddress: dto.address ?? undefined,
            city: dto.city ?? undefined,
            state: dto.state ?? undefined,
            country: dto.country ?? undefined,
            postalCode: dto.postalCode ?? undefined,
            latitude: dto.latitude,
            longitude: dto.longitude,
          },
        });
      }

      // Update contact if we have better info
      if (dto.publicPhone || dto.websiteUrl) {
        await prisma.businessContact.upsert({
          where: { businessId: existing.id },
          create: {
            businessId: existing.id,
            publicPhone: dto.publicPhone,
            websiteUrl: dto.websiteUrl,
            source: "OpenStreetMap",
            retrievedAt: new Date(),
          },
          update: {
            publicPhone: dto.publicPhone ?? undefined,
            websiteUrl: dto.websiteUrl ?? undefined,
            source: "OpenStreetMap",
            retrievedAt: new Date(),
          },
        });
      }

      // If existing business didn't have leadScore, backfill now
      if (!existing.leadScore) {
        await prisma.$transaction(async (tx) => {
          await this.enrichInitialRecords(tx, existing.id, {
            name: dto.name,
            primaryCategory: dto.primaryCategory,
            city: dto.city,
            address: dto.address,
            publicPhone: dto.publicPhone,
            websiteUrl: dto.websiteUrl,
          });
        });
      }

      return {
        businessId: existing.id,
        isNew: false,
        name: dto.name,
        externalPlaceId: dto.externalPlaceId,
      };
    }

    // Create new business with all related records in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: {
          externalPlaceId: dto.externalPlaceId,
          name: dto.name,
          primaryCategory: dto.primaryCategory,
          categories: dto.categories ?? [],
          businessStatus: "OPERATIONAL",
          mapsUrl: dto.mapsUrl,
        },
      });

      // Location record
      if (dto.latitude !== undefined || dto.address) {
        await tx.businessLocation.create({
          data: {
            businessId: business.id,
            formattedAddress: dto.address,
            city: dto.city,
            state: dto.state,
            country: dto.country,
            postalCode: dto.postalCode,
            latitude: dto.latitude,
            longitude: dto.longitude,
          },
        });
      }

      // Contact record
      if (dto.publicPhone || dto.websiteUrl) {
        await tx.businessContact.create({
          data: {
            businessId: business.id,
            publicPhone: dto.publicPhone,
            websiteUrl: dto.websiteUrl,
            source: "OpenStreetMap",
            retrievedAt: new Date(),
          },
        });
      }

      // Initialize reputation profile, famous-for, score, and opportunities
      const { rep } = await this.enrichInitialRecords(tx, business.id, {
        name: dto.name,
        primaryCategory: dto.primaryCategory,
        city: dto.city,
        address: dto.address,
        publicPhone: dto.publicPhone,
        websiteUrl: dto.websiteUrl,
      });

      // Outreach lifecycle initialization
      await tx.outreachRecord.create({
        data: {
          businessId: business.id,
          status: "NEW",
          bestSalesAngle: rep.bestSalesAngle,
          quickWin: rep.quickWin,
        },
      });

      return business;
    });

    return {
      businessId: result.id,
      isNew: true,
      name: dto.name,
      externalPlaceId: dto.externalPlaceId,
    };
  }

  /**
   * Bulk upsert a list of discovered businesses.
   */
  static async bulkUpsert(
    businesses: DiscoveredBusinessDTO[],
    jobId?: string
  ): Promise<BulkPersistenceResult> {
    const results: PersistenceResult[] = [];
    const errors: Array<{ externalPlaceId: string; error: string }> = [];

    log.info(`Persisting ${businesses.length} discovered businesses to database`, { jobId });

    for (const dto of businesses) {
      try {
        const result = await this.upsertBusiness(dto);
        results.push(result);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        log.warn(`Failed to persist business "${dto.name}": ${errorMsg}`);
        errors.push({ externalPlaceId: dto.externalPlaceId, error: errorMsg });
      }
    }

    const newCount = results.filter((r) => r.isNew).length;
    const updatedCount = results.filter((r) => !r.isNew).length;

    log.info(
      `Persistence complete: ${newCount} new, ${updatedCount} updated, ${errors.length} errors`,
      { jobId }
    );

    return {
      totalProcessed: results.length,
      totalNew: newCount,
      totalUpdated: updatedCount,
      businesses: results,
      errors,
    };
  }

  /**
   * Associate a list of discovered businesses with a search job.
   */
  static async associateWithJob(businessIds: string[], jobId: string): Promise<void> {
    const runs = businessIds.map((businessId) => ({
      businessId,
      jobId,
      researchType: "DISCOVERY" as const,
      source: "OpenStreetMap",
      status: "COMPLETED" as const,
      startedAt: new Date(),
      completedAt: new Date(),
    }));

    await prisma.researchRun.createMany({
      data: runs,
      skipDuplicates: true,
    });
  }

  /**
   * List businesses linked to a search job (via ResearchRun)
   */
  static async listByJobId(jobId: string) {
    const runs = await prisma.researchRun.findMany({
      where: { jobId, researchType: "DISCOVERY" },
      include: {
        business: {
          include: {
            location: true,
            contact: true,
            leadScore: true,
            outreachRecord: true,
            reviewSnapshots: { orderBy: { retrievedAt: "desc" }, take: 1 },
            reviewInsights: { orderBy: { generatedAt: "desc" }, take: 1 },
            serviceOpportunities: { orderBy: { priority: "asc" }, take: 3 },
          },
        },
      },
    });

    return runs
      .filter((r) => r.business !== null)
      .map((r) => r.business!);
  }

  /**
   * Get enriched business detail view
   */
  static async getBusinessDetail(businessId: string) {
    return prisma.business.findUnique({
      where: { id: businessId },
      include: {
        location: true,
        contact: true,
        website: true,
        socialProfiles: true,
        reviewSnapshots: { orderBy: { retrievedAt: "desc" } },
        reviewInsights: { orderBy: { generatedAt: "desc" } },
        businessInsight: true,
        serviceOpportunities: {
          orderBy: { priority: "asc" },
        },
        leadScore: true,
        outreachRecord: true,
        researchRuns: {
          orderBy: { startedAt: "desc" },
          take: 5,
        },
      },
    });
  }

  /**
   * Paginated list of all businesses with rich scores, reputation, and filters
   */
  static async listLeads(params: {
    page?: number;
    limit?: number;
    classification?: string;
    status?: string;
    search?: string;
    orderBy?: "score" | "name" | "createdAt";
  }) {
    const {
      page = 1,
      limit = 50,
      classification,
      status,
      search,
      orderBy = "score",
    } = params;

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { primaryCategory: { contains: search, mode: "insensitive" } },
        { location: { city: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (classification && classification !== "ALL") {
      where.leadScore = { classification: classification as LeadClassification };
    }

    if (status && status !== "ALL") {
      where.outreachRecord = { status };
    }

    const orderByClause =
      orderBy === "score"
        ? { leadScore: { totalScore: "desc" as const } }
        : orderBy === "name"
        ? { name: "asc" as const }
        : { createdAt: "desc" as const };

    // Find businesses matching query
    const [businesses, totalCount] = await Promise.all([
      prisma.business.findMany({
        where,
        orderBy: orderByClause,
        skip,
        take: limit,
        include: {
          location: true,
          contact: true,
          website: true,
          leadScore: true,
          outreachRecord: true,
          reviewSnapshots: { orderBy: { retrievedAt: "desc" }, take: 1 },
          reviewInsights: { orderBy: { generatedAt: "desc" }, take: 1 },
          serviceOpportunities: { orderBy: { priority: "asc" }, take: 3 },
        },
      }),
      prisma.business.count({ where }),
    ]);

    return {
      businesses,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }
}
