import { api } from "@/lib/api";
import type { SectionsDraft, SetSectionsDraft } from "./types";
import type { CmsJson, CmsRecord } from "@/lib/cmsJson";

/**
 * The About page storefront reads `GET /component-content/page/about` (Page sections →
 * Settings → ComponentContent fallback) and each component consumes its own data shape
 * (industries[], steps[], testimonials[], founderImageurl objects, primaryAction objects…).
 * The editor draft is rebuilt from that same live endpoint so the accordions always show
 * what the page actually renders, with every field named the way the component reads it.
 */
const PAGE_ENDPOINT = "/component-content/page/about";
const STATS_STRIP_KEY = "about.statsStrip";

/* ----------------------------------------------------------
   Image helpers: components read { imageUrl, alt } objects
   while the generic editors only render plain strings.
---------------------------------------------------------- */

const urlOf = (value: unknown): string =>
  typeof value === "string"
    ? value
    : value && typeof value === "object" && typeof (value as CmsRecord).imageUrl === "string"
      ? String((value as CmsRecord).imageUrl)
      : "";

const altOf = (value: unknown): string =>
  value && typeof value === "object" && typeof (value as CmsRecord).alt === "string"
    ? String((value as CmsRecord).alt)
    : "";

/** Editor copy of an image field: plain URL string (alt kept on the record). */
const asEditorValue = (value: unknown): string => urlOf(value);

/** Component copy: { imageUrl, alt } object (what the About components read). */
const asImageObject = (original: unknown, url: string, alt = ""): CmsJson => ({
  ...(original && typeof original === "object" && !Array.isArray(original) ? original : {}),
  imageUrl: url,
  alt: alt || altOf(original),
});

const IMAGE_LIST_KEYS = ["imageurl", "image", "founderImageurl", "signatureImageurl", "icon", "imgUrl"];

/** Copies of list items whose image objects are flattened to strings so the item editor shows them. */
const flattenItems = (list: unknown): CmsRecord[] =>
  Array.isArray(list)
    ? list.map((entry: CmsJson) => {
        if (!entry || typeof entry !== "object" || Array.isArray(entry)) return { title: String(entry ?? "") };
        const out: CmsRecord = { ...entry };
        IMAGE_LIST_KEYS.forEach((key) => {
          const value = out[key];
          if (value && typeof value === "object" && !Array.isArray(value)) {
            const alt = altOf(value);
            out[key] = urlOf(value);
            if (alt && !out.alt && !out.imageAlt) out.alt = alt;
          }
        });
        return out;
      })
    : [];

const str = (value: unknown): string => (typeof value === "string" ? value : "");

/* ----------------------------------------------------------
   Live record -> editable top-level fields, per component
---------------------------------------------------------- */

const editorFieldsFor = (componentKey: string, d: CmsRecord): CmsRecord => {
  switch (componentKey) {
    case "about.hero":
      return {
        eyebrow: str(d.heading),
        title: str(d.title),
        highlight: str(d.highlight),
        description: str(d.description),
        buttonLabel: str(d.primaryBtnText || d.buttonLabel || d.buttonText),
        buttonHref: str(d.primaryBtnPath || d.buttonHref || d.buttonPath),
        secondaryButtonLabel: str(d.secondaryBtnText || d.secondaryButtonLabel),
        secondaryButtonHref: str(d.secondaryBtnPath || d.secondaryButtonHref),
        image: asEditorValue(d.image ?? d.imageUrl ?? d.imageurl ?? d.imageSrc),
        imageAlt: altOf(d.image ?? d.imageurl) || str(d.imageAlt),
      };
    case "about.statsStrip":
      return { items: flattenItems(Array.isArray(d.stats) && d.stats.length ? d.stats : d.items) };
    case "about.ourStory":
      return {
        heading: str(d.heading),
        title: str(d.title),
        description: str(d.description),
        image: asEditorValue(d.image ?? d.imageurl),
        imageAlt: altOf(d.image ?? d.imageurl),
        items: flattenItems(Array.isArray(d.ourCoreValues) && d.ourCoreValues.length ? d.ourCoreValues : d.items),
        stats: flattenItems(d.stats),
      };
    case "about.industriesWeServe":
      return {
        heading: str(d.heading),
        title: str(d.title),
        subtitle: str(d.subtitle),
        items: flattenItems(Array.isArray(d.industries) && d.industries.length ? d.industries : d.items),
      };
    case "about.ourTurnkeyProcess":
      return {
        heading: str(d.heading),
        title: str(d.title),
        subtitle: str(d.subtitle),
        image: asEditorValue(d.image ?? d.imageurl),
        imageAlt: altOf(d.image ?? d.imageurl),
        items: flattenItems(Array.isArray(d.steps) && d.steps.length ? d.steps : d.items),
      };
    case "about.testimonials":
      return {
        title: str(d.title),
        subtitle: str(d.subtitle),
        items: flattenItems(d.testimonials),
      };
    case "about.founderVision":
      return {
        heading: str(d.heading),
        title: str(d.title),
        description: str(d.description),
        founderImage: asEditorValue(d.founderImageurl),
        founderImageAlt: altOf(d.founderImageurl),
        signatureImage: asEditorValue(d.signatureImageurl),
        signatureImageAlt: altOf(d.signatureImageurl),
        founderName: str((d.aboutFounder as CmsRecord | undefined)?.title),
        founderCompany: str((d.aboutFounder as CmsRecord | undefined)?.company),
        founderTitle: str((d.aboutFounder as CmsRecord | undefined)?.division),
      };
    case "about.letsBuild":
      return {
        heading: str(d.heading || d.title),
        title: str(d.title),
        subtitle: str(d.subtitle),
        description: str(d.description),
        buttonLabel: str((d.primaryAction as CmsRecord | undefined)?.label || d.buttonLabel || d.buttonText),
        buttonHref: str((d.primaryAction as CmsRecord | undefined)?.url || d.buttonHref || d.buttonPath),
        secondaryButtonLabel: str((d.secondaryAction as CmsRecord | undefined)?.label),
        secondaryButtonHref: str((d.secondaryAction as CmsRecord | undefined)?.url),
        image: asEditorValue(d.image ?? d.imageurl),
        imageAlt: altOf(d.image ?? d.imageurl),
      };
    default: {
      // Unknown component: keep its own fields, just flatten image objects so they stay editable.
      const section: CmsRecord = {};
      Object.keys(d).forEach((key) => {
        const value = d[key];
        if (key === "items" || key === "slides" || key === "stats" || Array.isArray(value) || (value && typeof value === "object")) return;
        section[key] = value;
      });
      if (d.image !== undefined || d.imageurl !== undefined) {
        section.image = asEditorValue(d.image ?? d.imageurl);
        section.imageAlt = altOf(d.image ?? d.imageurl);
      }
      if (Array.isArray(d.items)) section.items = flattenItems(d.items);
      if (Array.isArray(d.slides)) section.slides = flattenItems(d.slides);
      if (Array.isArray(d.stats)) section.stats = flattenItems(d.stats);
      return section;
    }
  }
};

export function syncAboutSectionsFromLiveApi(setSectionsDraft: SetSectionsDraft): void {
  api.get(`${PAGE_ENDPOINT}?includeInactive=true`)
    .then((res: CmsJson) => {
      const records: CmsRecord[] = res?.data?.data || res?.data || res;
      if (!Array.isArray(records) || records.length === 0) return;

      setSectionsDraft((prev) => {
        const next = prev.map((sec) => ({ ...sec }));
        records.forEach((record) => {
          const componentKey = str(record.componentKey || record.key);
          if (!componentKey) return;
          const data: CmsRecord = record.data && typeof record.data === "object" ? record.data : {};
          const patch: CmsRecord = {
            componentKey,
            enabled: record.isActive !== false,
            // Full raw data is kept so the save can rebuild the component's exact shape.
            data,
            ...editorFieldsFor(componentKey, data),
          };
          const existing = next.find((sec) => sec.componentKey === componentKey || sec.key === componentKey || sec.key === componentKey.split(".")[1]);
          if (existing) {
            Object.assign(existing, patch);
          } else {
            next.push({ key: componentKey.split(".")[1] || componentKey, name: str(record.label) || componentKey, ...patch });
          }
        });
        return next;
      });
    })
    .catch(() => {});
}

/* ----------------------------------------------------------
   Save: editable fields back into each component's data shape
---------------------------------------------------------- */

const restoredList = (
  original: unknown,
  edited: CmsRecord[],
  imageKeys: Record<string, string>,
): CmsJson[] => {
  const origList = Array.isArray(original) ? (original as CmsRecord[]) : [];
  return edited.map((item, index) => {
    const orig = origList[index] && typeof origList[index] === "object" ? origList[index] : {};
    const out: CmsRecord = { ...orig, ...item };
    Object.entries(imageKeys).forEach(([targetKey, editorKey]) => {
      const url = str(item[editorKey]) || str(item.image) || urlOf(orig[targetKey]);
      if (!url) return;
      const alt = str(item.imageAlt) || str(item.alt) || altOf(orig[targetKey]);
      // Components read the object; the flat string is kept as a fallback for older readers.
      out[targetKey] = asImageObject(orig[targetKey], url, alt);
      if (targetKey !== "image") out.image = url;
    });
    return out;
  });
};

/** StatsStrip is fetched directly by AboutBanner (`GET /component-content/about.statsStrip`), so it alone must be written back to ComponentContent. */
const saveStatsStripToComponentContent = async (items: CmsRecord[]): Promise<void> => {
  try {
    const current: CmsJson = await api.get(`/component-content/${STATS_STRIP_KEY}`);
    const doc = current?.data?.data || current?.data || current;
    const id = doc?._id;
    if (!id) return;
    const original = Array.isArray(doc?.data?.stats) ? doc.data.stats : Array.isArray(doc?.data?.items) ? doc.data.items : [];
    const stats = restoredList(original, items, { imageurl: "imageurl" }).map((stat: CmsRecord) => ({
      ...stat,
      number: stat.number ?? stat.label,
      subTitle: stat.subTitle ?? stat.subtitle,
    }));
    await api.put(`/component-content/${id}`, { data: { ...(doc?.data || {}), stats } });
  } catch (err) {
    console.error("Failed to sync stats strip to ComponentContent:", err);
  }
};

export async function saveAboutSections(sectionsDraft: SectionsDraft): Promise<void> {
  const pending: Array<Promise<void>> = [];

  sectionsDraft.forEach((section) => {
    const componentKey = str(section.componentKey || section.key);
    const data: CmsRecord = section.data && typeof section.data === "object" ? { ...section.data } : {};

    switch (componentKey) {
      case "about.hero": {
        data.heading = section.eyebrow ?? data.heading;
        data.title = section.title ?? data.title;
        data.highlight = section.highlight ?? data.highlight;
        data.description = section.description ?? data.description;
        data.image = asImageObject(data.image, str(section.image), str(section.imageAlt));
        data.imageUrl = str(section.image);
        data.primaryAction = { ...(data.primaryAction as CmsRecord || {}), label: section.buttonLabel || "", url: section.buttonHref || "", style: "primary" };
        data.secondaryAction = { ...(data.secondaryAction as CmsRecord || {}), label: section.secondaryButtonLabel || "", url: section.secondaryButtonHref || "", style: "secondary" };
        break;
      }
      case "about.ourStory": {
        data.heading = section.heading ?? data.heading;
        data.title = section.title ?? data.title;
        data.description = section.description ?? data.description;
        data.imageurl = asImageObject(data.imageurl, str(section.image), str(section.imageAlt));
        data.ourCoreValues = restoredList(data.ourCoreValues, Array.isArray(section.items) ? section.items : [], { imageurl: "imageurl" });
        data.stats = restoredList(data.stats, Array.isArray(section.stats) ? section.stats : [], { imageurl: "imageurl" });
        break;
      }
      case "about.industriesWeServe": {
        data.heading = section.heading ?? data.heading;
        data.title = section.title ?? data.title;
        data.subtitle = section.subtitle ?? data.subtitle;
        data.industries = restoredList(data.industries, Array.isArray(section.items) ? section.items : [], { imageurl: "imageurl" });
        break;
      }
      case "about.ourTurnkeyProcess": {
        data.heading = section.heading ?? data.heading;
        data.title = section.title ?? data.title;
        data.subtitle = section.subtitle ?? data.subtitle;
        data.imageurl = asImageObject(data.imageurl, str(section.image), str(section.imageAlt));
        data.steps = restoredList(data.steps, Array.isArray(section.items) ? section.items : [], { imageurl: "imageurl" });
        break;
      }
      case "about.testimonials": {
        data.title = section.title ?? data.title;
        data.subtitle = section.subtitle ?? data.subtitle;
        data.testimonials = Array.isArray(section.items) ? section.items.map((item) => ({ ...item })) : data.testimonials;
        break;
      }
      case "about.founderVision": {
        data.heading = section.heading ?? data.heading;
        data.title = section.title ?? data.title;
        data.description = section.description ?? data.description;
        data.founderImageurl = asImageObject(data.founderImageurl, str(section.founderImage), str(section.founderImageAlt));
        data.signatureImageurl = asImageObject(data.signatureImageurl, str(section.signatureImage), str(section.signatureImageAlt));
        data.aboutFounder = {
          ...((data.aboutFounder as CmsRecord) || {}),
          title: section.founderName || "",
          company: section.founderCompany || "",
          division: section.founderTitle || "",
        };
        break;
      }
      case "about.statsStrip": {
        data.stats = restoredList(data.stats, Array.isArray(section.items) ? section.items : [], { imageurl: "imageurl" }).map((stat: CmsRecord) => ({
          ...stat,
          number: stat.number ?? stat.label,
          subTitle: stat.subTitle ?? stat.subtitle,
        }));
        break;
      }
      case "about.letsBuild": {
        data.heading = section.heading ?? data.heading;
        data.title = section.title ?? data.title;
        data.subtitle = section.subtitle ?? data.subtitle;
        data.description = section.description ?? data.description;
        data.primaryAction = { ...(data.primaryAction as CmsRecord || {}), label: section.buttonLabel || "", url: section.buttonHref || "" };
        data.secondaryAction = { ...(data.secondaryAction as CmsRecord || {}), label: section.secondaryButtonLabel || "", url: section.secondaryButtonHref || "" };
        data.imageurl = asImageObject(data.imageurl, str(section.image), str(section.imageAlt));
        break;
      }
      default:
        return;
    }

    // The draft keeps the rebuilt data so savePageCore stores the component's real shape
    // in Settings and /pages (which the storefront reads first).
    (section as CmsRecord).data = data;

    if (componentKey === STATS_STRIP_KEY) {
      pending.push(saveStatsStripToComponentContent(Array.isArray(section.items) ? section.items : []));
    }
  });

  await Promise.all(pending);
}
