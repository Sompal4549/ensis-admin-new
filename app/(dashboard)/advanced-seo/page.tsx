"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  FileCode,
  Globe,
  Info,
  Plus,
  RotateCcw,
  Save,
  Share2,
  RefreshCw,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import Swal from "sweetalert2";
import { api } from "@/lib/api";
import { useApiGet } from "@/lib/useApiGet";
import { PUBLIC_SITE_URL } from "@/lib/cmsPages";
import typography from "../pages/PagesTypography.module.css";

/**
 * Same screen as the Organic admin's Advanced SEO. Ensis keeps its existing backend, so:
 *  - tracking IDs, Search Console codes, robots.txt and sitemap save to GET/PUT /seo/advanced;
 *  - social links save to the SocialLink collection (/social-clicks/links) that drives the website's social icons;
 *  - header/footer scripts, root file upload and index/follow have no Ensis endpoint, so they are shown disabled.
 */

type AdvancedSeo = {
  sitemap?: { url?: string; autoGenerate?: boolean; excludePaths?: string };
  robotsTxt?: { content?: string };
  searchConsole?: { googleVerification?: string; bingVerification?: string };
  analytics?: { gaId?: string; gtmId?: string; fbPixelId?: string; clarityId?: string };
};

type Form = {
  gtmId: string;
  gaId: string;
  fbPixelId: string;
  clarityId: string;
  googleVerification: string;
  bingVerification: string;
  robots: string;
  sitemapUrl: string;
  autoGenerate: boolean;
  excludePaths: string;
};

type SocialRow = { _id?: string; platform: string; url: string; isActive: boolean; order: number };
type ClickStat = { _id: string; count: number };
type ClickRow = { _id: string; platform: string; city?: string | null; region?: string | null; country?: string | null; createdAt: string };
type ClickPage = { clicks: ClickRow[]; total: number; page: number; limit: number };

/** Platforms the website's social icons know how to draw (Footer / SocialSidebar) */
const PLATFORMS = ["facebook", "instagram", "twitter", "youtube", "linkedin", "whatsapp"];
const normalizePlatform = (platform: string) => (platform === "x" ? "twitter" : (platform || "").toLowerCase());
const PAGE_SIZE = 10;

const defaultRobots = (site: string) => `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/

Sitemap: ${site}/sitemap.xml`;

const toForm = (seo: AdvancedSeo | null | undefined): Form => ({
  gtmId: seo?.analytics?.gtmId || "",
  gaId: seo?.analytics?.gaId || "",
  fbPixelId: seo?.analytics?.fbPixelId || "",
  clarityId: seo?.analytics?.clarityId || "",
  googleVerification: seo?.searchConsole?.googleVerification || "",
  bingVerification: seo?.searchConsole?.bingVerification || "",
  robots: seo?.robotsTxt?.content || "",
  sitemapUrl: seo?.sitemap?.url || "",
  autoGenerate: seo?.sitemap?.autoGenerate !== false,
  excludePaths: seo?.sitemap?.excludePaths || "",
});

/** Accepts either the bare code or the whole <meta ... content="..."> tag pasted from Google/Bing */
const verificationCode = (value: string) => {
  const match = value.match(/content=["']([^"']+)["']/i);
  return (match ? match[1] : value).trim();
};

const FORMATS: Record<"gtmId" | "gaId" | "fbPixelId" | "clarityId", { pattern: RegExp; example: string }> = {
  gtmId: { pattern: /^GTM-[A-Z0-9]+$/, example: "GTM-ABC1234" },
  gaId: { pattern: /^G-[A-Z0-9]+$/, example: "G-ABC123XYZ" },
  fbPixelId: { pattern: /^\d{8,20}$/, example: "123456789012345" },
  clarityId: { pattern: /^[a-z0-9]{6,20}$/i, example: "abcd1234ef" },
};

const FacebookIcon = ({ size = 16, color = "#1877F2" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const InstagramIcon = ({ size = 16, color = "#E4405F" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const TwitterIcon = ({ size = 16, color = "#000000" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const YoutubeIcon = ({ size = 16, color = "#FF0000" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill={color} />
  </svg>
);

const LinkedinIcon = ({ size = 16, color = "#0A66C2" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const WhatsappGlyph = ({ size = 16, color = "#25D366" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 21l1.65-4.9A8.5 8.5 0 1 1 8 19.4L3 21z" />
    <path d="M9 10c.5 2 2 3.5 4 4l1.2-1.2 1.8.8c-.3 1.1-1.2 1.6-2.2 1.4-2.8-.6-5-2.8-5.6-5.6-.2-1 .3-1.9 1.4-2.2l.8 1.8L9 10z" />
  </svg>
);

const PLATFORM_META: Record<string, { label: string; icon: React.ReactNode; tint: string; bar: string; placeholder: string }> = {
  facebook: { label: "Facebook", icon: <FacebookIcon size={12} color="#1877F2" />, tint: "bg-[#1877F2]/10", bar: "bg-[#1877F2]", placeholder: "https://www.facebook.com/yourpage" },
  instagram: { label: "Instagram", icon: <InstagramIcon size={12} color="#E4405F" />, tint: "bg-[#E4405F]/10", bar: "bg-[#E4405F]", placeholder: "https://www.instagram.com/yourpage" },
  twitter: { label: "Twitter / X", icon: <TwitterIcon size={12} color="#000000" />, tint: "bg-gray-100", bar: "bg-gray-800", placeholder: "https://x.com/yourpage" },
  youtube: { label: "YouTube", icon: <YoutubeIcon size={12} color="#FF0000" />, tint: "bg-[#FF0000]/10", bar: "bg-[#FF0000]", placeholder: "https://www.youtube.com/@yourchannel" },
  linkedin: { label: "LinkedIn", icon: <LinkedinIcon size={12} color="#0A66C2" />, tint: "bg-[#0A66C2]/10", bar: "bg-[#0A66C2]", placeholder: "https://www.linkedin.com/company/yourpage" },
  whatsapp: { label: "WhatsApp", icon: <WhatsappGlyph size={12} color="#25D366" />, tint: "bg-[#25D366]/10", bar: "bg-[#25D366]", placeholder: "https://wa.me/919876543210" },
};
const metaFor = (platform: string) =>
  PLATFORM_META[normalizePlatform(platform)] || { label: platform || "Other", icon: <Globe className="h-3 w-3 text-gray-500" />, tint: "bg-gray-100", bar: "bg-gray-500", placeholder: "https://" };

// SweetAlert2 theme matching the admin portal's dark toasts
const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  background: "#1e2433",
  color: "#e2e8f0",
  iconColor: "#4ade80",
  customClass: {
    popup: "swal-toast-popup",
    title: "swal-toast-title",
  },
  didOpen: (toast) => {
    toast.style.boxShadow = "none";
    toast.style.setProperty("-webkit-box-shadow", "none");
    toast.style.filter = "none";
  },
});

const showSuccess = (message: string) => Toast.fire({ icon: "success", title: message });
const showError = (message: string) => Toast.fire({ icon: "error", title: message, iconColor: "#f87171" });

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative h-[20px] w-[38px] shrink-0 rounded-full transition-colors duration-200 cursor-pointer ${checked ? "bg-[#16a34a]" : "bg-[#dc2626]"}`}
    >
      <span
        className={`absolute top-[3px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-all duration-200 ${checked ? "left-[21px]" : "left-[3px]"}`}
      />
    </button>
  );
}

const NO_BACKEND = "Not stored by the Ensis server yet, so this is read-only here.";

function Unavailable({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 rounded border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-900">
      <Info className="mt-[1px] h-3.5 w-3.5 shrink-0 text-amber-600" />
      <span>{children}</span>
    </div>
  );
}

export default function AdvancedSeoPage() {
  const { data, loading, error, reload } = useApiGet<AdvancedSeo | null>("/seo/advanced");
  const [draft, setDraft] = useState<{ base: AdvancedSeo | null | undefined; form: Form } | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const [socialRows, setSocialRows] = useState<SocialRow[]>([]);
  const [savingSocial, setSavingSocial] = useState(false);
  const [socialLoaded, setSocialLoaded] = useState(false);

  const [stats, setStats] = useState<ClickStat[]>([]);
  const [clickPage, setClickPage] = useState<ClickPage | null>(null);
  const [clickFilter, setClickFilter] = useState("");
  const [clickPageNo, setClickPageNo] = useState(1);
  const [loadingClicks, setLoadingClicks] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // The form starts from the saved settings and resets whenever they are reloaded
  const form = draft && draft.base === data ? draft.form : toForm(data);
  const set = (patch: Partial<Form>) => setDraft({ base: data, form: { ...form, ...patch } });

  useEffect(() => {
    if (error) showError(error instanceof Error ? error.message : "Could not load SEO settings");
  }, [error]);

  const loadSocial = async () => {
    try {
      const list = await api.get<SocialRow[]>(`/social-clicks/links?t=${Date.now()}`);
      setSocialRows(Array.isArray(list) ? list.map((row) => ({ ...row, isActive: row.isActive !== false, order: Number(row.order) || 0 })) : []);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not load social media links");
    } finally {
      setSocialLoaded(true);
    }
  };

  const loadClicks = async (filter = clickFilter, pageNo = clickPageNo) => {
    setLoadingClicks(true);
    try {
      const query = new URLSearchParams({ page: String(pageNo), limit: String(PAGE_SIZE) });
      if (filter) query.set("platform", filter);
      const [statList, clicks] = await Promise.all([
        api.get<ClickStat[]>("/social-clicks/stats"),
        api.get<ClickPage>(`/social-clicks?${query.toString()}`),
      ]);
      setStats(Array.isArray(statList) ? statList : []);
      setClickPage(clicks && Array.isArray(clicks.clicks) ? clicks : { clicks: [], total: 0, page: 1, limit: PAGE_SIZE });
    } catch (err) {
      showError(err instanceof Error ? err.message : "Could not load click analytics");
    } finally {
      setLoadingClicks(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the loaders set state only after their first await
    loadSocial();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- the loader sets state only after its first await
    loadClicks(clickFilter, clickPageNo);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clickFilter, clickPageNo]);

  const updateRow = (index: number, patch: Partial<SocialRow>) =>
    setSocialRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const usedPlatforms = new Set(socialRows.map((row) => normalizePlatform(row.platform)));
  const nextPlatform = PLATFORMS.find((platform) => !usedPlatforms.has(platform));
  const addRow = () => {
    if (!nextPlatform) return;
    setSocialRows((prev) => [...prev, { platform: nextPlatform, url: "", isActive: true, order: prev.length }]);
  };

  const removeRow = async (index: number) => {
    const row = socialRows[index];
    if (row._id) {
      const result = await Swal.fire({
        title: `Remove ${metaFor(row.platform).label}?`,
        text: "The icon disappears from the website. Its past clicks are kept.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, Remove",
        confirmButtonColor: "#dc2626",
      });
      if (!result.isConfirmed) return;
      try {
        await api.delete(`/social-clicks/links/${row._id}`);
        showSuccess("Social link removed.");
      } catch (err) {
        showError(err instanceof Error && err.message ? err.message : "Could not remove the social link");
        return;
      }
    }
    setSocialRows((prev) => prev.filter((_, i) => i !== index));
  };

  const saveSocial = async () => {
    const blank = socialRows.filter((row) => !row.url.trim() && !row._id);
    const missing = socialRows.filter((row) => !row.url.trim() && row._id);
    if (missing.length) {
      showError(`Enter a URL for ${missing.map((row) => metaFor(row.platform).label).join(", ")}, or remove the link.`);
      return;
    }
    setSavingSocial(true);
    try {
      for (const [index, row] of socialRows.entries()) {
        if (blank.includes(row)) continue;
        const payload = { platform: row.platform, url: row.url.trim(), isActive: row.isActive, order: index };
        if (row._id) await api.put(`/social-clicks/links/${row._id}`, payload);
        else await api.post("/social-clicks/links", payload);
      }
      await loadSocial();
      showSuccess("Social media links saved successfully!");
    } catch (err) {
      showError(err instanceof Error && err.message ? err.message : "Failed to update social media links");
    } finally {
      setSavingSocial(false);
    }
  };

  const site = (form.sitemapUrl ? form.sitemapUrl.replace(/\/$/, "") : PUBLIC_SITE_URL) || PUBLIC_SITE_URL;
  const formatError = (key: keyof typeof FORMATS) => {
    const value = form[key].trim();
    return value && !FORMATS[key].pattern.test(value) ? `Looks wrong — expected something like ${FORMATS[key].example}` : "";
  };
  const invalid = (Object.keys(FORMATS) as Array<keyof typeof FORMATS>).filter((k) => formatError(k));

  const save = async () => {
    if (invalid.length) {
      showError("Please fix the highlighted IDs");
      return;
    }
    if (form.sitemapUrl) {
      try {
        new URL(form.sitemapUrl);
      } catch {
        showError("Website address must be a full URL, for example https://ensis.in");
        return;
      }
    }
    setSaving(true);
    try {
      await api.put("/seo/advanced", {
        analytics: { gtmId: form.gtmId, gaId: form.gaId, fbPixelId: form.fbPixelId, clarityId: form.clarityId },
        searchConsole: {
          googleVerification: verificationCode(form.googleVerification),
          bingVerification: verificationCode(form.bingVerification),
        },
        robots: { content: form.robots },
        sitemap: { url: form.sitemapUrl, autoGenerate: form.autoGenerate, excludePaths: form.excludePaths },
      });
      setDraft(null);
      reload();
      showSuccess("SEO settings saved — live on the website within about a minute.");
    } catch (err) {
      showError(err instanceof Error && err.message ? err.message : "Could not save SEO settings");
    } finally {
      setSaving(false);
    }
  };

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        void save();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading && !data) {
    return (
      <main className={`${typography.pages} h-full min-h-0 w-full flex flex-col items-center justify-center bg-[#fffefb]`}>
        <div className="w-10 h-10 border-4 border-[#134698] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Loading Advanced SEO Settings...</p>
      </main>
    );
  }

  const idField = (key: keyof typeof FORMATS, label: string, placeholder: string) => (
    <div>
      <label className="block text-[11px] font-semibold text-gray-700 mb-1">{label}</label>
      <input
        type="text"
        value={form[key]}
        onChange={(e) => set({ [key]: key === "clarityId" ? e.target.value.trim() : e.target.value.trim().toUpperCase() } as Partial<Form>)}
        placeholder={placeholder}
        className={`w-full px-3 py-1.5 text-xs border rounded font-mono focus:ring-1 focus:ring-blue-500 bg-white ${formatError(key) ? "border-rose-300" : "border-gray-300"}`}
      />
      {formatError(key) && <p className="mt-1 text-[10px] font-semibold text-rose-600">{formatError(key)}</p>}
    </div>
  );

  return (
    <main
      className={`${typography.pages} h-full min-h-0 w-full overflow-y-auto overflow-x-hidden bg-[#fffefb] px-[18px] py-[14px] text-[#142347] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300`}
    >
      <div className="min-h-full w-full">
        {/* TOP HEADING — Matching Staff & Exhibitor List Style */}
        <div className="mb-[18px] flex shrink-0 items-center justify-between border-b-[2px] border-[#293681] pb-[8px]">
          <div>
            <h1 className="text-[19px] font-bold leading-[1.15] tracking-[-0.018em] text-[#23471d]" style={{ color: "#23471d" }}>
              Advanced SEO Settings
            </h1>
            <p className="mt-0.5 text-[9px] font-medium text-[#6c7587]">
              Super Admin only — configure global tracking scripts, search crawler verifications, and root files.
            </p>
          </div>

          <div className="flex items-center gap-[10px]">
            <a
              href={`${PUBLIC_SITE_URL}/sitemap.xml`}
              target="_blank"
              rel="noreferrer"
              className="flex h-[30px] items-center justify-center gap-[5px] rounded-[6px] border border-[#fed7aa] bg-[#fff7ed] px-[14px] text-[8.5px] font-semibold text-[#ea580c] transition hover:bg-[#ffedd5] shadow-sm cursor-pointer"
            >
              <Globe className="h-[12px] w-[12px] text-[#ea580c]" strokeWidth={1.7} />
              View Live Sitemap
            </a>

            <button
              type="button"
              disabled
              title={NO_BACKEND}
              className="flex h-[30px] items-center justify-center gap-[5px] rounded-[6px] border border-[#e2e6ea] bg-white px-[14px] text-[8.5px] font-semibold text-[#33415b] shadow-sm opacity-50 cursor-not-allowed"
            >
              <Plus className="h-[12px] w-[12px] text-[#075b33]" strokeWidth={1.7} />
              Upload Root File
            </button>

            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex h-[30px] items-center justify-center gap-[5px] rounded-[6px] bg-[#16a34a] px-[14px] text-[8.5px] font-semibold text-white shadow-xs transition hover:bg-[#15803d] disabled:opacity-60 cursor-pointer"
            >
              {saving ? <div className="h-[12px] w-[12px] border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="h-[12px] w-[12px]" strokeWidth={1.7} />}
              Save All Scripts
              <span className="ml-1 text-[8px] bg-white/20 px-1 py-0.2 rounded font-mono hidden sm:inline">Ctrl+S</span>
            </button>
          </div>
        </div>

        <section className="mt-[14px] grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* LEFT COLUMN: SCRIPT EDITORS */}
          <div className="lg:col-span-2 min-w-0 space-y-6">
            <section className="bg-white border-2 border-gray-200 p-6 shadow-lg shrink-0 rounded-none">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded">
                    <Globe className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">1. Global Script Injection & Tracking</h2>
                    <p className="text-[11px] text-gray-500">Manage meta tags, Open Graph globals, Google Tag Manager, Analytics & Meta Pixel for live layout.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button type="button" disabled title={NO_BACKEND} className="px-2.5 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs opacity-50 cursor-not-allowed">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Auto Generate (Local)
                  </button>
                  <button type="button" disabled title={NO_BACKEND} className="px-2.5 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded text-xs font-semibold flex items-center gap-1.5 shadow-2xs opacity-50 cursor-not-allowed">
                    <Globe className="w-3.5 h-3.5 text-green-600" />
                    Auto Generate (Live)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Dynamic Tracking & Verification Keys */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    Dynamic Analytics & Verification Keys
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {idField("gaId", "Google Analytics GA4 ID", "G-XXXXXXXXXX")}
                    {idField("gtmId", "Google Tag Manager (GTM) ID", "GTM-XXXXXXX")}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Google Search Console Code</label>
                      <input
                        type="text"
                        value={form.googleVerification}
                        onChange={(e) => set({ googleVerification: e.target.value })}
                        placeholder="LSfGa6XOQVOX... or the whole meta tag"
                        className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded font-mono focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                      {form.googleVerification && <p className="mt-1 text-[10px] font-semibold text-gray-500">Saved as: {verificationCode(form.googleVerification)}</p>}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                    {idField("fbPixelId", "Facebook (Meta) Pixel ID", "123456789012345")}
                    {idField("clarityId", "Microsoft Clarity ID", "abcd1234ef")}
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-700 mb-1">Bing Webmaster Code</label>
                      <input
                        type="text"
                        value={form.bingVerification}
                        onChange={(e) => set({ bingVerification: e.target.value })}
                        placeholder="Code or the whole meta tag"
                        className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded font-mono focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                      {form.bingVerification && <p className="mt-1 text-[10px] font-semibold text-gray-500">Saved as: {verificationCode(form.bingVerification)}</p>}
                    </div>
                  </div>
                </div>

                {/* Target Scope Selection */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Select Target Scope <span className="text-red-500">*</span>
                  </label>
                  <select disabled className="w-full px-3 py-2 border-2 border-gray-300 bg-gray-100 text-gray-700 focus:outline-none text-xs shadow-sm cursor-not-allowed font-medium">
                    <option value="global">Global Injection (All Pages & Dynamic Routes — ensis.in)</option>
                  </select>
                  <p className="mt-1 text-[10px] text-gray-400">Injected in the root Next.js document layout to guarantee persistent tracking across all page navigations.</p>
                </div>

                <Unavailable>
                  Custom header/footer scripts and the index / follow switches need server support that Ensis does not have yet, so they are read-only here. The tracking IDs above are saved and added to every page.
                </Unavailable>

                <fieldset disabled className="m-0 min-w-0 border-0 p-0 opacity-60 space-y-4">
                  {/* Header Scripts Editor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-800">
                        Header Scripts (Inside &lt;head&gt;) <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-400 font-mono">0 chars | 1 lines</span>
                        <button type="button" className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-medium flex items-center gap-1">
                          <Copy className="w-3 h-3" />
                          <span>Copy Tag</span>
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={8}
                      readOnly
                      className="w-full p-4 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[11px] focus:outline-none border-2 border-gray-200 shadow-inner overflow-auto rounded"
                      placeholder={"<!-- Paste Google Tag Manager (head snippet), Google Analytics (gtag.js), or Meta Pixel code -->\n<script>\n  // Example global header tracking\n</script>"}
                      spellCheck={false}
                    />
                    <p className="text-[11px] text-gray-500">Paste Google Tag Manager (head snippet), Google Analytics (gtag.js), or Meta Pixel code.</p>
                  </div>

                  {/* Footer Scripts Editor */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-gray-800">
                        Footer Scripts (Before &lt;/body&gt;) <span className="text-red-500">*</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-gray-400 font-mono">0 chars | 1 lines</span>
                        <button type="button" className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded font-medium flex items-center gap-1">
                          <Copy className="w-3 h-3" />
                          <span>Copy Tag</span>
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={8}
                      readOnly
                      className="w-full p-4 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[11px] focus:outline-none border-2 border-gray-200 shadow-inner overflow-auto rounded"
                      placeholder="<!-- Scripts that should load after page content (Chat widgets, Hotjar, conversion tracking) -->"
                      spellCheck={false}
                    />
                    <p className="text-[11px] text-gray-500">Scripts that should load after page content (Chat widgets, Hotjar, conversion tracking).</p>
                  </div>

                  {/* Indexing / Crawlers Toggles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <div className="flex items-center justify-between rounded-[6px] border border-[#e5e6e2] px-[12px] py-[9px] bg-gray-50">
                      <div>
                        <p className="text-[11px] font-semibold text-[#3a4557]">Allow Search Engines to Index</p>
                        <p className="mt-[2px] text-[9px] font-medium text-[#8b929c]">Turn off to add a noindex tag to global layout.</p>
                      </div>
                      <Toggle checked onChange={() => undefined} />
                    </div>
                    <div className="flex items-center justify-between rounded-[6px] border border-[#e5e6e2] px-[12px] py-[9px] bg-gray-50">
                      <div>
                        <p className="text-[11px] font-semibold text-[#3a4557]">Allow Search Engines to Follow Links</p>
                        <p className="mt-[2px] text-[9px] font-medium text-[#8b929c]">Turn off to add a nofollow tag to global layout.</p>
                      </div>
                      <Toggle checked onChange={() => undefined} />
                    </div>
                  </div>
                </fieldset>

                {/* Save Button Bar */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-2">
                  <div className="flex items-center gap-2 text-[11px] text-gray-500">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Tracking IDs are saved directly to the database and added to every page of the website.</span>
                  </div>
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving}
                    className="px-6 py-2.5 bg-[#4B1426] hover:bg-[#3a0f1d] text-white font-bold text-xs rounded transition-all shadow-sm hover:shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 uppercase tracking-wider"
                  >
                    {saving ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>Save Scripts</span>
                  </button>
                </div>
              </div>
            </section>

            {/* SECTION 4: ROBOTS.TXT & SITEMAP (saved with the same Save button) */}
            <section className="bg-white border-2 border-gray-200 p-6 shadow-lg shrink-0 rounded-none">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded">
                    <FileCode className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">4. robots.txt & Sitemap</h2>
                    <p className="text-[11px] text-gray-500">Tell search engines what to crawl, and what sitemap.xml lists.</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">robots.txt</label>
                  <textarea
                    value={form.robots}
                    onChange={(e) => set({ robots: e.target.value })}
                    placeholder={defaultRobots(site)}
                    rows={8}
                    spellCheck={false}
                    className="w-full p-4 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-[11px] focus:outline-none focus:ring-2 focus:ring-blue-500 border-2 border-gray-200 shadow-inner overflow-auto rounded"
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => set({ robots: defaultRobots(site) })}
                      className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 cursor-pointer font-medium flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Use default
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(form.robots || defaultRobots(site), "robots")}
                      className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100 cursor-pointer font-medium flex items-center gap-1"
                    >
                      {copiedField === "robots" ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                    <a href={`${PUBLIC_SITE_URL}/robots.txt`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#134698] hover:underline">
                      View live robots.txt <ExternalLink className="w-3 h-3" />
                    </a>
                    {/disallow:\s*\/\s*$/im.test(form.robots) && <span className="text-[10px] font-semibold text-rose-600">Warning: “Disallow: /” blocks the whole website from Google.</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Website Address (for sitemap links)</label>
                    <input
                      type="text"
                      value={form.sitemapUrl}
                      onChange={(e) => set({ sitemapUrl: e.target.value.trim() })}
                      placeholder="https://ensis.in"
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded font-mono focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">Exclude Paths (comma separated)</label>
                    <input
                      type="text"
                      value={form.excludePaths}
                      onChange={(e) => set({ excludePaths: e.target.value })}
                      placeholder="checkout, cart, orders"
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded font-mono focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-[6px] border border-[#e5e6e2] px-[12px] py-[9px] bg-gray-50">
                  <div>
                    <p className="text-[11px] font-semibold text-[#3a4557]">Include the fixed website pages automatically</p>
                    <p className="mt-[2px] text-[9px] font-medium text-[#8b929c]">A path in “Exclude Paths” also hides everything under it (e.g. “orders” hides /orders/123).</p>
                  </div>
                  <Toggle checked={form.autoGenerate} onChange={(value) => set({ autoGenerate: value })} />
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: FILE UPLOADS + SOCIAL */}
          <div className="lg:col-span-1 min-w-0 space-y-6">
            <section className="bg-white border-2 border-gray-200 p-6 shadow-lg shrink-0 rounded-none">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded">
                    <Upload className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">2. Static SEO & Root Files</h2>
                    <p className="text-[11px] text-gray-500">Verification & crawler files served at root domain.</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-1 bg-gray-50 text-gray-500 border border-gray-200 rounded-full flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                  Not available
                </span>
              </div>

              <div className="mb-4">
                <Unavailable>Uploading root files needs server support that Ensis does not have yet. Use the Search Console code and robots.txt on the left instead.</Unavailable>
              </div>

              <fieldset disabled className="m-0 min-w-0 border-0 p-0 opacity-60">
                <div className="mb-5">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">Upload Static Files (.xml, .html, .txt)</label>
                  <div className="border-2 border-dashed rounded p-6 text-center relative border-gray-300 cursor-not-allowed">
                    <input ref={fileInputRef} type="file" className="hidden" accept=".xml,.html,.txt" disabled />
                    <div className="space-y-2">
                      <div className="w-12 h-12 bg-blue-50 border border-blue-200 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                        <Upload className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-gray-800">Click to upload</span> <span className="text-xs text-gray-500">or drag and drop</span>
                      </div>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Sitemap, Robots.txt, Google Verification HTML</p>
                    </div>
                  </div>
                </div>
              </fieldset>

              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-[11px] font-bold text-[#134698] uppercase tracking-wider">Active Files (0)</h3>
                  <span className="text-[10px] text-gray-400 font-semibold">Direct Root Access</span>
                </div>
                <div className="py-8 text-center bg-gray-50 rounded border-2 border-dashed border-gray-200">
                  <Globe className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">No files uploaded yet</p>
                  <p className="text-[10px] text-gray-400 mt-1">The live sitemap.xml and robots.txt are generated from the settings on the left.</p>
                </div>
              </div>

              <div className="mt-5 p-3.5 bg-orange-50 border-l-4 border-orange-500 rounded-none">
                <div className="flex items-center gap-1.5 text-orange-900 text-xs font-bold uppercase tracking-tight mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-600" />
                  <span>Notice</span>
                </div>
                <p className="text-[11px] text-orange-800 leading-relaxed font-medium">
                  Search engines read{" "}
                  <code className="bg-orange-100 px-1 py-0.5 rounded font-mono text-[10px]">{site.replace(/^https?:\/\//, "")}/sitemap.xml</code> and{" "}
                  <code className="bg-orange-100 px-1 py-0.5 rounded font-mono text-[10px]">/robots.txt</code> straight from the website.
                </p>
              </div>
            </section>

            {/* SECTION 3: SOCIAL MEDIA LINKS & FLOATING SIDEBAR */}
            <section className="bg-white border-2 border-gray-200 p-6 shadow-lg shrink-0 rounded-none">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded text-blue-600">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">3. Social Media Links</h2>
                    <p className="text-[11px] text-gray-500">Syncs with floating sidebar & website footer.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={addRow}
                    disabled={!nextPlatform}
                    title={nextPlatform ? "Add a social link" : "Every platform already has a link"}
                    className="px-3 py-1.5 bg-white border border-[#134698] text-[#134698] hover:bg-blue-50 text-xs font-bold rounded flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Link
                  </button>
                  <button
                    type="button"
                    onClick={saveSocial}
                    disabled={savingSocial || !socialLoaded}
                    className="px-3.5 py-1.5 bg-[#134698] hover:bg-[#0f3777] text-white text-xs font-bold rounded flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    {savingSocial ? "Saving..." : "Save Links"}
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {!socialLoaded && <p className="text-[11px] font-semibold text-gray-500">Loading social links…</p>}
                {socialLoaded && socialRows.length === 0 && (
                  <div className="py-6 text-center bg-gray-50 rounded border-2 border-dashed border-gray-200">
                    <Share2 className="w-7 h-7 text-gray-300 mx-auto mb-2" />
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">No social links yet</p>
                    <p className="text-[10px] text-gray-400 mt-1">Use “Add Link” to show a social icon on the website.</p>
                  </div>
                )}
                {socialRows.map((row, index) => {
                  const meta = metaFor(row.platform);
                  const clicks = stats.find((item) => normalizePlatform(item._id) === normalizePlatform(row.platform))?.count || 0;
                  const taken = (platform: string) => usedPlatforms.has(platform) && platform !== normalizePlatform(row.platform);
                  return (
                    <div key={row._id || `new-${index}`} className="rounded border border-gray-200 bg-gray-50/60 p-3">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 text-xs font-bold text-gray-700">
                          <span className={`w-5 h-5 rounded-full ${meta.tint} flex items-center justify-center`}>{meta.icon}</span>
                          {row._id ? (
                            <span>{meta.label} URL</span>
                          ) : (
                            <select
                              value={normalizePlatform(row.platform)}
                              onChange={(e) => updateRow(index, { platform: e.target.value })}
                              className="rounded border border-gray-300 bg-white px-1.5 py-0.5 text-xs font-bold text-gray-700"
                            >
                              {PLATFORMS.map((platform) => (
                                <option key={platform} value={platform} disabled={taken(platform)}>
                                  {PLATFORM_META[platform].label}
                                </option>
                              ))}
                            </select>
                          )}
                        </label>
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] font-semibold text-gray-400">{clicks.toLocaleString()} clicks</span>
                          <span className="text-[10px] font-semibold text-gray-500">{row.isActive ? "Shown" : "Hidden"}</span>
                          <Toggle checked={row.isActive} onChange={(value) => updateRow(index, { isActive: value })} />
                          <button
                            type="button"
                            onClick={() => removeRow(index)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Remove link"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="relative flex items-center">
                        <input
                          type="url"
                          value={row.url}
                          onChange={(e) => updateRow(index, { url: e.target.value })}
                          placeholder={meta.placeholder}
                          className="w-full text-xs px-3 py-2 border border-gray-300 rounded bg-white focus:ring-1 focus:ring-blue-500 focus:border-blue-500 pr-9 font-mono"
                        />
                        {row.url && (
                          <a href={row.url} target="_blank" rel="noreferrer" className="absolute right-2 text-gray-400 hover:text-blue-600 p-1" title="Test link">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={saveSocial}
                  disabled={savingSocial || !socialLoaded}
                  className="w-full py-2 bg-[#134698] hover:bg-[#0f3777] text-white text-xs font-bold rounded flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {savingSocial ? "Saving Changes..." : "Save Social Media Links"}
                </button>
              </div>
            </section>

            {/* SECTION 5: SOCIAL CLICK ANALYTICS */}
            <section className="bg-white border-2 border-gray-200 p-6 shadow-lg shrink-0 rounded-none">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 rounded text-blue-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">5. Social Click Analytics</h2>
                    <p className="text-[11px] text-gray-500">How often visitors tap each social icon on the website.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => loadClicks()}
                  disabled={loadingClicks}
                  className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-xs font-bold rounded flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingClicks ? "animate-spin" : ""}`} />
                  Refresh
                </button>
              </div>

              <div className="mb-4 flex items-end justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total clicks</p>
                  <p className="text-3xl font-bold leading-none text-[#134698]">{stats.reduce((sum, item) => sum + item.count, 0).toLocaleString()}</p>
                </div>
                <p className="text-[10px] font-semibold text-gray-400">All time</p>
              </div>

              <div className="space-y-2.5 mb-5">
                {stats.length === 0 ? (
                  <p className="text-[11px] font-medium text-gray-400">No clicks recorded yet.</p>
                ) : (
                  stats.map((item) => {
                    const meta = metaFor(item._id);
                    const total = stats.reduce((sum, item) => sum + item.count, 0) || 1;
                    return (
                      <div key={item._id}>
                        <div className="mb-1 flex items-center justify-between text-[11px] font-semibold text-gray-700">
                          <span className="flex items-center gap-1.5">
                            <span className={`w-4 h-4 rounded-full ${meta.tint} flex items-center justify-center`}>{meta.icon}</span>
                            {meta.label}
                          </span>
                          <span>
                            {item.count.toLocaleString()} <span className="text-gray-400">({Math.round((item.count / total) * 100)}%)</span>
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-gray-100">
                          <div className={`h-1.5 rounded-full ${meta.bar}`} style={{ width: `${Math.max(3, (item.count / total) * 100)}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-gray-100 pt-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-[11px] font-bold text-[#134698] uppercase tracking-wider">Recent clicks</h3>
                  <select
                    value={clickFilter}
                    onChange={(e) => {
                      setClickFilter(e.target.value);
                      setClickPageNo(1);
                    }}
                    className="rounded border border-gray-300 bg-white px-2 py-1 text-[11px] font-semibold text-gray-700"
                  >
                    <option value="">All platforms</option>
                    {PLATFORMS.map((platform) => (
                      <option key={platform} value={platform}>
                        {PLATFORM_META[platform].label}
                      </option>
                    ))}
                  </select>
                </div>

                {!clickPage || clickPage.clicks.length === 0 ? (
                  <p className="py-4 text-center text-[11px] font-medium text-gray-400">No clicks to show.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {clickPage.clicks.map((click) => {
                      const meta = metaFor(click.platform);
                      const place = [click.city, click.region, click.country].filter(Boolean).join(", ");
                      return (
                        <li key={click._id} className="flex items-center justify-between gap-3 py-2">
                          <span className="flex items-center gap-2 text-[11px] font-semibold text-gray-800">
                            <span className={`w-4 h-4 rounded-full ${meta.tint} flex items-center justify-center`}>{meta.icon}</span>
                            {meta.label}
                          </span>
                          <span className="min-w-0 truncate text-[10px] font-medium text-gray-400">{place || "Location unknown"}</span>
                          <span className="shrink-0 text-[10px] font-semibold text-gray-500">{new Date(click.createdAt).toLocaleString()}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}

                {clickPage && clickPage.total > PAGE_SIZE && (
                  <div className="mt-3 flex items-center justify-between text-[11px] font-semibold text-gray-500">
                    <button
                      type="button"
                      disabled={clickPageNo <= 1 || loadingClicks}
                      onClick={() => setClickPageNo((n) => Math.max(1, n - 1))}
                      className="px-2.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                    >
                      Previous
                    </button>
                    <span>
                      Page {clickPage.page} of {Math.max(1, Math.ceil(clickPage.total / PAGE_SIZE))} · {clickPage.total.toLocaleString()} clicks
                    </span>
                    <button
                      type="button"
                      disabled={clickPageNo >= Math.ceil(clickPage.total / PAGE_SIZE) || loadingClicks}
                      onClick={() => setClickPageNo((n) => n + 1)}
                      className="px-2.5 py-1 rounded border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 cursor-pointer"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
