"use client";

import { useState } from "react";
import { ExternalLink, MapPin, Plus, Save, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { PUBLIC_SITE_URL } from "@/lib/cmsPages";
import { FieldLabel, TextInput, Textarea, Toggle } from "@/components/pages-cms/fields";

/** A city landing page, stored on a solution or product (backend city-page.schema). */
export type CityPage = {
  _id?: string;
  city: string;
  slug: string;
  isActive: boolean;
  heading: string;
  description: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
};

export const toSlug = (value: string) =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const normalizeCityPages = (input: unknown): CityPage[] =>
  (Array.isArray(input) ? input : []).map((c) => ({
    _id: c?._id,
    city: c?.city || "",
    slug: c?.slug || "",
    isActive: c?.isActive !== false,
    heading: c?.heading || "",
    description: c?.description || "",
    intro: c?.intro || "",
    metaTitle: c?.metaTitle || "",
    metaDescription: c?.metaDescription || "",
  }));

const blank = (): CityPage => ({
  city: "",
  slug: "",
  isActive: true,
  heading: "",
  description: "",
  intro: "",
  metaTitle: "",
  metaDescription: "",
});

/**
 * Manages the city pages of one solution or product. Each page lives at `${basePath}/${slug}`
 * on the website; empty fields fall back to the parent page's content with the city name.
 */
export default function CityPagesEditor({
  basePath,
  parentTitle,
  initial,
  onSave,
  headingLabel = "Hero heading (one line per row)",
  headingPlaceholder,
}: {
  /** Website path of the parent, e.g. /solutions/panchkarma-clinic-setup */
  basePath: string;
  parentTitle: string;
  initial: CityPage[];
  /** Persists the full list and returns what the server saved */
  onSave: (cities: CityPage[]) => Promise<CityPage[]>;
  /** Label of the heading field; products show it above the specifications, solutions in the hero */
  headingLabel?: string;
  /** Suggested heading for a city, e.g. "Best Teak Droni in Delhi" */
  headingPlaceholder?: (city: string) => string;
}) {
  const [cities, setCities] = useState<CityPage[]>(initial);
  const [openIndex, setOpenIndex] = useState<number | null>(initial.length ? null : 0);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const update = (index: number, patch: Partial<CityPage>) => {
    setCities((list) => list.map((c, i) => (i === index ? { ...c, ...patch } : c)));
    setDirty(true);
  };

  const add = () => {
    setCities((list) => [...list, blank()]);
    setOpenIndex(cities.length);
    setDirty(true);
  };

  const remove = async (index: number) => {
    const c = cities[index];
    if (c.city) {
      const ok = await Swal.fire({
        title: `Remove ${c.city}?`,
        text: "The city page will stop working after you save.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Remove",
        confirmButtonColor: "#dc2626",
      });
      if (!ok.isConfirmed) return;
    }
    setCities((list) => list.filter((_, i) => i !== index));
    setOpenIndex(null);
    setDirty(true);
  };

  const save = async () => {
    const slugs = cities.map((c) => toSlug(c.slug || c.city));
    if (cities.some((c) => !c.city.trim())) {
      Swal.fire({ title: "City name missing", text: "Every city page needs a city name.", icon: "warning" });
      return;
    }
    const duplicate = slugs.find((s, i) => slugs.indexOf(s) !== i);
    if (duplicate) {
      Swal.fire({ title: "Duplicate city", text: `Two city pages use the address “${duplicate}”.`, icon: "warning" });
      return;
    }
    setSaving(true);
    try {
      const saved = await onSave(cities.map((c, i) => ({ ...c, slug: slugs[i] })));
      setCities(normalizeCityPages(saved));
      setDirty(false);
      Swal.fire({ title: "City pages saved", icon: "success", timer: 1400, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: "Save failed", text: err instanceof Error ? err.message : "Could not save city pages.", icon: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2">
        <p className="text-[8.5px] text-[#475569]">
          Each city gets its own page at <code className="rounded bg-white px-1">{basePath}/city-name</code>. Leave a field empty to
          reuse the main page&apos;s content with the city name added.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1 rounded-[6px] border border-[#cbd5e1] bg-white px-3 py-1.5 text-[9px] font-semibold text-[#0f172a] hover:bg-[#f1f5f9]"
          >
            <Plus className="h-3.5 w-3.5" /> Add City
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving || !dirty}
            className="inline-flex items-center gap-1 rounded-[6px] bg-[#15633a] px-3 py-1.5 text-[9px] font-semibold text-white disabled:opacity-50"
          >
            <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save City Pages"}
          </button>
        </div>
      </div>

      {cities.length === 0 && (
        <p className="rounded-[8px] border border-dashed border-[#cbd5e1] px-3 py-6 text-center text-[9px] text-[#64748b]">
          No city pages yet. Click “Add City” to create one, e.g. Delhi, Mumbai or Bengaluru.
        </p>
      )}

      {cities.map((c, index) => {
        const slug = toSlug(c.slug || c.city);
        const url = `${PUBLIC_SITE_URL}${basePath}/${slug}`;
        const open = openIndex === index;
        return (
          <div key={c._id || `new-${index}`} className="rounded-[8px] border border-[#e2e8f0] bg-white">
            <div className="flex items-center gap-2 px-3 py-2">
              <button type="button" onClick={() => setOpenIndex(open ? null : index)} className="flex min-w-0 flex-1 items-center gap-2 text-left">
                <MapPin className="h-4 w-4 shrink-0 text-[#15633a]" />
                <span className="truncate text-[9.5px] font-semibold text-[#0f172a]">
                  {c.city ? `${parentTitle} in ${c.city}` : "New city page"}
                </span>
                {slug && <span className="truncate text-[8px] text-[#64748b]">{basePath}/{slug}</span>}
              </button>
              <span className={`rounded-full px-2 py-0.5 text-[8px] font-semibold ${c.isActive ? "bg-[#e6f6ea] text-[#15803d]" : "bg-[#f1f3f5] text-[#64748b]"}`}>
                {c.isActive ? "Live" : "Off"}
              </span>
              {c._id && c.isActive && !dirty && (
                <a href={url} target="_blank" rel="noreferrer" title="Open on website" className="text-[#2563eb] hover:text-[#1d4ed8]">
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
              <button type="button" onClick={() => remove(index)} title="Remove city" className="text-[#dc2626] hover:text-[#b91c1c]">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {open && (
              <div className="grid grid-cols-1 gap-3 border-t border-[#eef2f6] px-3 py-3 md:grid-cols-2">
                <div>
                  <FieldLabel required>City</FieldLabel>
                  <TextInput value={c.city} onChange={(city) => update(index, { city })} placeholder="e.g. Delhi" maxLength={60} />
                </div>
                <div>
                  <FieldLabel>Page address</FieldLabel>
                  <TextInput value={c.slug} onChange={(v) => update(index, { slug: v })} placeholder={toSlug(c.city) || "delhi"} maxLength={60} />
                </div>
                <div className="md:col-span-2 flex items-center justify-between rounded-[6px] bg-[#f8fafc] px-3 py-2">
                  <span className="text-[9px] text-[#334155]">Show this page on the website</span>
                  <Toggle checked={c.isActive} onChange={(isActive) => update(index, { isActive })} />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>{headingLabel}</FieldLabel>
                  <Textarea
                    value={c.heading}
                    onChange={(heading) => update(index, { heading })}
                    rows={2}
                    maxLength={140}
                    placeholder={headingPlaceholder ? headingPlaceholder(c.city || "Delhi") : `${parentTitle}\nin ${c.city || "Delhi"}.`}
                  />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>Hero description</FieldLabel>
                  <Textarea
                    value={c.description}
                    onChange={(description) => update(index, { description })}
                    rows={3}
                    placeholder="Leave empty to use the main description with the city name added."
                  />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel>City introduction (local projects, service area — blank line between paragraphs)</FieldLabel>
                  <Textarea
                    value={c.intro}
                    onChange={(intro) => update(index, { intro })}
                    rows={4}
                    maxLength={2000}
                    placeholder={`e.g. ENSIS has delivered Panchkarma centres across ${c.city || "Delhi"}…`}
                  />
                </div>
                <div>
                  <FieldLabel>SEO title</FieldLabel>
                  <TextInput
                    value={c.metaTitle}
                    onChange={(metaTitle) => update(index, { metaTitle })}
                    maxLength={70}
                    placeholder={`${parentTitle} in ${c.city || "Delhi"} | ENSIS`}
                  />
                </div>
                <div>
                  <FieldLabel>SEO description</FieldLabel>
                  <Textarea value={c.metaDescription} onChange={(metaDescription) => update(index, { metaDescription })} rows={2} maxLength={170} />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
