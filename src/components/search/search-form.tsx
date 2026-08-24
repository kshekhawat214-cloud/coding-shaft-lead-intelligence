"use client";

import { useState } from "react";
import { SEARCH_MODES } from "@/domain/constants";
import { CODING_SHAFT_SERVICES } from "@/domain/services-catalog";
import {
  Search,
  Sparkles,
  MapPin,
  Tag,
  Sliders,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";

interface SearchFormProps {
  onJobCreated?: (job: unknown) => void;
}

const PRESET_LOCATIONS = [
  "London, UK",
  "Austin, TX",
  "Jaipur, Rajasthan",
  "Miami, FL",
  "San Francisco, CA",
  "New York, NY",
  "Dubai, UAE",
];

const PRESET_CATEGORIES = [
  "Restaurants & Cafes",
  "Dental & Clinics",
  "Law Firms",
  "Real Estate",
  "E-Commerce & Retail",
  "Gyms & Fitness",
  "Salons & Spas",
  "Tech & Digital Agencies",
  "Home & Trade Services",
];

export function SearchForm({ onJobCreated }: SearchFormProps) {
  const [locationQuery, setLocationQuery] = useState("London, UK");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "Restaurants & Cafes",
    "Dental & Clinics",
  ]);
  const [customCategory, setCustomCategory] = useState("");
  const [searchMode, setSearchMode] = useState<string>("BROAD");
  const [radiusMeters, setRadiusMeters] = useState(10000);
  const [maxBusinesses, setMaxBusinesses] = useState(20);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const addCustomCategory = () => {
    if (customCategory.trim() && !selectedCategories.includes(customCategory.trim())) {
      setSelectedCategories((prev) => [...prev, customCategory.trim()]);
      setCustomCategory("");
    }
  };

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((s) => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!locationQuery.trim()) {
      setError("Please enter a target city or location");
      return;
    }

    if (selectedCategories.length === 0) {
      setError("Please select at least one business category");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locationQuery: locationQuery.trim(),
          categories: selectedCategories,
          radiusMeters,
          maxBusinesses,
          searchMode,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to create search job");
      }

      setSuccessMessage(`Search job queued successfully (ID: ${data.data.id.slice(0, 8)}...)`);
      if (onJobCreated) {
        onJobCreated(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-6 border border-slate-800 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
            <Search className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Create Business Prospecting Job</h2>
            <p className="text-xs text-slate-400">Discover businesses using OpenStreetMap Multi-Source, audit reputation & score fit</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Target Location */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Target Location
        </label>
        <div className="relative">
          <input
            type="text"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            placeholder="e.g. London, UK or Austin, TX or Jaipur, Rajasthan"
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[11px] text-slate-500 self-center mr-1">Quick:</span>
          {PRESET_LOCATIONS.map((loc) => (
            <button
              key={loc}
              type="button"
              onClick={() => setLocationQuery(loc)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                locationQuery === loc
                  ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-semibold"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {loc}
            </button>
          ))}
        </div>
      </div>

      {/* Target Categories */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-emerald-400" /> Target Categories
        </label>
        <div className="flex flex-wrap gap-2">
          {PRESET_CATEGORIES.map((cat) => {
            const active = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                type="button"
                onClick={() => toggleCategory(cat)}
                className={`text-xs px-3 py-1.5 rounded-xl border font-semibold transition flex items-center gap-1.5 ${
                  active
                    ? "bg-emerald-600 border-emerald-500 text-black shadow-lg shadow-emerald-600/20"
                    : "bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                {active && <Check className="w-3 h-3 text-black" />}
                {cat}
              </button>
            );
          })}
        </div>

        {/* Custom Category Input */}
        <div className="flex gap-2 pt-1">
          <input
            type="text"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomCategory();
              }
            }}
            placeholder="Add custom category (e.g. Bakeries, Solar Installers)..."
            className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="button"
            onClick={addCustomCategory}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Add
          </button>
        </div>
      </div>

      {/* Prospecting Mode Selection */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Prospecting Strategy
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SEARCH_MODES.map((mode) => {
            const active = searchMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setSearchMode(mode.id)}
                className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                  active
                    ? "bg-emerald-950/40 border-emerald-500 text-white shadow-md shadow-emerald-950/40"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{mode.name}</span>
                  {active && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                </div>
                <p className="text-[10px] text-slate-400 mt-1 leading-tight">{mode.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Settings Toggle */}
      <div className="border-t border-slate-800/80 pt-4">
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-slate-400 hover:text-emerald-300 flex items-center gap-1.5 transition font-medium"
        >
          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          <span>{showAdvanced ? "Hide Advanced Search Parameters" : "Show Advanced Search Parameters"}</span>
        </button>

        {showAdvanced && (
          <div className="mt-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Search Radius */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Search Radius</span>
                  <span className="text-emerald-400 font-bold">{radiusMeters / 1000} km</span>
                </div>
                <input
                  type="range"
                  min={1000}
                  max={40000}
                  step={1000}
                  value={radiusMeters}
                  onChange={(e) => setRadiusMeters(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              {/* Max Businesses */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-slate-300">
                  <span>Max Businesses to Discover</span>
                  <span className="text-emerald-400 font-bold">{maxBusinesses}</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={maxBusinesses}
                  onChange={(e) => setMaxBusinesses(Number(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>

            {/* Target Coding Shaft Services */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300">Prioritize Specific Coding Shaft Services</span>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                {CODING_SHAFT_SERVICES.map((s) => {
                  const active = selectedServices.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleService(s.id)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                        active
                          ? "bg-emerald-500/30 border-emerald-500 text-emerald-200 font-semibold"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300"
                      }`}
                    >
                      {s.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-black font-extrabold text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-black" />
            <span>Queuing Discovery Job...</span>
          </>
        ) : (
          <>
            <Search className="w-4 h-4 text-black" />
            <span>Launch Prospecting Search Job</span>
          </>
        )}
      </button>
    </form>
  );
}
