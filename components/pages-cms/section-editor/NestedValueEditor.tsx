"use client";

import { useState } from "react";
import { ChevronRight, Plus, Trash2 } from "lucide-react";
import { FieldLabel, ImageUploadField, TextInput, Textarea, Toggle } from "../fields";
import { IMAGE_KEY_PATTERN, LONG_TEXT_KEY_PATTERN, humanizeKey } from "./sectionFieldHelpers";
import type { CmsRecord } from "@/lib/cmsJson";

/* =========================================================
   NESTED VALUE EDITOR
   Renders an input for any value shape a CMS section stores in its
   nested `data` object (or inside an item): strings, numbers,
   booleans, string lists, { imageUrl, alt } images, small objects
   like buttons, and repeatable lists of objects (cards, stats,
   buttons ...). SectionFieldsEditor only handles top-level scalars,
   so every nested structure is edited here instead.
======================================================== */

const MAX_DEPTH = 4;
const HIDDEN_KEYS = new Set(["_id", "id"]);
const IMAGE_URL_KEYS = ["imageUrl", "imageurl", "imageSrc", "src", "image"];
const ALT_KEYS = ["alt", "imageAlt", "altText", "imageAltText"];

export function isRecord(value: unknown): value is CmsRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Blank value that keeps the shape of an existing one (booleans stay booleans, objects stay objects). */
function blankLike(value: unknown): unknown {
  if (Array.isArray(value)) return [];
  if (isRecord(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, blankLike(entry)]));
  }
  if (typeof value === "boolean") return false;
  if (typeof value === "number") return value;
  return "";
}

function newId() {
  return Math.random().toString(36).slice(2, 9);
}

function imageUrlKeyOf(value: CmsRecord) {
  return IMAGE_URL_KEYS.find((key) => typeof value[key] === "string") ?? "imageUrl";
}

function isImageObject(value: CmsRecord) {
  const urlKey = IMAGE_URL_KEYS.find((key) => typeof value[key] === "string");
  if (!urlKey) return false;
  return Object.keys(value).every(
    (key) => key === urlKey || ALT_KEYS.includes(key) || key === "title" || key === "alt",
  );
}

function isLongKey(key: string) {
  return LONG_TEXT_KEY_PATTERN.test(key) || key === "mapEmbedUrl";
}

function isImageKey(key: string) {
  return IMAGE_KEY_PATTERN.test(key) && !/alt/i.test(key);
}

function itemLabel(item: CmsRecord, index: number) {
  const main =
    item.title ||
    item.label ||
    item.name ||
    item.heading ||
    item.question ||
    item.tagline ||
    (item.title1 ? `${item.title1} ${item.title2 || ""}`.trim() : "");
  return main ? String(main) : `Item ${index + 1}`;
}

/* ---------------------------------------------------------
   { imageUrl, alt } objects → upload + alt text
--------------------------------------------------------- */
function ImageObjectFields({
  value,
  onChange,
}: {
  value: CmsRecord;
  onChange: (next: CmsRecord) => void;
}) {
  const urlKey = imageUrlKeyOf(value);
  const others = Object.entries(value).filter(([key]) => key !== urlKey && !HIDDEN_KEYS.has(key));
  const altEntries: Array<[string, unknown]> = others.filter(([key]) => ALT_KEYS.includes(key));
  const rest = others.filter(([key]) => !ALT_KEYS.includes(key));
  if (!altEntries.length) altEntries.push(["alt", value.alt ?? ""]);

  return (
    <div className="flex flex-col gap-2 rounded-[6px] border border-[#e2e8f0] bg-white p-[10px]">
      <div>
        <FieldLabel>Image (Upload / URL)</FieldLabel>
        <ImageUploadField
          value={String(value[urlKey] ?? "")}
          onChange={(next) => onChange({ ...value, [urlKey]: next })}
        />
      </div>
      <div className="grid grid-cols-2 gap-x-[16px] gap-y-[10px]">
        {altEntries.map(([key, entry]) => (
          <div key={key} className={rest.length ? "" : "col-span-2"}>
            <FieldLabel>Alt Text</FieldLabel>
            <TextInput
              value={String(entry ?? "")}
              onChange={(next) => onChange({ ...value, [key]: next })}
              hideLimit
              placeholder="Describe the image for accessibility"
            />
          </div>
        ))}
        {rest.map(([key, entry]) => (
          <div key={key}>
            <FieldLabel>{humanizeKey(key)}</FieldLabel>
            <TextInput
              value={String(entry ?? "")}
              onChange={(next) => onChange({ ...value, [key]: next })}
              hideLimit
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Every field inside a plain object (button, card, group ...)
--------------------------------------------------------- */
function NestedObjectFields({
  value,
  onChange,
  depth,
}: {
  value: CmsRecord;
  onChange: (next: CmsRecord) => void;
  depth: number;
}) {
  const entries = Object.entries(value).filter(([key]) => !HIDDEN_KEYS.has(key));
  if (!entries.length) return null;

  return (
    <div className="grid grid-cols-2 gap-x-[16px] gap-y-[10px]">
      {entries.map(([key, entry]) => {
        const wide =
          isRecord(entry) ||
          Array.isArray(entry) ||
          (typeof entry === "string" && (isLongKey(key) || isImageKey(key)));
        return (
          <div key={key} className={wide ? "col-span-2" : ""}>
            <FieldLabel>{humanizeKey(key)}</FieldLabel>
            <NestedValueEditor
              fieldKey={key}
              value={entry}
              depth={depth + 1}
              onChange={(next) => onChange({ ...value, [key]: next })}
            />
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------
   Repeatable list of objects (cards / stats / buttons ...)
--------------------------------------------------------- */
function NestedListEditor({
  value,
  onChange,
  depth,
  addLabel,
}: {
  value: Array<CmsRecord | string | number>;
  onChange: (next: Array<CmsRecord | string | number>) => void;
  depth: number;
  addLabel?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleAdd = () => {
    const template = value[0];
    const blank = isRecord(template) ? (blankLike(template) as CmsRecord) : {};
    if (isRecord(template) && !blank.id) blank.id = newId();
    setOpenIndex(value.length);
    onChange([...value, blank]);
  };

  return (
    <div className="flex flex-col gap-[8px]">
      <div className="flex items-center justify-between border-t border-[#e2e8f0] pt-[8px]">
        <span className="rounded-full border border-blue-200 bg-blue-50 px-[7px] py-[1px] text-[8.5px] font-bold text-blue-700">
          {value.length} Total
        </span>
        <button
          type="button"
          onClick={handleAdd}
          className="flex h-[24px] items-center gap-[4px] rounded-[4px] border border-blue-200 bg-white px-[8px] text-[9px] font-semibold text-blue-700 hover:bg-blue-50 transition-colors"
        >
          <Plus className="h-[10px] w-[10px]" />
          {addLabel || "Add Item"}
        </button>
      </div>

      <div className="space-y-3">
        {value.map((raw, index) => {
          const isOpen = openIndex === index;
          const entry = isRecord(raw) ? raw : ({ title: String(raw ?? "") } as CmsRecord);

          return (
            <div
              key={String(entry.id ?? index)}
              className="overflow-hidden rounded-[6px] border border-[#e2e8f0] bg-white shadow-2xs"
            >
              <div
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex cursor-pointer items-center justify-between border-b border-[#f1f5f9] bg-[#f8fafc] px-[12px] py-[8px] hover:bg-[#f1f5f9] transition"
              >
                <div className="flex items-center gap-[6px]">
                  <ChevronRight
                    className={`h-3.5 w-3.5 text-[#64748b] transition-transform ${isOpen ? "rotate-90 text-[#1e40af]" : ""}`}
                  />
                  <span className="text-[11px] font-bold text-[#1e40af]">
                    {itemLabel(entry, index)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenIndex(null);
                    onChange(value.filter((_, i) => i !== index));
                  }}
                  className="flex items-center gap-[3px] text-[9.5px] font-semibold text-[#dc2626] hover:underline"
                >
                  <Trash2 className="h-[11px] w-[11px]" />
                  Remove
                </button>
              </div>

              {isOpen && (
                <div className="bg-white p-[12px]">
                  <NestedValueEditor
                    fieldKey=""
                    value={entry}
                    depth={depth + 1}
                    onChange={(next) => {
                      const copy = [...value];
                      copy[index] = isRecord(next) ? next : { title: String(next ?? "") };
                      onChange(copy);
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------
   Comma separated string (or number) lists
--------------------------------------------------------- */
function StringListEditor({
  value,
  onChange,
  numeric,
}: {
  value: unknown[];
  onChange: (next: unknown[]) => void;
  numeric: boolean;
}) {
  return (
    <TextInput
      value={value.map((entry) => String(entry)).join(", ")}
      onChange={(next) => {
        const parts = next
          .split(",")
          .map((entry) => entry.trim())
          .filter((entry) => entry.length > 0);
        onChange(numeric ? parts.map((entry) => Number(entry) || 0) : parts);
      }}
      placeholder="comma, separated, values"
      hideLimit
    />
  );
}

/* ---------------------------------------------------------
   Main dispatcher
--------------------------------------------------------- */
export function NestedValueEditor({
  fieldKey,
  value,
  onChange,
  depth = 0,
  addLabel,
}: {
  fieldKey: string;
  value: unknown;
  onChange: (next: unknown) => void;
  depth?: number;
  addLabel?: string;
}) {
  if (depth > MAX_DEPTH) return null;

  if (typeof value === "boolean") {
    return <Toggle checked={value} onChange={onChange} />;
  }

  if (typeof value === "number") {
    return (
      <TextInput
        value={String(value)}
        onChange={(next) => onChange(next === "" ? 0 : Number(next) || 0)}
        hideLimit
      />
    );
  }

  if (typeof value === "string") {
    if (isImageKey(fieldKey)) {
      return <ImageUploadField value={value} onChange={onChange} />;
    }
    if (isLongKey(fieldKey)) {
      return <Textarea value={value} onChange={onChange} rows={3} noLimit={fieldKey === "mapEmbedUrl"} />;
    }
    return <TextInput value={value} onChange={onChange} hideLimit />;
  }

  if (Array.isArray(value)) {
    const isObjectList = value.length > 0 && isRecord(value[0]);
    if (isObjectList) {
      return (
        <NestedListEditor
          value={value as Array<CmsRecord | string | number>}
          onChange={onChange}
          depth={depth}
          addLabel={addLabel}
        />
      );
    }
    const numeric = value.length > 0 && value.every((entry) => typeof entry === "number");
    return <StringListEditor value={value} onChange={onChange} numeric={numeric} />;
  }

  if (isRecord(value)) {
    if (isImageObject(value)) {
      return <ImageObjectFields value={value} onChange={onChange} />;
    }
    return <NestedObjectFields value={value} onChange={onChange} depth={depth} />;
  }

  return null;
}
