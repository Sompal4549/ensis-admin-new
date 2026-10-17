"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { BarChart3, ExternalLink, FileCode, Map as MapIcon, RotateCcw, Save, SearchCheck } from "lucide-react";
import { api } from "@/lib/api";
import { useApiGet } from "@/lib/useApiGet";
import { PUBLIC_SITE_URL } from "@/lib/cmsPages";
import { Toggle } from "@/components/pages-cms/fields";

/** Matches the backend's advanced SEO record (GET/PUT /seo/advanced) that the website reads */
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

const inputClass =
  "h-[40px] w-full rounded-[6px] border border-[#dfe4e8] bg-white px-[12px] text-[11.5px] font-semibold text-[#2f3d58] outline-none focus:border-[#075b33]";
const labelClass = "mb-[5px] block text-[10.5px] font-semibold text-[#24345e]";
const cardClass = "rounded-[9px] border border-[#e7e9ec] bg-white px-[18px] py-[16px]";

function CardHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <div className="mb-[14px] flex items-start gap-[10px]">
      <span className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-full bg-[#eaf4ee] text-[#075b33]">{icon}</span>
      <div>
        <h2 className="text-[14px] font-semibold text-[#17234a]">{title}</h2>
        <p className="mt-[2px] text-[10.5px] font-semibold text-[#66738b]">{subtitle}</p>
      </div>
    </div>
  );
}

export default function AdvancedSeoPage() {
  const { data, loading, error, reload } = useApiGet<AdvancedSeo | null>("/seo/advanced");
  const [draft, setDraft] = useState<{ base: AdvancedSeo | null | undefined; form: Form } | null>(null);
  const [saving, setSaving] = useState(false);

  // The form starts from the saved settings and resets whenever they are reloaded
  const form = draft && draft.base === data ? draft.form : toForm(data);
  const set = (patch: Partial<Form>) => setDraft({ base: data, form: { ...form, ...patch } });

  useEffect(() => {
    if (error) Swal.fire({ title: "Could not load SEO settings", text: error instanceof Error ? error.message : "", icon: "error" });
  }, [error]);

  const site = (form.sitemapUrl ? form.sitemapUrl.replace(/\/$/, "") : PUBLIC_SITE_URL) || PUBLIC_SITE_URL;
  const formatError = (key: keyof typeof FORMATS) => {
    const value = form[key].trim();
    return value && !FORMATS[key].pattern.test(value) ? `Looks wrong — expected something like ${FORMATS[key].example}` : "";
  };
  const invalid = (Object.keys(FORMATS) as Array<keyof typeof FORMATS>).filter((k) => formatError(k));

  const save = async () => {
    if (invalid.length) {
      Swal.fire({ title: "Please fix the highlighted IDs", icon: "warning" });
      return;
    }
    if (form.sitemapUrl) {
      try {
        new URL(form.sitemapUrl);
      } catch {
        Swal.fire({ title: "Website address must be a full URL", text: "For example https://ensis.in", icon: "warning" });
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
      Swal.fire({ title: "SEO settings saved", text: "Live on the website within about a minute.", icon: "success", timer: 1600, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: "Could not save SEO settings", text: err instanceof Error ? err.message : "", icon: "error" });
    } finally {
      setSaving(false);
    }
  };

  const idField = (key: keyof typeof FORMATS, label: string, help: string) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        value={form[key]}
        onChange={(e) => set({ [key]: key === "clarityId" ? e.target.value.trim() : e.target.value.trim().toUpperCase() } as Partial<Form>)}
        placeholder={FORMATS[key].example}
        className={`${inputClass} ${formatError(key) ? "border-rose-300" : ""}`}
      />
      <p className={`mt-[4px] text-[9.5px] font-semibold ${formatError(key) ? "text-rose-600" : "text-[#738097]"}`}>{formatError(key) || help}</p>
    </div>
  );

  return (
    <main
      style={{ fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}
      className="h-full min-h-0 w-full overflow-y-auto overflow-x-hidden bg-[#fffefb] px-[18px] py-[14px] text-[#142347]"
    >
      <header className="flex flex-wrap items-start justify-between gap-[16px]">
        <div>
          <h1 className="text-[24px] font-semibold leading-none tracking-[-0.02em] text-[#075b33]">Advanced SEO</h1>
          <nav className="mt-[9px] flex items-center gap-[8px] text-[10.5px] font-semibold text-[#1d2b58]">
            <span>Dashboard</span>
            <span className="text-[#7b8597]">›</span>
            <span>Advanced SEO</span>
          </nav>
        </div>
        <button
          type="button"
          disabled={saving || loading}
          onClick={save}
          className="inline-flex h-[40px] items-center gap-[8px] rounded-[6px] bg-[linear-gradient(180deg,#076636_0%,#03542c_100%)] px-[20px] text-[11px] font-semibold text-white disabled:opacity-60"
        >
          <Save className="h-[15px] w-[15px]" />
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </header>

      {loading && !data ? (
        <p className="mt-[24px] text-[11px] font-semibold text-[#68758d]">Loading SEO settings…</p>
      ) : (
        <section className="mt-[16px] grid items-start gap-[14px] xl:grid-cols-2">
          <div className={cardClass}>
            <CardHeader icon={<BarChart3 className="h-[16px] w-[16px]" />} title="Analytics & Tracking" subtitle="Added to every page of the website. Leave a field empty to switch that tool off." />
            <div className="grid gap-[14px] md:grid-cols-2">
              {idField("gtmId", "Google Tag Manager ID", "Recommended — manage all tags from GTM")}
              {idField("gaId", "Google Analytics 4 ID", "Only if GA4 is not already inside GTM")}
              {idField("fbPixelId", "Facebook (Meta) Pixel ID", "Numbers only")}
              {idField("clarityId", "Microsoft Clarity ID", "From clarity.microsoft.com → Settings")}
            </div>
          </div>

          <div className={cardClass}>
            <CardHeader icon={<SearchCheck className="h-[16px] w-[16px]" />} title="Search Console Verification" subtitle="Paste the code, or the whole meta tag — the code is picked out automatically." />
            <div className="flex flex-col gap-[14px]">
              <div>
                <label className={labelClass}>Google Search Console</label>
                <input value={form.googleVerification} onChange={(e) => set({ googleVerification: e.target.value })} placeholder='<meta name="google-site-verification" content="…" />' className={inputClass} />
                {form.googleVerification && <p className="mt-[4px] text-[9.5px] font-semibold text-[#738097]">Saved as: {verificationCode(form.googleVerification)}</p>}
              </div>
              <div>
                <label className={labelClass}>Bing Webmaster Tools</label>
                <input value={form.bingVerification} onChange={(e) => set({ bingVerification: e.target.value })} placeholder='<meta name="msvalidate.01" content="…" />' className={inputClass} />
                {form.bingVerification && <p className="mt-[4px] text-[9.5px] font-semibold text-[#738097]">Saved as: {verificationCode(form.bingVerification)}</p>}
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <CardHeader icon={<FileCode className="h-[16px] w-[16px]" />} title="robots.txt" subtitle="Tells search engines which parts of the site to crawl. Empty uses the safe default." />
            <textarea
              value={form.robots}
              onChange={(e) => set({ robots: e.target.value })}
              placeholder={defaultRobots(site)}
              spellCheck={false}
              className="h-[190px] w-full resize-y rounded-[6px] border border-[#dfe4e8] bg-[#0f172a] px-[12px] py-[10px] font-mono text-[11px] leading-[1.6] text-[#e2e8f0] outline-none"
            />
            <div className="mt-[8px] flex flex-wrap items-center gap-[10px]">
              <button type="button" onClick={() => set({ robots: defaultRobots(site) })} className="inline-flex h-[30px] items-center gap-[6px] rounded-[5px] border border-[#dfe3e7] bg-white px-[10px] text-[10px] font-semibold text-[#273655] hover:bg-slate-50">
                <RotateCcw className="h-[12px] w-[12px]" /> Use default
              </button>
              <a href={`${PUBLIC_SITE_URL}/robots.txt`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-[5px] text-[10.5px] font-semibold text-[#075b33] hover:underline">
                View live robots.txt <ExternalLink className="h-[11px] w-[11px]" />
              </a>
              {/disallow:\s*\/\s*$/im.test(form.robots) && (
                <span className="text-[10px] font-semibold text-rose-600">Warning: “Disallow: /” blocks the whole website from Google.</span>
              )}
            </div>
          </div>

          <div className={cardClass}>
            <CardHeader icon={<MapIcon className="h-[16px] w-[16px]" />} title="Sitemap" subtitle="sitemap.xml lists every page, product, solution, blog and city page for search engines." />
            <div className="flex flex-col gap-[14px]">
              <div>
                <label className={labelClass}>Website Address</label>
                <input value={form.sitemapUrl} onChange={(e) => set({ sitemapUrl: e.target.value.trim() })} placeholder="https://ensis.in" className={inputClass} />
                <p className="mt-[4px] text-[9.5px] font-semibold text-[#738097]">Used for the links inside the sitemap. Leave empty to use the website&apos;s own address.</p>
              </div>
              <label className="flex items-center gap-[10px] text-[11px] font-semibold text-[#233D4D]">
                <Toggle checked={form.autoGenerate} onChange={(value) => set({ autoGenerate: value })} />
                Include the fixed website pages automatically
              </label>
              <div>
                <label className={labelClass}>Exclude Paths</label>
                <input value={form.excludePaths} onChange={(e) => set({ excludePaths: e.target.value })} placeholder="checkout, cart, orders" className={inputClass} />
                <p className="mt-[4px] text-[9.5px] font-semibold text-[#738097]">Comma separated. A path also hides everything under it (e.g. “orders” hides /orders/123).</p>
              </div>
              <a href={`${PUBLIC_SITE_URL}/sitemap.xml`} target="_blank" rel="noreferrer" className="inline-flex w-fit items-center gap-[5px] text-[10.5px] font-semibold text-[#075b33] hover:underline">
                View live sitemap.xml <ExternalLink className="h-[11px] w-[11px]" />
              </a>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
