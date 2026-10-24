"use client";

import { Plus, Trash2 } from "lucide-react";
import { FieldLabel, ImageUploadField, TextInput } from "../fields";

/** One icon + label under the hero text (e.g. "Ayurveda Expertise"). The website reads slide.features[{ imgUrl, title }]. */
export type HeroFeature = { imgUrl?: string; title?: string };

export function HeroFeaturesEditor({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (next: HeroFeature[]) => void;
}) {
  const features: HeroFeature[] = Array.isArray(value)
    ? value.filter((f): f is HeroFeature => !!f && typeof f === "object")
    : [];

  const update = (index: number, patch: Partial<HeroFeature>) =>
    onChange(features.map((f, i) => (i === index ? { ...f, ...patch } : f)));

  return (
    <div className="col-span-2 flex flex-col gap-[8px] rounded-[6px] border border-[#e2e8f0] bg-[#fafbfc] p-[10px]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-bold text-[#1e40af]">Feature Icons (below the hero text)</p>
          <p className="text-[10px] font-medium text-[#64748b]">
            Small icon + label row such as &quot;Ayurveda Expertise&quot;, &quot;Premium Quality&quot;. 4 fit best. Leave empty to hide the row on this slide.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange([...features, { imgUrl: "", title: "" }])}
          className="inline-flex h-[28px] shrink-0 items-center gap-[4px] rounded-[5px] border border-dashed border-[#93c5fd] bg-white px-[10px] text-[10px] font-bold text-[#1e40af] hover:bg-blue-50"
        >
          <Plus className="h-[11px] w-[11px]" />
          Add Feature
        </button>
      </div>

      {features.length === 0 && <p className="text-[10px] font-medium text-[#8b929c]">No feature icons added yet.</p>}

      {features.map((feature, index) => (
        <div key={index} className="grid grid-cols-1 items-start gap-[10px] rounded-[5px] border border-[#e2e8f0] bg-white p-[8px] md:grid-cols-[1fr_1.2fr_auto]">
          <div>
            <FieldLabel>Label</FieldLabel>
            <TextInput value={feature.title || ""} onChange={(next) => update(index, { title: next })} placeholder="Ayurveda Expertise" maxLength={40} />
          </div>
          <div>
            <FieldLabel>Icon (Upload / URL)</FieldLabel>
            <ImageUploadField value={feature.imgUrl || ""} onChange={(url) => update(index, { imgUrl: url })} />
          </div>
          <button
            type="button"
            title="Remove"
            onClick={() => onChange(features.filter((_, i) => i !== index))}
            className="mt-[20px] grid h-[30px] w-[30px] place-items-center rounded-[5px] border border-rose-200 bg-white text-rose-500 hover:bg-rose-50"
          >
            <Trash2 className="h-[12px] w-[12px]" />
          </button>
        </div>
      ))}
    </div>
  );
}
