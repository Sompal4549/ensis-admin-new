import { ApiRequestError, api } from "./api";

// Admin SEO client. Every screen reads the backend SEO audit (/seo/audits/...); there is no
// client-side or sample fallback, so errors reach the screens and "no audit yet" is explicit.

export type SeoSeverity = "critical" | "warning" | "notice";

export type SeoSeverity = "critical" | "warning" | "notice";

export interface SeoScores {
  overall: number | null;
  technical: number | null;
  onPage: number | null;
  content: number | null;
  performance: number | null;
  visibility: number | null;
}

export interface SeoIssueCounts {
  critical: number;
  warning: number;
  notice: number;
  total: number;
}

export interface SeoIssue {
  id: string;
  ruleId: string;
  category: string;
  severity: SeoSeverity;
  title: string;
  detail: string;
  evidence: Record<string, unknown>;
  url?: string | null;
  scope?: string;
  firstSeenAt: string;
  lastSeenAt: string;
}
export interface SeoPageFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: "2xx" | "3xx" | "4xx" | "5xx" | "error";
  indexable?: boolean;
  severity?: SeoSeverity;
  issueCategory?: string;
  hasBrokenLinks?: boolean;
  orphan?: boolean;
  sortBy?: string;
  sortDir?: "asc" | "desc";
}

export interface SeoPagesResponse {
  pages: SeoPageRow[];
  message: string | null;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SeoPageRow {
  id: string;
  url: string;
  path: string;
  title: string | null;
  titleLength: number;
  titleStatus: "missing" | "too_short" | "too_long" | "ok";
  metaDescription: string | null;
  metaDescriptionLength: number;
  descriptionStatus: "missing" | "too_short" | "too_long" | "ok";
  httpStatus: number | null;
  indexable: boolean;
  indexabilityReason: string | null;
  canonical: string | null;
  canonicalStatus: "missing" | "self" | "points_elsewhere" | "unknown";
  score: number | null;
  issueCounts: SeoIssueCounts;
  issueCategories: string[];
  h1: string[];
  h1Status: "missing" | "multiple" | "hierarchy_error" | "hierarchy_warning" | "ok";
  hierarchyStatus: string;
  headingCounts: Record<string, number>;
  wordCount: number;
  inLinks: number;
  outLinks: number;
  brokenLinks: number;
  depth: number | null;
  isOrphan: boolean;
  inSitemap: boolean;
  schemaTypes: string[];
  schemaStatus: "none" | "invalid" | "valid" | "valid_with_breadcrumb";
  imageCount: number;
  imagesMissingAlt: number;
  responseTimeMs: number | null;
  keywordStatus: "ok" | "warning" | "not_available";
  openGraphStatus: "valid" | "incomplete" | "not_available";
  twitterStatus: "valid" | "incomplete" | "not_available";
  consoleErrorCount: number;
  failedRequestCount: number;
  renderBlockingCount: number;
  cdnStatus: "detected" | "likely" | "no_indicators" | "unable_to_determine";
  performance: {
    score: number | null;
    lcpMs: number | null;
    cls: number | null;
    isFieldData: boolean;
    fetchedAt: string | null;
  };
  search: { clicks: number; impressions: number; ctr: number; position: number; updatedAt: string | null } | null;
  analytics: { views: number; users: number; engagementRate: number | null } | null;
  lastCrawledAt: string | null;
}

export interface SeoRecommendationItem {
  ruleId: string | null;
  category?: string;
  title: string;
  whyItMatters: string;
  priority: "high" | "medium" | "low";
  recommendedFix: string;
  implementation: string;
  suggestedTitle: string | null;
  suggestedDescription: string | null;
  headingSuggestions: string[];
  internalLinkSuggestions: Array<{ fromOrTo: string; anchorText: string; reason: string }>;
  contentSuggestions: string[];
  schemaSuggestion: string | null;
}

export interface SeoRouteTelemetry {
  routeScore: number;
  indexableWords: number;
  internalLinks: number;
  lcpSeconds: number;
  cls: number;
  searchConsole: { clicks: number; impressions: number; ctr: number; position: number };
  crawlerIssue: string;
}

export interface PageSpeedAudit {
  ok: boolean;
  message?: string;
  url: string;
  strategy: "mobile" | "desktop";
  fetchedAt: string;
  cached: boolean;
  scores: {
    performance: number | null;
    accessibility: number | null;
    bestPractices: number | null;
    seo: number | null;
  };
  metrics: {
    fcpMs: number | null;
    lcpMs: number | null;
    tbtMs: number | null;
    cls: number | null;
    siMs: number | null;
    ttfbMs: number | null;
    htmlKb: number | null;
    payloadKb: number | null;
    totalRequests: number | null;
    domNodes: number | null;
    imageRequests: number | null;
    javascriptKb: number | null;
    cssKb: number | null;
    fontKb: number | null;
    otherKb: number | null;
  };
  fieldData: { available: boolean; overall: string | null };
}

export interface SeoRecommendation {
  id: string;
  scope: string;
  url: string | null;
  route?: string | null;
  provider: string;
  providerAvailable?: boolean;
  model: string;
  summary: string | null;
  positiveSignals?: string[];
  items: SeoRecommendationItem[];
  telemetry?: SeoRouteTelemetry | null;
  status: string;
  error: string | null;
  generatedAt: string;
}

export interface SeoRecommendationResponse {
  status: "ok" | "cached" | "not_configured" | "error" | "no_data";
  message: string | null;
  recommendation: SeoRecommendation | null;
}

export interface SeoPageDetail {
  page: SeoPageRow & {
    metaRobots: string | null;
    canonicalNormalized: string | null;
    canonicalCount: number;
    ogTitle: string | null;
    ogDescription: string | null;
    ogImage: string | null;
    ogType: string | null;
    ogUrl: string | null;
    twitterCard: string | null;
    twitterTitle: string | null;
    twitterDescription: string | null;
    twitterImage: string | null;
    metaKeywords: string | null;
    metaKeywordCount: number;
    socialStatus: { openGraph: string; twitter: string };
    keywordAnalysis: {
      available: boolean;
      targets: Array<{
        keyword: string;
        source: string;
        presentInTitle: boolean;
        presentInMetaDescription: boolean;
        presentInH1: boolean;
        presentInHeadings: boolean;
        presentInOpeningContent: boolean;
        presentInImageAlt: boolean;
        presentInInternalAnchor: boolean;
        exactMentions: number;
        totalWordCount: number;
        densityPercent: number;
      }>;
    };
    browserHealth: Record<
      "consoleErrors" | "consoleWarnings" | "jsExceptions" | "failedRequests",
      Array<{
        url: string;
        message: string;
        type: string;
        resourceUrl: string | null;
        resourceType: string | null;
        statusCode: number | null;
        timestamp: string;
      }>
    >;
    cdn: { status: string; provider: string | null; evidence: string[]; cacheControl: string | null; server: string | null };
    lang: string | null;
    viewport: string | null;
    hreflang: Array<{ hreflang: string; href: string }>;
    headingSequence: Array<{ level: number; text: string }>;
    headingIssues: string[];
    h2: string[];
    h3: string[];
    images: Array<{ src: string; alt: string | null; hasAlt: boolean; isDecorative: boolean; loading: string | null; width: number | null; height: number | null }>;
    imagesEmptyAlt: number;
    imagesLazyLoaded: number;
    imagesWithoutDimensions: number;
    schemas: Array<{ types: string[]; valid: boolean; errors: string[]; warnings: string[] }>;
    breadcrumbIssues: string[];
    scoreBreakdown: Array<{ category: string; score: number; weight: number }>;
    contentType: string | null;
    finalUrl: string | null;
    redirected: boolean;
    fetchError: string | null;
    renderedWithJs: boolean;
    internalLinkCount: number;
    externalLinkCount: number;
    nofollowLinkCount: number;
    mixedContentLinkCount: number;
  };
  issues: SeoIssue[];
  links: {
    incoming: Array<{ source: string; anchorText: string; isNofollow: boolean }>;
    outgoing: Array<{
      target: string;
      normalizedTarget: string;
      anchorText: string;
      rel: string | null;
      isInternal: boolean;
      isNofollow: boolean;
      httpStatus: number | null;
      statusClass: string;
      isBroken: boolean;
      redirectsTo: string | null;
      redirectHops: number;
    }>;
    brokenOutgoing: number;
    redirectingOutgoing: number;
  };
  redirectChain: {
    hops: Array<{ url: string; status: number | null }>;
    hopCount: number;
    finalUrl: string | null;
    finalStatus: number | null;
    severity: string;
    issues: string[];
  } | null;
  performance: {
    audits: Array<{
      id: string;
      strategy: string;
      status: string;
      error: string | null;
      lighthouseVersion: string | null;
      lab: Record<string, number | null>;
      field: { available: boolean; source: string | null } & Record<string, unknown>;
      opportunities: Array<{ id: string; title: string; savingsMs: number | null }>;
      renderBlockingResources: Array<{ url: string | null; type: string; savingsMs: number | null; source: string }>;
      fetchedAt: string;
    }>;
    labNote: string;
    fieldNote: string;
  };
  search: {
    available: boolean;
    rangeStart: string | null;
    rangeEnd: string | null;
    metric: string;
    totals: { clicks: number; impressions: number; ctr: number; position: number } | null;
    topQueries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>;
  };
  history: Array<{
    capturedAt: string;
    score: number | null;
    issueCounts: SeoIssueCounts;
    wordCount: number;
    httpStatus: number | null;
    performanceScore: number | null;
    lcpMs: number | null;
    cls: number | null;
    clicks: number | null;
    impressions: number | null;
    position: number | null;
  }>;
  recommendation: SeoRecommendation | null;
}


/** Latest site audit as returned by GET /seo/audits/latest */
export interface SeoOverview {
  hasData: boolean;
  siteUrl: string;
  message: string | null;
  running: {
    id: string;
    status: string;
    startedAt: string | null;
    progress: { done: number; total: number };
  } | null;
  lastFailure: { id: string; error: string; completedAt: string | null } | null;
  openAlerts: number;
  audit: {
    id: string;
    status: string;
    trigger: string;
    startedAt: string | null;
    completedAt: string | null;
    durationMs: number | null;
    robotsFound: boolean;
    sitemapFound: boolean;
    sitemapUrlCount: number;
    score: number | null;
    stats: { pages: number; errors: number; critical: number; warning: number; notice: number };
  } | null;
  previousScore: number | null;
  scores: Omit<SeoScores, "visibility"> | null;
  counts: {
    urlsCrawled: number;
    errorPages: number;
    indexablePages: number;
    healthyPages: number;
    criticalIssues: number;
    warnings: number;
    notices: number;
    pagesMissingTitle: number;
    pagesMissingDescription: number;
    pagesMissingH1: number;
    pagesMissingCanonical: number;
    redirectingPages: number;
    share700Words: number | null;
    shareScore90: number | null;
    shareMetaOk: number | null;
    shareImagesWithAlt: number | null;
  } | null;
  topIssues: Array<{ ruleId: string; severity: SeoSeverity; category: string; title: string; affectedPages: number }>;
  scoreExplanation: SeoScoreExplanation | null;
  history: Array<{
    id: string;
    completedAt: string | null;
    score: number | null;
    stats: { pages: number; errors: number; critical: number; warning: number; notice: number };
  }>;
}

export interface SeoScoreExplanation {
  overall: number | null;
  categories: Array<{
    category: string;
    score: number | null;
    rawPenalty: number;
    issueCount: number;
    contributions: Array<{ ruleId: string; title: string; severity: SeoSeverity; count: number; penalty: number }>;
  }>;
  formula: {
    severityPenalty: Record<SeoSeverity, number>;
    pagesConsidered: number;
    description: string;
  };
}

/** An audited URL that failed or returned 4xx/5xx (GET /seo/broken-links) */
export interface SeoBrokenLink {
  url: string;
  path: string;
  httpStatus: number | null;
  statusClass: string;
  isInternal: boolean;
  error: string | null;
}

export interface SeoAlert {
  id: string;
  type: string;
  severity: SeoSeverity;
  title: string;
  message: string;
  url: string | null;
  acknowledged: boolean;
  acknowledgedAt: string | null;
  acknowledgedBy: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface SeoCompetitor {
  id: string;
  url: string;
  label: string;
  isActive: boolean;
  lastCrawlAt: string | null;
  lastScore: number | null;
}

export interface SeoCompetitorComparison {
  primary: { label: string; url: string; observed: Record<string, number | null> };
  competitors: Array<{ siteId: string; label: string; url: string; observed: Record<string, number | null> }>;
}


// ---------- Backend page shape and mapping to the admin table/detail types ----------

interface AuditIssueDto {
  ruleId: string;
  severity: SeoSeverity;
  title: string;
  detail: string;
  category: string;
}

interface AuditPageDto {
  id: string;
  url: string;
  path: string;
  httpStatus: number | null;
  finalUrl: string | null;
  redirected: boolean;
  responseTimeMs: number | null;
  contentType: string | null;
  title: string | null;
  titleLength: number;
  metaDescription: string | null;
  metaDescriptionLength: number;
  metaRobots: string | null;
  canonical: string | null;
  h1: string[];
  h2Count: number;
  wordCount: number;
  imageCount: number;
  imagesMissingAlt: number;
  lang: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  hasJsonLd: boolean;
  error: string | null;
  score: number | null;
  issues: AuditIssueDto[];
  issueCounts: SeoIssueCounts;
  issueCategories: string[];
  indexable: boolean;
  indexabilityReason: string | null;
}

interface AuditPagesDto {
  auditId: string | null;
  completedAt: string | null;
  message: string | null;
  pages: AuditPageDto[];
  meta: SeoPagesResponse["meta"];
}

interface AuditPageDetailDto {
  auditId: string;
  completedAt: string | null;
  page: AuditPageDto;
  history: Array<{
    capturedAt: string | null;
    score: number | null;
    issueCounts: SeoIssueCounts;
    wordCount: number;
    httpStatus: number | null;
    responseTimeMs: number | null;
  }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  metadata: "Metadata",
  indexing: "Indexing",
  canonical: "Canonical",
  headings: "Headings",
  images: "Images",
  content: "Content",
  structure: "Structure",
  performance: "Performance",
};

const hasRule = (page: AuditPageDto, ruleId: string) => page.issues.some((issue) => issue.ruleId === ruleId);
const isFetched = (page: AuditPageDto) => !page.error && page.httpStatus !== null && page.httpStatus < 400;

const lengthStatus = (page: AuditPageDto, value: string | null, prefix: string): SeoPageRow["titleStatus"] => {
  if (!value) return "missing";
  if (hasRule(page, `${prefix}_too_short`)) return "too_short";
  if (hasRule(page, `${prefix}_too_long`)) return "too_long";
  return "ok";
};

const normalizeUrl = (value: string) => {
  try {
    const url = new URL(value);
    return `${url.protocol}//${url.host.toLowerCase()}${url.pathname.replace(/\/+$/, "") || "/"}`;
  } catch {
    return value;
  }
};

const canonicalStatus = (page: AuditPageDto): SeoPageRow["canonicalStatus"] => {
  if (!isFetched(page)) return "unknown";
  if (!page.canonical) return "missing";
  const canonical = normalizeUrl(page.canonical);
  return canonical === normalizeUrl(page.url) || (page.finalUrl && canonical === normalizeUrl(page.finalUrl))
    ? "self"
    : "points_elsewhere";
};

function toPageRow(page: AuditPageDto, crawledAt: string | null): SeoPageRow {
  const fetched = isFetched(page);
  const h1Status: SeoPageRow["h1Status"] = page.h1.length === 0 ? "missing" : page.h1.length > 1 ? "multiple" : "ok";
  return {
    id: page.id,
    url: page.url,
    path: page.path,
    title: page.title,
    titleLength: page.titleLength,
    titleStatus: lengthStatus(page, page.title, "title"),
    metaDescription: page.metaDescription,
    metaDescriptionLength: page.metaDescriptionLength,
    descriptionStatus: lengthStatus(page, page.metaDescription, "meta_desc"),
    httpStatus: page.httpStatus,
    indexable: page.indexable,
    indexabilityReason: page.indexabilityReason,
    canonical: page.canonical,
    canonicalStatus: canonicalStatus(page),
    score: page.score,
    issueCounts: page.issueCounts,
    issueCategories: page.issueCategories.map((category) => CATEGORY_LABELS[category] ?? category),
    h1: page.h1,
    h1Status,
    hierarchyStatus: h1Status,
    headingCounts: { h1: page.h1.length, h2: page.h2Count },
    wordCount: page.wordCount,
    // Link graph, browser and CDN data are not collected by the crawler
    inLinks: 0,
    outLinks: 0,
    brokenLinks: 0,
    depth: null,
    isOrphan: false,
    inSitemap: false,
    schemaTypes: page.hasJsonLd ? ["JSON-LD"] : [],
    schemaStatus: page.hasJsonLd ? "valid" : "none",
    imageCount: page.imageCount,
    imagesMissingAlt: page.imagesMissingAlt,
    responseTimeMs: page.responseTimeMs,
    keywordStatus: "not_available",
    openGraphStatus: !fetched ? "not_available" : page.ogTitle && page.ogImage ? "valid" : "incomplete",
    twitterStatus: "not_available",
    consoleErrorCount: 0,
    failedRequestCount: 0,
    renderBlockingCount: 0,
    cdnStatus: "unable_to_determine",
    performance: { score: null, lcpMs: null, cls: null, isFieldData: false, fetchedAt: null },
    search: null,
    analytics: null,
    lastCrawledAt: crawledAt,
  };
}

function toPageDetail(dto: AuditPageDetailDto): SeoPageDetail {
  const source = dto.page;
  const row = toPageRow(source, dto.completedAt);
  const seenAt = dto.completedAt ?? new Date(0).toISOString();
  const pageScoreFor = (categories: string[]) =>
    Math.max(
      0,
      100 -
        source.issues
          .filter((issue) => categories.includes(issue.category))
          .reduce((sum, issue) => sum + ({ critical: 15, warning: 5, notice: 1 } as const)[issue.severity], 0),
    );

  return {
    page: {
      ...row,
      metaRobots: source.metaRobots,
      canonicalNormalized: source.canonical ? normalizeUrl(source.canonical) : null,
      canonicalCount: source.canonical ? 1 : 0,
      ogTitle: source.ogTitle,
      ogDescription: source.ogDescription,
      ogImage: source.ogImage,
      ogType: null,
      ogUrl: null,
      twitterCard: null,
      twitterTitle: null,
      twitterDescription: null,
      twitterImage: null,
      metaKeywords: null,
      metaKeywordCount: 0,
      socialStatus: { openGraph: row.openGraphStatus, twitter: "not_available" },
      keywordAnalysis: { available: false, targets: [] },
      browserHealth: { consoleErrors: [], consoleWarnings: [], jsExceptions: [], failedRequests: [] },
      cdn: { status: "unable_to_determine", provider: null, evidence: [], cacheControl: null, server: null },
      lang: source.lang,
      viewport: null,
      hreflang: [],
      headingSequence: source.h1.map((text) => ({ level: 1, text })),
      headingIssues: source.issues.filter((issue) => issue.category === "headings").map((issue) => issue.detail),
      h2: [],
      h3: [],
      images: [],
      imagesEmptyAlt: 0,
      imagesLazyLoaded: 0,
      imagesWithoutDimensions: 0,
      schemas: source.hasJsonLd ? [{ types: ["JSON-LD"], valid: true, errors: [], warnings: [] }] : [],
      breadcrumbIssues: [],
      scoreBreakdown: [
        { category: "Technical", score: pageScoreFor(["indexing", "structure", "canonical"]), weight: 0 },
        { category: "On-page", score: pageScoreFor(["metadata", "headings"]), weight: 0 },
        { category: "Content", score: pageScoreFor(["content", "images"]), weight: 0 },
        { category: "Performance", score: pageScoreFor(["performance"]), weight: 0 },
      ],
      contentType: source.contentType,
      finalUrl: source.finalUrl,
      redirected: source.redirected,
      fetchError: source.error,
      renderedWithJs: false,
      internalLinkCount: 0,
      externalLinkCount: 0,
      nofollowLinkCount: 0,
      mixedContentLinkCount: 0,
    },
    issues: source.issues.map((issue) => ({
      id: `${source.id}:${issue.ruleId}`,
      ruleId: issue.ruleId,
      category: CATEGORY_LABELS[issue.category] ?? issue.category,
      severity: issue.severity,
      title: issue.title,
      detail: issue.detail,
      evidence: {},
      url: source.url,
      scope: "page",
      firstSeenAt: seenAt,
      lastSeenAt: seenAt,
    })),
    links: { incoming: [], outgoing: [], brokenOutgoing: 0, redirectingOutgoing: 0 },
    redirectChain: source.redirected
      ? {
          hops: [
            { url: source.url, status: null },
            { url: source.finalUrl ?? source.url, status: source.httpStatus },
          ],
          hopCount: 1,
          finalUrl: source.finalUrl,
          finalStatus: source.httpStatus,
          severity: "notice",
          issues: source.issues.filter((issue) => issue.ruleId === "redirected").map((issue) => issue.detail),
        }
      : null,
    performance: {
      audits: [],
      labNote: "Lighthouse data comes from the live PageSpeed check shown in the header.",
      fieldNote: "",
    },
    search: {
      available: false,
      rangeStart: null,
      rangeEnd: null,
      metric: "Google Search Console is not connected.",
      totals: null,
      topQueries: [],
    },
    history: dto.history.map((item) => ({
      capturedAt: item.capturedAt ?? seenAt,
      score: item.score,
      issueCounts: item.issueCounts,
      wordCount: item.wordCount,
      httpStatus: item.httpStatus,
      performanceScore: null,
      lcpMs: null,
      cls: null,
      clicks: null,
      impressions: null,
      position: null,
    })),
    recommendation: null,
  };
}

/** Readable message for SEO API errors (503 = OpenAI key missing, 502 = OpenAI failed). */
export function seoErrorMessage(caught: unknown, fallback = "Request failed"): string {
  if (caught instanceof ApiRequestError) {
    if (caught.status === 503) {
      return /OPENAI_API_KEY/i.test(caught.message)
        ? caught.message
        : `AI recommendations are not configured on the server (OPENAI_API_KEY missing). ${caught.message}`;
    }
    if (caught.status === 502) return `OpenAI could not complete the request: ${caught.message}`;
    return caught.message || fallback;
  }
  return caught instanceof Error && caught.message ? caught.message : fallback;
}

const toQuery = (filters?: SeoPageFilters) => {
  const params = new URLSearchParams();
  Object.entries(filters ?? {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : "";
};

export const seoAuditApi = {
  /** Latest completed site audit plus the running one (for progress). `hasData` is false before the first audit. */
  overview: () => api.get<SeoOverview>("/seo/audits/latest"),
  pages: async (filters?: SeoPageFilters): Promise<SeoPagesResponse> => {
    const response = await api.get<AuditPagesDto>(`/seo/audits/latest/pages${toQuery(filters)}`);
    return {
      pages: response.pages.map((page) => toPageRow(page, response.completedAt)),
      message: response.message,
      meta: response.meta,
    };
  },
  page: async (id: string): Promise<SeoPageDetail> =>
    toPageDetail(await api.get<AuditPageDetailDto>(`/seo/audits/latest/pages/${encodeURIComponent(id)}`)),
  /**
   * Live Google PageSpeed Insights (Lighthouse) audit for one route.
   * Runs server-side through /pagespeed and is cached there for 6 hours.
   */
  pagespeed: async (
    url: string,
    strategy: "mobile" | "desktop" = "mobile",
    refresh = false,
  ): Promise<PageSpeedAudit> => {
    const params = new URLSearchParams({ url, strategy });
    if (refresh) params.set("refresh", "1");
    try {
      const response = await fetch(`/pagespeed?${params.toString()}`, { cache: "no-store" });
      const data = (await response.json()) as PageSpeedAudit;
      return data;
    } catch (caught) {
      // An explicit "unavailable" result (ok: false, every value null), shown as an error by the screens
      return {
        ok: false,
        message: caught instanceof Error ? caught.message : "PageSpeed Insights is unreachable",
        url,
        strategy,
        fetchedAt: new Date().toISOString(),
        cached: false,
        scores: { performance: null, accessibility: null, bestPractices: null, seo: null },
        metrics: { fcpMs: null, lcpMs: null, tbtMs: null, cls: null, siMs: null, ttfbMs: null, htmlKb: null, payloadKb: null, totalRequests: null, domNodes: null, imageRequests: null, javascriptKb: null, cssKb: null, fontKb: null, otherKb: null },
        fieldData: { available: false, overall: null },
      };
    }
  },
  brokenLinks: () =>
    api.get<{ auditId: string | null; completedAt: string | null; links: SeoBrokenLink[] }>("/seo/broken-links"),
  alerts: (includeAcknowledged = false) =>
    api.get<SeoAlert[]>(`/seo/alerts${includeAcknowledged ? "?includeAcknowledged=true" : ""}`),
  competitors: () => api.get<SeoCompetitor[]>("/seo/competitors"),
  competitorComparison: () => api.get<SeoCompetitorComparison>("/seo/competitors/comparison"),
  startAudit: () => api.post<{ crawlId: string; status: string }>("/seo/audits", {}),
  /** OpenAI site plan. Resolves with status "no_data" when there is no audit; throws 503/502 otherwise. */
  generateSiteRecommendation: () =>
    api.post<SeoRecommendationResponse>("/seo/recommendations/site", {}, { timeoutMs: 90_000 }),
  generatePageRecommendation: (id: string) =>
    api.post<SeoRecommendationResponse>(`/seo/recommendations/pages/${encodeURIComponent(id)}`, {}, { timeoutMs: 90_000 }),
  updateSeo: (pageId: string, data: { metaTitle?: string; metaDescription?: string }) =>
    api.post(`/seo/update`, { page: pageId, ...data }),
  acknowledgeAlert: (id: string) => api.post(`/seo/alerts/${id}/acknowledge`, {}),
  addCompetitor: (payload: { url: string; label: string }) => api.post<SeoCompetitor>("/seo/competitors", payload),
  deleteCompetitor: (id: string) => api.delete<{ id: string }>(`/seo/competitors/${id}`),
  auditCompetitor: (id: string) => api.post(`/seo/competitors/${id}/audit`, {}),
};
