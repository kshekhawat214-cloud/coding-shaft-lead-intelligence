import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { CODING_SHAFT_SERVICES, ServiceDefinition } from "@/domain/services-catalog";
import { deriveWebsiteWeaknesses } from "@/domain/types";
import { ResearchType, RunStatus, PriorityLevel } from "@prisma/client";

const log = logger.child("OpportunityEngine");

export interface ServiceOpportunity {
  service: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  evidence: string[];
  confidence: number;
}

// ─── Signal → Service Mapping ─────────────────────────────────────────────────

interface OpportunityRule {
  serviceKeyword: string; // partial match against service name
  priority: PriorityLevel;
  reason: string;
  check: (signals: BusinessSignals) => { matched: boolean; evidence: string[] };
}

interface BusinessSignals {
  // Website signals
  hasWebsite: boolean;
  hasSSL: boolean;
  hasMobileViewport: boolean;
  hasWhatsApp: boolean;
  hasOnlineBooking: boolean;
  hasContactForm: boolean;
  hasGoogleAnalytics: boolean;
  hasFbPixel: boolean;
  isWordPress: boolean;
  isShopify: boolean;
  isWix: boolean;
  websiteScore: number | null;
  // Social signals
  hasFacebook: boolean;
  hasInstagram: boolean;
  // Review signals
  rating: number | null;
  reviewCount: number | null;
  // Category
  primaryCategory: string | null;
  // Pain points from reviews
  painPoints: string[];
  weaknesses: string[];
}

const OPPORTUNITY_RULES: OpportunityRule[] = [
  // ── Website / Digital Presence ───────────────────────────────────────────
  {
    serviceKeyword: "Website",
    priority: PriorityLevel.CRITICAL,
    reason: "No website detected — missing digital presence is the #1 barrier to new customers",
    check: (s) => ({
      matched: !s.hasWebsite,
      evidence: ["Business has no website listed"],
    }),
  },
  {
    serviceKeyword: "Website",
    priority: PriorityLevel.HIGH,
    reason: "Website is built on Wix/Squarespace — professional redesign would dramatically improve authority and SEO",
    check: (s) => ({
      matched: s.isWix,
      evidence: ["Detected Wix website builder"],
    }),
  },
  {
    serviceKeyword: "SEO",
    priority: PriorityLevel.HIGH,
    reason: "Website missing meta description, title, or H1 — basic SEO fixes needed to rank on Google",
    check: (s) => {
      const missingBasicSEO = s.weaknesses.some((w) =>
        w.toLowerCase().includes("missing") && (w.includes("title") || w.includes("description") || w.includes("H1"))
      );
      return {
        matched: missingBasicSEO,
        evidence: s.weaknesses.filter((w) =>
          w.includes("title") || w.includes("description") || w.includes("H1")
        ),
      };
    },
  },
  {
    serviceKeyword: "SSL",
    priority: PriorityLevel.HIGH,
    reason: "Website running on HTTP without SSL — Google penalizes non-HTTPS sites and users see 'Not Secure' warning",
    check: (s) => ({
      matched: s.hasWebsite && !s.hasSSL,
      evidence: ["Website detected without SSL certificate (HTTP only)"],
    }),
  },
  {
    serviceKeyword: "Mobile",
    priority: PriorityLevel.HIGH,
    reason: "Website not mobile-responsive — 60%+ of web traffic is mobile; missing viewport meta tag detected",
    check: (s) => ({
      matched: s.hasWebsite && !s.hasMobileViewport,
      evidence: ["Missing viewport meta tag", "Site not optimised for mobile devices"],
    }),
  },

  // ── WhatsApp & Communication ──────────────────────────────────────────────
  {
    serviceKeyword: "WhatsApp",
    priority: PriorityLevel.HIGH,
    reason: "No WhatsApp business integration — high opportunity to increase direct customer engagement",
    check: (s) => ({
      matched: !s.hasWhatsApp,
      evidence: ["No WhatsApp link found on website or contact page"],
    }),
  },

  // ── Booking & Conversion ──────────────────────────────────────────────────
  {
    serviceKeyword: "Booking",
    priority: PriorityLevel.HIGH,
    reason: "No online booking system — customers cannot self-schedule, leading to lost revenue",
    check: (s) => ({
      matched: s.hasWebsite && !s.hasOnlineBooking,
      evidence: ["No online booking or appointment scheduling detected"],
    }),
  },
  {
    serviceKeyword: "eCommerce",
    priority: PriorityLevel.MEDIUM,
    reason: "Local business without e-commerce — an online store could expand revenue beyond walk-in customers",
    check: (s) => ({
      matched: s.hasWebsite && !s.isShopify && s.primaryCategory !== null &&
        ["restaurant", "cafe", "retail", "shop", "bakery", "salon", "spa"].some(
          (cat) => s.primaryCategory?.toLowerCase().includes(cat)
        ),
      evidence: ["Business type suitable for online ordering/sales"],
    }),
  },

  // ── Analytics & Tracking ──────────────────────────────────────────────────
  {
    serviceKeyword: "Analytics",
    priority: PriorityLevel.MEDIUM,
    reason: "No analytics tracking — business cannot measure website performance or run targeted ads",
    check: (s) => ({
      matched: s.hasWebsite && !s.hasGoogleAnalytics,
      evidence: ["No Google Analytics or GTM detected on website"],
    }),
  },
  {
    serviceKeyword: "Facebook",
    priority: PriorityLevel.MEDIUM,
    reason: "No Facebook Pixel — cannot run retargeting ads to website visitors",
    check: (s) => ({
      matched: s.hasWebsite && !s.hasFbPixel && s.hasFacebook,
      evidence: ["Facebook page found but no Facebook Pixel on website"],
    }),
  },

  // ── Social Media ──────────────────────────────────────────────────────────
  {
    serviceKeyword: "Social Media",
    priority: PriorityLevel.MEDIUM,
    reason: "No social media presence detected — significant audience reach opportunity",
    check: (s) => ({
      matched: !s.hasFacebook && !s.hasInstagram,
      evidence: ["No Facebook or Instagram page found"],
    }),
  },

  // ── Reputation Management ─────────────────────────────────────────────────
  {
    serviceKeyword: "Reputation",
    priority: PriorityLevel.HIGH,
    reason: "Low rating detected — reputation management and review response strategy needed",
    check: (s) => ({
      matched: s.rating !== null && s.rating < 3.5,
      evidence: [
        `Current rating: ${s.rating?.toFixed(1)} / 5.0`,
        "Below 3.5 threshold — impacting customer acquisition",
      ],
    }),
  },
  {
    serviceKeyword: "Review",
    priority: PriorityLevel.MEDIUM,
    reason: "Very few reviews — review generation campaign would build social proof and improve local SEO",
    check: (s) => ({
      matched: s.reviewCount !== null && s.reviewCount < 20,
      evidence: [`Only ${s.reviewCount} reviews found`, "Low review count reduces trust signals"],
    }),
  },

  // ── Contact Form ─────────────────────────────────────────────────────────
  {
    serviceKeyword: "Contact",
    priority: PriorityLevel.LOW,
    reason: "No contact form detected — potential leads have no easy way to reach the business",
    check: (s) => ({
      matched: s.hasWebsite && !s.hasContactForm,
      evidence: ["No HTML contact form found on website"],
    }),
  },
];

// ─── Engine ──────────────────────────────────────────────────────────────────

export class OpportunityEngine {
  static async analyzeBusinessOpportunities(businessId: string): Promise<ServiceOpportunity[]> {
    // Load all available signals from DB
    const [business, website, socialProfiles, reviewSnapshots, reviewInsights] = await Promise.all([
      prisma.business.findUnique({
        where: { id: businessId },
        include: { contact: true },
      }),
      prisma.website.findUnique({ where: { businessId } }),
      prisma.socialProfile.findMany({ where: { businessId } }),
      prisma.reviewSnapshot.findMany({ where: { businessId }, orderBy: { retrievedAt: "desc" }, take: 1 }),
      prisma.reviewInsight.findMany({ where: { businessId }, orderBy: { generatedAt: "desc" }, take: 1 }),
    ]);

    const latestReview = reviewSnapshots[0] ?? null;
    const latestInsight = reviewInsights[0] ?? null;

    const signals: BusinessSignals = {
      hasWebsite: Boolean(business?.contact?.websiteUrl || website),
      hasSSL: website?.https ?? false,
      hasMobileViewport: website?.mobileScore === 1.0,
      hasWhatsApp: website?.whatsappPresent ?? false,
      hasOnlineBooking: website?.bookingCapability ?? false,
      hasContactForm: false, // Not stored in Website schema — use weaknesses
      hasGoogleAnalytics: false, // Use weaknesses
      hasFbPixel: false,
      isWordPress: false,
      isShopify: website?.ecommerceCapability ?? false,
      isWix: false,
      websiteScore: website?.websiteScore ?? null,
      hasFacebook: socialProfiles.some((p) => p.platform === "Facebook"),
      hasInstagram: socialProfiles.some((p) => p.platform === "Instagram"),
      rating: latestReview?.rating ?? null,
      reviewCount: latestReview?.reviewCount ?? null,
      primaryCategory: business?.primaryCategory ?? null,
      painPoints: latestInsight ? (latestInsight.customerPainPoints as string[]) : [],
      weaknesses: deriveWebsiteWeaknesses(website),
    };

    // Derive additional signals from website weaknesses text
    const weakStr = signals.weaknesses.join(" ").toLowerCase();
    signals.hasContactForm = !weakStr.includes("no contact form");
    signals.hasGoogleAnalytics = !weakStr.includes("no analytics");
    signals.hasFbPixel = !weakStr.includes("no facebook pixel");
    signals.isWordPress = false; // Would need extra field
    signals.isWix = false; // Would need extra field

    // Run all rules
    const opportunities: ServiceOpportunity[] = [];
    for (const rule of OPPORTUNITY_RULES) {
      const { matched, evidence } = rule.check(signals);
      if (!matched) continue;

      // Find matching service from catalog
      const matchedService = CODING_SHAFT_SERVICES.find((s: ServiceDefinition) =>
        s.name.toLowerCase().includes(rule.serviceKeyword.toLowerCase()) ||
        s.category.toLowerCase().includes(rule.serviceKeyword.toLowerCase())
      );

      if (!matchedService) continue;

      opportunities.push({
        service: matchedService.name,
        priority: rule.priority as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
        reason: rule.reason,
        evidence,
        confidence: evidence.length > 1 ? 0.9 : 0.75,
      });
    }

    return opportunities;
  }

  static async persistOpportunities(
    businessId: string,
    opportunities: ServiceOpportunity[]
  ): Promise<void> {
    // Delete old opportunities for this business
    await prisma.serviceOpportunity.deleteMany({ where: { businessId } });

    if (opportunities.length === 0) return;

    await prisma.serviceOpportunity.createMany({
      data: opportunities.map((opp) => ({
        businessId,
        service: opp.service,
        priority: opp.priority as PriorityLevel,
        reason: opp.reason,
        evidence: opp.evidence,
        confidence: opp.confidence,
      })),
    });
  }

  static async runForBusiness(businessId: string) {
    const researchRun = await prisma.researchRun.create({
      data: {
        businessId,
        researchType: ResearchType.OPPORTUNITY_ANALYSIS,
        source: "RuleEngine",
        status: RunStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    try {
      const opportunities = await this.analyzeBusinessOpportunities(businessId);
      await this.persistOpportunities(businessId, opportunities);

      await prisma.researchRun.update({
        where: { id: researchRun.id },
        data: { status: RunStatus.COMPLETED, completedAt: new Date() },
      });

      log.info(`Opportunity analysis complete for ${businessId}: ${opportunities.length} opportunities`);
      return { businessId, opportunitiesFound: opportunities.length, opportunities };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await prisma.researchRun.update({
        where: { id: researchRun.id },
        data: { status: RunStatus.FAILED, errorMessage, completedAt: new Date() },
      });
      throw err;
    }
  }

  static async runForJob(jobId: string) {
    const runs = await prisma.researchRun.findMany({
      where: { jobId, researchType: ResearchType.DISCOVERY },
      select: { businessId: true },
    });
    const ids = runs.map((r) => r.businessId).filter((id): id is string => id !== null);

    let analyzed = 0;
    let errors = 0;
    const CONCURRENCY = 5;

    for (let i = 0; i < ids.length; i += CONCURRENCY) {
      const results = await Promise.allSettled(
        ids.slice(i, i + CONCURRENCY).map((id) => this.runForBusiness(id))
      );
      for (const r of results) {
        if (r.status === "fulfilled") analyzed++;
        else errors++;
      }
    }

    return { total: ids.length, analyzed, errors };
  }
}
