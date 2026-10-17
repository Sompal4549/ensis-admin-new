"use client";

import { useCallback, useEffect, useState } from "react";
import { ExternalLink, Layers, Plus, Save, Trash2 } from "lucide-react";
import Swal from "sweetalert2";
import { api } from "@/lib/api";
import { PUBLIC_SITE_URL } from "@/lib/cmsPages";
import { FieldLabel, ImageUploadField, TextInput, Textarea, Toggle } from "@/components/pages-cms/fields";
import CityPagesEditor, { normalizeCityPages, toSlug, type CityPage } from "@/components/city-pages/CityPagesEditor";

/* Shape of a solution as stored by the backend (models/solution.model.ts) */
type Item = { title: string; text: string; icon: string };
type Step = { number: string; title: string; text: string };
type Stat = { icon: string; top: string; text: string };
type Solution = {
  _id: string;
  title: string;
  slug: string;
  isActive: boolean;
  isFeatured: boolean;
  orderBy: number;
  hero: {
    eyebrow: string;
    heading: string[];
    description: string;
    primaryCta: { text: string; url: string };
    secondaryCta: { text: string; url: string };
    image: string;
    imageAlt: string;
  };
  stats: Stat[];
  approach: { eyebrow: string; heading: string; description: string; image: string; imageAlt: string };
  spaces: { eyebrow: string; heading: string; description: string; items: Item[] };
  services: Item[];
  process: Step[];
  cta: { eyebrow: string; heading: string[]; description: string; buttonText: string; image: string; imageAlt: string };
  seo: { metaTitle: string; metaDescription: string; metaKeywords: string; canonical: string; ogJson: string; schema: string };
  cities: CityPage[];
};

const TABS = ["Content", "City Pages", "SEO"] as const;
type Tab = (typeof TABS)[number];

/** Icon names the website knows (SolutionClient iconMap); anything else shows a leaf */
const ICONS = ["Leaf", "Flower2", "LayoutGrid", "HandHeart", "BedDouble", "Frame", "Lamp", "Droplets", "Settings", "ClipboardCheck", "Sparkles", "HardHat", "ArrowRight"];

const s = (v: unknown) => (typeof v === "string" ? v : "");

/** Fills every field so the form never deals with undefined */
const normalize = (raw: any): Solution => ({
  _id: raw._id,
  title: s(raw.title),
  slug: s(raw.slug),
  isActive: raw.isActive !== false,
  isFeatured: !!raw.isFeatured,
  orderBy: Number(raw.orderBy) || 0,
  hero: {
    eyebrow: s(raw.hero?.eyebrow),
    heading: Array.isArray(raw.hero?.heading) ? raw.hero.heading : [],
    description: s(raw.hero?.description),
    primaryCta: { text: s(raw.hero?.primaryCta?.text), url: s(raw.hero?.primaryCta?.url) },
    secondaryCta: { text: s(raw.hero?.secondaryCta?.text), url: s(raw.hero?.secondaryCta?.url) },
    image: s(raw.hero?.image),
    imageAlt: s(raw.hero?.imageAlt),
  },
  stats: Array.isArray(raw.stats) ? raw.stats.map((x: any) => ({ icon: s(x.icon), top: s(x.top), text: s(x.text) })) : [],
  approach: {
    eyebrow: s(raw.approach?.eyebrow),
    heading: s(raw.approach?.heading),
    description: s(raw.approach?.description),
    image: s(raw.approach?.image),
    imageAlt: s(raw.approach?.imageAlt),
  },
  spaces: {
    eyebrow: s(raw.spaces?.eyebrow),
    heading: s(raw.spaces?.heading),
    description: s(raw.spaces?.description),
    items: Array.isArray(raw.spaces?.items) ? raw.spaces.items.map((x: any) => ({ title: s(x.title), text: s(x.text), icon: s(x.icon) })) : [],
  },
  services: Array.isArray(raw.services) ? raw.services.map((x: any) => ({ title: s(x.title), text: s(x.text), icon: s(x.icon) })) : [],
  process: Array.isArray(raw.process) ? raw.process.map((x: any) => ({ number: s(x.number), title: s(x.title), text: s(x.text) })) : [],
  cta: {
    eyebrow: s(raw.cta?.eyebrow),
    heading: Array.isArray(raw.cta?.heading) ? raw.cta.heading : [],
    description: s(raw.cta?.description),
    buttonText: s(raw.cta?.buttonText),
    image: s(raw.cta?.image),
    imageAlt: s(raw.cta?.imageAlt),
  },
  seo: {
    metaTitle: s(raw.seo?.metaTitle),
    metaDescription: s(raw.seo?.metaDescription),
    metaKeywords: s(raw.seo?.metaKeywords),
    canonical: s(raw.seo?.canonical),
    ogJson: s(raw.seo?.ogJson),
    schema: s(raw.seo?.schema),
  },
  cities: normalizeCityPages(raw.cities),
});

const toLines = (value: string) => value.split("\n").map((l) => l.trim()).filter(Boolean);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[8px] border border-[#e2e8f0] bg-white p-3">
      <h3 className="mb-3 text-[9.5px] font-bold text-[#0f2a1c]">{title}</h3>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">{children}</div>
    </section>
  );
}

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={wide ? "md:col-span-2" : ""}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}

/** Editable list of rows (stats, space items, services, process steps) */
function RowList<T extends Record<string, string>>({
  rows,
  fields,
  onChange,
  blank,
  addLabel,
}: {
  rows: T[];
  fields: { key: keyof T & string; label: string; icon?: boolean; wide?: boolean }[];
  onChange: (rows: T[]) => void;
  blank: T;
  addLabel: string;
}) {
  return (
    <div className="md:col-span-2 flex flex-col gap-2">
      {rows.map((row, i) => (
        <div key={i} className="flex items-start gap-2 rounded-[6px] border border-[#eef2f6] bg-[#fbfcfd] p-2">
          <div className="grid flex-1 grid-cols-1 gap-2 md:grid-cols-3">
            {fields.map((f) => (
              <div key={f.key} className={f.wide ? "md:col-span-2" : ""}>
                <p className="mb-0.5 text-[8px] font-semibold text-[#64748b]">{f.label}</p>
                {f.icon ? (
                  <select
                    value={row[f.key]}
                    onChange={(e) => onChange(rows.map((r, j) => (j === i ? { ...r, [f.key]: e.target.value } : r)))}
                    className="h-[30px] w-full rounded-[6px] border border-[#dfe3e8] bg-white px-2 text-[9px]"
                  >
                    {!ICONS.includes(row[f.key]) && <option value={row[f.key]}>{row[f.key] || "—"}</option>}
                    {ICONS.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                ) : (
                  <TextInput
                    value={row[f.key]}
                    onChange={(v) => onChange(rows.map((r, j) => (j === i ? { ...r, [f.key]: v } : r)))}
                    maxLength={200}
                    hideLimit
                  />
                )}
              </div>
            ))}
          </div>
          <button type="button" onClick={() => onChange(rows.filter((_, j) => j !== i))} title="Remove" className="mt-5 text-[#dc2626]">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...rows, { ...blank }])}
        className="inline-flex w-fit items-center gap-1 rounded-[6px] border border-[#cbd5e1] bg-white px-3 py-1 text-[9px] font-semibold"
      >
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </button>
    </div>
  );
}

export default function SolutionsAdminPage() {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Solution | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("Content");

  const load = useCallback(async (keepId?: string) => {
    setLoading(true);
    try {
      const list = (await api.get<any[]>(`/solutions/admin/all?t=${Date.now()}`)).map(normalize);
      setSolutions(list);
      const pick = list.find((x) => x._id === keepId) || list[0] || null;
      setSelectedId(pick?._id ?? null);
      setDraft(pick);
      setDirty(false);
    } catch (err) {
      Swal.fire({ title: "Could not load solutions", text: err instanceof Error ? err.message : "", icon: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const select = async (id: string) => {
    if (dirty) {
      const ok = await Swal.fire({ title: "Discard unsaved changes?", icon: "warning", showCancelButton: true, confirmButtonText: "Discard" });
      if (!ok.isConfirmed) return;
    }
    const next = solutions.find((x) => x._id === id) || null;
    setSelectedId(id);
    setDraft(next);
    setDirty(false);
  };

  const edit = (patch: (d: Solution) => Solution) => {
    setDraft((d) => (d ? patch(d) : d));
    setDirty(true);
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.title.trim() || !draft.slug.trim()) {
      Swal.fire({ title: "Title and page address are required", icon: "warning" });
      return;
    }
    setSaving(true);
    try {
      // City pages are saved from their own tab
      const { _id, cities: _cities, ...body } = draft;
      await api.put(`/solutions/${_id}`, {
        ...body,
        slug: toSlug(draft.slug),
        hero: { ...body.hero, heading: toLines(body.hero.heading.join("\n")) },
        cta: { ...body.cta, heading: toLines(body.cta.heading.join("\n")) },
      });
      await load(_id);
      Swal.fire({ title: "Solution saved", icon: "success", timer: 1400, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: "Save failed", text: err instanceof Error ? err.message : "", icon: "error" });
    } finally {
      setSaving(false);
    }
  };

  const create = async () => {
    const { value: title } = await Swal.fire({
      title: "New solution",
      input: "text",
      inputLabel: "Solution name",
      inputPlaceholder: "e.g. Ayurveda Day-care Centre Setup",
      showCancelButton: true,
      inputValidator: (v) => (!v?.trim() ? "Enter a name" : undefined),
    });
    if (!title) return;
    try {
      const created = await api.post<any>("/solutions", {
        title: title.trim(),
        slug: toSlug(title),
        orderBy: solutions.length + 1,
        hero: { eyebrow: title.trim().toUpperCase(), heading: [title.trim()], description: "" },
      });
      await load(created?._id);
    } catch (err) {
      Swal.fire({ title: "Could not create", text: err instanceof Error ? err.message : "", icon: "error" });
    }
  };

  const remove = async () => {
    if (!draft) return;
    const ok = await Swal.fire({
      title: `Delete “${draft.title}”?`,
      text: "Its page and all of its city pages will stop working.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });
    if (!ok.isConfirmed) return;
    try {
      await api.delete(`/solutions/${draft._id}`);
      await load();
    } catch (err) {
      Swal.fire({ title: "Delete failed", text: err instanceof Error ? err.message : "", icon: "error" });
    }
  };

  const saveCities = async (cities: CityPage[]) => {
    if (!draft) return [];
    const saved = await api.put<CityPage[]>(`/solutions/${draft._id}/cities`, { cities });
    const normalized = normalizeCityPages(saved);
    setSolutions((list) => list.map((x) => (x._id === draft._id ? { ...x, cities: normalized } : x)));
    setDraft((d) => (d ? { ...d, cities: normalized } : d));
    return normalized;
  };

  const d = draft;
  const pageUrl = d ? `${PUBLIC_SITE_URL}/solutions/${d.slug}` : "";

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-[19px] font-bold text-[#0f2a1c]">
            <Layers className="h-5 w-5 text-[#15633a]" /> Solutions
          </h1>
          <p className="text-[9px] text-[#64748b]">
            Content of every solution page on the website, and its city pages (e.g. Panchkarma Clinic Setup in Delhi).
          </p>
        </div>
        <button type="button" onClick={create} className="inline-flex items-center gap-1 rounded-[6px] bg-[#15633a] px-3 py-2 text-[9px] font-semibold text-white">
          <Plus className="h-4 w-4" /> New Solution
        </button>
      </div>

      {loading && !d ? (
        <p className="py-10 text-center text-[9.5px] text-[#64748b]">Loading solutions…</p>
      ) : !d ? (
        <p className="rounded-[8px] border border-dashed border-[#cbd5e1] py-10 text-center text-[9.5px] text-[#64748b]">
          No solutions yet. Run <code>npm run seed:solutions</code> in the backend or click “New Solution”.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr]">
          <aside className="flex flex-col gap-1 rounded-[8px] border border-[#e2e8f0] bg-white p-2">
            {solutions.map((x) => (
              <button
                key={x._id}
                type="button"
                onClick={() => select(x._id)}
                className={`flex items-center justify-between gap-2 rounded-[6px] px-3 py-2 text-left text-[9.5px] ${
                  x._id === selectedId ? "bg-[#e6f6ea] font-semibold text-[#14532d]" : "text-[#334155] hover:bg-[#f8fafc]"
                }`}
              >
                <span className="truncate">
                  {x.orderBy}. {x.title}
                </span>
                <span className="shrink-0 text-[8px] text-[#64748b]">
                  {x.cities.length ? `${x.cities.length} cities` : ""} {x.isActive ? "" : "· Off"}
                </span>
              </button>
            ))}
          </aside>

          <div className="flex min-w-0 flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-[8px] border border-[#e2e8f0] bg-white px-3 py-2">
              <div className="flex gap-1">
                {TABS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={`rounded-[6px] px-3 py-1.5 text-[9px] font-semibold ${tab === t ? "bg-[#15633a] text-white" : "text-[#334155] hover:bg-[#f1f5f9]"}`}
                  >
                    {t}
                    {t === "City Pages" && d.cities.length ? ` (${d.cities.length})` : ""}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {d.isActive && (
                  <a href={pageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[9px] font-semibold text-[#2563eb]">
                    <ExternalLink className="h-3.5 w-3.5" /> View page
                  </a>
                )}
                {tab !== "City Pages" && (
                  <>
                    <button type="button" onClick={remove} className="inline-flex items-center gap-1 rounded-[6px] border border-[#fecaca] px-3 py-1.5 text-[9px] font-semibold text-[#dc2626]">
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                    <button
                      type="button"
                      onClick={save}
                      disabled={saving || !dirty}
                      className="inline-flex items-center gap-1 rounded-[6px] bg-[#15633a] px-3 py-1.5 text-[9px] font-semibold text-white disabled:opacity-50"
                    >
                      <Save className="h-3.5 w-3.5" /> {saving ? "Saving…" : "Save"}
                    </button>
                  </>
                )}
              </div>
            </div>

            {tab === "Content" && (
              <>
                <Section title="Basics">
                  <Field label="Solution name">
                    <TextInput value={d.title} onChange={(title) => edit((x) => ({ ...x, title }))} maxLength={80} />
                  </Field>
                  <Field label="Page address (/solutions/…)">
                    <TextInput value={d.slug} onChange={(slug) => edit((x) => ({ ...x, slug }))} maxLength={80} />
                  </Field>
                  <Field label="Order in lists">
                    <TextInput value={String(d.orderBy)} onChange={(v) => edit((x) => ({ ...x, orderBy: Number(v.replace(/\D/g, "")) || 0 }))} maxLength={3} hideLimit />
                  </Field>
                  <div className="flex items-end gap-6 pb-1">
                    <label className="flex items-center gap-2 text-[9px]">
                      <Toggle checked={d.isActive} onChange={(isActive) => edit((x) => ({ ...x, isActive }))} /> Live on website
                    </label>
                    <label className="flex items-center gap-2 text-[9px]">
                      <Toggle checked={d.isFeatured} onChange={(isFeatured) => edit((x) => ({ ...x, isFeatured }))} /> Featured
                    </label>
                  </div>
                </Section>

                <Section title="Hero">
                  <Field label="Eyebrow (small label)">
                    <TextInput value={d.hero.eyebrow} onChange={(eyebrow) => edit((x) => ({ ...x, hero: { ...x.hero, eyebrow } }))} />
                  </Field>
                  <Field label="Heading (one line per row)">
                    <Textarea
                      value={d.hero.heading.join("\n")}
                      onChange={(v) => edit((x) => ({ ...x, hero: { ...x.hero, heading: v.split("\n") } }))}
                      rows={2}
                      maxLength={160}
                    />
                  </Field>
                  <Field label="Description" wide>
                    <Textarea value={d.hero.description} onChange={(description) => edit((x) => ({ ...x, hero: { ...x.hero, description } }))} rows={3} />
                  </Field>
                  <Field label="Primary button text">
                    <TextInput value={d.hero.primaryCta.text} onChange={(text) => edit((x) => ({ ...x, hero: { ...x.hero, primaryCta: { ...x.hero.primaryCta, text } } }))} />
                  </Field>
                  <Field label="Primary button link">
                    <TextInput value={d.hero.primaryCta.url} onChange={(url) => edit((x) => ({ ...x, hero: { ...x.hero, primaryCta: { ...x.hero.primaryCta, url } } }))} placeholder="/contact" />
                  </Field>
                  <Field label="Secondary button text">
                    <TextInput value={d.hero.secondaryCta.text} onChange={(text) => edit((x) => ({ ...x, hero: { ...x.hero, secondaryCta: { ...x.hero.secondaryCta, text } } }))} />
                  </Field>
                  <Field label="Secondary button link">
                    <TextInput value={d.hero.secondaryCta.url} onChange={(url) => edit((x) => ({ ...x, hero: { ...x.hero, secondaryCta: { ...x.hero.secondaryCta, url } } }))} placeholder="#approach" />
                  </Field>
                  <Field label="Hero image (empty = current website image)">
                    <ImageUploadField value={d.hero.image} onChange={(image) => edit((x) => ({ ...x, hero: { ...x.hero, image } }))} />
                  </Field>
                  <Field label="Hero image alt text">
                    <TextInput value={d.hero.imageAlt} onChange={(imageAlt) => edit((x) => ({ ...x, hero: { ...x.hero, imageAlt } }))} />
                  </Field>
                </Section>

                <Section title="Stats strip">
                  <RowList
                    rows={d.stats}
                    fields={[{ key: "icon", label: "Icon", icon: true }, { key: "top", label: "Top text" }, { key: "text", label: "Bottom text" }]}
                    onChange={(stats) => edit((x) => ({ ...x, stats }))}
                    blank={{ icon: "Leaf", top: "", text: "" }}
                    addLabel="Add stat"
                  />
                </Section>

                <Section title="Approach">
                  <Field label="Eyebrow">
                    <TextInput value={d.approach.eyebrow} onChange={(eyebrow) => edit((x) => ({ ...x, approach: { ...x.approach, eyebrow } }))} />
                  </Field>
                  <Field label="Heading (one line per row)">
                    <Textarea value={d.approach.heading} onChange={(heading) => edit((x) => ({ ...x, approach: { ...x.approach, heading } }))} rows={2} maxLength={160} />
                  </Field>
                  <Field label="Paragraphs (blank line between paragraphs)" wide>
                    <Textarea
                      value={d.approach.description}
                      onChange={(description) => edit((x) => ({ ...x, approach: { ...x.approach, description } }))}
                      rows={6}
                      maxLength={2000}
                    />
                  </Field>
                  <Field label="Image (empty = current website image)">
                    <ImageUploadField value={d.approach.image} onChange={(image) => edit((x) => ({ ...x, approach: { ...x.approach, image } }))} />
                  </Field>
                  <Field label="Image alt text">
                    <TextInput value={d.approach.imageAlt} onChange={(imageAlt) => edit((x) => ({ ...x, approach: { ...x.approach, imageAlt } }))} />
                  </Field>
                </Section>

                <Section title="Spaces / integration">
                  <Field label="Eyebrow">
                    <TextInput value={d.spaces.eyebrow} onChange={(eyebrow) => edit((x) => ({ ...x, spaces: { ...x.spaces, eyebrow } }))} />
                  </Field>
                  <Field label="Heading">
                    <TextInput value={d.spaces.heading} onChange={(heading) => edit((x) => ({ ...x, spaces: { ...x.spaces, heading } }))} />
                  </Field>
                  <Field label="Description" wide>
                    <Textarea value={d.spaces.description} onChange={(description) => edit((x) => ({ ...x, spaces: { ...x.spaces, description } }))} rows={2} />
                  </Field>
                  <RowList
                    rows={d.spaces.items}
                    fields={[{ key: "icon", label: "Icon", icon: true }, { key: "title", label: "Title" }, { key: "text", label: "Text" }]}
                    onChange={(items) => edit((x) => ({ ...x, spaces: { ...x.spaces, items } }))}
                    blank={{ icon: "Leaf", title: "", text: "" }}
                    addLabel="Add item"
                  />
                </Section>

                <Section title="Services">
                  <RowList
                    rows={d.services}
                    fields={[{ key: "icon", label: "Icon", icon: true }, { key: "title", label: "Title" }, { key: "text", label: "Text" }]}
                    onChange={(services) => edit((x) => ({ ...x, services }))}
                    blank={{ icon: "Leaf", title: "", text: "" }}
                    addLabel="Add service"
                  />
                </Section>

                <Section title="Process">
                  <RowList
                    rows={d.process}
                    fields={[{ key: "number", label: "Step no." }, { key: "title", label: "Title" }, { key: "text", label: "Text" }]}
                    onChange={(process) => edit((x) => ({ ...x, process }))}
                    blank={{ number: String(d.process.length + 1).padStart(2, "0"), title: "", text: "" }}
                    addLabel="Add step"
                  />
                </Section>

                <Section title="Final call to action">
                  <Field label="Eyebrow">
                    <TextInput value={d.cta.eyebrow} onChange={(eyebrow) => edit((x) => ({ ...x, cta: { ...x.cta, eyebrow } }))} />
                  </Field>
                  <Field label="Heading (one line per row)">
                    <Textarea value={d.cta.heading.join("\n")} onChange={(v) => edit((x) => ({ ...x, cta: { ...x.cta, heading: v.split("\n") } }))} rows={2} maxLength={160} />
                  </Field>
                  <Field label="Description" wide>
                    <Textarea value={d.cta.description} onChange={(description) => edit((x) => ({ ...x, cta: { ...x.cta, description } }))} rows={2} />
                  </Field>
                  <Field label="Button text">
                    <TextInput value={d.cta.buttonText} onChange={(buttonText) => edit((x) => ({ ...x, cta: { ...x.cta, buttonText } }))} />
                  </Field>
                  <Field label="Image alt text">
                    <TextInput value={d.cta.imageAlt} onChange={(imageAlt) => edit((x) => ({ ...x, cta: { ...x.cta, imageAlt } }))} />
                  </Field>
                  <Field label="Background image (empty = current website image)" wide>
                    <ImageUploadField value={d.cta.image} onChange={(image) => edit((x) => ({ ...x, cta: { ...x.cta, image } }))} />
                  </Field>
                </Section>
              </>
            )}

            {tab === "City Pages" && (
              <CityPagesEditor key={d._id} basePath={`/solutions/${d.slug}`} parentTitle={d.title} initial={d.cities} onSave={saveCities} />
            )}

            {tab === "SEO" && (
              <Section title="Search engine settings (main page)">
                <Field label="Meta title" wide>
                  <TextInput value={d.seo.metaTitle} onChange={(metaTitle) => edit((x) => ({ ...x, seo: { ...x.seo, metaTitle } }))} maxLength={70} placeholder={`${d.hero.eyebrow} | ENSIS Wellness`} />
                </Field>
                <Field label="Meta description" wide>
                  <Textarea value={d.seo.metaDescription} onChange={(metaDescription) => edit((x) => ({ ...x, seo: { ...x.seo, metaDescription } }))} rows={3} maxLength={170} />
                </Field>
                <Field label="Keywords (comma separated)" wide>
                  <TextInput value={d.seo.metaKeywords} onChange={(metaKeywords) => edit((x) => ({ ...x, seo: { ...x.seo, metaKeywords } }))} maxLength={300} />
                </Field>
              </Section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
