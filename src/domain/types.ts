import { LeadClassificationType, LeadLifecycleStage } from "./constants";

export interface EvidenceItem {
  sourceUrl?: string;
  sourceType: "website" | "google_places" | "review" | "social" | "inference";
  observation: string;
  retrievedAt: string;
  confidence: number;
}

export interface ScoreBreakdown {
  businessAttractivenessScore: number;
  reputationScore: number;
  digitalWeaknessScore: number;
  technologyOpportunityScore: number;
  serviceFitScore: number;
  contactabilityScore: number;
  totalScore: number;
  classification: LeadClassificationType;
  reasons: string[];
}

export interface OpportunitySuggestion {
  serviceId: string;
  serviceName: string;
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reason: string;
  evidence: EvidenceItem[];
  confidence: number;
}

export interface SalesIntelligenceOutput {
  bestSalesAngle: string;
  quickWin: string;
  recommendedPackage: string;
  outreachIdea: string;
}

export interface DiscoveredBusinessDTO {
  externalPlaceId: string;
  name: string;
  primaryCategory?: string;
  categories: string[];
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  reviewCount?: number;
  publicPhone?: string;
  websiteUrl?: string;
  mapsUrl?: string;
}

export interface LeadDetailViewDTO {
  id: string;
  name: string;
  category: string;
  address: string;
  city: string;
  state: string;
  country: string;
  phone?: string;
  websiteUrl?: string;
  mapsUrl?: string;
  rating?: number;
  reviewCount?: number;
  websiteStatus?: string;
  websiteScore?: number;
  leadScore: number;
  classification: LeadClassificationType;
  scoreBreakdown: ScoreBreakdown;
  opportunities: OpportunitySuggestion[];
  salesAngle?: string;
  quickWin?: string;
  outreachIdea?: string;
  status: LeadLifecycleStage;
  researchDate?: string;
}

export function deriveWebsiteWeaknesses(website?: {
  https?: boolean;
  mobileScore?: number | null;
  title?: string | null;
  metaDescription?: string | null;
  whatsappPresent?: boolean;
  bookingCapability?: boolean;
  websiteScore?: number | null;
  seoScore?: number | null;
  conversionScore?: number | null;
} | null): string[] {
  if (!website) return ["No website listed"];
  const list: string[] = [];
  if (!website.https) list.push("No SSL certificate (HTTP only)");
  if (website.mobileScore === 0) list.push("Not mobile-responsive (missing viewport)");
  if (!website.title) list.push("Missing page title tag");
  if (!website.metaDescription) list.push("Missing meta description");
  if (!website.whatsappPresent) list.push("No WhatsApp contact link");
  if (!website.bookingCapability) list.push("No online booking system");
  if ((website.seoScore ?? 1) < 0.5) list.push("Low SEO optimization score");
  if ((website.conversionScore ?? 1) < 0.5) list.push("Low conversion optimization score");
  if ((website.websiteScore ?? 1) < 0.5) list.push("Low overall website score");
  return list;
}
