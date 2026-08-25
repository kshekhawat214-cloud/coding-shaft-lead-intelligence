"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Clock,
  Play,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Ban,
  Trash2,
  MapPin,
  Tag,
  Layers,
  Sparkles,
  ExternalLink,
  Phone,
  Globe,
  Loader2,
  Eye,
  ArrowRight,
  Flame,
  Star,
} from "lucide-react";
import { DiscoveredBusinessDTO } from "@/domain/types";

export interface SearchJobItem {
  id: string;
  locationQuery: string;
  categories: string[] | string;
  radiusMeters: number;
  maxBusinesses: number;
  searchMode: string;
  status: "QUEUED" | "RUNNING" | "PARTIAL" | "COMPLETED" | "FAILED" | "CANCELLED";
  progress: number;
  errorMessage?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

interface JobListProps {
  refreshTrigger?: number;
  onViewInCRM?: () => void;
}

export function JobList({ refreshTrigger, onViewInCRM }: JobListProps) {
  const [jobs, setJobs] = useState<SearchJobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [discoveredLeads, setDiscoveredLeads] = useState<{
    jobId: string;
    locationQuery: string;
    leads: DiscoveredBusinessDTO[];
  } | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch("/api/jobs?limit=15");
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setJobs(json.data);
      }
    } catch {
      // Ignore background poll error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs, refreshTrigger]);

  // Polling for active jobs
  useEffect(() => {
    const hasActiveJobs = jobs.some((j) =>
      ["QUEUED", "RUNNING"].includes(j.status)
    );

    if (hasActiveJobs) {
      const interval = setInterval(fetchJobs, 2500);
      return () => clearInterval(interval);
    }
  }, [jobs, fetchJobs]);

  const handleRunDiscovery = async (id: string, locationQuery: string) => {
    setRunningJobId(id);
    try {
      const res = await fetch(`/api/jobs/${id}/run`, { method: "POST" });
      const json = await res.json();
      if (json.success && json.data?.qualifiedBusinesses) {
        setDiscoveredLeads({
          jobId: id,
          locationQuery,
          leads: json.data.qualifiedBusinesses,
        });
        fetchJobs();
      } else if (!json.success) {
        alert(`Discovery issue: ${json.error?.message || "Check network/Overpass API"}`);
        fetchJobs();
      }
    } catch (err) {
      alert("Error triggering discovery job");
    } finally {
      setRunningJobId(null);
    }
  };

  const handleViewJobLeads = async (id: string, locationQuery: string) => {
    setActionLoading(id);
    try {
      // Correct endpoint: /api/jobs/[id]/leads returns persisted businesses for this job
      const res = await fetch(`/api/jobs/${id}/leads`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setDiscoveredLeads({
          jobId: id,
          locationQuery,
          leads: json.data.map((b: any) => ({
            name: b.name,
            primaryCategory: b.primaryCategory,
            address: b.location?.formattedAddress || "Local address",
            publicPhone: b.contact?.publicPhone,
            websiteUrl: b.contact?.websiteUrl,
            mapsUrl: b.mapsUrl,
            externalPlaceId: b.externalPlaceId,
          })),
        });
      } else {
        alert("No leads found for this job yet.");
      }
    } catch {
      alert("Failed to load leads for this job");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (id: string) => {
    setActionLoading(id);
    try {
      await fetch(`/api/jobs/${id}/cancel`, { method: "POST" });
      fetchJobs();
    } catch {
      alert("Failed to cancel search job");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this search job?")) return;
    setActionLoading(id);
    try {
      await fetch(`/api/jobs/${id}`, { method: "DELETE" });
      fetchJobs();
    } catch {
      alert("Failed to delete search job");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: SearchJobItem["status"]) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-800/50">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Discovered
          </span>
        );
      case "RUNNING":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-md border border-amber-800/50">
            <RotateCw className="w-3 h-3 animate-spin text-amber-400" /> Discovering
          </span>
        );
      case "QUEUED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-md border border-cyan-800/50">
            <Clock className="w-3 h-3" /> Queued
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/60 px-2.5 py-1 rounded-md border border-rose-800/50">
            <XCircle className="w-3 h-3" /> Failed
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            <Ban className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Discovery Search Jobs ({jobs.length})</h2>
            <p className="text-xs text-slate-400">Manage automated OpenStreetMap discovery tasks & run history</p>
          </div>
        </div>

        <button
          onClick={fetchJobs}
          disabled={loading}
          className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-slate-700 transition"
          title="Refresh Jobs"
        >
          <RotateCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
          Loading discovery jobs...
        </div>
      ) : jobs.length === 0 ? (
        <div className="py-12 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
          No discovery jobs queued yet. Use the form to launch a location search.
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
          {jobs.map((job) => {
            const categoriesArray = Array.isArray(job.categories)
              ? job.categories
              : typeof job.categories === "string"
              ? JSON.parse(job.categories || "[]")
              : [];

            const isCancellable = ["QUEUED", "RUNNING"].includes(job.status);
            const isRunningThis = runningJobId === job.id;
            const progressPercent = job.progress || (job.status === "COMPLETED" ? 100 : 0);

            return (
              <div
                key={job.id}
                className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3 hover:border-slate-700 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white text-sm flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        {job.locationQuery}
                      </span>
                      {getStatusBadge(job.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs text-slate-400">
                      <span className="text-[11px] text-slate-500">Radius: {job.radiusMeters / 1000}km</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[11px] text-slate-500">Target: {job.maxBusinesses} places</span>
                    </div>

                    {/* Category tags */}
                    <div className="flex flex-wrap gap-1 pt-1.5">
                      {categoriesArray.map((c: string) => (
                        <span
                          key={c}
                          className="text-[10px] bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/60"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleRunDiscovery(job.id, job.locationQuery)}
                      disabled={isRunningThis || job.status === "RUNNING"}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                        job.status === "COMPLETED"
                          ? "bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700"
                          : "bg-emerald-600 hover:bg-emerald-500 text-black shadow-md shadow-emerald-600/20"
                      }`}
                    >
                      {isRunningThis ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Discovering...</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          <span>{job.status === "COMPLETED" ? "Re-Run" : "Run Discovery"}</span>
                        </>
                      )}
                    </button>

                    {/* View Leads for Completed jobs */}
                    {job.status === "COMPLETED" && (
                      <button
                        onClick={() => handleViewJobLeads(job.id, job.locationQuery)}
                        disabled={actionLoading === job.id}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition border border-slate-700"
                        title="View discovered businesses"
                      >
                        <Eye className="w-3.5 h-3.5 text-emerald-400" />
                        <span>View</span>
                      </button>
                    )}

                    {isCancellable && (
                      <button
                        onClick={() => handleCancel(job.id)}
                        disabled={actionLoading === job.id}
                        className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-800 text-slate-400 hover:text-amber-300 transition text-xs"
                        title="Cancel Job"
                      >
                        <Ban className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(job.id)}
                      disabled={actionLoading === job.id}
                      className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-rose-800 text-slate-400 hover:text-rose-300 transition text-xs"
                      title="Delete Job"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                {["RUNNING", "PARTIAL"].includes(job.status) && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>OpenStreetMap Discovery Progress</span>
                      <span className="font-semibold text-emerald-400">{progressPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                )}

                {job.errorMessage && (
                  <div className="text-xs text-rose-400 bg-rose-950/30 p-2 rounded-lg border border-rose-900/50">
                    Error: {job.errorMessage}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Discovered Leads Preview Drawer */}
      {discoveredLeads && (
        <div className="pt-4 border-t border-slate-800 space-y-4 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">
                Discovered Businesses ({discoveredLeads.leads.length}) in {discoveredLeads.locationQuery}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {onViewInCRM && (
                <button
                  onClick={onViewInCRM}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30 text-xs font-bold transition shadow-sm shadow-emerald-950/30"
                >
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Open in Sales CRM</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
              <button
                onClick={() => setDiscoveredLeads(null)}
                className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1"
              >
                Close
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {discoveredLeads.leads.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl">
                No businesses discovered for this job yet. Click "Run Discovery" above.
              </div>
            ) : (
              discoveredLeads.leads.map((lead, idx) => (
                <div
                  key={lead.externalPlaceId || idx}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-2 hover:border-slate-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{lead.name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/60 uppercase font-bold">
                      {lead.primaryCategory || "Business"}
                    </span>
                  </div>

                  <p className="text-slate-400 text-[11px]">{lead.address}</p>

                  <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-300">
                    {lead.publicPhone && (
                      <a
                        href={`tel:${lead.publicPhone}`}
                        className="flex items-center gap-1 text-emerald-400 hover:underline font-mono"
                      >
                        <Phone className="w-3 h-3" /> {lead.publicPhone}
                      </a>
                    )}
                    {lead.websiteUrl ? (
                      <a
                        href={lead.websiteUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-emerald-400 hover:underline"
                      >
                        <Globe className="w-3 h-3" /> Website
                      </a>
                    ) : (
                      <span className="text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 font-semibold">
                        ⚠️ No Website
                      </span>
                    )}
                    {lead.mapsUrl && (
                      <a
                        href={lead.mapsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1 text-slate-400 hover:text-slate-200"
                      >
                        <ExternalLink className="w-3 h-3" /> Open in Map
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
