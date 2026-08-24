import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, createSuccessResponse } from "@/lib/api-response";
import { generateReputationProfile } from "@/domain/reputation-engine";
import { formatLeadPhone } from "@/domain/phone-formatter";

export const dynamic = "force-dynamic";

/**
 * POST /api/sync/google-sheets
 * Automatically splits and syncs leads into TWO distinct sheets:
 * 1. 📞 Contact Ready Leads (Phone & WhatsApp 1-Click links)
 * 2. 🌐 Digital Prospects (No direct phone, for web development & field outreach)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { webhookUrl, classification } = body;

    if (!webhookUrl || typeof webhookUrl !== "string" || !webhookUrl.startsWith("https://script.google.com")) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_WEBHOOK",
            message: "Please provide a valid Google Apps Script Webhook URL starting with https://script.google.com/...",
          },
        },
        { status: 400 }
      );
    }

    const businesses = await prisma.business.findMany({
      where: {
        ...(classification && classification !== "ALL"
          ? { leadScore: { classification: classification as any } }
          : {}),
      },
      include: {
        contact: true,
        location: true,
        website: true,
        leadScore: true,
        outreachRecord: true,
        reviewSnapshots: { orderBy: { retrievedAt: "desc" }, take: 1 },
        reviewInsights: { orderBy: { generatedAt: "desc" }, take: 1 },
        serviceOpportunities: { orderBy: { priority: "asc" }, take: 3 },
      },
      orderBy: { createdAt: "desc" },
      take: 1000,
    });

    const contactableLeads: any[] = [];
    const noPhoneLeads: any[] = [];

    for (const b of businesses) {
      const rep = generateReputationProfile({
        name: b.name,
        category: b.primaryCategory,
        city: b.location?.city,
        address: b.location?.formattedAddress,
        hasWebsite: Boolean(b.contact?.websiteUrl),
        hasPhone: Boolean(b.contact?.publicPhone),
      });

      const insight = b.reviewInsights?.[0];
      const snapshot = b.reviewSnapshots?.[0];
      const score = b.leadScore;
      const outreach = b.outreachRecord;

      let famousFor = rep.famousFor;
      if (insight?.famousFor && Array.isArray(insight.famousFor) && insight.famousFor.length > 0) {
        famousFor = insight.famousFor.join(" | ");
      } else if (rep.signatureItems.length > 0) {
        famousFor = `${rep.famousFor} (Signatures: ${rep.signatureItems.join(", ")})`;
      }

      let painPoints = rep.customerPainPoints.join(" | ");
      if (insight?.customerPainPoints && Array.isArray(insight.customerPainPoints) && insight.customerPainPoints.length > 0) {
        painPoints = insight.customerPainPoints.join(" | ");
      }

      const consensus = (insight?.sentimentSummary && !insight.sentimentSummary.includes("Insufficient review"))
        ? insight.sentimentSummary
        : rep.qualityConsensus;

      const phoneInfo = formatLeadPhone(b.contact?.publicPhone, b.name, b.location?.city || "your area");

      if (phoneInfo) {
        // Tab 1: Contact Ready
        contactableLeads.push({
          name: b.name,
          phone: phoneInfo.parenthesized, // e.g. "(+91) 90010 94661" - 100% immune to math evaluation and #ERROR!
          whatsAppLink: phoneInfo.whatsAppLink,
          city: b.location?.city || "",
          category: b.primaryCategory || "Local Business",
          rating: snapshot?.rating ? `${snapshot.rating.toFixed(1)} ★` : `${rep.rating.toFixed(1)} ★`,
          reviewCount: snapshot?.reviewCount || rep.reviewCount,
          famousFor,
          consensus,
          customerPainPoints: painPoints,
          leadScore: score?.totalScore || 85,
          classification: score?.classification || "HOT",
          salesPitch: outreach?.bestSalesAngle || "1-Click WhatsApp direct ordering & menu expansion",
          website: b.contact?.websiteUrl || "No Website",
          mapsUrl: b.mapsUrl || "",
          discoveredAt: b.createdAt.toISOString().split("T")[0],
        });
      } else {
        // Tab 2: Digital Prospect (No Phone)
        noPhoneLeads.push({
          name: b.name,
          category: b.primaryCategory || "Local Business",
          city: b.location?.city || "",
          website: b.contact?.websiteUrl || "⚠️ No Website",
          rating: snapshot?.rating ? `${snapshot.rating.toFixed(1)} ★` : `${rep.rating.toFixed(1)} ★`,
          famousFor,
          identifiedGap: b.contact?.websiteUrl ? "No direct phone; website inquiry form needed" : "⚠️ No phone & no website — prime web build candidate",
          leadScore: score?.totalScore || 80,
          salesPitch: outreach?.bestSalesAngle || "Custom website build & Google Maps presence",
          mapsUrl: b.mapsUrl || "",
          discoveredAt: b.createdAt.toISOString().split("T")[0],
        });
      }
    }

    // Send payload to Google Sheets Webhook
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactableLeads,
        noPhoneLeads,
        totalCount: businesses.length,
        contactableCount: contactableLeads.length,
        noPhoneCount: noPhoneLeads.length,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "GOOGLE_SHEETS_ERROR",
            message: `Google Sheets rejected sync: ${errText.slice(0, 150)}`,
          },
        },
        { status: 502 }
      );
    }

    return createSuccessResponse({
      totalSynced: businesses.length,
      contactableSynced: contactableLeads.length,
      noPhoneSynced: noPhoneLeads.length,
      message: `Successfully synced ${businesses.length} leads! ${contactableLeads.length} into "📞 Contact Ready Leads" tab and ${noPhoneLeads.length} into "🌐 Web Prospects (No Phone)" tab.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
