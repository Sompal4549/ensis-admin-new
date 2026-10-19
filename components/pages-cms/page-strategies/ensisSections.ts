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
};

export const isEnsisPage = (configKey?: string) => Boolean(configKey && ENSIS_PAGE_PREFIX[configKey]);

const componentKeyOf = (prefix: string, section: CmsRecord): string => {
  if (typeof section.componentKey === "string" && section.componentKey) return section.componentKey;
  const key = String(section.key || "");
  return key.includes(".") ? key : `${prefix}.${key}`;
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
    return stored.map((section) => {
      const componentKey = componentKeyOf(prefix, section);
      const defaults = fallback.find((item) => item.key === componentKey || item.key === section.key);
      return { ...(defaults || {}), ...section, componentKey };
    });
  }

  return fallback
    .filter((item) => String(item.key || "").startsWith(`${prefix}.`))
    .map((item) => ({ ...item, componentKey: item.key }));
}
