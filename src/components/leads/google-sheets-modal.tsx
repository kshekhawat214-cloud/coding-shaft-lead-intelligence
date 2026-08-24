"use client";

import { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Copy,
  Check,
  ExternalLink,
  Send,
  Sparkles,
  AlertCircle,
  Code,
  CheckCircle2,
  X,
  Download,
  Phone,
  Globe,
  Trash2,
} from "lucide-react";

interface GoogleSheetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalLeads: number;
  contactableLeadsCount: number;
  noPhoneLeadsCount: number;
}

export function GoogleSheetsModal({
  isOpen,
  onClose,
  totalLeads,
  contactableLeadsCount,
  noPhoneLeadsCount,
}: GoogleSheetsModalProps) {
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedFormulaPhone, setCopiedFormulaPhone] = useState(false);
  const [copiedFormulaAll, setCopiedFormulaAll] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);
  const [showScriptCode, setShowScriptCode] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("cs_gsheet_webhook");
      if (saved) {
        setWebhookUrl(saved);
        setIsSaved(true);
      }
    }
  }, []);

  if (!isOpen) return null;

  const currentHost = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  const importFormulaPhone = `=IMPORTDATA("${currentHost}/api/export/leads.csv?type=contactable")`;
  const importFormulaAll = `=IMPORTDATA("${currentHost}/api/export/leads.csv")`;

  const appsScriptCode = `function doPost(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var data = JSON.parse(e.postData.contents);
  var contactable = data.contactableLeads || [];
  var noPhone = data.noPhoneLeads || [];
  
  // ── Tab 1: 📞 Contact Ready Leads ──────────────────────────────────────
  var sheet1 = ss.getSheetByName("📞 Contact Ready Leads");
  if (!sheet1) {
    sheet1 = ss.insertSheet("📞 Contact Ready Leads", 0);
  }
  
  sheet1.getRange("B:B").setNumberFormat("@");
  
  if (sheet1.getLastRow() === 0) {
    sheet1.appendRow([
      "Business Name", "Phone Number", "1-Click WhatsApp", "City", "Category", 
      "Star Rating", "Reviews", "Famous For (Signature Dish/Service)", "Customer Consensus", 
      "Customer Friction / Gap", "Lead Score", "Priority", "Instant Sales Pitch Angle", 
      "Website", "Google Maps URL", "Discovered Date"
    ]);
    sheet1.getRange(1, 1, 1, 16).setFontWeight("bold").setBackground("#10b981").setFontColor("#000000");
  }
  
  // Build lookup index of existing leads to prevent duplicates
  var existingMap1 = {};
  if (sheet1.getLastRow() > 1) {
    var rows1 = sheet1.getRange(2, 1, sheet1.getLastRow() - 1, 2).getValues();
    for (var k = 0; k < rows1.length; k++) {
      var nameKey = (rows1[k][0] || "").toString().toLowerCase().trim();
      var phoneKey = (rows1[k][1] || "").toString().replace(/[^0-9]/g, "");
      if (nameKey) existingMap1[nameKey] = true;
      if (phoneKey) existingMap1[phoneKey] = true;
    }
  }
  
  var newAdded1 = 0;
  for (var i = 0; i < contactable.length; i++) {
    var l = contactable[i];
    var nKey = (l.name || "").toLowerCase().trim();
    var pKey = (l.phone || "").replace(/[^0-9]/g, "");
    
    // Skip if already in your spreadsheet (preserves your past notes & call logs!)
    if (existingMap1[nKey] || (pKey && existingMap1[pKey])) continue;
    
    var safePhone = l.phone || "";
    var waFormula = l.whatsAppLink ? '=HYPERLINK("' + l.whatsAppLink + '", "💬 Open WhatsApp")' : "No Link";
    sheet1.appendRow([
      l.name, safePhone, waFormula, l.city, l.category,
      l.rating, l.reviewCount, l.famousFor, l.consensus,
      l.customerPainPoints, l.leadScore, l.classification, l.salesPitch,
      l.website, l.mapsUrl, l.discoveredAt
    ]);
    existingMap1[nKey] = true;
    if (pKey) existingMap1[pKey] = true;
    newAdded1++;
  }
  
  // ── Tab 2: 🌐 Web Prospects (No Phone) ─────────────────────────────────
  var sheet2 = ss.getSheetByName("🌐 Web Prospects (No Phone)");
  if (!sheet2) {
    sheet2 = ss.insertSheet("🌐 Web Prospects (No Phone)", 1);
  }
  
  if (sheet2.getLastRow() === 0) {
    sheet2.appendRow([
      "Business Name", "Category", "City", "Website URL", "Star Rating", 
      "Famous For", "Missing Element / Opportunity", "Lead Score", "Sales Pitch", 
      "Google Maps URL", "Discovered Date"
    ]);
    sheet2.getRange(1, 1, 1, 11).setFontWeight("bold").setBackground("#f59e0b").setFontColor("#000000");
  }
  
  var existingMap2 = {};
  if (sheet2.getLastRow() > 1) {
    var rows2 = sheet2.getRange(2, 1, sheet2.getLastRow() - 1, 1).getValues();
    for (var m = 0; m < rows2.length; m++) {
      var n2Key = (rows2[m][0] || "").toString().toLowerCase().trim();
      if (n2Key) existingMap2[n2Key] = true;
    }
  }
  
  var newAdded2 = 0;
  for (var j = 0; j < noPhone.length; j++) {
    var np = noPhone[j];
    var n2 = (np.name || "").toLowerCase().trim();
    if (existingMap2[n2]) continue;
    
    sheet2.appendRow([
      np.name, np.category, np.city, np.website, np.rating,
      np.famousFor, np.identifiedGap, np.leadScore, np.salesPitch,
      np.mapsUrl, np.discoveredAt
    ]);
    existingMap2[n2] = true;
    newAdded2++;
  }
  
  // Auto-enable Google Sheets Filter Bars on Row 1
  try { if (!sheet1.getFilter()) sheet1.getDataRange().createFilter(); } catch(err) {}
  try { if (!sheet2.getFilter()) sheet2.getDataRange().createFilter(); } catch(err) {}
  
  // Clean default empty sheet
  var defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    try { ss.deleteSheet(defaultSheet); } catch(err) {}
  }
  
  return ContentService.createTextOutput(JSON.stringify({ 
    status: "success", 
    newContactableAdded: newAdded1, 
    newNoPhoneAdded: newAdded2 
  })).setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopyFormulaPhone = () => {
    navigator.clipboard.writeText(importFormulaPhone);
    setCopiedFormulaPhone(true);
    setTimeout(() => setCopiedFormulaPhone(false), 2500);
  };

  const handleCopyFormulaAll = () => {
    navigator.clipboard.writeText(importFormulaAll);
    setCopiedFormulaAll(true);
    setTimeout(() => setCopiedFormulaAll(false), 2500);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleSaveWebhook = () => {
    if (webhookUrl.trim()) {
      localStorage.setItem("cs_gsheet_webhook", webhookUrl.trim());
      setIsSaved(true);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem("cs_gsheet_webhook");
    setWebhookUrl("");
    setIsSaved(false);
    setSyncResult(null);
  };

  const handleSyncToWebhook = async () => {
    if (!webhookUrl.trim()) {
      setSyncResult({ success: false, message: "Please enter your Google Apps Script Webhook URL first." });
      return;
    }

    try {
      setSyncing(true);
      setSyncResult(null);
      handleSaveWebhook();

      const res = await fetch("/api/sync/google-sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: webhookUrl.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setSyncResult({
          success: true,
          message: data.data.message || `Successfully synced to your connected Google Sheet!`,
        });
      } else {
        setSyncResult({
          success: false,
          message: data.error?.message || "Failed to sync. Make sure your Apps Script is deployed as Web App.",
        });
      }
    } catch {
      setSyncResult({
        success: false,
        message: "Network error connecting to Google Sheets Webhook.",
      });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-3xl rounded-2xl border border-slate-700 p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto pr-3">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Connect & Sync with Google Sheets
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                  Dual-Sheet Auto Split
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Persistent Sheet Connection: Automatically organizes Phone Leads and Web Prospects into 2 clean tabs
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Split Summary Banner */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-200">Sheet Tab 1: 📞 Contact Ready</div>
              <div className="text-lg font-extrabold text-white">
                {contactableLeadsCount} Leads <span className="text-xs font-normal text-emerald-400">with Phone & 1-Click WhatsApp</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-200">Sheet Tab 2: 🌐 Web Prospects</div>
              <div className="text-lg font-extrabold text-white">
                {noPhoneLeadsCount} Leads <span className="text-xs font-normal text-amber-400">for Web Dev & Maps drop-in</span>
              </div>
            </div>
          </div>
        </div>

        {/* Persistent Webhook Direct Push (Recommended) */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">
                Automatic Dual-Tab Push Sync
              </span>
              {isSaved && (
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  🟢 Connected & Remembered
                </span>
              )}
            </div>
            <button
              onClick={() => setShowScriptCode(!showScriptCode)}
              className="text-[11px] text-amber-400 hover:underline flex items-center gap-1"
            >
              <Code className="w-3 h-3" />
              <span>{showScriptCode ? "Hide Script" : "Show 10-Sec Script"}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Paste your Google Apps Script URL once. Our system will <strong>remember and reuse this same sheet</strong> for every sync and new search until you change it.
          </p>

          <div className="flex items-center gap-2">
            <input
              type="url"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={webhookUrl}
              onChange={(e) => {
                setWebhookUrl(e.target.value);
                setIsSaved(false);
              }}
              className="w-full text-xs px-3 py-2.5 rounded-lg bg-black/60 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
            />
            <button
              onClick={handleSyncToWebhook}
              disabled={syncing}
              className="px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-black text-xs font-bold flex items-center gap-1.5 shrink-0 transition shadow-md shadow-emerald-600/20"
            >
              <Send className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              <span>{syncing ? "Syncing..." : "Sync to Sheet"}</span>
            </button>
            {isSaved && (
              <button
                onClick={handleDisconnect}
                title="Disconnect / Change Sheet"
                className="p-2.5 rounded-lg bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 border border-slate-700 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {syncResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                syncResult.success
                  ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/60"
                  : "bg-rose-950/60 text-rose-300 border border-rose-800/60"
              }`}
            >
              {syncResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{syncResult.message}</span>
            </div>
          )}

          {showScriptCode && (
            <div className="p-3.5 rounded-lg bg-black/80 border border-slate-800 space-y-2 mt-2">
              <div className="flex justify-between items-center text-[11px] text-slate-400">
                <span className="font-semibold text-slate-300">
                  Google Sheet ➔ Extensions ➔ Apps Script ➔ Replace all with this:
                </span>
                <button
                  onClick={handleCopyScript}
                  className="text-emerald-400 hover:underline flex items-center gap-1 font-bold"
                >
                  {copiedScript ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedScript ? "Copied!" : "Copy Script"}
                </button>
              </div>
              <pre className="text-[10px] text-emerald-300 font-mono overflow-x-auto p-2.5 bg-slate-950 rounded border border-slate-900 max-h-48 leading-relaxed">
                {appsScriptCode}
              </pre>
              <p className="text-[10px] text-slate-400">
                💡 <em>Click <strong>Deploy ➔ Manage Deployments ➔ Edit (Version: New) ➔ Deploy</strong> to apply the updated script!</em>
              </p>
            </div>
          )}
        </div>

        {/* Method 2: Live Auto-Sync Formulas */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" /> Alternative: Live Formula Import (`=IMPORTDATA`)
            </span>
            <a
              href="https://sheets.new"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Open New Google Sheet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-[11px] text-emerald-400 font-semibold mb-1">
                <span>📞 Tab 1 Formula (Phone & WhatsApp Leads Only):</span>
                <button onClick={handleCopyFormulaPhone} className="hover:underline flex items-center gap-1">
                  {copiedFormulaPhone ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedFormulaPhone ? "Copied!" : "Copy"}
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={importFormulaPhone}
                className="w-full font-mono text-xs px-3 py-1.5 rounded-lg bg-black/60 border border-slate-700 text-emerald-300 focus:outline-none select-all"
              />
            </div>

            <div>
              <div className="flex justify-between text-[11px] text-slate-400 font-semibold mb-1">
                <span>📁 Tab 2 Formula (All Leads):</span>
                <button onClick={handleCopyFormulaAll} className="hover:underline flex items-center gap-1">
                  {copiedFormulaAll ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedFormulaAll ? "Copied!" : "Copy"}
                </button>
              </div>
              <input
                type="text"
                readOnly
                value={importFormulaAll}
                className="w-full font-mono text-xs px-3 py-1.5 rounded-lg bg-black/60 border border-slate-700 text-slate-400 focus:outline-none select-all"
              />
            </div>
          </div>
        </div>

        {/* Direct CSV Downloads */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800 flex-wrap gap-2">
          <span className="text-xs text-slate-400">Offline CSV Downloads:</span>
          <div className="flex items-center gap-2">
            <a
              href="/api/export/leads.csv?type=contactable"
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 text-xs font-semibold border border-emerald-800/60 transition"
            >
              <Phone className="w-3 h-3 text-emerald-400" />
              <span>Download Contactable Leads ({contactableLeadsCount})</span>
            </a>
            <a
              href="/api/export/leads.csv"
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition"
            >
              <Download className="w-3 h-3" />
              <span>All ({totalLeads})</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
