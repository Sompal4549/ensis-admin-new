import type { CmsRecord } from "@/lib/cmsJson";
import type { SectionsDraft } from "./types";

/**
 * Ensis pages store their sections in settings as short keys ("hero") with a
 * componentKey ("home.hero") pointing at the ComponentContent record the storefront
 * reads, while the editor defaults use the full key. Same prefixes as the backend's
 * CONFIG_KEY_TO_PAGE_SLUG in page.routes.ts.
 */
const ENSIS_PAGE_PREFIX: Record<string, string> = {
  landingPage: "home",
  aboutPage: "about",
  turnkeyPage: "turnkey",
  consultancyPage: "consultancy",
  solutionsPage: "solutions",
  productsPage: "product",
  projectsPage: "projects",
  blogPage: "blog",
  careersPage: "career",
  contactPage: "contact",
  enquiryPage: "enquiry",
  privacyPolicyPage: "policy",
  termsAndConditionsPage: "policy",
  disclaimerPage: "policy",
  refundPolicyPage: "policy",
};

export const isEnsisPage = (configKey?: string) => Boolean(configKey && ENSIS_PAGE_PREFIX[configKey]);

/**
 * Sections hidden from the editor: leftovers in Settings that no website component
 * reads any more (grep "scheduleHero": zero hits in frontend/backend). They stay in
 * the database until the next save of the page replaces its sections.
 */
const HIDDEN_SECTION_KEYS = new Set([
  // Home: leftover section nothing renders any more (zero code references).
  "home.scheduleHero",
  // About: both components are commented out in ensis-Frontend RenderSections.tsx
  "about.whyChooseEnsis",
  "about.ourExpertise",
  // Blog: sections commented out in ensis-Frontend RenderSections.tsx
  "blog.mediaResources",
  "blog.stayInspired",
  "blog.supportWellness",
  "blog.featureStrip",
  "blog.features_strip",
  "features_strip",
  // Contact: sections commented out or null in ensis-Frontend RenderSections.tsx
  "contact.ctaBanner",
  "contact.featuresStrip",
  "enquiry.features_strip",
  "enquiry.ctaBanner",
]);

const componentKeyOf = (prefix: string, section: CmsRecord): string => {
  if (typeof section.componentKey === "string" && section.componentKey) return section.componentKey;
  const key = String(section.key || "");
  return key.includes(".") ? key : `${prefix}.${key}`;
};

/**
 * Live content stores images as objects ({ imageUrl, alt }) while the generic field
 * editors only render strings, so those fields silently disappeared from the form
 * (About hero image, Stats Strip icons). Flatten such values to the plain URL and
 * carry the alt text over when the record has no alt field of its own.
 * `data` and other nested objects are left untouched.
 */
const flattenImageFields = (record: CmsRecord): CmsRecord => {
  const out: CmsRecord = { ...record };
  Object.keys(out).forEach((key) => {
    const value = out[key];
    if (!value || typeof value !== "object" || Array.isArray(value)) return;
    const url =
      typeof value.imageUrl === "string"
        ? value.imageUrl
        : typeof value.imageurl === "string"
          ? value.imageurl
          : undefined;
    if (url === undefined) return;
    out[key] = url;
    const alt = typeof value.alt === "string" ? value.alt : "";
    if (alt) {
      if (!out.imageAlt) out.imageAlt = alt;
      else if (!out.alt) out.alt = alt;
    }
  });
  const lists = ["items", "slides"];
  lists.forEach((listKey) => {
    const list = out[listKey];
    if (!Array.isArray(list)) return;
    out[listKey] = list.map((entry: CmsRecord) =>
      entry && typeof entry === "object" && !Array.isArray(entry) ? flattenImageFields(entry) : entry,
    );
  });
  return out;
};

/**
 * Builds the editor draft for an Ensis page. Saved sections (MongoDB) win and keep
 * their order and items; defaults only fill fields a saved section lacks. With nothing
 * saved, only defaults belonging to this page are used, so a page borrowing another
 * page's defaults (Enquiry → Contact, Solutions → Turnkey) can never overwrite that
 * page's storefront content.
 */
export function resolveEnsisSections(
  configKey: string,
  stored: CmsRecord[] | undefined,
  fallback: SectionsDraft,
): SectionsDraft {
  const prefix = ENSIS_PAGE_PREFIX[configKey];

  // For careersPage: only expose the 6 redesign sections defined in Contract §2
  if (configKey === "careersPage") {
    const activeKeys = new Set([
      "career.banner",
      "career.features",
      "career.section",
      "career.emptyState",
      "career.whyWork",
      "career.lifeAtEnsis",
      "career.talentCommunity",
    ]);

    const storedMap = new Map<string, CmsRecord>();
    if (Array.isArray(stored)) {
      stored.forEach((s) => {
        const compKey = componentKeyOf(prefix, s);
        storedMap.set(compKey, s);
        if (s.key) storedMap.set(String(s.key), s);
      });
    }

    return fallback
      .filter((item) => activeKeys.has(String(item.key)))
      .map((item) => {
        const compKey = String(item.key);
        const saved = storedMap.get(compKey);
        return {
          ...item,
          ...(saved || {}),
          componentKey: compKey,
        };
      });
  }

  if (Array.isArray(stored) && stored.length > 0) {
    const mapped = stored
      .filter((section) => !HIDDEN_SECTION_KEYS.has(String(section.key || "")))
      .map((section) => {
        const componentKey = componentKeyOf(prefix, section);
        const defaults = fallback.find((item) => item.key === componentKey || item.key === section.key);
        return flattenImageFields({ ...(defaults || {}), ...section, componentKey });
      });

    // Check if the fallback has a hero/banner section that stored is missing (e.g. policy pages where only clauses were stored)
    const fallbackHero = fallback.find((item) => {
      const k = String(item.key || "").toLowerCase();
      return k.includes("hero") || k.includes("banner") || k.endsWith(".page");
    });
    if (fallbackHero) {
      const hasHeroInStored = mapped.some((s) => {
        const k = String(s.key || s.componentKey || "").toLowerCase();
        return (
          k === String(fallbackHero.key).toLowerCase() ||
          k.includes("hero") ||
          k.includes("banner") ||
          (prefix === "enquiry" && k.includes("enquiry"))
        );
      });
      if (!hasHeroInStored) {
        mapped.unshift(flattenImageFields({ ...fallbackHero, componentKey: fallbackHero.key }));
      }
    }

    return mapped;
  }

  return fallback
    .filter((item) => String(item.key || "").startsWith(`${prefix}.`) && !HIDDEN_SECTION_KEYS.has(String(item.key || "")))
    .map((item) => flattenImageFields({ ...item, componentKey: item.key }));
}
