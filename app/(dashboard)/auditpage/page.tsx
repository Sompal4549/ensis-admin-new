"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileSearch,
  Link2,
  Sparkles,
  KeyRound,
  History,
  Activity,
  Info,
  Loader2,
} from "lucide-react";
import { seoAuditApi, type PageSpeedAudit } from "@/lib/seoAuditApi";
import { getSavedPageSpeed, savePageSpeed, getSavedPageSpeedMap } from "@/lib/pageSpeedBatch";
import { PAGE_INVENTORY } from "@/lib/seoCheckupData";
import SeoSiteCheckupReport from "@/components/seo/SeoSiteCheckupReport";
import SeoActivityLogWidget from "@/components/seo/SeoActivityLogWidget";

/**
 * Same Audited Pages suite as the Organic admin. Ensis keeps its existing backend, so:
 *  - tab 1 (page audit, Mobile/Desktop, cached PageSpeed) and tab 5 (activity logs) are fully live;
 *  - tabs 2-4 (backlinks, AI content guard, keyword planner) have no Ensis endpoints yet, so they explain that instead.
 */

type Tab = "audit" | "backlinks" | "ai_content" | "keyword_planner" | "activity_log";

interface RouteOption {
  id: string;
  label: string;
  path: string;
}

// Routes come from the site's page inventory (Ensis has no live-sitemap endpoint for the picker)
const ALL_SITE_PAGES: RouteOption[] = PAGE_INVENTORY.map((page) => ({ id: page.id, label: page.label, path: page.path }));

const routeUrl = (p: RouteOption) => (p.id === "home" ? "https://ensis.in" : `https://ensis.in${p.path}`);

const TABS: { key: Tab; label: string; icon: typeof Activity }[] = [
  { key: "audit", label: "1. Page SEO Audit", icon: Activity },
  { key: "backlinks", label: "2. Backlinks & Excel Tracker", icon: Link2 },
  { key: "ai_content", label: "3. AI Content & Copy Guard", icon: Sparkles },
  { key: "keyword_planner", label: "4. Keyword Planner (Google & AI)", icon: KeyRound },
  { key: "activity_log", label: "5. SEO Activity Logs", icon: History },
];

const UNAVAILABLE: Partial<Record<Tab, { title: string; text: string }>> = {
  backlinks: {
    title: "Backlinks & Excel Tracker",
    text: "Tracking backlinks and importing them from Excel needs server support that the Ensis backend does not have yet.",
  },
  ai_content: {
    title: "AI Content & Copy Guard",
    text: "The AI content and copy-paste originality scan needs server support that the Ensis backend does not have yet.",
  },
  keyword_planner: {
    title: "Keyword Planner (Google & AI)",
    text: "The Google and AI keyword planner needs server support that the Ensis backend does not have yet.",
  },
};

export default function SeoAuditedPagesPage() {
  const [activeTab, setActiveTab] = useState<Tab>("audit");
  const [selectedPageId, setSelectedPageId] = useState<string>("home");
  const [strategy, setStrategy] = useState<"mobile" | "desktop">("mobile");
  const [speed, setSpeed] = useState<{ pageId: string; strategy: "mobile" | "desktop"; data: PageSpeedAudit | null } | null>(null);
  const [reAuditing, setReAuditing] = useState(false);
  const [liveFetching, setLiveFetching] = useState(false);
  const prefetchStarted = useRef(false);

  // PageSpeed for the selected route & strategy. A cached run (localStorage, 6h TTL) is
  // shown instantly — the live refresh keeps running in the background and only
  // replaces the numbers when it lands. Route switching never blanks the page.
  useEffect(() => {
    const pageObj = ALL_SITE_PAGES.find((p) => p.id === selectedPageId) || ALL_SITE_PAGES[0];
    if (!pageObj) return;
    const targetUrl = routeUrl(pageObj);
    const cacheKey = `${targetUrl}:${strategy}`;

    const cached = getSavedPageSpeed(cacheKey) || getSavedPageSpeed(targetUrl);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- shows the cached run immediately, the live one replaces it
    if (cached) setSpeed({ pageId: pageObj.id, strategy, data: cached });
    else setSpeed(null);

    let cancelled = false;
    setLiveFetching(true);
    seoAuditApi
      .pagespeed(targetUrl, strategy, false)
      .then((data) => {
        if (cancelled) return;
        setSpeed({ pageId: pageObj.id, strategy, data });
        if (data?.ok) {
          savePageSpeed(cacheKey, data);
          if (strategy === "mobile") savePageSpeed(targetUrl, data);
        }
      })
      .catch(() => {
        if (!cancelled) setSpeed({ pageId: pageObj.id, strategy, data: cached ?? null });
      })
      .finally(() => {
        if (!cancelled) setLiveFetching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedPageId, strategy]);

  // Warm PageSpeed for every route in the background (once), so switching
  // routes later is instant instead of waiting on a fresh Lighthouse pass.
  // Starts after a short delay so it never competes with the first route load.
  useEffect(() => {
    if (prefetchStarted.current || ALL_SITE_PAGES.length < 2) return;
    prefetchStarted.current = true;
    const saved = getSavedPageSpeedMap();
    const pending = ALL_SITE_PAGES.filter((r) => !saved.has(routeUrl(r)));
    if (pending.length === 0) return;

    let stopped = false;
    const timer = setTimeout(() => {
      void (async () => {
        for (const r of pending) {
          if (stopped) return;
          try {
            const audit = await seoAuditApi.pagespeed(routeUrl(r), "mobile", false);
            if (!stopped && audit?.ok) savePageSpeed(routeUrl(r), audit);
          } catch {
            // skip this route — it will be fetched on demand when selected
          }
        }
      })();
    }, 2500);

    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, []);

  const selectedPageObj = ALL_SITE_PAGES.find((p) => p.id === selectedPageId) || ALL_SITE_PAGES[0];
  const pageSpeed = speed?.pageId === selectedPageObj.id && speed.strategy === strategy ? speed.data : null;
  const updating = liveFetching || reAuditing;
  const unavailable = UNAVAILABLE[activeTab];

  return (
    <div className="min-h-screen bg-slate-100 p-4 lg:p-6 space-y-6 text-slate-900">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#23471d] pb-4 bg-white p-4 rounded-xl shadow-xs">
        <div>
          <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-600">
            <FileSearch className="h-4 w-4" /> Ensis SEO Command Intelligence
          </div>
          <h1 className="text-xl font-extrabold text-[#23471d]">Deep Page Audit & SEO Matrix Suite</h1>
          <p className="text-xs font-medium text-slate-500 mt-0.5">
            Complete suite: Page-by-Page Audit, Backlinks Excel Tracker, AI Content Originality Guard, Dual-Mode Keyword Planner, and Audit Trail.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/seo"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition"
          >
            <ArrowLeft className="h-4 w-4 text-emerald-600" /> Command Center
          </Link>
        </div>
      </div>

      {/* Main Suite Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:thin] bg-white p-2 rounded-xl border border-slate-200 shadow-xs">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-xs font-black transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                activeTab === tab.key ? "bg-[#23471d] text-white shadow-xs" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <Icon className="h-4 w-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab 1: Page SEO Audit */}
      {activeTab === "audit" && (
        <div className="space-y-6">
          {/* Page Selection Bar */}
          <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-[280px]">
              <span className="text-xs font-extrabold uppercase text-slate-500 shrink-0">Select Page Route:</span>
              <select
                value={selectedPageId}
                onChange={(e) => setSelectedPageId(e.target.value)}
                className="h-10 w-full max-w-md rounded-lg border border-slate-300 bg-slate-50 px-3 text-xs font-bold text-slate-900 outline-none focus:border-emerald-600 focus:bg-white shadow-xs transition cursor-pointer"
              >
                {ALL_SITE_PAGES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label} ({p.path})
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Page Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 [scrollbar-width:thin]">
              {ALL_SITE_PAGES.slice(0, 7).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPageId(p.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition cursor-pointer whitespace-nowrap ${
                    selectedPageId === p.id ? "bg-[#23471d] text-white shadow-xs" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Live PageSpeed status chip — non-blocking, the report stays visible */}
          {updating && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              {reAuditing ? "Re-running live PageSpeed Insights for this page…" : "Refreshing PageSpeed Insights in the background…"}
            </div>
          )}

          {/* The report always renders — route switching never blanks the page.
              PageSpeed numbers update in place when the live run lands. */}
          <SeoSiteCheckupReport
            pageId={selectedPageObj.id}
            url={routeUrl(selectedPageObj)}
            pagespeed={pageSpeed}
            strategy={strategy}
            onStrategyChange={(s) => setStrategy(s)}
            onReAudit={() => {
              const targetUrl = routeUrl(selectedPageObj);
              const pageId = selectedPageObj.id;
              const cacheKey = `${targetUrl}:${strategy}`;
              setReAuditing(true);
              seoAuditApi
                .pagespeed(targetUrl, strategy, true)
                .then((data) => {
                  setSpeed({ pageId, strategy, data });
                  if (data?.ok) {
                    savePageSpeed(cacheKey, data);
                    if (strategy === "mobile") savePageSpeed(targetUrl, data);
                  }
                })
                .catch(() => setSpeed({ pageId, strategy, data: null }))
                .finally(() => setReAuditing(false));
            }}
          />
        </div>
      )}

      {/* Tabs 2-4: no Ensis backend yet */}
      {unavailable && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-xs">
          <div className="mx-auto flex max-w-xl flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-200 bg-amber-50 text-amber-600">
              <Info className="h-5 w-5" />
            </div>
            <h2 className="text-base font-extrabold text-[#23471d]">{unavailable.title}</h2>
            <p className="text-xs font-medium leading-relaxed text-slate-500">{unavailable.text}</p>
            <p className="text-[11px] font-semibold text-slate-400">The Page SEO Audit and SEO Activity Logs tabs are fully available.</p>
          </div>
        </div>
      )}

      {/* Tab 5: SEO Activity Logs */}
      {activeTab === "activity_log" && <SeoActivityLogWidget />}
    </div>
  );
}
