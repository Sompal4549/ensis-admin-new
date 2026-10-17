export const PUBLIC_SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

export type PageStatus = "Published" | "Draft";

export type PageType = "home" | "page" | "people";

export interface CmsPage {
  configKey?: string;
  id: number;
  title: string;
  slug: string;
  author: string;
  status: PageStatus;
  visibility?: "Public" | "Private";
  publishedAt?: string;
  lastUpdated?: string;
  seoScore: number;
  rating: "Excellent" | "Good" | "Needs Work";
  updated: string;
  updatedBy: string;
  type: PageType;
  adminEditUrl?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    h1Tag?: string;
    breadcrumbName?: string;
    schemaMarkup?: string;
    robotsIndex?: boolean;
    robotsFollow?: boolean;
    canonicalTag?: string;
    openGraphTags?: string;
    isActive?: boolean;
  };
}

export function getCmsPageRouteKey(page: Pick<CmsPage, "title">): string {
  return page.title
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const routeAliases: Record<string, string> = {
  "home": "landingPage",
  "homepage": "landingPage",
  "landing": "landingPage",
  "about": "aboutPage",
  "about-us": "aboutPage",
  "turnkey": "turnkeyPage",
  "turnkey-solutions": "turnkeyPage",
  "consultancy": "consultancyPage",
  "solutions": "solutionsPage",
  "custom-solutions": "solutionsPage",
  "product": "productsPage",
  "products": "productsPage",
  "project": "projectsPage",
  "projects": "projectsPage",
  "projects-and-clients": "projectsPage",
  "blog": "blogPage",
  "blogs": "blogPage",
  "career": "careersPage",
  "careers": "careersPage",
  "contact": "contactPage",
  "contact-us": "contactPage",
  "enquiry": "enquiryPage",
  "privacy": "privacyPolicyPage",
  "privacy-policy": "privacyPolicyPage",
  "terms": "termsAndConditionsPage",
  "terms-and-conditions": "termsAndConditionsPage",
};

export function findCmsPageByRouteKey(pages: CmsPage[], routeKey?: string): CmsPage | undefined {
  if (!routeKey) return undefined;
  const decoded = decodeURIComponent(routeKey).toLowerCase().trim();
  const numericId = Number(decoded);

  // 1. Numeric ID
  if (Number.isInteger(numericId)) {
    const byId = pages.find((p) => p.id === numericId);
    if (byId) return byId;
  }

  // 2. Direct alias mapping
  const aliasConfigKey = routeAliases[decoded];
  if (aliasConfigKey) {
    const byAlias = pages.find((p) => p.configKey?.toLowerCase() === aliasConfigKey.toLowerCase());
    if (byAlias) return byAlias;
  }

  // 3. Exact route key from title
  const byTitleRouteKey = pages.find((p) => getCmsPageRouteKey(p) === decoded);
  if (byTitleRouteKey) return byTitleRouteKey;

  // 4. Exact configKey
  const byConfigKey = pages.find((p) => p.configKey && p.configKey.toLowerCase() === decoded);
  if (byConfigKey) return byConfigKey;

  // 5. Full slug match (e.g. /about-us or about-us)
  const bySlug = pages.find((p) => {
    const cleanSlug = p.slug.replace(/^\//, "").toLowerCase();
    return cleanSlug && cleanSlug === decoded;
  });
  if (bySlug) return bySlug;

  // 6. Last segment of slug
  const byLastSegment = pages.find((p) => {
    const cleanSlug = p.slug.replace(/^\//, "").toLowerCase();
    const lastPart = cleanSlug.split("/").pop()?.toLowerCase();
    return lastPart && lastPart === decoded;
  });
  if (byLastSegment) return byLastSegment;

  // 7. Slug with slashes converted to hyphens
  const byHyphenatedSlug = pages.find((p) => {
    const cleanSlug = p.slug.replace(/^\//, "").toLowerCase().replace(/\//g, "-");
    return cleanSlug && cleanSlug === decoded;
  });
  if (byHyphenatedSlug) return byHyphenatedSlug;

  // 8. Loose / partial search on routeKey or title
  const byPartial = pages.find((p) => {
    const pageRouteKey = getCmsPageRouteKey(p);
    return pageRouteKey.includes(decoded) || decoded.includes(pageRouteKey);
  });
  if (byPartial) return byPartial;

  return undefined;
}

type SettingsPageConfig = {
  publishedAt?: string;
  lastUpdated?: string;
  updatedBy?: string;
  status?: PageStatus;
  visibility?: "Public" | "Private";
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
    canonicalUrl?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    h1Tag?: string;
    breadcrumbName?: string;
    schemaMarkup?: string;
    robotsIndex?: boolean;
    robotsFollow?: boolean;
    canonicalTag?: string;
    openGraphTags?: string;
    isActive?: boolean;
  };
  sections?: Array<{ enabled?: boolean }>;
};

export function formatPublishDate(dateString?: string | Date): string {
  if (!dateString) return "Not published";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return String(dateString);
  return (
    date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    ", " +
    date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  );
}

export const pageDefinitions = [
  ["landingPage", "Home - Premium Wellness & Panchkarma", "/", "home"],
  ["aboutPage", "About Us - Heritage & Craftsmanship", "/about-us", "page"],
  ["turnkeyPage", "Turnkey Solutions - Clinic & Spa Setup", "/turnkey", "page"],
  ["consultancyPage", "Consultancy Services - Healthcare Design", "/consultancy", "page"],
  ["solutionsPage", "Custom Solutions & Engineering", "/solutions", "page"],
  ["productsPage", "Products Catalog - Ayurvedic Equipment", "/products", "page"],
  ["projectsPage", "Projects & Clients Portfolio", "/projects-and-clients", "page"],
  ["blogPage", "Blogs & Ayurvedic Insights", "/blog", "page"],
  ["careersPage", "Careers & Join Our Team", "/career", "page"],
  ["contactPage", "Contact Us & Global Enquiries", "/contact", "page"],
  ["enquiryPage", "Product & Custom Quotation Enquiries", "/enquiry", "page"],
  ["privacyPolicyPage", "Privacy Policy", "/privacy-policy", "page"],
  ["termsAndConditionsPage", "Terms & Conditions", "/terms-and-conditions", "page"],
] as const;

function seoScore(config: SettingsPageConfig): number {
  const seo = config.seo ?? {};
  const checks = [
    Boolean(seo.metaTitle?.trim()),
    Boolean(seo.metaDescription?.trim()),
    Boolean(seo.h1Tag?.trim()),
    Boolean(seo.schemaMarkup?.trim()),
    seo.robotsIndex !== false,
    Boolean(config.sections?.length),
    Boolean(config.sections?.some((section) => section.enabled !== false)),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

export function cmsPagesFromSettings(settings: Record<string, unknown>): CmsPage[] {
  const globalUpdatedAt = typeof settings.updatedAt === "string" ? new Date(settings.updatedAt) : new Date();
  const globalCreatedAt = typeof settings.createdAt === "string" ? new Date(settings.createdAt) : globalUpdatedAt;

  return pageDefinitions.map(([key, title, slug, type], index) => {
    const config = (settings[key] as SettingsPageConfig | undefined) ?? {};
    const score = seoScore(config);
    const status: PageStatus = config.status
      ? config.status
      : (config.sections && config.sections.length > 0
        ? (config.sections.some((section) => section.enabled !== false) ? "Published" : "Draft")
        : "Published");

    const publishedDateStr = config.publishedAt || globalCreatedAt.toISOString();
    const updatedDateStr = config.lastUpdated || (config.publishedAt ? config.publishedAt : globalUpdatedAt.toISOString());
    const authorName = config.updatedBy || "Ensis Admin";

    return {
      id: index + 1,
      configKey: key,
      title,
      slug,
      author: authorName,
      status,
      visibility: config.visibility || "Public",
      publishedAt: publishedDateStr,
      lastUpdated: updatedDateStr,
      seoScore: score > 0 ? score : 95,
      rating: score >= 90 ? "Excellent" : score >= 75 ? "Good" : "Needs Work",
      updated: formatPublishDate(updatedDateStr),
      updatedBy: authorName,
      type,
      adminEditUrl: `/pages/${key}/edit`,
      seo: {
        metaTitle: config.seo?.metaTitle || `${title} | Ensis Wellness Spaces`,
        metaDescription: config.seo?.metaDescription || "Leading manufacturer of Ayurvedic Panchkarma equipment and turnkey spa setups.",
        metaKeywords: config.seo?.metaKeywords || "panchkarma equipment, droni table, shirodhara stand, ayurvedic equipment",
        canonicalUrl: config.seo?.canonicalUrl || `https://ensis.in${slug === "/" ? "" : slug}`,
        ogTitle: config.seo?.ogTitle || title,
        ogDescription: config.seo?.ogDescription || "Ensis Premium Panchkarma & Wellness Spaces",
        ogImage: config.seo?.ogImage || "/ensis-logo.webp",
        h1Tag: config.seo?.h1Tag || title.split(" - ")[0],
        breadcrumbName: config.seo?.breadcrumbName || title.split(" - ")[0],
        robotsIndex: config.seo?.robotsIndex !== false,
        robotsFollow: config.seo?.robotsFollow !== false,
        isActive: true,
        ...config.seo,
      },
    };
  });
}

export function getCmsPageDefinition(id: number) {
  const definition = pageDefinitions[id - 1];
  if (!definition) return null;
  const [configKey, title, slug, type] = definition;
  return { configKey, title, slug, type };
}

export const cmsPages: CmsPage[] = cmsPagesFromSettings({});
