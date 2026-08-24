import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { WebsiteAuditor, WebsiteAuditResult } from "@/infrastructure/audit/website-auditor";
import { ResearchType, RunStatus } from "@prisma/client";

const log = logger.child("WebsiteAuditService");

export interface AuditServiceResult {
  businessId: string;
  websiteUrl: string;
  audit: WebsiteAuditResult;
  savedToDb: boolean;
}

export class WebsiteAuditService {
  /**
   * Run a website audit for a single business and persist the result.
   */
  static async auditBusiness(businessId: string): Promise<AuditServiceResult> {
    // Fetch the business contact for its website URL
    const contact = await prisma.businessContact.findUnique({
      where: { businessId },
    });

    if (!contact?.websiteUrl) {
      throw new Error(`Business ${businessId} has no website URL to audit`);
    }

    const websiteUrl = contact.websiteUrl;
    log.info(`Starting website audit for business ${businessId}: ${websiteUrl}`);

    // Create a ResearchRun to track this audit
    const researchRun = await prisma.researchRun.create({
      data: {
        businessId,
        researchType: ResearchType.WEBSITE_AUDIT,
        source: "FetchAndParse",
        status: RunStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    try {
      // Run the audit
      const audit = await WebsiteAuditor.audit(websiteUrl);

      // Persist to Website table (using existing schema)
      await prisma.website.upsert({
        where: { businessId },
        create: {
          businessId,
          url: audit.resolvedUrl,
          status: audit.reachable ? "REACHABLE" : "UNREACHABLE",
          https: audit.hasSSL,
          title: audit.titleText,
          metaDescription: audit.metaDescriptionText,
          // Composite scores (0–1 scale)
          websiteScore: audit.auditScore / 100,
          mobileScore: audit.hasViewportMeta ? 1.0 : 0.0,
          seoScore:
            ([audit.hasTitle, audit.hasMetaDescription, audit.hasH1, audit.hasCanonical].filter(Boolean).length) / 4,
          conversionScore:
            ([audit.hasContactForm, audit.hasPhoneNumber, audit.hasWhatsApp, audit.hasOnlineBooking].filter(Boolean).length) / 4,
          bookingCapability: audit.hasOnlineBooking,
          orderingCapability: false,
          ecommerceCapability: audit.hasShopify,
          whatsappPresent: audit.hasWhatsApp,
          researchTimestamp: new Date(audit.auditedAt),
        },
        update: {
          url: audit.resolvedUrl,
          status: audit.reachable ? "REACHABLE" : "UNREACHABLE",
          https: audit.hasSSL,
          title: audit.titleText,
          metaDescription: audit.metaDescriptionText,
          websiteScore: audit.auditScore / 100,
          mobileScore: audit.hasViewportMeta ? 1.0 : 0.0,
          seoScore:
            ([audit.hasTitle, audit.hasMetaDescription, audit.hasH1, audit.hasCanonical].filter(Boolean).length) / 4,
          conversionScore:
            ([audit.hasContactForm, audit.hasPhoneNumber, audit.hasWhatsApp, audit.hasOnlineBooking].filter(Boolean).length) / 4,
          bookingCapability: audit.hasOnlineBooking,
          ecommerceCapability: audit.hasShopify,
          whatsappPresent: audit.hasWhatsApp,
          researchTimestamp: new Date(audit.auditedAt),
        },
      });

      // Complete the ResearchRun
      await prisma.researchRun.update({
        where: { id: researchRun.id },
        data: { status: RunStatus.COMPLETED, completedAt: new Date() },
      });

      log.info(`Audit persisted for business ${businessId}, score=${audit.auditScore}`);

      return { businessId, websiteUrl, audit, savedToDb: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);

      await prisma.researchRun.update({
        where: { id: researchRun.id },
        data: {
          status: RunStatus.FAILED,
          errorMessage,
          completedAt: new Date(),
        },
      });

      throw err;
    }
  }

  /**
   * Bulk audit all businesses in a job that have a website URL.
   * Processes concurrently (max 3 at a time) to respect rate limits.
   */
  static async auditJobBusinesses(jobId: string): Promise<{
    total: number;
    audited: number;
    skipped: number;
    errors: number;
  }> {
    const businesses = await prisma.researchRun.findMany({
      where: { jobId, researchType: ResearchType.DISCOVERY },
      select: {
        businessId: true,
        business: {
          select: { id: true, contact: { select: { websiteUrl: true } } },
        },
      },
    });

    const withWebsites = businesses.filter(
      (b) => b.businessId !== null && b.business?.contact?.websiteUrl
    ) as Array<typeof businesses[number] & { businessId: string }>;
    const withoutWebsites = businesses.length - withWebsites.length;

    log.info(
      `Bulk audit: ${withWebsites.length} with websites, ${withoutWebsites} skipped (no website)`,
      { jobId }
    );

    let audited = 0;
    let errors = 0;

    // Process in batches of 3 (concurrent)
    const CONCURRENCY = 3;
    for (let i = 0; i < withWebsites.length; i += CONCURRENCY) {
      const batch = withWebsites.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map((b) => this.auditBusiness(b.businessId))
      );

      for (const result of results) {
        if (result.status === "fulfilled") {
          audited++;
        } else {
          errors++;
          log.warn(`Batch audit error: ${result.reason}`);
        }
      }
    }

    return {
      total: businesses.length,
      audited,
      skipped: withoutWebsites,
      errors,
    };
  }
}
