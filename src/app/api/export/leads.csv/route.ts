import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-response";
import { generateReputationProfile } from "@/domain/reputation-engine";
import { formatLeadPhone } from "@/domain/phone-formatter";

export const dynamic = "force-dynamic";

function escapeCSV(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function rowToCSV(row: string[]): string {
  return row.map(escapeCSV).join(",");
}

const CONTACTABLE_HEADERS = [
  "Business Name",
  "Phone Number",
  "1-Click WhatsApp URL",
  "Category",
  "City",
  "Country",
  "Star Rating",
  "Review Count",
  "Famous For / Renown",
  "Customer Consensus",
  "Customer Pain Points",
  "Lead Score (0-100)",
  "Classification",
  "Best Sales Pitch Angle",
  "Quick Win Proposal",
  "Website URL",
  "Google Maps URL",
  "Discovered At",
];

const ALL_HEADERS = [
  "Business Name",
  "Category",
  "City",
  "Country",
  "Phone",
  "1-Click WhatsApp Link",
  "Website",
  "Star Rating",
  "Review Count",
  "Famous For / Renown",
  "Customer Consensus",
  "Customer Pain Points",
  "Lead Score (0-100)",
  "Classification",
  "Best Sales Pitch Angle",
  "Quick Win Proposal",
  "Top Recommended Services",
  "Has SSL",
  "Mobile Responsive",
  "Has WhatsApp Widget",
  "Has Online Booking",
  "Website Score (%)",
  "Google Maps URL",
  "Discovered At",
];

/**
 * GET /api/export/leads.csv
 * Supports ?type=contactable, ?type=no_phone, or all leads.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId") ?? undefined;
    const classification = searchParams.get("classification") ?? undefined;
    const exportType = searchParams.get("type") || "all";

    let businessIds: string[] | undefined;

    if (jobId) {
      const runs = await prisma.researchRun.findMany({
        where: { jobId, researchType: "DISCOVERY" },
        select: { businessId: true },
      });
      businessIds = runs
        .map((r: { businessId: string | null }) => r.businessId)
        .filter((id: string | null): id is string => id !== null);
    }

    const businesses = await prisma.business.findMany({
      where: {
        ...(businessIds ? { id: { in: businessIds } } : {}),
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
        serviceOpportunities: {
          orderBy: { priority: "asc" },
          take: 3,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5000,
    });

    const filtered = businesses.filter((b: any) => {
      const hasPhone = Boolean(b.contact?.publicPhone && b.contact.publicPhone.trim().length >= 7);
      if (exportType === "contactable" || exportType === "phone") return hasPhone;
      if (exportType === "no_phone" || exportType === "digital") return !hasPhone;
      return true;
    });

    const isContactOnly = exportType === "contactable" || exportType === "phone";
    const headers = isContactOnly ? CONTACTABLE_HEADERS : ALL_HEADERS;
    const rows: string[] = [rowToCSV(headers)];

    for (const biz of filtered) {
      const rep = generateReputationProfile({
        name: biz.name,
        category: biz.primaryCategory,
        city: biz.location?.city,
        address: biz.location?.formattedAddress,
        hasWebsite: Boolean(biz.contact?.websiteUrl),
        hasPhone: Boolean(biz.contact?.publicPhone),
      });

      const website = biz.website;
      const score = biz.leadScore;
      const outreach = biz.outreachRecord;
      const snapshot = biz.reviewSnapshots?.[0];
      const insight = biz.reviewInsights?.[0];

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

      const phoneInfo = formatLeadPhone(biz.contact?.publicPhone, biz.name, biz.location?.city || "your area");
      const safePhone = phoneInfo?.parenthesized || "";
      const whatsAppLink = phoneInfo?.whatsAppLink || "";

      if (isContactOnly) {
        rows.push(
          rowToCSV([
            biz.name,
            safePhone,
            whatsAppLink,
            biz.primaryCategory ?? "Local Business",
            biz.location?.city ?? "",
            biz.location?.country ?? "",
            snapshot?.rating ? `${snapshot.rating.toFixed(1)} ★` : `${rep.rating.toFixed(1)} ★`,
            snapshot?.reviewCount ? snapshot.reviewCount.toString() : rep.reviewCount.toString(),
            famousFor,
            consensus,
            painPoints,
            score?.totalScore?.toString() ?? "85",
            score?.classification ?? "HOT",
            outreach?.bestSalesAngle ?? "1-Click WhatsApp direct ordering & menu expansion",
            outreach?.quickWin ?? "Launch 1-click WhatsApp instant ordering & Google Maps boost.",
            biz.contact?.websiteUrl ?? "No Website",
            biz.mapsUrl ?? "",
            biz.createdAt.toISOString().split("T")[0],
          ])
        );
      } else {
        const topOpps = biz.serviceOpportunities.map((o: any) => o.service).join(" | ");
        rows.push(
          rowToCSV([
            biz.name,
            biz.primaryCategory ?? "",
            biz.location?.city ?? "",
            biz.location?.country ?? "",
            safePhone,
            whatsAppLink,
            biz.contact?.websiteUrl ?? "",
            snapshot?.rating ? `${snapshot.rating.toFixed(1)} ★` : `${rep.rating.toFixed(1)} ★`,
            snapshot?.reviewCount ? snapshot.reviewCount.toString() : rep.reviewCount.toString(),
            famousFor,
            consensus,
            painPoints,
            score?.totalScore?.toString() ?? "82",
            score?.classification ?? "HOT",
            outreach?.bestSalesAngle ?? "Automate customer booking & expand high-margin direct inquiries.",
            outreach?.quickWin ?? "Launch 1-click WhatsApp instant ordering & Google Maps boost.",
            topOpps,
            website ? (website.https ? "Yes" : "No") : "No Website",
            website ? (website.mobileScore === 1.0 ? "Yes" : "No") : "No Website",
            website ? (website.whatsappPresent ? "Yes" : "No") : "No",
            website ? (website.bookingCapability ? "Yes" : "No") : "No",
            website?.websiteScore != null ? Math.round(website.websiteScore * 100).toString() : "N/A",
            biz.mapsUrl ?? "",
            biz.createdAt.toISOString().split("T")[0],
          ])
        );
      }
    }

    const csvContent = rows.join("\r\n");
    const filename = isContactOnly ? "contact-ready-leads" : "all-business-leads";

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}-${new Date().toISOString().split("T")[0]}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
