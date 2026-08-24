import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { SocialDiscovery } from "@/infrastructure/social/social-discovery";
import { ResearchType, RunStatus } from "@prisma/client";

const log = logger.child("SocialIntelligenceService");

export class SocialIntelligenceService {
  static async discoverBusinessSocials(businessId: string) {
    const contact = await prisma.businessContact.findUnique({
      where: { businessId },
    });

    if (!contact?.websiteUrl) {
      return { businessId, profilesFound: 0, skipped: true };
    }

    const researchRun = await prisma.researchRun.create({
      data: {
        businessId,
        researchType: ResearchType.SOCIAL_RESEARCH,
        source: "WebsiteLinkExtraction",
        status: RunStatus.IN_PROGRESS,
        startedAt: new Date(),
      },
    });

    try {
      const result = await SocialDiscovery.discoverFromWebsite(contact.websiteUrl);

      // Upsert each discovered profile
      for (const profile of result.profiles) {
        await prisma.socialProfile.upsert({
          where: {
            // Use a compound unique-ish approach via findFirst + create
            id: (
              await prisma.socialProfile.findFirst({
                where: { businessId, platform: profile.platform },
                select: { id: true },
              })
            )?.id ?? "new",
          },
          create: {
            businessId,
            platform: profile.platform,
            profileUrl: profile.profileUrl,
            confidence: profile.confidence,
            retrievedAt: new Date(result.discoveredAt),
          },
          update: {
            profileUrl: profile.profileUrl,
            confidence: profile.confidence,
            retrievedAt: new Date(result.discoveredAt),
          },
        });
      }

      await prisma.researchRun.update({
        where: { id: researchRun.id },
        data: { status: RunStatus.COMPLETED, completedAt: new Date() },
      });

      log.info(`Social discovery complete for ${businessId}: ${result.profiles.length} profiles`);

      return {
        businessId,
        profilesFound: result.profiles.length,
        profiles: result.profiles,
        skipped: false,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      await prisma.researchRun.update({
        where: { id: researchRun.id },
        data: { status: RunStatus.FAILED, errorMessage, completedAt: new Date() },
      });
      throw err;
    }
  }

  static async discoverJobSocials(jobId: string) {
    const runs = await prisma.researchRun.findMany({
      where: { jobId, researchType: ResearchType.DISCOVERY },
      select: { businessId: true },
    });

    const ids = runs.map((r) => r.businessId).filter((id): id is string => id !== null);
    let found = 0;
    let errors = 0;

    const CONCURRENCY = 3;
    for (let i = 0; i < ids.length; i += CONCURRENCY) {
      const results = await Promise.allSettled(
        ids.slice(i, i + CONCURRENCY).map((id) => this.discoverBusinessSocials(id))
      );
      for (const r of results) {
        if (r.status === "fulfilled") found += r.value.profilesFound;
        else errors++;
      }
    }

    return { total: ids.length, totalProfilesFound: found, errors };
  }
}
