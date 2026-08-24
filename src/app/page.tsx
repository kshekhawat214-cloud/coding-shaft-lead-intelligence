"use client";

import { useState } from "react";
import { SearchForm } from "@/components/search/search-form";
import { JobList } from "@/components/search/job-list";
import { LeadsExplorer } from "@/components/leads/leads-explorer";
import { CODING_SHAFT_SERVICES } from "@/domain/services-catalog";
import { SCORING_WEIGHTS, LEAD_CLASSIFICATION_THRESHOLDS, SEARCH_MODES } from "@/domain/constants";
import {
  Sparkles,
  Layers,
  Search,
  Database,
  Gauge,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Flame,
  FileSpreadsheet,
} from "lucide-react";

export default function Home() {
  const [activeTab, setActiveTab] = useState<"prospecting" | "leads">("prospecting");
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleJobCreated = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 pb-6 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <span className="text-xs uppercase tracking-wider font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/50">
              Zero-Cost Architecture • OpenStreetMap • Supabase PostgreSQL
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            Coding Shaft Lead Intelligence & Reputation Engine
          </h1>
          <p className="mt-2 text-slate-400 max-w-2xl text-sm sm:text-base">
            Local business discovery, star ratings & customer reviews, "Famous For" intelligence, and instant WhatsApp sales generation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/api/export/leads.csv"
            download
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-xs font-bold text-amber-300 hover:bg-amber-500/25 transition shadow-sm shadow-amber-950/30"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            <span>Export CSV</span>
          </a>
          <a
            href="/api/health"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white hover:border-slate-700 transition"
          >
            <Gauge className="w-4 h-4 text-emerald-400" />
            <span>Health Status</span>
          </a>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800 space-x-6">
        <button
          onClick={() => setActiveTab("prospecting")}
          className={`pb-4 px-1 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === "prospecting"
              ? "border-emerald-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Search className="w-4 h-4 text-emerald-400" />
          <span>Prospect Discovery & Search Jobs</span>
        </button>

        <button
          onClick={() => setActiveTab("leads")}
          className={`pb-4 px-1 text-sm font-bold flex items-center gap-2 border-b-2 transition ${
            activeTab === "leads"
              ? "border-emerald-500 text-white"
              : "border-transparent text-slate-400 hover:text-slate-200"
          }`}
        >
          <Flame className="w-4 h-4 text-rose-400" />
          <span>Sales Leads CRM & Reputation Intelligence</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "prospecting" ? (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7">
            <SearchForm onJobCreated={handleJobCreated} />
          </div>
          <div className="lg:col-span-5">
            <JobList
              refreshTrigger={refreshTrigger}
              onViewInCRM={() => setActiveTab("leads")}
            />
          </div>
        </section>
      ) : (
        <section>
          <LeadsExplorer />
        </section>
      )}

      {/* System Status Metrics */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Core Services</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">{CODING_SHAFT_SERVICES.length}</span>
            <span className="text-xs text-slate-400 ml-2">Services in Catalog</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Configured across 6 key technology pillars</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Data Model</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">13</span>
            <span className="text-xs text-slate-400 ml-2">Normalized Entities</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">Prisma schema ready for PostgreSQL & Supabase</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Scoring Engine</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">100</span>
            <span className="text-xs text-slate-400 ml-2">Points Deterministic Model</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">6 weighted components & 5 tier classifications</p>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Search Modes</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Search className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold text-white">{SEARCH_MODES.length}</span>
            <span className="text-xs text-slate-400 ml-2">Prospecting Strategies</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">OpenStreetMap discovery without paid API bills</p>
        </div>
      </section>

      {/* Scoring Methodology & Service Catalog */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Scoring Breakdown */}
        <section className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Lead Scoring Methodology</h2>
            </div>
            <p className="text-xs text-slate-400">
              Transparent 100-point scoring formula according to LEAD_SCORING.md
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Business Attractiveness</span>
                <span className="text-indigo-400 font-semibold">{SCORING_WEIGHTS.BUSINESS_ATTRACTIVENESS} pts</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: "20%" }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Digital Weakness</span>
                <span className="text-indigo-400 font-semibold">{SCORING_WEIGHTS.DIGITAL_WEAKNESS} pts</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: "20%" }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Technology Opportunity</span>
                <span className="text-indigo-400 font-semibold">{SCORING_WEIGHTS.TECHNOLOGY_OPPORTUNITY} pts</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: "20%" }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Reputation Strength</span>
                <span className="text-indigo-400 font-semibold">{SCORING_WEIGHTS.REPUTATION} pts</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: "15%" }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Coding Shaft Service Fit</span>
                <span className="text-indigo-400 font-semibold">{SCORING_WEIGHTS.SERVICE_FIT} pts</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: "15%" }} />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Contactability & Data Quality</span>
                <span className="text-indigo-400 font-semibold">{SCORING_WEIGHTS.CONTACTABILITY} pts</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: "10%" }} />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Classification Tiers
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-emerald-300">
                <div className="font-bold">HOT (80–100)</div>
                <div className="text-[11px] text-emerald-400/80">Immediate outreach priority</div>
              </div>
              <div className="p-2.5 rounded-lg bg-blue-950/40 border border-blue-800/40 text-blue-300">
                <div className="font-bold">HIGH (65–79)</div>
                <div className="text-[11px] text-blue-400/80">Strong service alignment</div>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/40 text-amber-300">
                <div className="font-bold">MEDIUM (50–64)</div>
                <div className="text-[11px] text-amber-400/80">Moderate opportunity</div>
              </div>
              <div className="p-2.5 rounded-lg bg-orange-950/40 border border-orange-800/40 text-orange-300">
                <div className="font-bold">LOW (30–49)</div>
                <div className="text-[11px] text-orange-400/80">Limited immediate fit</div>
              </div>
            </div>
          </div>
        </section>

        {/* Right Column (Span 2): Services Catalog */}
        <section className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h2 className="text-lg font-bold text-white">Coding Shaft Service Catalog</h2>
              </div>
              <p className="text-xs text-slate-400">
                22 standardized services mapped to automated intelligence rules
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
            {CODING_SHAFT_SERVICES.map((service) => (
              <div
                key={service.id}
                className="glass-card rounded-xl p-4 border border-slate-800/80 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h3 className="text-sm font-semibold text-white">{service.name}</h3>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {service.tier}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{service.description}</p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                  <span className="text-indigo-400 font-medium">{service.category}</span>
                  {service.quickWinPotential && (
                    <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
                      <Sparkles className="w-3 h-3" /> Quick Win
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Implementation Roadmap */}
      <section className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Engine Implementation Roadmap</h2>
            <p className="text-xs text-slate-400">Phased rollout following IMPLEMENTATION_PLAN.md</p>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-950/60 text-indigo-400 border border-indigo-800/60">
            Phase 2: Search Jobs Active
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/50">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
              <CheckCircle2 className="w-4 h-4" /> Phase 1: Foundation
            </div>
            <p className="text-xs text-slate-300">Next.js, TypeScript, Prisma, Zod, Logger, Errors, Health Check</p>
          </div>

          <div className="p-4 rounded-xl bg-indigo-950/30 border border-indigo-500/50">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold mb-1">
              <CheckCircle2 className="w-4 h-4" /> Phase 2: Search Jobs
            </div>
            <p className="text-xs text-slate-200">Search job model, validation, job manager UI, cancel & delete APIs</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
              <ArrowRight className="w-4 h-4" /> Phase 3: Free Discovery
            </div>
            <p className="text-xs text-slate-400">OpenStreetMap / Overpass provider, deduplication, normalization</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
              <ArrowRight className="w-4 h-4" /> Phase 4–14: Pipeline
            </div>
            <p className="text-xs text-slate-400">Website audit, review intel, opportunity engine, dashboard</p>
          </div>
        </div>
      </section>
    </div>
  );
}
