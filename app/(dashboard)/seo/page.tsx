"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BellRing,
  Check,
  Code2,
  FileCheck2,
  Play,
  RefreshCw,
  Search,
  Sparkles,
  FileSearch,
  Download,
  Building2,
  Target,
  Users,
  Info,
  Trash2,
} from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import {
  seoAuditApi,
  seoErrorMessage,
  type SeoAlert,
  type SeoBrokenLink,
  type SeoCompetitor,
  type SeoCompetitorComparison,
  type SeoOverview,
  type SeoRecommendationResponse,
} from "@/lib/seoAuditApi";
import { SeverityBadge, formatDateTime } from "@/components/seo/SeoBadges";
import SeoPagesTable from "@/components/seo/SeoPagesTable";
import SeoPageDetail from "@/components/seo/SeoPageDetail";
import SeoCheckupFullReport from "@/components/seo/SeoCheckupFullReport";
import { getSavedPageSpeed } from "@/lib/pageSpeedBatch";
import { downloadTextFile } from "@/lib/seoCheckupData";

type Tab =
  | "Overview"
  | "Full report"
  | "Pages"
  | "Why this score"
  | "Broken links"
  | "Search insights"
  | "Alerts"
  | "Competitors"
  | "AI plan";

const TABS: Tab[] = [
  "Overview",
  "Full report",
  "Pages",
  "Why this score",
  "Broken links",
  "Search insights",
  "Alerts",
  "Competitors",
  "AI plan",
];

const AUDIT_POLL_MS = 4000;

function Panel({
  title,
  children,
  note,
}: {
  title: string;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
      <div className="border-b border-slate-100 pb-2.5">
        <h3 className="text-sm font-bold text-slate-900">{title}</h3>
        {note && <p className="mt-0.5 text-xs text-slate-500">{note}</p>}
      </div>
      {children}
    </div>
  );
}

function ScoreRing({ value, color, textClass }: { value: number | null; color: string; textClass: string }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  return (
    <div className="relative my-3 flex items-center justify-center">
      <svg className="w-32 h-32 transform -rotate-90">
        <circle cx="64" cy="64" r={radius} stroke="#e2e8f0" strokeWidth="10" fill="transparent" />
        <circle
          cx="64"
          cy="64"
          r={radius}
          stroke={color}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - (value ?? 0) / 100)}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-extrabold tracking-tight ${textClass}`}>{value ?? "—"}</span>
        <span className="text-[11px] font-bold text-slate-400">/ 100</span>
      </div>
    </div>
  );
}

const csvCell = (value: unknown) => {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export default function SeoDashboardPage() {
  const [overview, setOverview] = useState<SeoOverview | null>(null);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [brokenLinks, setBrokenLinks] = useState<SeoBrokenLink[]>([]);
  const [alerts, setAlerts] = useState<SeoAlert[]>([]);
  const [competitors, setCompetitors] = useState<SeoCompetitor[]>([]);
  const [comparison, setComparison] = useState<SeoCompetitorComparison | null>(null);
  const [tab, setTab] = useState<Tab>("Overview");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [aiPlan, setAiPlan] = useState<SeoRecommendationResponse | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Business Context State
  const [businessAbout, setBusinessAbout] = useState(
    "A manufacturer of handcrafted Panchkarma, Ayurvedic and spa equipment that also delivers turnkey wellness clinics, spas and consultancy."
  );
  const [industryNiche, setIndustryNiche] = useState("Ayurvedic, Panchkarma & spa equipment and turnkey wellness setups");
  const [targetAudience, setTargetAudience] = useState(
    "Vaidyas, Ayurvedic doctors, clinic and hospital owners, wellness resorts, hotels and spa operators."
  );
  const [isEditingContext, setIsEditingContext] = useState(false);

  // Competitor input state
  const [newCompetitorUrl, setNewCompetitorUrl] = useState("");
  const [newCompetitorLabel, setNewCompetitorLabel] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, linksData, alertData, competitorData, comparisonData] = await Promise.all([
        seoAuditApi.overview(),
        seoAuditApi.brokenLinks(),
        seoAuditApi.alerts(),
        seoAuditApi.competitors(),
        seoAuditApi.competitorComparison(),
      ]);
      setOverview(overviewData);
      setBrokenLinks(linksData.links);
      setAlerts(alertData);
      setCompetitors(competitorData);
      setComparison(comparisonData);
    } catch (caught) {
      setError(seoErrorMessage(caught, "Could not load the SEO dashboard"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- shows the loading state while a new request runs
    void load();
  }, [load]);

  // While an audit runs, poll its progress; reload everything once it finishes
  const runningId = overview?.running?.id ?? null;
  useEffect(() => {
    if (!runningId) return;
    const timer = setInterval(() => {
      seoAuditApi
        .overview()
        .then((next) => {
          if (next.running) setOverview(next);
          else void load();
        })
        .catch((caught) => setError(seoErrorMessage(caught, "Could not check the audit progress")));
    }, AUDIT_POLL_MS);
    return () => clearInterval(timer);
  }, [runningId, load]);

  const runAudit = async () => {
    setBusy(true);
    setError(null);
    try {
      const started = await seoAuditApi.startAudit();
      setOverview(await seoAuditApi.overview().catch(() => overview));
      setOverview((current) =>
        current && !current.running
          ? { ...current, running: { id: started.crawlId, status: "running", startedAt: null, progress: { done: 0, total: 0 } } }
          : current,
      );
    } catch (caught) {
      setError(seoErrorMessage(caught, "Could not start the audit"));
    } finally {
      setBusy(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await seoAuditApi.pages({ page: 1, limit: 100, sortBy: "url", sortDir: "asc" });
      const header = ["Path", "URL", "HTTP status", "SEO score", "Critical", "Warnings", "Notices", "Title", "Title length", "Meta description length", "Words", "Response ms"];
      const lines = response.pages.map((page) =>
        [
          page.path,
          page.url,
          page.httpStatus,
          page.score,
          page.issueCounts.critical,
          page.issueCounts.warning,
          page.issueCounts.notice,
          page.title,
          page.titleLength,
          page.metaDescriptionLength,
          page.wordCount,
          page.responseTimeMs,
        ].map(csvCell).join(","),
      );
      downloadTextFile("Ensis_SEO_Audit_Pages.csv", [header.join(","), ...lines].join("\n"), "text/csv;charset=utf-8");
    } catch (caught) {
      setError(seoErrorMessage(caught, "Could not export the audit"));
    }
  };

  const handleExportJSON = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(overview || {}, null, 2));
    const link = document.createElement("a");
    link.setAttribute("href", dataStr);
    link.setAttribute("download", "Ensis_SEO_Overview.json");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddCompetitor = async () => {
    if (!newCompetitorUrl) return;
    try {
      await seoAuditApi.addCompetitor({
        url: newCompetitorUrl,
        label: newCompetitorLabel || newCompetitorUrl,
      });
      setNewCompetitorUrl("");
      setNewCompetitorLabel("");
      void load();
    } catch (caught) {
      setError(seoErrorMessage(caught, "Failed to add competitor"));
    }
  };

  const handleAuditCompetitor = async (competitor: SeoCompetitor) => {
    try {
      await seoAuditApi.auditCompetitor(competitor.id);
      setNotice(`Audit of ${competitor.label} started. It checks up to 10 pages; press Refresh in a minute to see the result.`);
    } catch (caught) {
      setError(seoErrorMessage(caught, "Could not start the competitor audit"));
    }
  };

  const handleDeleteCompetitor = async (competitor: SeoCompetitor) => {
    if (!window.confirm(`Remove ${competitor.label} and its audit results?`)) return;
    try {
      await seoAuditApi.deleteCompetitor(competitor.id);
      void load();
    } catch (caught) {
      setError(seoErrorMessage(caught, "Could not remove the competitor"));
    }
  };

  const handleAcknowledge = async (alert: SeoAlert) => {
    try {
      await seoAuditApi.acknowledgeAlert(alert.id);
      setAlerts((current) => current.filter((item) => item.id !== alert.id));
    } catch (caught) {
      setError(seoErrorMessage(caught, "Could not acknowledge the alert"));
    }
  };

  const generatePlan = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      setAiPlan(await seoAuditApi.generateSiteRecommendation());
    } catch (caught) {
      setAiError(seoErrorMessage(caught, "Could not generate the AI plan"));
    } finally {
      setAiLoading(false);
    }
  };

  if (loading && !overview) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-500">
        <Spinner />
      </div>
    );
  }

  const siteUrl = overview?.siteUrl ?? "https://ensis.in";
  const audit = overview?.audit ?? null;
  const counts = overview?.counts ?? null;
  const running = overview?.running ?? null;
  const hasData = Boolean(overview?.hasData && audit);
  const healthyShare =
    counts && counts.urlsCrawled ? Math.round((counts.healthyPages / counts.urlsCrawled) * 100) : null;
  const passedPages = counts ? counts.healthyPages : 0;

  const emptyState = (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-xs">
      <FileSearch className="mx-auto h-8 w-8 text-blue-600" />
      <h3 className="mt-2 text-sm font-bold text-slate-900">
        {running ? "The first SEO audit is running" : "No SEO audit yet"}
      </h3>
      <p className="mx-auto mt-1 max-w-md text-xs text-slate-600">
        {running
          ? "Results appear here automatically when the crawl finishes."
          : `Run an audit to crawl ${siteUrl} and measure titles, descriptions, headings, canonicals, content and response times on every page.`}
      </p>
      {!running && (
        <button
          type="button"
          onClick={() => void runAudit()}
          disabled={busy}
          className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-700 px-4 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
        >
          <Play className="h-3.5 w-3.5" /> {busy ? "Starting..." : "Run first audit"}
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-100px)] w-full bg-[#f8fafc] text-slate-900 p-4 lg:p-6 space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4 bg-white p-4 lg:p-5 rounded-xl shadow-xs">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-blue-600">
            <Activity className="h-4 w-4 text-blue-600" /> Ensis SEO Intelligence
          </div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Site Health Command Center
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-600">
            <span>Website: <a href={siteUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-mono underline font-semibold">{siteUrl}</a></span>
            <span>·</span>
            <span>Last audit: <strong className="text-slate-900">{audit?.completedAt ? formatDateTime(audit.completedAt) : "never"}</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("Full report")}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <FileCheck2 className="h-3.5 w-3.5 text-emerald-600" /> Full report
          </button>

          <Link
            href="/auditpage"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
          >
            <Search className="h-3.5 w-3.5 text-blue-600" /> Audited Pages
          </Link>

          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>

          <button
            type="button"
            onClick={() => void handleExportCSV()}
            disabled={!hasData}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5 text-slate-600" /> Export CSV
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
          >
            <Download className="h-3.5 w-3.5 text-slate-600" /> Export PDF
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            disabled={!hasData}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Code2 className="h-3.5 w-3.5 text-slate-600" /> Export JSON
          </button>

          <button
            type="button"
            onClick={() => void runAudit()}
            disabled={busy || Boolean(running)}
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-700 px-4 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
          >
            <Play className="h-3.5 w-3.5" /> {running ? "Auditing..." : busy ? "Starting..." : "Run Audit"}
          </button>
        </div>
      </div>

      {running && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-800 space-y-2">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
            {running.progress.total
              ? `Audit running — ${running.progress.done} of ${running.progress.total} pages checked`
              : "Audit running — discovering pages from the CMS, sitemap and site routes..."}
            {running.startedAt && <span className="font-normal text-blue-700">· started {formatDateTime(running.startedAt)}</span>}
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-100">
            <div
              className="h-full rounded-full bg-blue-600 transition-all duration-500"
              style={{
                width: `${running.progress.total ? Math.round((running.progress.done / running.progress.total) * 100) : 3}%`,
              }}
            />
          </div>
        </div>
      )}

      {overview?.lastFailure && !running && (
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          The last audit failed{overview.lastFailure.completedAt ? ` (${formatDateTime(overview.lastFailure.completedAt)})` : ""}: {overview.lastFailure.error}
          {hasData ? " — showing the previous successful audit." : ""}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {notice && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
          <span className="flex items-center gap-2"><Check className="h-4 w-4 shrink-0" />{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="text-emerald-700 hover:underline cursor-pointer">Dismiss</button>
        </div>
      )}

      {/* 2. Main Navigation Tabs */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xs [scrollbar-width:thin]">
        {TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`whitespace-nowrap rounded-md px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${tab === item
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
          >
            {item}
            {item === "Alerts" && alerts.length > 0 ? ` (${alerts.length})` : ""}
          </button>
        ))}
      </div>

      {tab === "Overview" && !hasData && emptyState}

      {tab === "Overview" && hasData && audit && counts && (
        <div className="space-y-6">
          {/* 3. Domain Level Overall Score Card */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            {/* Site audit score ring */}
            <div className="md:col-span-4 flex flex-col items-center text-center justify-between border-r border-slate-100 pr-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Site SEO Audit Score
              </span>
              <ScoreRing value={audit.score} color="#16a34a" textClass="text-slate-900" />
              <p className="text-xs text-slate-600 font-medium">
                Average page score across {audit.stats.pages} crawled pages
                {overview?.previousScore != null && audit.score != null
                  ? ` (${audit.score - overview.previousScore >= 0 ? "+" : ""}${audit.score - overview.previousScore} vs previous audit)`
                  : ""}
              </p>
            </div>

            {/* Healthy pages ring */}
            <div className="md:col-span-4 flex flex-col items-center text-center justify-between border-r border-slate-100 pr-4">
              <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-blue-600">
                <Sparkles className="h-4 w-4" /> Pages Without Critical Issues
              </div>
              <ScoreRing value={healthyShare} color="#2563eb" textClass="text-blue-900" />
              <p className="text-xs text-slate-600 font-medium">
                {counts.healthyPages} of {counts.urlsCrawled} pages have no critical issue
                {counts.errorPages ? ` · ${counts.errorPages} failed to load` : ""}.
              </p>
            </div>

            {/* Overall Telemetry & Issues Summary */}
            <div className="md:col-span-4 flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Crawl Summary</h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  Your site scored <strong className="text-slate-900">{audit.score ?? "—"}/100</strong>. We found <strong className="text-red-600 font-bold">{audit.stats.critical} critical issues</strong>, <strong className="text-amber-600 font-bold">{audit.stats.warning} warnings</strong> and {audit.stats.notice} notices across {audit.stats.pages} crawled pages.
                  {" "}robots.txt {audit.robotsFound ? "found" : "not found"} · sitemap {audit.sitemapFound ? `found (${audit.sitemapUrlCount} URLs)` : "not found"}
                  {audit.durationMs != null ? ` · took ${Math.round(audit.durationMs / 1000)}s` : ""}.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-100">
                <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                  <span className="block text-lg font-extrabold text-red-600">{audit.stats.critical}</span>
                  <span className="text-[10px] font-bold uppercase text-red-700">Critical</span>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                  <span className="block text-lg font-extrabold text-amber-600">{audit.stats.warning}</span>
                  <span className="text-[10px] font-bold uppercase text-amber-700">Warnings</span>
                </div>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                  <span className="block text-lg font-extrabold text-emerald-600">{passedPages}</span>
                  <span className="text-[10px] font-bold uppercase text-emerald-700">Healthy pages</span>
                </div>
              </div>
            </div>
          </div>

          {/* 4. Score Breakdown by Categories */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Category Audit Score Breakdown</span>
              <span className="text-xs text-slate-500 font-normal">From the audit of {formatDateTime(audit.completedAt)}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {(overview?.scoreExplanation?.categories ?? []).map((cat) => {
                const bySeverity = (severity: string) =>
                  cat.contributions.filter((item) => item.severity === severity).reduce((sum, item) => sum + item.count, 0);
                return (
                  <div key={cat.category} className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900">{cat.category}</span>
                      {cat.score != null && (
                        <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {cat.score}/100
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-medium text-slate-600">
                      <span className="text-red-600 font-bold">{bySeverity("critical")} Critical</span> ·
                      <span className="text-amber-600 font-bold">{bySeverity("warning")} Warnings</span> ·
                      <span className="text-slate-600 font-bold">{bySeverity("notice")} Notices</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full"
                        style={{ width: `${cat.score ?? 0}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Domain Business Context */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="h-4.5 w-4.5 text-blue-600" />
                Domain Business Context
              </h3>
              <button
                type="button"
                onClick={() => setIsEditingContext(!isEditingContext)}
                className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
              >
                {isEditingContext ? "Save Changes" : "Edit Context"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block flex items-center gap-1">
                  <Info className="h-3.5 w-3.5 text-blue-600" /> What is this domain about
                </span>
                {isEditingContext ? (
                  <textarea
                    value={businessAbout}
                    onChange={(e) => setBusinessAbout(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                    rows={3}
                  />
                ) : (
                  <p className="text-slate-600">{businessAbout}</p>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block flex items-center gap-1">
                  <Target className="h-3.5 w-3.5 text-blue-600" /> Industry Niche
                </span>
                {isEditingContext ? (
                  <input
                    type="text"
                    value={industryNiche}
                    onChange={(e) => setIndustryNiche(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                  />
                ) : (
                  <p className="text-slate-600 font-semibold">{industryNiche}</p>
                )}
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
                <span className="font-bold text-slate-900 block flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-blue-600" /> Target Audience
                </span>
                {isEditingContext ? (
                  <textarea
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded text-xs"
                    rows={3}
                  />
                ) : (
                  <p className="text-slate-600">{targetAudience}</p>
                )}
              </div>
            </div>
          </div>

          {/* 6. Top issues from the audit */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="h-4.5 w-4.5 text-amber-600" />
                Top Issues
              </h3>
              <span className="text-xs bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1 rounded-full font-bold">
                {overview?.topIssues.length ?? 0} issue types
              </span>
            </div>

            {(overview?.topIssues ?? []).length === 0 ? (
              <p className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                <Check className="h-4 w-4" /> The audit found no issues.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="p-2.5 font-bold">Category</th>
                      <th className="p-2.5 font-bold">Issue</th>
                      <th className="p-2.5 font-bold">Severity</th>
                      <th className="p-2.5 font-bold">Affected pages</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {(overview?.topIssues ?? []).map((issue) => (
                      <tr key={issue.ruleId}>
                        <td className="p-2.5 font-semibold text-slate-900">{issue.category}</td>
                        <td className="p-2.5 font-semibold text-slate-900">{issue.title}</td>
                        <td className="p-2.5"><SeverityBadge severity={issue.severity} /></td>
                        <td className="p-2.5 text-slate-600">{issue.affectedPages}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* 7. Content Strengths & Weaknesses */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
              <span>Content Strengths & Weaknesses</span>
              <span className="text-xs text-slate-500 font-normal">Share of pages that loaded successfully</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[
                {
                  value: counts.share700Words,
                  label: "Pages with 700+ words",
                  box: "bg-emerald-50 border-emerald-200",
                  text: "text-emerald-700",
                  sub: "text-emerald-800",
                },
                {
                  value: counts.shareScore90,
                  label: "Pages scoring 90+",
                  box: "bg-blue-50 border-blue-200",
                  text: "text-blue-700",
                  sub: "text-blue-800",
                },
                {
                  value: counts.shareImagesWithAlt,
                  label: "Pages with all image alts",
                  box: "bg-indigo-50 border-indigo-200",
                  text: "text-indigo-700",
                  sub: "text-indigo-800",
                },
                {
                  value: counts.shareMetaOk,
                  label: "Pages without meta issues",
                  box: "bg-amber-50 border-amber-200",
                  text: "text-amber-700",
                  sub: "text-amber-800",
                },
              ].map((card) => (
                <div key={card.label} className={`p-3 border rounded-lg ${card.box}`}>
                  <span className={`block text-xl font-extrabold ${card.text}`}>{card.value == null ? "—" : `${card.value}%`}</span>
                  <span className={`text-[10px] font-bold uppercase ${card.sub}`}>{card.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === "Full report" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                Full Site SEO Site Checkup Report
              </h2>
              <p className="text-xs text-slate-500">
                Checklist template for {siteUrl}, grouped by audit category with remediation steps. Its numbers come from a
                bundled route snapshot plus live PageSpeed; measured crawl results are in <strong>Overview</strong> and <strong>Pages</strong>.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setTab("Pages")}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
              >
                <FileSearch className="h-3.5 w-3.5 text-blue-600" /> Page-by-page report
              </button>
              <button
                type="button"
                onClick={() => void runAudit()}
                disabled={busy || Boolean(running)}
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-md bg-blue-600 px-4 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-700 disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" /> {running ? "Auditing..." : "Re-run Site Audit"}
              </button>
            </div>
          </div>

          <SeoCheckupFullReport
            scope="site"
            route="home"
            pagespeed={getSavedPageSpeed(siteUrl)}
            onReAudit={() => void runAudit()}
            onExportPdf={() => window.print()}
          />
        </div>
      )}

      {tab === "Pages" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <SeoPagesTable
              onSelectPage={setSelectedPageId}
              selectedPageId={selectedPageId}
              onAuditStarted={() => void load()}
            />
          </div>
          {selectedPageId && (
            <SeoPageDetail
              pageId={selectedPageId}
              onClose={() => setSelectedPageId(null)}
            />
          )}
        </div>
      )}

      {tab === "Why this score" && !hasData && emptyState}

      {tab === "Why this score" && hasData && overview?.scoreExplanation && (
        <div className="space-y-4">
          <Panel title="How the score is calculated" note={overview.scoreExplanation.formula.description}>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-slate-100 px-2.5 py-1 text-slate-700 font-mono">critical −{overview.scoreExplanation.formula.severityPenalty.critical}</span>
              <span className="rounded bg-slate-100 px-2.5 py-1 text-slate-700 font-mono">warning −{overview.scoreExplanation.formula.severityPenalty.warning}</span>
              <span className="rounded bg-slate-100 px-2.5 py-1 text-slate-700 font-mono">notice −{overview.scoreExplanation.formula.severityPenalty.notice}</span>
              <span className="rounded bg-slate-100 px-2.5 py-1 text-slate-700 font-mono">{overview.scoreExplanation.formula.pagesConsidered} pages considered</span>
            </div>
          </Panel>

          {overview.scoreExplanation.categories.map((cat) => (
            <Panel
              key={cat.category}
              title={`${cat.category}: ${cat.score ?? "—"}/100`}
              note={`${cat.issueCount} issue(s), ${cat.rawPenalty} penalty points across all pages`}
            >
              {cat.contributions.length === 0 ? (
                <p className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
                  <Check className="h-4 w-4" /> No issues in this category.
                </p>
              ) : (
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="p-2 font-bold">Rule</th>
                      <th className="p-2 font-bold">Severity</th>
                      <th className="p-2 font-bold">Occurrences</th>
                      <th className="p-2 font-bold">Penalty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cat.contributions.map((item) => (
                      <tr key={item.ruleId}>
                        <td className="p-2 font-semibold text-slate-900">
                          {item.title} <span className="font-mono text-[10px] text-slate-400">{item.ruleId}</span>
                        </td>
                        <td className="p-2"><SeverityBadge severity={item.severity} /></td>
                        <td className="p-2 font-mono">{item.count}</td>
                        <td className="p-2 font-mono">−{item.penalty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>
          ))}

          {(overview.history ?? []).length > 1 && (
            <Panel title="Score history" note="Completed site audits, oldest first">
              <div className="flex flex-wrap gap-2 text-xs">
                {overview.history.map((item) => (
                  <span key={item.id} className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-700">
                    {formatDateTime(item.completedAt)} · <strong>{item.score ?? "—"}</strong>
                  </span>
                ))}
              </div>
            </Panel>
          )}
        </div>
      )}

      {tab === "Broken links" && !hasData && emptyState}

      {tab === "Broken links" && hasData && (
        <Panel
          title={`Broken pages (${brokenLinks.length})`}
          note="Audited URLs that returned 4xx/5xx or could not be fetched. The crawler checks known pages; it does not follow every link."
        >
          {brokenLinks.length === 0 ? (
            <p className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
              <Check className="h-4 w-4" /> Every audited URL loaded successfully.
            </p>
          ) : (
            brokenLinks.map((link) => (
              <div key={link.url} className="border-b border-slate-100 py-2.5 last:border-0 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-700">
                    {link.httpStatus ?? link.statusClass}
                  </span>
                  <a href={link.url} target="_blank" rel="noreferrer" className="font-mono text-slate-900 hover:underline">{link.url}</a>
                  <span className="text-slate-500">{link.isInternal ? "internal" : "external"}</span>
                  {link.error && <span className="text-red-600">{link.error}</span>}
                </div>
              </div>
            ))
          )}
        </Panel>
      )}

      {tab === "Search insights" && (
        <Panel title="Google Search Console Insights">
          <p className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <Info className="h-4 w-4 text-blue-600" />
            Google Search Console is not connected, so no clicks, impressions, CTR or ranking data is available.
          </p>
        </Panel>
      )}

      {tab === "Alerts" && (
        <Panel title="SEO Alerts" note="Raised by site audits for critical issues and score drops of 10+ points.">
          {alerts.length === 0 ? (
            <p className="flex items-center gap-2 text-xs font-semibold text-emerald-600">
              <BellRing className="h-4 w-4" />
              {hasData ? "No open alerts." : "No alerts yet — alerts are raised when an audit runs."}
            </p>
          ) : (
            alerts.map((alert) => (
              <div key={alert.id} className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 py-2.5 last:border-0 text-xs">
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <SeverityBadge severity={alert.severity} />
                    <span className="font-bold text-slate-900">{alert.title}</span>
                  </div>
                  {alert.message && <p className="text-slate-600">{alert.message}</p>}
                  <p className="text-[11px] text-slate-400">
                    {alert.url ? `${alert.url} · ` : ""}last seen {formatDateTime(alert.updatedAt ?? alert.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleAcknowledge(alert)}
                  className="shrink-0 rounded border border-slate-300 bg-white px-2.5 py-1 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Acknowledge
                </button>
              </div>
            ))
          )}
        </Panel>
      )}

      {tab === "Competitors" && (
        <Panel title="Competitor Analysis & Domain Benchmarking" note="Each competitor audit checks up to 10 pages with the same rules as the Ensis audit.">
          <div className="space-y-4 text-xs">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Competitor Label"
                value={newCompetitorLabel}
                onChange={(e) => setNewCompetitorLabel(e.target.value)}
                className="p-2 border border-slate-300 rounded text-xs w-48"
              />
              <input
                type="text"
                placeholder="Competitor Domain URL"
                value={newCompetitorUrl}
                onChange={(e) => setNewCompetitorUrl(e.target.value)}
                className="p-2 border border-slate-300 rounded text-xs flex-1 max-w-sm"
              />
              <button
                type="button"
                onClick={() => void handleAddCompetitor()}
                className="px-3 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 cursor-pointer"
              >
                Add Competitor
              </button>
            </div>

            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="p-2 font-bold">Domain</th>
                  <th className="p-2 font-bold">SEO Score</th>
                  <th className="p-2 font-bold">Pages Crawled</th>
                  <th className="p-2 font-bold">Avg Words</th>
                  <th className="p-2 font-bold">Critical / Warnings</th>
                  <th className="p-2 font-bold">Last Audit</th>
                  <th className="p-2 font-bold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="p-2 font-bold text-blue-600">{comparison?.primary.url ?? siteUrl} (Primary)</td>
                  <td className="p-2 font-bold text-emerald-600">{comparison?.primary.observed.score ?? "—"} / 100</td>
                  <td className="p-2 font-mono">{comparison?.primary.observed.pagesCrawled ?? "—"}</td>
                  <td className="p-2 font-mono">{comparison?.primary.observed.averageWordCount ?? "—"}</td>
                  <td className="p-2 font-mono">
                    {comparison?.primary.observed.criticalIssues ?? "—"} / {comparison?.primary.observed.warnings ?? "—"}
                  </td>
                  <td className="p-2">{audit?.completedAt ? formatDateTime(audit.completedAt) : "never"}</td>
                  <td className="p-2" />
                </tr>
                {competitors.map((competitor) => {
                  const observed = comparison?.competitors.find((row) => row.siteId === competitor.id)?.observed;
                  return (
                    <tr key={competitor.id}>
                      <td className="p-2">
                        <span className="font-bold text-slate-900">{competitor.label}</span>
                        <span className="block font-mono text-[10px] text-slate-500">{competitor.url}</span>
                      </td>
                      <td className="p-2 font-bold text-slate-700">{observed?.score ?? competitor.lastScore ?? "—"} / 100</td>
                      <td className="p-2 font-mono">{observed?.pagesCrawled ?? "—"}</td>
                      <td className="p-2 font-mono">{observed?.averageWordCount ?? "—"}</td>
                      <td className="p-2 font-mono">{observed?.criticalIssues ?? "—"} / {observed?.warnings ?? "—"}</td>
                      <td className="p-2">{competitor.lastCrawlAt ? formatDateTime(competitor.lastCrawlAt) : "not audited"}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => void handleAuditCompetitor(competitor)}
                            className="rounded border border-slate-300 bg-white px-2 py-1 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                          >
                            Audit
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove ${competitor.label}`}
                            onClick={() => void handleDeleteCompetitor(competitor)}
                            className="rounded border border-red-200 bg-white p-1 text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {competitors.length === 0 && <p className="text-slate-500">No competitors added yet.</p>}
          </div>
        </Panel>
      )}

      {tab === "AI plan" && (
        <Panel title="AI SEO Strategic Execution Plan" note="Generated by OpenAI from the latest site audit results.">
          <div className="space-y-3 text-xs">
            <button
              type="button"
              onClick={() => void generatePlan()}
              disabled={aiLoading || !hasData}
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-700 px-4 text-xs font-semibold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {aiLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {aiLoading ? "Generating..." : aiPlan?.recommendation ? "Regenerate plan" : "Generate AI plan"}
            </button>
            {!hasData && <p className="text-slate-500">Run a site audit first; the plan is generated from its results.</p>}

            {aiError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {aiError}
              </div>
            )}

            {aiPlan?.status === "no_data" && <p className="font-semibold text-amber-700">{aiPlan.message}</p>}

            {aiPlan?.recommendation && (
              <div className="space-y-3">
                {aiPlan.recommendation.summary && (
                  <p className="rounded-lg border border-blue-100 bg-blue-50 p-3 leading-relaxed text-slate-700">
                    {aiPlan.recommendation.summary}
                  </p>
                )}
                {(aiPlan.recommendation.positiveSignals ?? []).length > 0 && (
                  <ul className="list-disc space-y-0.5 pl-5 text-emerald-700">
                    {(aiPlan.recommendation.positiveSignals ?? []).map((signal) => (
                      <li key={signal}>{signal}</li>
                    ))}
                  </ul>
                )}
                {aiPlan.recommendation.items.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900">{index + 1}. {item.title}</span>
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase ${item.priority === "high"
                            ? "bg-red-100 text-red-700"
                            : item.priority === "medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-slate-200 text-slate-700"
                          }`}
                      >
                        {item.priority}
                      </span>
                      {item.category && <span className="text-[10px] font-semibold text-slate-500">{item.category}</span>}
                    </div>
                    {item.whyItMatters && <p className="text-slate-600">{item.whyItMatters}</p>}
                    {item.recommendedFix && <p className="text-slate-800"><strong>Fix:</strong> {item.recommendedFix}</p>}
                    {item.implementation && <p className="text-slate-600"><strong>How:</strong> {item.implementation}</p>}
                  </div>
                ))}
                <p className="text-[11px] text-slate-400">
                  {aiPlan.recommendation.model} · generated {formatDateTime(aiPlan.recommendation.generatedAt)}
                </p>
              </div>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
