import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { deriveWebsiteWeaknesses } from "@/domain/types";
import { LeadClassification, ResearchType } from "@prisma/client";

const log = logger.child("LeadScoringEngine");

export interface LeadScoreBreakdown {
  businessAttractivenessScore: number; // 0–25
  reputationScore: number;             // 0–20
  digitalWeaknessScore: number;        // 0–25 (higher = more opportunity)
  technologyOpportunityScore: number;  // 0–15
  serviceFitScore: number;             // 0–10
  contactabilityScore: number;         // 0–5
  totalScore: number;                  // 0–100
  classification: LeadClassification;
  explanation: string;
}

// ─── Classification Thresholds ─────────────────────────────────────────────────

function classify(score: number): LeadClassification {
  if (score >= 75) return LeadClassification.HOT;
  if (score >= 55) return LeadClassification.HIGH;
  if (score >= 35) return LeadClassification.MEDIUM;
  if (score >= 15) return LeadClassification.LOW;
  return LeadClassification.NOT_QUALIFIED;
}

// ─── Scoring Engine ───────────────────────────────────────────────────────────

export class LeadScoringEngine {
  static async scoreBusinessLead(businessId: string): Promise<LeadScoreBreakdown> {
    const [business, website, reviewSnapshots, reviewInsights, socialProfiles, opportunities] =
      await Promise.all([
        prisma.business.findUnique({
          where: { id: businessId },
          include: { contact: true, location: true },
        }),
        prisma.website.findUnique({ where: { businessId } }),
        prisma.reviewSnapshot.findMany({
          where: { businessId },
          orderBy: { retrievedAt: "desc" },
          take: 1,
        }),
        prisma.reviewInsight.findMany({
          where: { businessId },
          orderBy: { generatedAt: "desc" },
          take: 1,
        }),
        prisma.socialProfile.findMany({ where: { businessId } }),
        prisma.serviceOpportunity.findMany({ where: { businessId } }),
      ]);

    const review = reviewSnapshots[0] ?? null;
    const insight = reviewInsights[0] ?? null;

    // ── 1. Business Attractiveness (0–25) ─────────────────────────────────────
    // How desirable is this business as a client?
    let attractiveness = 0;

    // Has contact info (phone or website) → 5pts
    if (business?.contact?.publicPhone) attractiveness += 3;
    if (business?.contact?.websiteUrl) attractiveness += 2;

    // Business operational (not permanently closed) → 5pts
    if (business?.businessStatus === "OPERATIONAL") attractiveness += 5;

    // Has reviews (social proof of activity) → up to 8pts
    if (review?.reviewCount) {
      if (review.reviewCount >= 100) attractiveness += 8;
      else if (review.reviewCount >= 50) attractiveness += 6;
      else if (review.reviewCount >= 10) attractiveness += 4;
      else attractiveness += 2;
    }

    // Location known → 2pts
    if (business?.location?.city) attractiveness += 2;

    // Category defined → 3pts
    if (business?.primaryCategory) attractiveness += 3;

    attractiveness = Math.min(attractiveness, 25);

    // ── 2. Reputation Score (0–20) ───────────────────────────────────────────
    // Higher rating = better prospect (already successful, can invest in growth)
    let reputation = 0;

    if (review?.rating !== null && review?.rating !== undefined) {
      const r = review.rating;
      if (r >= 4.5) reputation += 20;
      else if (r >= 4.0) reputation += 16;
      else if (r >= 3.5) reputation += 12;
      else if (r >= 3.0) reputation += 8;
      else if (r >= 2.0) reputation += 4;
      else reputation += 2;
    } else {
      // Unknown rating → neutral 8pts
      reputation += 8;
    }

    // Positive themes boost → up to 3pts bonus (capped)
    const positiveThemes = insight ? (insight.positiveThemes as string[]).length : 0;
    if (positiveThemes >= 3) reputation = Math.min(reputation + 3, 20);
    else if (positiveThemes >= 1) reputation = Math.min(reputation + 1, 20);

    reputation = Math.min(reputation, 20);

    // ── 3. Digital Weakness Score (0–25) ────────────────────────────────────
    // More weaknesses = more opportunity to sell Coding Shaft services
    let weaknessScore = 0;
    const weaknesses = deriveWebsiteWeaknesses(website);

    if (!business?.contact?.websiteUrl) weaknessScore += 8;       // No website at all
    else {
      if (!website?.https) weaknessScore += 3;                     // No SSL
      if (website?.mobileScore === 0) weaknessScore += 3;          // Not mobile
      if (!website?.whatsappPresent) weaknessScore += 3;           // No WhatsApp
      if (!website?.bookingCapability) weaknessScore += 3;         // No booking
      if (weaknesses.some((w) => w.includes("analytics"))) weaknessScore += 2; // No analytics
      if (weaknesses.some((w) => w.includes("contact form"))) weaknessScore += 2; // No contact form
      if (weaknesses.some((w) => w.includes("title"))) weaknessScore += 2;  // Bad SEO
      if ((website?.websiteScore ?? 1) < 0.5) weaknessScore += 2;  // Poor overall
    }

    weaknessScore = Math.min(weaknessScore, 25);

    // ── 4. Technology Opportunity Score (0–15) ───────────────────────────────
    // Opportunities specific to Coding Shaft tech services
    let techScore = 0;

    const criticalOpps = opportunities.filter((o) => o.priority === "CRITICAL").length;
    const highOpps = opportunities.filter((o) => o.priority === "HIGH").length;
    const medOpps = opportunities.filter((o) => o.priority === "MEDIUM").length;

    techScore += criticalOpps * 5;
    techScore += highOpps * 3;
    techScore += medOpps * 1;

    // Social gaps
    const socialCount = socialProfiles.length;
    if (socialCount === 0) techScore += 3;
    else if (socialCount === 1) techScore += 1;

    techScore = Math.min(techScore, 15);

    // ── 5. Service Fit Score (0–10) ──────────────────────────────────────────
    // How well does this business match Coding Shaft's service catalog?
    let serviceFit = 0;

    const allOpps = opportunities.length;
    if (allOpps >= 5) serviceFit += 10;
    else if (allOpps >= 3) serviceFit += 7;
    else if (allOpps >= 1) serviceFit += 4;

    serviceFit = Math.min(serviceFit, 10);

    // ── 6. Contactability Score (0–5) ────────────────────────────────────────
    let contactability = 0;
    if (business?.contact?.publicPhone) contactability += 2;
    if (business?.contact?.websiteUrl) contactability += 1;
    if (website?.whatsappPresent) contactability += 2;

    contactability = Math.min(contactability, 5);

    // ── Total ─────────────────────────────────────────────────────────────────
    const totalScore = Math.round(
      attractiveness + reputation + weaknessScore + techScore + serviceFit + contactability
    );
    const classification = classify(totalScore);

    const explanation = [
      `Business attractiveness: ${attractiveness}/25`,
      `Reputation: ${reputation}/20`,
      `Digital weakness opportunity: ${weaknessScore}/25`,
      `Technology opportunity: ${techScore}/15`,
      `Service fit: ${serviceFit}/10`,
      `Contactability: ${contactability}/5`,
      `→ Total: ${totalScore}/100 (${classification})`,
    ].join(" | ");

    log.info(`Lead score for ${businessId}: ${totalScore}/100 [${classification}]`);

    return {
      businessAttractivenessScore: attractiveness,
      reputationScore: reputation,
      digitalWeaknessScore: weaknessScore,
      technologyOpportunityScore: techScore,
      serviceFitScore: serviceFit,
      contactabilityScore: contactability,
      totalScore,
      classification,
      explanation,
    };
  }

  static async persistScore(businessId: string, score: LeadScoreBreakdown): Promise<void> {
    await prisma.leadScore.upsert({
      where: { businessId },
      create: {
        businessId,
        totalScore: score.totalScore,
        businessAttractivenessScore: score.businessAttractivenessScore,
        reputationScore: score.reputationScore,
        digitalWeaknessScore: score.digitalWeaknessScore,
        technologyOpportunityScore: score.technologyOpportunityScore,
        serviceFitScore: score.serviceFitScore,
        contactabilityScore: score.contactabilityScore,
        classification: score.classification,
        scoreVersion: "1.0.0",
        calculatedAt: new Date(),
      },
      update: {
        totalScore: score.totalScore,
        businessAttractivenessScore: score.businessAttractivenessScore,
        reputationScore: score.reputationScore,
        digitalWeaknessScore: score.digitalWeaknessScore,
        technologyOpportunityScore: score.technologyOpportunityScore,
        serviceFitScore: score.serviceFitScore,
        contactabilityScore: score.contactabilityScore,
        classification: score.classification,
        scoreVersion: "1.0.0",
        calculatedAt: new Date(),
      },
    });
  }

  static async scoreAndPersist(businessId: string): Promise<LeadScoreBreakdown> {
    const score = await this.scoreBusinessLead(businessId);
    await this.persistScore(businessId, score);
    return score;
  }

  static async scoreJobLeads(jobId: string) {
    const runs = await prisma.researchRun.findMany({
      where: { jobId, researchType: ResearchType.DISCOVERY },
      select: { businessId: true },
    });
    const ids = runs.map((r) => r.businessId).filter((id): id is string => id !== null);

    let scored = 0;
    let errors = 0;
    const CONCURRENCY = 5;

    for (let i = 0; i < ids.length; i += CONCURRENCY) {
      const results = await Promise.allSettled(
        ids.slice(i, i + CONCURRENCY).map((id) => this.scoreAndPersist(id))
      );
      for (const r of results) {
        if (r.status === "fulfilled") scored++;
        else errors++;
      }
    }

    return { total: ids.length, scored, errors };
  }
}


