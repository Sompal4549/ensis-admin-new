import { ArrowDown, ArrowUp, ChevronRight, Plus, Trash2 } from "lucide-react";
import { ClauseDetailsEditor, SectionFieldsEditor, SectionItemsEditor, SectionNestedDataEditor, SectionTitle } from "../section-editor";
import { Toggle } from "../fields";
import { LayoutSectionEditor } from "../section-editor/LayoutSectionEditor";
import { isLayoutSection } from "../page-strategies/layout";
import type { CmsRecord } from "@/lib/cmsJson";

export function PageSectionsPanel({
  sectionsDraft,
  setSectionsDraft,
  openSectionIndices,
  setOpenSectionIndices,
  toggleSectionAccordion,
  updateSectionField,
  updateSectionItem,
  addSectionItem,
  removeSectionItem,
  resetToWebsiteDefaults,
}: {
  sectionsDraft: Array<CmsRecord>;
  setSectionsDraft: React.Dispatch<React.SetStateAction<Array<CmsRecord>>>;
  openSectionIndices: Set<number>;
  setOpenSectionIndices: React.Dispatch<React.SetStateAction<Set<number>>>;
  toggleSectionAccordion: (index: number) => void;
  updateSectionField: (sectionIndex: number, key: string, value: unknown) => void;
  updateSectionItem: (sectionIndex: number, itemIndex: number, key: string, value: unknown) => void;
  addSectionItem: (sectionIndex: number) => void;
  removeSectionItem: (sectionIndex: number, itemIndex: number) => void;
  resetToWebsiteDefaults: () => void;
}) {
  const moveSection = (fromIndex: number, delta: number) => {
    const toIndex = fromIndex + delta;
    if (toIndex < 0 || toIndex >= sectionsDraft.length) return;
    setSectionsDraft((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next.map((sec, idx) => ({
        ...sec,
        index: idx,
      }));
    });
    setOpenSectionIndices((prev) => {
      const next = new Set<number>();
      for (const idx of prev) {
        if (idx === fromIndex) {
          next.add(toIndex);
        } else if (idx === toIndex) {
          next.add(fromIndex);
        } else {
          next.add(idx);
        }
      }
      return next;
    });
  };

  return (
    <section
      className="
        flex
        shrink-0
        flex-col
        shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_0_0_1px_rgba(27,31,35,0.15)]
        bg-white
        px-[16px]
        py-[9px]
      "
    >
      <div
        className="
          flex
          shrink-0
          items-start
          justify-between
        "
      >
        <SectionTitle
          number={2}
          title="Page Sections"
        />

        <span className="text-[9.5px] font-semibold text-[#233D4D]">
          {sectionsDraft.length} sections
        </span>
      </div>

      {/* EXPAND / COLLAPSE GLOBAL ACTIONS */}
      <div className="mt-[10px] flex items-center justify-between border-b border-[#f1f5f9] pb-[8px] mb-[12px]">
        <span className="text-[10.5px] font-bold text-[#1e293b]">
          Page Landing Sections ({sectionsDraft.length})
        </span>
        <div className="flex items-center gap-[6px]">
          <button
            type="button"
            onClick={() => setOpenSectionIndices(new Set(sectionsDraft.map((_, i) => i)))}
            className="text-[9.5px] font-semibold text-[#233D4D] hover:underline"
          >
            Expand All
          </button>
          <span className="text-[#cbd5e1]">|</span>
          <button
            type="button"
            onClick={() => setOpenSectionIndices(new Set())}
            className="text-[9.5px] font-semibold text-[#64748b] hover:underline"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* INDIVIDUAL COLLAPSIBLE SECTION CARDS */}
      {sectionsDraft.length === 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-md text-center my-3">
          <p className="text-[12px] font-semibold text-amber-800 mb-2">No sections currently loaded for this page.</p>
          <button
            type="button"
            onClick={resetToWebsiteDefaults}
            className="px-4 py-1.5 bg-[#233D4D] text-white text-[11px] font-bold rounded hover:bg-[#380e1c] transition-colors shadow-sm"
          >
            Load Live Website Defaults
          </button>
        </div>
      )}
      <div className="flex flex-col gap-[10px]">
        {sectionsDraft.map((section, sectionIndex) => {
          const isOpen = openSectionIndices.has(sectionIndex);

          return (
            <div
              key={section._id ?? section.key ?? sectionIndex}
              className={`rounded-[6px] border transition ${isOpen ? "border-[#233D4D] bg-[#fbfbfa]" : "border-[#cbd5e1] bg-white hover:border-[#94a3b8]"
                }`}
            >
              {/* SECTION CARD HEADER */}
              <div
                onClick={() => toggleSectionAccordion(sectionIndex)}
                className={`flex cursor-pointer items-center justify-between px-[14px] py-[10px] transition ${isOpen ? "bg-[#fdf2f4] border-b border-[#f5d0d6]" : "bg-[#f8fafc]"
                  }`}
              >
                <div className="flex items-center gap-[8px]">
                  <ChevronRight
                    className={`h-4 w-4 text-[#233D4D] transition-transform ${isOpen ? "rotate-90 text-[#3b0f1e]" : ""
                      }`}
                  />
                  <span className="font-mono text-[10px] font-bold text-[#64748b]">
                    {sectionIndex + 1}.
                  </span>
                  <span className="text-[12px] font-bold text-[#233D4D]">
                    {section.name ?? section.key}
                  </span>
                  {section.enabled === false && (
                    <span className="rounded-[4px] bg-rose-50 border border-rose-200 px-[6px] py-[1px] text-[8px] font-bold text-rose-600">
                      Disabled
                    </span>
                  )}
                </div>

                {isLayoutSection(section) ? (
                  <span className="rounded-[4px] border border-[#bfdbfe] bg-[#eff6ff] px-[6px] py-[1px] text-[8.5px] font-bold text-[#1e40af]">
                    Site-wide · every page
                  </span>
                ) : (
                <div className="flex items-center gap-[10px]" onClick={(e) => e.stopPropagation()}>
                  {/* REORDER UP / DOWN */}
                  <div className="flex items-center gap-[2px] border-r border-[#e2e8f0] pr-[8px]">
                    <button
                      type="button"
                      disabled={sectionIndex === 0}
                      onClick={() => moveSection(sectionIndex, -1)}
                      className="p-1 text-[#64748b] hover:text-[#233D4D] hover:bg-[#e2e8f0]/60 rounded disabled:opacity-25 disabled:cursor-not-allowed transition"
                      title="Move section up"
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={sectionIndex === sectionsDraft.length - 1}
                      onClick={() => moveSection(sectionIndex, 1)}
                      className="p-1 text-[#64748b] hover:text-[#233D4D] hover:bg-[#e2e8f0]/60 rounded disabled:opacity-25 disabled:cursor-not-allowed transition"
                      title="Move section down"
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-[6px]">
                    <span
                      className={`text-[9.5px] font-bold ${section.enabled !== false ? "text-[#16a34a]" : "text-[#dc2626]"
                        }`}
                    >
                      {section.enabled !== false ? "Enabled" : "Disabled"}
                    </span>
                    <Toggle
                      checked={section.enabled !== false}
                      onChange={(value) => updateSectionField(sectionIndex, "enabled", value)}
                    />
                  </div>

                  {sectionIndex > 0 && !isLayoutSection(section) && (
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== "undefined" && window.confirm(`Remove section "${section.name || section.title || sectionIndex + 1}"?`)) {
                          setSectionsDraft((prev) => prev.filter((_, idx) => idx !== sectionIndex));
                        }
                      }}
                      className="text-[#94a3b8] hover:text-rose-600 transition p-1"
                      title="Delete this section"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                )}
              </div>

              {/* SECTION BODY (ONLY RENDERED WHEN OPEN) */}
              {isOpen && isLayoutSection(section) && (
                <div className="p-[14px] bg-[#fbfbfa]">
                  <LayoutSectionEditor
                    section={section}
                    onDataChange={(data) => updateSectionField(sectionIndex, "data", data)}
                  />
                </div>
              )}

              {isOpen && !isLayoutSection(section) && (
                <div className="flex flex-col gap-[12px] p-[14px] bg-[#fbfbfa]">
                  <SectionFieldsEditor
                    section={section}
                    onFieldChange={(key, value) => updateSectionField(sectionIndex, key, value)}
                  />

                  <SectionNestedDataEditor
                    section={section}
                    onSectionFieldChange={(key, value) => updateSectionField(sectionIndex, key, value)}
                    onDataChange={(nextData) => updateSectionField(sectionIndex, "data", nextData)}
                  />

                  {Array.isArray(section.slides) && (
                    <div className="flex flex-col gap-[8px]">
                      <SectionItemsEditor
                        items={section.slides}
                        onChangeItem={(itemIndex, key, value) => {
                          setSectionsDraft((previous) =>
                            previous.map((sec, i) => {
                              if (i !== sectionIndex) return sec;
                              const slides = [...(sec.slides ?? [])];
                              slides[itemIndex] = { ...slides[itemIndex], [key]: value };
                              return { ...sec, slides };
                            }),
                          );
                        }}
                        onAddItem={() => {
                          setSectionsDraft((previous) =>
                            previous.map((sec, i) => {
                              if (i !== sectionIndex) return sec;
                              const slides = [...(sec.slides ?? [])];
                              // Clone the shape of the last slide so a new slide has exactly the
                              // same fields (title/highlight/button names, Show Lutus, Is Center...)
                              // as the slides already there, with blank values of the right type.
                              const template = slides[slides.length - 1];
                              const blank: CmsRecord = template
                                ? Object.fromEntries(
                                    Object.entries(template)
                                      .filter(([k]) => k !== "_id" && k !== "id" && k !== "schedule")
                                      .map(([k, v]) => [k, Array.isArray(v) ? [] : typeof v === "boolean" ? false : ""]),
                                  )
                                : {};
                              blank.id = `slide-${slides.length + 1}`;
                              if (!blank.title) blank.title = "NEW HERO SLIDE";
                              if (blank.description === undefined || blank.description === null) blank.description = "Enter slide description...";
                              if (blank.image === undefined) blank.image = "";
                              if (blank.showLutus === undefined) blank.showLutus = false;
                              if (blank.isCenter === undefined) blank.isCenter = false;
                              return { ...sec, slides: [...slides, blank] };
                            }),
                          );
                        }}
                        onRemoveItem={(itemIndex) => {
                          setSectionsDraft((previous) =>
                            previous.map((sec, i) => {
                              if (i !== sectionIndex) return sec;
                              const slides = (sec.slides ?? []).filter((_: unknown, idx: number) => idx !== itemIndex);
                              return { ...sec, slides };
                            }),
                          );
                        }}
                        sectionId={section.key}
                      />
                    </div>
                  )}

                  {section.key === "ourStory" && Array.isArray(section.stats) && (
                    <div className="flex flex-col gap-[8px]">
                      <span className="text-[10.5px] font-bold text-[#1e293b]">Stats</span>
                      <SectionItemsEditor
                        items={section.stats}
                        onChangeItem={(itemIndex, key, value) => {
                          setSectionsDraft((previous) =>
                            previous.map((sec, i) => {
                              if (i !== sectionIndex) return sec;
                              const stats = [...(sec.stats ?? [])];
                              stats[itemIndex] = { ...stats[itemIndex], [key]: value };
                              return { ...sec, stats };
                            }),
                          );
                        }}
                        onAddItem={() => {
                          setSectionsDraft((previous) =>
                            previous.map((sec, i) => {
                              if (i !== sectionIndex) return sec;
                              const stats = [...(sec.stats ?? [])];
                              const blank: CmsRecord = { number: "", title: "", subTitle: "", imageurl: "", imageAlt: "" };
                              return { ...sec, stats: [...stats, blank] };
                            }),
                          );
                        }}
                        onRemoveItem={(itemIndex) => {
                          setSectionsDraft((previous) =>
                            previous.map((sec, i) => {
                              if (i !== sectionIndex) return sec;
                              const stats = (sec.stats ?? []).filter((_: unknown, idx: number) => idx !== itemIndex);
                              return { ...sec, stats };
                            }),
                          );
                        }}
                        sectionId={`${section.key}-stats`}
                      />
                    </div>
                  )}

                  {Array.isArray(section.items) && section.key !== "introduction-section" && section.key !== "why-participate" && section.key !== "conference-section" && section.key !== "sponsors-attend" && section.key !== "testimonials-section" && (
                    <SectionItemsEditor
                      items={section.items}
                      onChangeItem={(itemIndex, key, value) => updateSectionItem(sectionIndex, itemIndex, key, value)}
                      onAddItem={() => addSectionItem(sectionIndex)}
                      onRemoveItem={(itemIndex) => removeSectionItem(sectionIndex, itemIndex)}
                      sectionId={section.key}
                    />
                  )}

                  {!isLayoutSection(section) && sectionIndex > 0 && (
                    <ClauseDetailsEditor
                      section={section}
                      onChange={(updatedFields) => {
                        setSectionsDraft((prev) =>
                          prev.map((sec, i) =>
                            i === sectionIndex ? { ...sec, ...updatedFields } : sec
                          )
                        );
                      }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}

        <div className="flex items-center justify-between pt-2 border-t border-[#f1f5f9] mt-2">
          <button
            type="button"
            onClick={() => {
              const newIndex = sectionsDraft.length + 1;
              const newSec: CmsRecord = {
                key: `clause-${Date.now()}`,
                name: `${newIndex}. New Clause`,
                title: `New Clause`,
                description: "",
                enabled: true,
              };
              setSectionsDraft((prev) => [...prev, newSec]);
              setOpenSectionIndices((prev) => new Set([...prev, sectionsDraft.length]));
            }}
            className="inline-flex items-center gap-1.5 rounded-[5px] border border-[#233D4D] bg-white px-3 py-1.5 text-[11px] font-bold text-[#233D4D] hover:bg-[#fdf2f4] transition shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" /> Add New Section / Clause
          </button>
        </div>
      </div>
    </section>
  );
}
