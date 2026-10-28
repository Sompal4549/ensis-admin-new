"use client";

import React from "react";
import { Plus, Trash2, ExternalLink, Check, Circle, Layers, FileText, Sparkles } from "lucide-react";
import type { CmsRecord } from "@/lib/cmsJson";

interface ClauseCard {
  icon?: string;
  title?: string;
  text?: string;
  description?: string;
}

interface ClauseLink {
  label?: string;
  href?: string;
}

export function ClauseDetailsEditor({
  section,
  onChange,
}: {
  section: CmsRecord;
  onChange: (updatedFields: Partial<CmsRecord>) => void;
}) {
  const cards: ClauseCard[] = Array.isArray(section.cards) ? section.cards : [];
  const checkItems: string[] = Array.isArray(section.checkItems)
    ? section.checkItems.map((c) => (typeof c === "string" ? c : (c as any).title || (c as any).text || ""))
    : [];
  const bullets: string[] = Array.isArray(section.bullets)
    ? section.bullets.map((b) => (typeof b === "string" ? b : (b as any).title || (b as any).text || ""))
    : [];
  const link: ClauseLink | null =
    section.link && typeof section.link === "object"
      ? (section.link as ClauseLink)
      : null;
  const extra: string | undefined =
    typeof section.extra === "string" ? section.extra : undefined;
  const extra2: string | undefined =
    typeof section.extra2 === "string" ? section.extra2 : undefined;

  const hasAnyClauseElements =
    Boolean(section.cards) ||
    Boolean(section.checkItems) ||
    Boolean(section.bullets) ||
    Boolean(section.link) ||
    extra !== undefined ||
    extra2 !== undefined;

  return (
    <div className="flex flex-col gap-3 pt-2 border-t border-[#e2e8f0]">
      {/* ===================== CARDS GRID ===================== */}
      {Array.isArray(section.cards) && (
        <div className="flex flex-col gap-2 rounded-[6px] border border-[#e2e8f0] bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-2">
            <div className="flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-[#a9742a]" />
              <span className="text-[11px] font-bold text-[#1e293b]">
                Information Cards Grid ({cards.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = [...cards, { icon: "file-text", title: "New Card", text: "" }];
                onChange({ cards: next });
              }}
              className="inline-flex items-center gap-1 rounded bg-[#fdf2f4] px-2 py-0.5 text-[9.5px] font-bold text-[#233D4D] hover:bg-[#fae1e6] transition"
            >
              <Plus className="h-3 w-3" /> Add Card
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {cards.map((card, idx) => (
              <div
                key={idx}
                className="relative rounded-[5px] border border-[#e6d6b9] bg-[#fdfaf3] p-2.5 flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-bold text-[#063120]">
                    Card #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = cards.filter((_, i) => i !== idx);
                      onChange({ cards: next });
                    }}
                    className="text-[#94a3b8] hover:text-rose-600 transition p-0.5"
                    title="Delete card"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-1">
                    <label className="block text-[8.5px] font-bold text-[#64748b] uppercase">
                      Icon
                    </label>
                    <input
                      type="text"
                      value={card.icon || ""}
                      onChange={(e) => {
                        const next = [...cards];
                        next[idx] = { ...card, icon: e.target.value };
                        onChange({ cards: next });
                      }}
                      placeholder="user, list, monitor, etc."
                      className="w-full rounded border border-[#cbd5e1] bg-white px-2 py-1 text-[10px] text-[#1e293b] outline-none focus:border-[#233D4D]"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-[8.5px] font-bold text-[#64748b] uppercase">
                      Card Title
                    </label>
                    <input
                      type="text"
                      value={card.title || ""}
                      onChange={(e) => {
                        const next = [...cards];
                        next[idx] = { ...card, title: e.target.value };
                        onChange({ cards: next });
                      }}
                      placeholder="e.g. Personal Information"
                      className="w-full rounded border border-[#cbd5e1] bg-white px-2 py-1 text-[10px] text-[#1e293b] font-semibold outline-none focus:border-[#233D4D]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[8.5px] font-bold text-[#64748b] uppercase">
                    Description Text
                  </label>
                  <textarea
                    rows={2}
                    value={card.text || card.description || ""}
                    onChange={(e) => {
                      const next = [...cards];
                      next[idx] = { ...card, text: e.target.value };
                      onChange({ cards: next });
                    }}
                    placeholder="Details about this point..."
                    className="w-full resize-none rounded border border-[#cbd5e1] bg-white px-2 py-1 text-[10px] text-[#334155] outline-none focus:border-[#233D4D]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== CHECKLIST ITEMS ===================== */}
      {Array.isArray(section.checkItems) && (
        <div className="flex flex-col gap-2 rounded-[6px] border border-[#e2e8f0] bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-2">
            <div className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-600" />
              <span className="text-[11px] font-bold text-[#1e293b]">
                Checklist Points ({checkItems.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = [...checkItems, ""];
                onChange({ checkItems: next });
              }}
              className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[9.5px] font-bold text-emerald-700 hover:bg-emerald-100 transition"
            >
              <Plus className="h-3 w-3" /> Add Checklist Point
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {checkItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#a9742a] text-white">
                  <Check className="h-3 w-3 stroke-[3]" />
                </span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const next = [...checkItems];
                    next[idx] = e.target.value;
                    onChange({ checkItems: next });
                  }}
                  placeholder="Enter checklist point..."
                  className="flex-1 rounded border border-[#cbd5e1] bg-white px-2.5 py-1 text-[10.5px] text-[#1e293b] outline-none focus:border-[#233D4D]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = checkItems.filter((_, i) => i !== idx);
                    onChange({ checkItems: next });
                  }}
                  className="text-[#94a3b8] hover:text-rose-600 transition p-1"
                  title="Delete point"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== BULLET POINTS ===================== */}
      {Array.isArray(section.bullets) && (
        <div className="flex flex-col gap-2 rounded-[6px] border border-[#e2e8f0] bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-2">
            <div className="flex items-center gap-1.5">
              <Circle className="h-3 w-3 fill-[#233D4D] text-[#233D4D]" />
              <span className="text-[11px] font-bold text-[#1e293b]">
                Bullet Points ({bullets.length})
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                const next = [...bullets, ""];
                onChange({ bullets: next });
              }}
              className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[9.5px] font-bold text-blue-700 hover:bg-blue-100 transition"
            >
              <Plus className="h-3 w-3" /> Add Bullet Point
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            {bullets.map((bullet, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="flex h-2 w-2 shrink-0 rounded-full bg-[#333333] ml-1.5" />
                <input
                  type="text"
                  value={bullet}
                  onChange={(e) => {
                    const next = [...bullets];
                    next[idx] = e.target.value;
                    onChange({ bullets: next });
                  }}
                  placeholder="Enter bullet point..."
                  className="flex-1 rounded border border-[#cbd5e1] bg-white px-2.5 py-1 text-[10.5px] text-[#1e293b] outline-none focus:border-[#233D4D]"
                />
                <button
                  type="button"
                  onClick={() => {
                    const next = bullets.filter((_, i) => i !== idx);
                    onChange({ bullets: next });
                  }}
                  className="text-[#94a3b8] hover:text-rose-600 transition p-1"
                  title="Delete bullet"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== ACTION LINK ===================== */}
      {link && (
        <div className="flex flex-col gap-2 rounded-[6px] border border-[#e2e8f0] bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-1.5">
            <div className="flex items-center gap-1.5">
              <ExternalLink className="h-3.5 w-3.5 text-[#a9742a]" />
              <span className="text-[11px] font-bold text-[#1e293b]">
                Clause Action Link
              </span>
            </div>
            <button
              type="button"
              onClick={() => onChange({ link: null })}
              className="text-[#94a3b8] hover:text-rose-600 transition p-0.5 text-[9px] flex items-center gap-1"
              title="Remove action link"
            >
              <Trash2 className="h-3 w-3" /> Remove Link
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[8.5px] font-bold text-[#64748b] uppercase">
                Link Label / Anchor Text
              </label>
              <input
                type="text"
                value={link.label || ""}
                onChange={(e) => onChange({ link: { ...link, label: e.target.value } })}
                placeholder="e.g. Read our Terms & Conditions"
                className="w-full rounded border border-[#cbd5e1] bg-white px-2.5 py-1 text-[10.5px] text-[#1e293b] outline-none focus:border-[#233D4D]"
              />
            </div>
            <div>
              <label className="block text-[8.5px] font-bold text-[#64748b] uppercase">
                Link Target (Href / URL)
              </label>
              <input
                type="text"
                value={link.href || ""}
                onChange={(e) => onChange({ link: { ...link, href: e.target.value } })}
                placeholder="e.g. /terms-and-conditions or mailto:info@ensis.in"
                className="w-full rounded border border-[#cbd5e1] bg-white px-2.5 py-1 text-[10.5px] text-[#1e293b] outline-none focus:border-[#233D4D]"
              />
            </div>
          </div>
        </div>
      )}

      {/* ===================== EXTRA PARAGRAPH ===================== */}
      {extra !== undefined && (
        <div className="flex flex-col gap-1.5 rounded-[6px] border border-[#e2e8f0] bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#1e293b]">
              Additional Note / Supplementary Paragraph (extra)
            </span>
            <button
              type="button"
              onClick={() => onChange({ extra: undefined })}
              className="text-[#94a3b8] hover:text-rose-600 transition text-[9px] flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" /> Remove Note
            </button>
          </div>
          <textarea
            rows={2}
            value={extra}
            onChange={(e) => onChange({ extra: e.target.value })}
            placeholder="Additional context or closing note for this clause..."
            className="w-full resize-none rounded border border-[#cbd5e1] bg-white px-2.5 py-1.5 text-[10.5px] text-[#334155] outline-none focus:border-[#233D4D]"
          />
        </div>
      )}

      {/* ===================== EXTRA 2 PARAGRAPH ===================== */}
      {extra2 !== undefined && (
        <div className="flex flex-col gap-1.5 rounded-[6px] border border-[#e2e8f0] bg-white p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#1e293b]">
              Secondary Additional Paragraph (extra2)
            </span>
            <button
              type="button"
              onClick={() => onChange({ extra2: undefined })}
              className="text-[#94a3b8] hover:text-rose-600 transition text-[9px] flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" /> Remove Note
            </button>
          </div>
          <textarea
            rows={2}
            value={extra2}
            onChange={(e) => onChange({ extra2: e.target.value })}
            placeholder="Second supplementary note..."
            className="w-full resize-none rounded border border-[#cbd5e1] bg-white px-2.5 py-1.5 text-[10.5px] text-[#334155] outline-none focus:border-[#233D4D]"
          />
        </div>
      )}

      {/* ===================== QUICK ADD TOOLBAR ===================== */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[8.5px] font-bold uppercase tracking-wider text-[#94a3b8] mr-1">
          Add Clause Elements:
        </span>
        {!Array.isArray(section.cards) && (
          <button
            type="button"
            onClick={() =>
              onChange({
                cards: [{ icon: "file-text", title: "Key Information", text: "Details..." }],
              })
            }
            className="inline-flex items-center gap-1 rounded-[4px] border border-[#d1d5db] bg-white px-2 py-1 text-[9px] font-semibold text-[#374151] hover:bg-[#f3f4f6] transition"
          >
            <Plus className="h-2.5 w-2.5 text-[#a9742a]" /> Cards Grid
          </button>
        )}
        {!Array.isArray(section.checkItems) && (
          <button
            type="button"
            onClick={() => onChange({ checkItems: [""] })}
            className="inline-flex items-center gap-1 rounded-[4px] border border-[#d1d5db] bg-white px-2 py-1 text-[9px] font-semibold text-[#374151] hover:bg-[#f3f4f6] transition"
          >
            <Plus className="h-2.5 w-2.5 text-emerald-600" /> Checklist
          </button>
        )}
        {!Array.isArray(section.bullets) && (
          <button
            type="button"
            onClick={() => onChange({ bullets: [""] })}
            className="inline-flex items-center gap-1 rounded-[4px] border border-[#d1d5db] bg-white px-2 py-1 text-[9px] font-semibold text-[#374151] hover:bg-[#f3f4f6] transition"
          >
            <Plus className="h-2.5 w-2.5 text-blue-600" /> Bullet Points
          </button>
        )}
        {!link && (
          <button
            type="button"
            onClick={() => onChange({ link: { label: "", href: "" } })}
            className="inline-flex items-center gap-1 rounded-[4px] border border-[#d1d5db] bg-white px-2 py-1 text-[9px] font-semibold text-[#374151] hover:bg-[#f3f4f6] transition"
          >
            <Plus className="h-2.5 w-2.5 text-[#063120]" /> Action Link
          </button>
        )}
        {extra === undefined && (
          <button
            type="button"
            onClick={() => onChange({ extra: "" })}
            className="inline-flex items-center gap-1 rounded-[4px] border border-[#d1d5db] bg-white px-2 py-1 text-[9px] font-semibold text-[#374151] hover:bg-[#f3f4f6] transition"
          >
            <Plus className="h-2.5 w-2.5 text-[#64748b]" /> Extra Note
          </button>
        )}
      </div>
    </div>
  );
}
