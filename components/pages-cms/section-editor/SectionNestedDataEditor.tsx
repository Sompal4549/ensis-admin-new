"use client";

import { FieldLabel } from "../fields";
import { IMAGE_KEY_PATTERN, LONG_TEXT_KEY_PATTERN, humanizeKey } from "./sectionFieldHelpers";
import { NestedValueEditor, isRecord } from "./NestedValueEditor";
import type { CmsRecord } from "@/lib/cmsJson";

/* =========================================================
   NESTED SECTION DATA EDITOR
   SectionFieldsEditor only renders the section's own scalar fields;
   everything a storefront component reads from the nested `data`
   object (buttons, images, cards, stats, groups ...) had no input at
   all. This adds those inputs for every page, writing each edit back
   to the path that actually reaches the storefront:
   - keys the backend re-derives from a top-level field (title, image,
     bgImage ...) are edited on the section itself, because the
     top-level value wins when /pages merges the section into
     ComponentContent;
   - everything else is edited inside section.data.
======================================================== */

/** Top-level section keys the backend copies over section.data on save (page.routes.ts). */
const MAPPED_TOP_KEYS = new Set([
  "title",
  "heading",
  "subtitle",
  "description",
  "eyebrow",
  "highlight",
  "buttonLabel",
  "buttonHref",
  "secondaryButtonLabel",
  "secondaryButtonHref",
  "image",
  "bgImage",
  "backgroundImage",
  "icon",
  "items",
  "slides",
]);

/** Aliases the backend writes section.items into (utils/cms-items.ts). */
const ITEM_ALIASES = ["items", "ourCoreValues", "stats", "features", "cards"];

/**
 * Keys the backend also derives from another top-level field when that field is set
 * (page.routes.ts merges `buttonLabel` into `buttonText`, `title` into `heading`, ...),
 * so a data copy of them would be overwritten on save.
 */
const DERIVED_SOURCES: Record<string, string[]> = {
  heading: ["heading", "title"],
  buttonText: ["buttonLabel"],
  primaryBtnText: ["buttonLabel"],
  primaryButtonText: ["buttonLabel"],
  buttonPath: ["buttonHref"],
  primaryBtnPath: ["buttonHref"],
  primaryButtonHref: ["buttonHref"],
  secondaryBtnText: ["buttonLabel"],
  secondaryButtonText: ["buttonLabel"],
  secondaryBtnPath: ["buttonHref"],
  secondaryButtonPath: ["buttonHref"],
  eyebrow: ["eyebrow"],
  highlight: ["eyebrow"],
  iconSrc: ["icon"],
  iconImage: ["icon"],
  imageUrl: ["image"],
  imageurl: ["image"],
  imageSrc: ["image"],
};

/** Keys that produce the same storefront image field — a top-level one overrides the data copy. */
const IMAGE_KEY_GROUPS = [
  ["image", "imageurl", "imageUrl", "imageSrc"],
  ["bgImage", "backgroundImage"],
];

const LABEL_OVERRIDES: Record<string, string> = {
  subheading: "Subheading / Eyebrow",
  mostProjectsTitle: "Most Projects Title",
  statsTitle: "Stats Title",
  primaryButton: "Primary Button (Label + Link)",
  secondaryButton: "Secondary Button (Label + Link)",
  buttons: "Call-to-Action Buttons",
  mostProjects: "Most Project Needs",
  withEnsis: "With Ensis Block",
  specialCard: "Special Card",
  chooseList: "Why Choose List",
  processList: "Process Steps",
};

type Slot = {
  key: string;
  source: "data" | "section";
  label: string;
  value: unknown;
  /** The section also carries this key as a scalar — keep the (dead) copy in sync. */
  mirror?: boolean;
};

function labelFor(key: string) {
  return LABEL_OVERRIDES[key] ?? humanizeKey(key);
}

export function SectionNestedDataEditor({
  section,
  onSectionFieldChange,
  onDataChange,
}: {
  section: CmsRecord;
  onSectionFieldChange: (key: string, value: unknown) => void;
  onDataChange: (data: CmsRecord) => void;
}) {
  const data = isRecord(section.data) ? section.data : null;
  const hasItems = Array.isArray(section.items);

  const coveredLists = new Set<string>();
  if (hasItems) {
    coveredLists.add("items");
    if (section.itemsField && section.itemsField !== "items") {
      coveredLists.add(section.itemsField);
    } else if (!section.itemsField) {
      ITEM_ALIASES.forEach((alias) => coveredLists.add(alias));
    }
    // policy pages: the backend rebuilds data.sections from section.items
    if (String(section.componentKey || section.key || "").startsWith("policy.")) {
      coveredLists.add("sections");
    }
  }
  if ("slides" in section) coveredLists.add("slides");

  const slots: Slot[] = [];
  const usedTopKeys = new Set<string>();

  const pushTop = (key: string) => {
    if (usedTopKeys.has(key)) return;
    usedTopKeys.add(key);
    slots.push({ key, source: "section", label: labelFor(key), value: section[key] });
  };

  if (data) {
    for (const [key, value] of Object.entries(data)) {
      if (key === "id" || key === "_id") continue;
      if (coveredLists.has(key)) continue;

      const imageGroup = IMAGE_KEY_GROUPS.find((group) => group.includes(key));
      if (imageGroup) {
        const topKey = imageGroup.find((candidate) => candidate in section);
        if (topKey) {
          // The top-level image wins on save — edit it (a scalar one is already
          // rendered by the generic section editor).
          if (isRecord(section[topKey])) pushTop(topKey);
          continue;
        }
      }

      if (key in section && MAPPED_TOP_KEYS.has(key)) {
        if (isRecord(section[key])) pushTop(key);
        continue;
      }

      // the backend rebuilds this key from another top-level field on save
      if ((DERIVED_SOURCES[key] ?? []).some((source) => Boolean(section[source]))) continue;

      slots.push({
        key,
        source: "data",
        label: labelFor(key),
        value,
        mirror:
          key in section &&
          typeof section[key] !== "object" &&
          typeof value !== "object" &&
          !Array.isArray(value),
      });
    }
  }

  // top-level image objects with no data counterpart
  for (const group of IMAGE_KEY_GROUPS) {
    for (const key of group) {
      if (key in section && isRecord(section[key])) pushTop(key);
    }
  }

  if (!slots.length) return null;

  const handleValue = (slot: Slot, next: unknown) => {
    if (slot.source === "section") {
      onSectionFieldChange(slot.key, next);
      return;
    }
    if (slot.mirror) onSectionFieldChange(slot.key, next);
    onDataChange({ ...(data as CmsRecord), [slot.key]: next });
  };

  return (
    <div className="flex flex-col gap-[10px] border-t border-[#e2e8f0] pt-[10px]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-[#1e40af]">Nested Section Content</span>
        <span className="rounded-full border border-blue-200 bg-blue-50 px-[7px] py-[1px] text-[8.5px] font-bold text-blue-700">
          {slots.length} fields
        </span>
      </div>

      <div className="grid grid-cols-2 gap-x-[16px] gap-y-[10px]">
        {slots.map((slot) => {
          const complex = isRecord(slot.value) || Array.isArray(slot.value);
          const longText =
            typeof slot.value === "string" &&
            (LONG_TEXT_KEY_PATTERN.test(slot.key) || slot.key === "mapEmbedUrl");
          const image =
            typeof slot.value === "string" &&
            IMAGE_KEY_PATTERN.test(slot.key) &&
            !/alt/i.test(slot.key);

          return (
            <div
              key={`${slot.source}-${slot.key}`}
              className={complex || longText || image ? "col-span-2" : ""}
            >
              <FieldLabel>{slot.label}</FieldLabel>
              <NestedValueEditor
                fieldKey={slot.key}
                value={slot.value}
                onChange={(next) => handleValue(slot, next)}
                addLabel={`Add ${slot.label.replace(/\s*\(.*\)$/, "")} Item`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
