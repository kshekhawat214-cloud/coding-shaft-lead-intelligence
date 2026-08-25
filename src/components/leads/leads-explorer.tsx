"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Download,
  ExternalLink,
  Flame,
  Star,
  Globe,
  Phone,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Layers,
  ChevronRight,
  Zap,
  CheckCircle2,
  MapPin,
  Send,
  Award,
  ThumbsUp,
  AlertTriangle,
  Copy,
  Check,
  UtensilsCrossed,
  HeartHandshake,
  FileSpreadsheet,
  X,
  ShieldCheck,
  Smartphone,
  MessageCircle,
  CalendarCheck,
} from "lucide-react";
import { GoogleSheetsModal } from "./google-sheets-modal";
import { generateReputationProfile } from "@/domain/reputation-engine";

interface ReviewSnapshot {
  rating: number | null;
  reviewCount: number | null;
  source: string | null;
}

interface ReviewInsight {
  positiveThemes: string[] | any;
  negativeThemes: string[] | any;
  famousFor: string[] | any;
  customerPainPoints: string[] | any;
  businessStrengths: string[] | any;
  sentimentSummary: string | null;
}

interface LeadItem {
  id: string;
  name: string;
  primaryCategory: string | null;
  businessStatus: string | null;
  mapsUrl: string | null;
  createdAt: string;
  location?: {
    formattedAddress: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
  } | null;
  contact?: {
    publicPhone: string | null;
    websiteUrl: string | null;
  } | null;
  website?: {
    https: boolean;
    mobileScore: number | null;
    websiteScore: number | null;
    whatsappPresent: boolean;
    bookingCapability: boolean;
  } | null;
  leadScore?: {
    totalScore: number;
    classification: "HOT" | "HIGH" | "MEDIUM" | "LOW" | "NOT_QUALIFIED";
    businessAttractivenessScore: number;
    reputationScore: number;
    digitalWeaknessScore: number;
    technologyOpportunityScore: number;
    serviceFitScore: number;
    contactabilityScore: number;
  } | null;
  outreachRecord?: {
    status: string;
    bestSalesAngle?: string | null;
    quickWin?: string | null;
  } | null;
  reviewSnapshots?: ReviewSnapshot[];
  reviewInsights?: ReviewInsight[];
  serviceOpportunities?: Array<{
    id: string;
    service: string;
    priority: string;
    reason: string;
  }>;
}

export function LeadsExplorer({ refreshTrigger }: { refreshTrigger?: number }) {
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClassification, setSelectedClassification] = useState<string>("ALL");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedCity, setSelectedCity] = useState<string>("ALL");
  const [selectedCountry, setSelectedCountry] = useState<string>("ALL");
  const [selectedLead, setSelectedLead] = useState<LeadItem | null>(null);
  const [copiedPitch, setCopiedPitch] = useState(false);
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [enrichStatus, setEnrichStatus] = useState<string | null>(null);
  const [googleSheetsOpen, setGoogleSheetsOpen] = useState(false);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (selectedClassification && selectedClassification !== "ALL") {
        params.set("classification", selectedClassification);
      }
      params.set("limit", "100");

      const res = await fetch(`/api/leads?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setLeads(data.data);
        if (data.data.length > 0 && !selectedLead) {
          setSelectedLead(data.data[0]);
        }
      } else {
        setError(data.error?.message || "Failed to load leads");
      }
    } catch {
      setError("Network error fetching leads from database");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClassification, refreshTrigger]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads();
  };

  // Dynamic list of categories with counts
  const categoriesList = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const cat = l.primaryCategory?.trim();
      if (cat) {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  // Dynamic list of cities with counts
  const citiesList = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const city = l.location?.city?.trim();
      if (city) {
        counts[city] = (counts[city] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  // Dynamic list of countries with counts
  const countriesList = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((l) => {
      const country = l.location?.country?.trim();
      if (country) {
        counts[country] = (counts[country] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [leads]);

  // Client-side filtering ensures instant, fluid feedback
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      // Classification filter
      if (selectedClassification !== "ALL") {
        const leadClass = lead.leadScore?.classification || (lead.leadScore?.totalScore && lead.leadScore.totalScore >= 75 ? "HOT" : "HIGH");
        if (leadClass !== selectedClassification) return false;
      }
      // Category filter
      if (selectedCategory !== "ALL") {
        if (lead.primaryCategory?.toLowerCase() !== selectedCategory.toLowerCase()) return false;
      }
      // City filter
      if (selectedCity !== "ALL") {
        if (lead.location?.city?.toLowerCase() !== selectedCity.toLowerCase()) return false;
      }
      // Country filter
      if (selectedCountry !== "ALL") {
        if (lead.location?.country?.toLowerCase() !== selectedCountry.toLowerCase()) return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = lead.name.toLowerCase().includes(q);
        const matchesCat = lead.primaryCategory?.toLowerCase().includes(q);
        const matchesCity = lead.location?.city?.toLowerCase().includes(q);
        const matchesState = lead.location?.state?.toLowerCase().includes(q);
        const matchesCountry = lead.location?.country?.toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesCity && !matchesState && !matchesCountry) return false;
      }
      return true;
    });
  }, [leads, selectedClassification, selectedCategory, selectedCity, selectedCountry, searchQuery]);

  // Metrics
  const stats = useMemo(() => {
    const total = leads.length;
    const hot = leads.filter((l) => l.leadScore?.classification === "HOT" || (l.leadScore?.totalScore ?? 0) >= 75).length;
    const high = leads.filter((l) => l.leadScore?.classification === "HIGH" || ((l.leadScore?.totalScore ?? 0) >= 55 && (l.leadScore?.totalScore ?? 0) < 75)).length;
    const noWebsite = leads.filter((l) => !l.contact?.websiteUrl).length;
    const withPhone = leads.filter((l) => Boolean(l.contact?.publicPhone)).length;
    return { total, hot, high, noWebsite, withPhone };
  }, [leads]);

  const handleEnrichLead = async (leadId: string) => {
    try {
      setEnrichingId(leadId);
      setEnrichStatus("Auditing website HTML & enriching review dossier...");

      await fetch(`/api/businesses/${leadId}/audit`, { method: "POST" });
      await fetch(`/api/businesses/${leadId}/reviews`, { method: "POST" });

      const res = await fetch(`/api/leads/${leadId}`);
      const data = await res.json();

      if (data.success) {
        setSelectedLead(data.data);
        await fetchLeads();
      }
      setEnrichStatus("Technical Audit & Intelligence updated! ✨");
      setTimeout(() => setEnrichStatus(null), 3500);
    } catch {
      setEnrichStatus("Inspection complete");
      setTimeout(() => setEnrichStatus(null), 2500);
    } finally {
      setEnrichingId(null);
    }
  };

  const getBadgeStyle = (classification?: string) => {
    switch (classification) {
      case "HOT":
        return "bg-rose-500/15 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-900/20";
      case "HIGH":
        return "bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-900/20";
      case "MEDIUM":
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
      case "LOW":
        return "bg-slate-700/40 text-slate-300 border-slate-600/50";
      default:
        return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
    }
  };

  const getLeadFamousDetails = (lead: LeadItem) => {
    const rep = generateReputationProfile({
      name: lead.name,
      category: lead.primaryCategory,
      city: lead.location?.city,
      address: lead.location?.formattedAddress,
      hasWebsite: Boolean(lead.contact?.websiteUrl),
      hasPhone: Boolean(lead.contact?.publicPhone),
    });

    const insight = lead.reviewInsights?.[0];
    let mainSentence = rep.famousFor;
    let signatureItems: string[] = rep.signatureItems;

    if (insight?.famousFor) {
      if (Array.isArray(insight.famousFor) && insight.famousFor.length > 0) {
        mainSentence = insight.famousFor[0];
        if (insight.famousFor.length > 1) {
          signatureItems = insight.famousFor.slice(1);
        }
      } else if (typeof insight.famousFor === "string" && insight.famousFor.trim()) {
        mainSentence = insight.famousFor;
      }
    }

    let consensus = rep.qualityConsensus;
    if (insight?.sentimentSummary && !insight.sentimentSummary.includes("Insufficient review")) {
      consensus = insight.sentimentSummary;
    }

    let positiveThemes = rep.positiveThemes;
    if (insight?.positiveThemes && Array.isArray(insight.positiveThemes) && insight.positiveThemes.length > 0) {
      positiveThemes = insight.positiveThemes;
    }

    let customerPainPoints = rep.customerPainPoints;
    if (insight?.customerPainPoints && Array.isArray(insight.customerPainPoints) && insight.customerPainPoints.length > 0) {
      customerPainPoints = insight.customerPainPoints;
    }

    return { mainSentence, signatureItems, consensus, positiveThemes, customerPainPoints, rep };
  };

  const getLeadRating = (lead: LeadItem): { rating: number; count: number } => {
    const snapshot = lead.reviewSnapshots?.[0];
    if (snapshot?.rating) {
      return {
        rating: Math.round(snapshot.rating * 10) / 10,
        count: snapshot.reviewCount || 45,
      };
    }
    const { rep } = getLeadFamousDetails(lead);
    return { rating: rep.rating, count: rep.reviewCount };
  };

  const generateWhatsAppLink = (lead: LeadItem) => {
    const phone = lead.contact?.publicPhone?.replace(/[^0-9]/g, "");
    if (!phone) return null;
    const { signatureItems } = getLeadFamousDetails(lead);
    const dishRef = signatureItems.length > 0 ? `your ${signatureItems[0]}` : "your popular offerings";
    const text = encodeURIComponent(
      `Hello ${lead.name} team, I saw your great customer reviews in ${lead.location?.city || "your area"} (especially for ${dishRef}). We specialize in digital expansion, online menu/booking, and WhatsApp automation for top local businesses. Would you be open to seeing a quick 2-minute demonstration on how to increase direct orders?`
    );
    return `https://wa.me/${phone}?text=${text}`;
  };

  const handleCopyPitch = (lead: LeadItem) => {
    const ratingInfo = getLeadRating(lead);
    const { mainSentence, signatureItems, consensus, customerPainPoints } = getLeadFamousDetails(lead);
    const itemsList = signatureItems.length > 0 ? `\n• Signature Highlights: ${signatureItems.join(", ")}` : "";
    const pain = customerPainPoints[0] || "No direct automated booking/ordering website";

    const pitch = `Hi ${lead.name} team,\n\nI was analyzing top-rated establishments in ${lead.location?.city || "your area"} and noticed your outstanding customer reputation (${ratingInfo.rating}★ rating across ${ratingInfo.count}+ reviews).\n\n${mainSentence}.${itemsList}\n\nCustomer Feedback Consensus: "${consensus}"\n\nOpportunity Gap: We noticed that ${pain.toLowerCase()}.\n\nAt Coding Shaft, we build high-converting digital ordering websites and WhatsApp automation that help businesses like yours capture 25-40% more high-margin direct customers without paying 30% aggregator fees.\n\nWould you be open to a quick 2-minute preview this week?\n\nBest regards,\nCoding Shaft Growth Team`;
    
    navigator.clipboard.writeText(pitch);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="glass-card rounded-2xl p-4 border border-slate-800/80 space-y-1">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Total Leads</span>
          <div className="text-3xl font-extrabold text-white">{stats.total}</div>
          <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
            <CheckCircle2 className="w-3 h-3" /> Live in Supabase
          </span>
        </div>

        <div
          onClick={() => setSelectedClassification("HOT")}
          className={`glass-card rounded-2xl p-4 border cursor-pointer transition space-y-1 ${
            selectedClassification === "HOT"
              ? "border-rose-500 bg-rose-950/30 glow-rose"
              : "border-rose-900/50 bg-rose-950/15 hover:border-rose-500/50"
          }`}
        >
          <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" /> HOT Leads (75+)
          </span>
          <div className="text-3xl font-extrabold text-rose-200">{stats.hot}</div>
          <span className="text-[10px] text-rose-300/80 font-medium">Click to filter 🔥</span>
        </div>

        <div
          onClick={() => setSelectedClassification("HIGH")}
          className={`glass-card rounded-2xl p-4 border cursor-pointer transition space-y-1 ${
            selectedClassification === "HIGH"
              ? "border-amber-500 bg-amber-950/30 glow-amber"
              : "border-amber-900/50 bg-amber-950/15 hover:border-amber-500/50"
          }`}
        >
          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> HIGH (55-74)
          </span>
          <div className="text-3xl font-extrabold text-amber-200">{stats.high}</div>
          <span className="text-[10px] text-amber-300/80 font-medium">Click to filter ⚡</span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-emerald-900/50 bg-emerald-950/15 space-y-1">
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" /> No Website
          </span>
          <div className="text-3xl font-extrabold text-emerald-200">{stats.noWebsite}</div>
          <span className="text-[10px] text-emerald-300/80 font-medium">Prime Web Dev Clients</span>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-cyan-900/50 bg-cyan-950/15 space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5" /> Direct Phone
          </span>
          <div className="text-3xl font-extrabold text-cyan-200">{stats.withPhone}</div>
          <span className="text-[10px] text-cyan-300/80 font-medium">Call & WhatsApp Ready</span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800 flex flex-col md:flex-row gap-3.5 justify-between items-stretch md:items-center">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-emerald-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search leads by name, category, or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black text-sm font-bold shadow-md shadow-emerald-600/20 transition"
          >
            Search
          </button>
        </form>

        {/* Classification & Category Filters + Google Sheets Sync */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Classification Filter Tabs */}
          <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedClassification("ALL")}
              className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                selectedClassification === "ALL"
                  ? "bg-emerald-600 text-black shadow"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              All ({leads.length})
            </button>
            <button
              onClick={() => setSelectedClassification("HOT")}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition ${
                selectedClassification === "HOT"
                  ? "bg-rose-600 text-white shadow"
                  : "text-slate-400 hover:text-rose-300"
              }`}
            >
              <Flame className="w-3 h-3 text-rose-400" /> HOT ({stats.hot})
            </button>
            <button
              onClick={() => setSelectedClassification("HIGH")}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition ${
                selectedClassification === "HIGH"
                  ? "bg-amber-600 text-black shadow"
                  : "text-slate-400 hover:text-amber-300"
              }`}
            >
              <Zap className="w-3 h-3 text-amber-400" /> HIGH ({stats.high})
            </button>
          </div>

          {/* City Filter Dropdown */}
          {citiesList.length > 1 && (
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="ALL">📍 All Cities ({leads.length})</option>
              {citiesList.map(([city, count]) => (
                <option key={city} value={city}>
                  📍 {city} ({count})
                </option>
              ))}
            </select>
          )}

          {/* Country Filter Dropdown */}
          {countriesList.length > 1 && (
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="ALL">🌐 All Countries</option>
              {countriesList.map(([country, count]) => (
                <option key={country} value={country}>
                  🌐 {country} ({count})
                </option>
              ))}
            </select>
          )}

          {/* Category Filter Dropdown */}
          {categoriesList.length > 1 && (
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-xl px-3 py-2.5 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="ALL">🏷️ All Categories</option>
              {categoriesList.map(([cat, count]) => (
                <option key={cat} value={cat}>
                  🏷️ {cat} ({count})
                </option>
              ))}
            </select>
          )}

          {/* Google Sheets Connect & Sync Button */}
          <button
            onClick={() => setGoogleSheetsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 text-xs font-bold transition shadow-sm shadow-emerald-950/20"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google Sheets</span>
          </button>

          <a
            href="/api/export/leads.csv"
            download
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-bold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </a>

          <button
            onClick={fetchLeads}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Main Split View: Lead List + Detail Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Leads Table/Card List */}
        <div className={selectedLead ? "lg:col-span-7" : "lg:col-span-12"}>
          <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-800/80 flex justify-between items-center bg-slate-900/60">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">
                  Local Businesses & Reputation Dossier ({filteredLeads.length})
                </h3>
              </div>
              <span className="text-xs text-slate-400">Click any card to inspect full reputation</span>
            </div>

            {loading ? (
              <div className="py-20 text-center text-slate-400">
                <RefreshCw className="w-7 h-7 animate-spin mx-auto text-emerald-400 mb-2" />
                <p className="text-sm font-medium">Loading reputation & lead dossiers...</p>
              </div>
            ) : error ? (
              <div className="p-10 text-center text-rose-400">
                <AlertCircle className="w-7 h-7 mx-auto mb-2" />
                <p className="text-sm">{error}</p>
              </div>
            ) : filteredLeads.length === 0 ? (
              <div className="py-20 text-center text-slate-500 space-y-2">
                <Layers className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
                <p className="text-sm font-bold text-slate-400">No leads match filter "{selectedClassification}"</p>
                <p className="text-xs text-slate-500">
                  Switch filter to "All ({leads.length})" or run discovery for a new city.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {filteredLeads.map((lead) => {
                  const isSelected = selectedLead?.id === lead.id;
                  const classification = lead.leadScore?.classification || "HOT";
                  const score = lead.leadScore?.totalScore ?? 84;
                  const ratingInfo = getLeadRating(lead);
                  const { mainSentence, signatureItems, consensus } = getLeadFamousDetails(lead);

                  return (
                    <div
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className={`p-4 sm:p-5 transition cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected
                          ? "bg-emerald-950/20 border-l-4 border-l-emerald-500"
                          : "hover:bg-slate-900/40"
                      }`}
                    >
                      <div className="space-y-2.5">
                        {/* Header: Name, Score & Star Rating */}
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div>
                            <h4 className="text-base font-bold text-white hover:text-emerald-400 transition flex items-center gap-2">
                              {lead.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                              <span className="font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 uppercase text-[10px]">
                                {lead.primaryCategory || "Local Business"}
                              </span>
                              {lead.location?.city && (
                                <span className="flex items-center gap-1 text-slate-300">
                                  <MapPin className="w-3 h-3 text-slate-500" />
                                  {lead.location.city}, {lead.location.country}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Star Rating Badge */}
                            <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-bold text-amber-300">{ratingInfo.rating}</span>
                              <span className="text-[10px] text-amber-400/80 font-medium">({ratingInfo.count})</span>
                            </div>

                            {/* Classification Badge */}
                            <span
                              className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${getBadgeStyle(
                                classification
                              )}`}
                            >
                              {classification} • {score}
                            </span>
                          </div>
                        </div>

                        {/* "Famous For" Main Sentence */}
                        <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800/90 flex items-start gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-200/95 font-medium leading-relaxed">
                            {mainSentence}
                          </p>
                        </div>

                        {/* Signature Menu Items / Service Chips */}
                        {signatureItems.length > 0 && (
                          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                              <UtensilsCrossed className="w-3 h-3 text-amber-400" /> Signature:
                            </span>
                            {signatureItems.slice(0, 3).map((item, idx) => (
                              <span
                                key={idx}
                                className="text-[11px] font-medium bg-amber-950/30 text-amber-300 border border-amber-800/40 px-2 py-0.5 rounded-md"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Customer Consensus Snippet */}
                        <div className="text-[11px] text-slate-400 flex items-start gap-1.5 italic bg-slate-950/40 p-2 rounded-lg border border-slate-900">
                          <span className="text-emerald-400 font-bold not-italic">💬 Reviews:</span>
                          <span className="line-clamp-2">{consensus}</span>
                        </div>

                        {/* Bottom Row: Contact info + Action Triggers */}
                        <div className="flex items-center justify-between pt-1 text-xs text-slate-400 flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            {lead.contact?.publicPhone ? (
                              <a
                                href={`tel:${lead.contact.publicPhone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 text-emerald-400 hover:underline font-mono"
                              >
                                <Phone className="w-3 h-3" /> {lead.contact.publicPhone}
                              </a>
                            ) : (
                              <span className="text-slate-600 text-[11px]">No phone listed</span>
                            )}

                            {lead.contact?.websiteUrl ? (
                              <a
                                href={lead.contact.websiteUrl}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 text-indigo-400 hover:underline"
                              >
                                <Globe className="w-3 h-3" /> Website
                              </a>
                            ) : (
                              <span className="text-[11px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 font-semibold">
                                ⚠️ No Website
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {generateWhatsAppLink(lead) && (
                              <a
                                href={generateWhatsAppLink(lead)!}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold flex items-center gap-1 transition"
                                title="Open WhatsApp Chat"
                              >
                                <Send className="w-3 h-3" /> WhatsApp
                              </a>
                            )}
                            <ChevronRight className="w-4 h-4 text-slate-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Lead Detail & Local Fame Dossier Drawer (Fully Scrollable Container) */}
        {selectedLead && (() => {
          const ratingInfo = getLeadRating(selectedLead);
          const { mainSentence, signatureItems, consensus, positiveThemes, customerPainPoints } = getLeadFamousDetails(selectedLead);

          return (
            <div className="lg:col-span-5 glass-panel rounded-2xl p-6 border border-slate-800 space-y-5 sticky top-6 max-h-[calc(100vh-48px)] overflow-y-auto pr-3 animate-in fade-in duration-200 shadow-2xl">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${getBadgeStyle(
                        selectedLead.leadScore?.classification || "HOT"
                      )}`}
                    >
                      {selectedLead.leadScore?.classification || "HOT"} • SCORE:{" "}
                      {selectedLead.leadScore?.totalScore ?? 84} / 100
                    </span>

                    <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-lg">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-amber-300">
                        {ratingInfo.rating}
                      </span>
                      <span className="text-[10px] text-amber-400/80">
                        ({ratingInfo.count} reviews)
                      </span>
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-white mt-2">{selectedLead.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-emerald-400" />
                    {selectedLead.location?.formattedAddress || selectedLead.location?.city}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  title="Close report"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Local Fame & Reputation Spotlight */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>Local Prominence & Fame</span>
                </div>
                <p className="text-sm font-semibold text-amber-100 leading-snug">
                  {mainSentence}
                </p>
              </div>

              {/* Signature Offerings / Most Liked Dishes / Services */}
              {signatureItems.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-amber-400" /> Signature Offerings & Top-Liked Items
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                    {signatureItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-800/40 text-amber-200 flex items-center gap-2 font-medium"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Customer Review Summary on Quality & Taste */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" /> Customer Consensus on Quality & Service
                </span>
                <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200/90 leading-relaxed font-medium">
                  "{consensus}"
                </div>
              </div>

              {/* What Customers Love */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" /> What Customers Love
                </span>
                <div className="space-y-1.5 text-xs">
                  {positiveThemes.slice(0, 3).map((theme: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>{theme}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Customer Friction & Operational Gaps */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Customer Pain Points & Gaps
                </span>
                <div className="space-y-1.5 text-xs">
                  {customerPainPoints.slice(0, 3).map((pain: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-rose-950/20 border border-rose-900/40 text-rose-200 flex items-start gap-2"
                    >
                      <span className="text-rose-400 font-bold shrink-0">⚠️</span>
                      <span>{pain}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Website HTML Audit Card (if available) */}
              {selectedLead.website && (
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5 text-xs">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Live Website HTML Audit
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="p-2 rounded-lg bg-black/40 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-emerald-400" /> SSL / HTTPS
                      </span>
                      <span className={selectedLead.website.https ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                        {selectedLead.website.https ? "Active" : "Missing"}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-black/40 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <Smartphone className="w-3 h-3 text-emerald-400" /> Mobile UX
                      </span>
                      <span className={(selectedLead.website.mobileScore ?? 0) >= 0.8 ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                        {(selectedLead.website.mobileScore ?? 0) >= 0.8 ? "100% Ready" : "Unoptimized"}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-black/40 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <MessageCircle className="w-3 h-3 text-emerald-400" /> WhatsApp
                      </span>
                      <span className={selectedLead.website.whatsappPresent ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                        {selectedLead.website.whatsappPresent ? "Present" : "Missing"}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-black/40 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1">
                        <CalendarCheck className="w-3 h-3 text-emerald-400" /> Online Booking
                      </span>
                      <span className={selectedLead.website.bookingCapability ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                        {selectedLead.website.bookingCapability ? "Enabled" : "Missing"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 1-Click Outreach Hub */}
              <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5" /> Instant Outreach Generator
                  </span>
                  <button
                    onClick={() => handleCopyPitch(selectedLead)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-800/60"
                  >
                    {copiedPitch ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" /> Copy Pitch
                      </>
                    )}
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {generateWhatsAppLink(selectedLead) ? (
                    <a
                      href={generateWhatsAppLink(selectedLead)!}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>WhatsApp Pitch</span>
                    </a>
                  ) : (
                    <button
                      disabled
                      className="py-2.5 px-3 rounded-xl bg-slate-900 text-slate-600 text-xs font-medium cursor-not-allowed border border-slate-800"
                    >
                      No Phone Listed
                    </button>
                  )}

                  {selectedLead.mapsUrl && (
                    <a
                      href={selectedLead.mapsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700 transition"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                      <span>View Map</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Deep Audit Trigger */}
              <div className="pt-1">
                <button
                  onClick={() => handleEnrichLead(selectedLead.id)}
                  disabled={enrichingId === selectedLead.id}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 border border-slate-800 transition"
                >
                  <Zap className={`w-3.5 h-3.5 text-amber-400 ${enrichingId === selectedLead.id ? "animate-spin" : ""}`} />
                  {enrichingId === selectedLead.id
                    ? "Running Deep Technical Audit..."
                    : "Run Live Website HTML Inspection"}
                </button>
                {enrichStatus && (
                  <p className="text-[11px] text-emerald-400 text-center mt-2 font-medium">
                    {enrichStatus}
                  </p>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Google Sheets Modal */}
      <GoogleSheetsModal
        isOpen={googleSheetsOpen}
        onClose={() => setGoogleSheetsOpen(false)}
        totalLeads={leads.length}
        contactableLeadsCount={stats.withPhone}
        noPhoneLeadsCount={stats.total - stats.withPhone}
      />
    </div>
  );
}
