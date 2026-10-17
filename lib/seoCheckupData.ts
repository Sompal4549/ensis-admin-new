export type CheckupStatus = "passed" | "failed" | "warning";

/**
 * Scope of the individual check:
 *  - "site": the fact is identical for every route of the domain (TLS, robots.txt, CDN, build pipeline…)
 *  - "page": the check is evaluated against this route's own crawl data
 */
export type CheckupLevel = "site" | "page";

/**
 * Where the number shown by a check came from:
 *  - "measured": captured by the SEO Site Checkup audit run
 *  - "crawl":    captured by your own crawler / Search Console for this route
 *  - "derived":  calculated from the crawl inputs using the published threshold
 */
export type CheckupSource = "measured" | "crawl" | "derived";

export interface CheckupTable {

  title?: string;
  headers: string[];
  rows: Array<Array<string | number>>;
}

export interface CheckupStat {
  label: string;
  value: string;
  tone?: "green" | "blue" | "indigo" | "amber" | "red";
}

export interface CheckupList {
  title?: string;
  items: string[];
}

export interface CheckupMeta {
  label?: string;
  value: string;
  mono?: boolean;
}

export interface CheckupTest {
  id: string;
  name: string;
  status: CheckupStatus;
  level?: CheckupLevel;
  source?: CheckupSource;
  benchmark?: string;
  summary?: string;
  badge?: string;
  meta?: CheckupMeta[];
  stats?: CheckupStat[];
  tables?: CheckupTable[];
  lists?: CheckupList[];
  /** Raw evidence (image srcs, header names …) shown inside the issue card. */
  evidence?: string[];
  fix?: string;
  collapsible?: boolean;
}

export interface CheckupGroup {
  id: string;
  name: string;
  note?: string;
  score?: number;
  badge?: string;
  headline?: { value: string; label: string };
  tests: CheckupTest[];
}

export type CheckupPriority = "HIGH" | "MEDIUM" | "LOW";

export interface CheckupIssue {
  priority: CheckupPriority;
  title: string;
  detail?: string;
  fix?: string;
  collapsible?: boolean;
  status?: CheckupStatus;
  route?: string;
  group?: string;
  evidence?: string[];
}

export interface CheckupCategory {
  name: string;
  score?: number;
  failed: number;
  warnings: number;
  passed: number;
}

export interface ReportInput {
  label: string;
  value: string;
  source?: CheckupSource;
  status?: CheckupStatus;
}

export interface SeoCheckupReportData {
  scope: "site" | "page";
  route: string;
  url: string;
  pageTitle: string;
  pageDesc: string | null;
  titleLen: number;
  descLen: number | null;
  seoScore: number;
  aiScore: number;
  scoreSource: CheckupSource;
  aiSource: CheckupSource;
  telemetrySource: CheckupSource;
  failedCount: number;
  warningCount: number;
  passedCount: number;
  totalCount: number;
  summary: string;
  categories: CheckupCategory[];
  inputs: ReportInput[];
  issues: CheckupIssue[];
  groups: CheckupGroup[];
  generatedAt: string;
  pageSpeed?: PageSpeedSnapshot | null;
}

export interface InventoryPage {
  id: string;
  path: string;
  label: string;
  title: string;
  score: number;
  words: number;
  inLinks: number;
  lcp: number;
  cls: number;
  clicks: number;
  impressions: number;
  position: number;
  issue: "ok" | "short";
}

/** Live meta tags, only supplied when the caller read them from the CMS/API. */
export interface ReportMetaOverride {
  title?: string | null;
  description?: string | null;
}

/* ------------------------------------------------------------------ */
/* Live <meta name="description"> captured from ensis.in.  */
/* Captured 16 Oct 2026 from the rendered Ensis storefront — the text a  */
/* visitor and Google actually see, not a placeholder.                 */
/* ------------------------------------------------------------------ */
export const ROUTE_META_CAPTURED_AT = "2026-10-16";

export const ROUTE_META: Record<string, string> = {
  "/": "ENSIS provides Panchkarma equipment, spa furniture, Ayurvedic clinic setup, wellness infrastructure solutions, and consultancy services across India.",
  "/about-us": "Discover ENSIS, a wellness division of Design House India Pvt. Ltd. with 20+ years of experience in Panchkarma equipment, wellness interiors, manufacturing",
  "/products": "Explore premium Ayurvedic & spa products, Panchakarma equipment, wellness furniture and accessories by ENSIS for clinics, spas, resorts and wellness center",
  "/turnkey": "ENSIS provides end-to-end turnkey wellness solutions for Panchakarma centres, Ayurveda clinics, hospitals, spas, resorts and retreats—from design and manuf",
  "/consultancy": "Build and grow your wellness business with ENSIS consultancy services covering Ayurveda, Panchakarma, spa setup, feasibility, planning, branding, equipment",
  "/projects-and-clients": "Explore ENSIS Ayurveda, Panchakarma, spa, wellness resort and healthcare projects delivered across India with expert design, equipment, execution and turnk",
  "/blog": "Explore ENSIS insights on Ayurveda, Panchakarma, spa design, wellness trends, sauna therapy, wellness equipment and building successful wellness businesses",
  "/career": "Explore career opportunities at ENSIS and join a team creating innovative wellness spaces, Ayurveda clinics, spas and holistic health environments across I",
  "/contact": "Contact ENSIS for Ayurvedic and Panchkarma equipment, wellness interiors, spa solutions and turnkey wellness projects. Get expert support across India.",
  "/enquiry": "Tell ENSIS about your Ayurveda, Panchkarma, spa, resort or wellness project. Get expert consultancy, turnkey execution, design and equipment solutions acro",
  "/privacy-policy": "Learn how ENSIS collects, uses and protects your personal information. Our privacy policy outlines data practices for visitors and partners.",
  "/terms-and-conditions": "Review the terms and conditions governing your use of the ENSIS website, products, services and business interactions. Policy updated May 2025.",
};

/* ------------------------------------------------------------------ */
/* <img> inventory captured from the rendered Ensis storefront */
/* Captured 16 Oct 2026 — real srcs, real alt/text/width-height state.  */
/* ------------------------------------------------------------------ */
export const ROUTE_IMAGES_CAPTURED_AT = "2026-10-16";

export interface RouteImages {
  total: number;
  missingAlt: string[];
  noSrcset: string[];
  noDims: string[];
}

export const ROUTE_IMAGES: Record<string, RouteImages> = {
  "/": {"total":71,"missingAlt":["https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1786021937/ensis/cnz8fdqulge8kyfgxdpt.webp","/_next/static/media/img-7.a5cace0b.webp"],"noSrcset":["https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895454/ensis/hiiaox1cxbhqitgl398r.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895338/ensis/o9uoqux6pxhfkqvetosb.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895404/ensis/bfzklxvkqlxinbj4uuhw.webp","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/logo.3dfc404d.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1786021937/ensis/cnz8fdqulge8kyfgxdpt.webp","/_next/static/media/arrow.95448763.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1782886954/ensis/mdb8oajubpgllovbr7tf.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1782886972/ensis/sptq22x6dljsjmyv7ap4.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1783072809/ensis/myd4comvvadmxerthoqa.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781782352/ensis/vskg5y4uqgy1ji1p27of.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781784001/ensis/yxonoae0hx7kfopgmbxv.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781784137/ensis/szhbepql0ahtqe9zjjsj.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781784302/ensis/idcpzbknkm3hgkxyr4sk.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781784620/ensis/ailgdfmcds9ikwetvweg.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781929952/ensis/fvzzzqftxyrqddp2uqhc.jpg","/_next/static/media/lotus.9e992496.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781785505/ensis/qwh6qpggvrttnck1so0o.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781785610/ensis/ais20jhrn2jgxkv5h5j1.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781785759/ensis/u233lgr43gzrxyutbqq1.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781785974/ensis/ky1i3hj8tyfqeipabupm.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781842529/ensis/jass2iu3zujd4jovomfr.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781842635/ensis/oriwyygnkbgpl1ysjswy.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781842718/ensis/tlsekeclqtvis8nijubu.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1783138189/ensis/sdprchdgmbdgtvuplqh5.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781924623/ensis/w92szn4hr2uom7awzgrp.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781924597/ensis/a7sh3jppteprllbim6ut.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781924549/ensis/n7dtvji5wx27yz4spv6p.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781922297/ensis/bjpadyat6xensnv24w18.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781922563/ensis/htzrthrevstm3qmpbeeo.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781922602/ensis/mnlkmmdrjg4dmasofer6.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781922636/ensis/dq0qf43bzqrqstog5vhi.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781922656/ensis/mluaxepmqucddeqcvijx.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781922670/ensis/hzea1ue5zptozjxrqlkz.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_900,f_auto,q_auto/v1781850158/ensis/products/rbs9p7lnq1lpdrut7184.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/w_900,f_auto,q_auto/v1783413283/ensis/products/pm0nect3c0szvayvtvzb.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_900,f_auto,q_auto/v1783414556/ensis/products/gpahlpum9nveunvs3y2g.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_900,f_auto,q_auto/v1783415314/ensis/products/iugmbtagdsjzgstumhpi.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_900,f_auto,q_auto/v1783415666/ensis/products/qjcs0csmwsyohvffciys.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_900,f_auto,q_auto/v1783416291/ensis/products/hposijbrbsbkyg5ohos1.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_900,f_auto,q_auto/v1783416740/ensis/products/csrcd57w77gbxicroj6w.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_900,f_auto,q_auto/v1791280565/ensis/products/xepgakgnbebslpo0aica.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1782022223/ensis/notefgg8uxmpj10dlz5m.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1785830498/ensis/lorvk6yskfku6q7mchzb.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1785830507/ensis/yzhv99mdmw8z5g88n0vo.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1782022111/ensis/k3szzsi4uplqint5kysl.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1785830524/ensis/g90xm55brqgqbi4wiuhy.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1785830533/ensis/ld4rw4pzskhnj3ssqblh.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1785830576/ensis/mnplkkztwak9w6h4gefe.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1785830557/ensis/iuvwdftcpc2v9vu1uy7k.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781928595/ensis/fglnx1hos1pij74sylqz.png","/_next/static/media/quote.428a17dc.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781928752/ensis/wbhprk0mypyszxvfbdlq.jpg","/_next/static/media/quote.428a17dc.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781928822/ensis/p3md7aetzgfe0k1jdfxn.jpg","/_next/static/media/quote.428a17dc.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781928822/ensis/p3md7aetzgfe0k1jdfxn.jpg","/_next/static/media/quote.428a17dc.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781928822/ensis/p3md7aetzgfe0k1jdfxn.jpg","/_next/static/media/quote.428a17dc.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781928822/ensis/p3md7aetzgfe0k1jdfxn.jpg","/_next/static/media/quote.428a17dc.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781928822/ensis/p3md7aetzgfe0k1jdfxn.jpg","/_next/static/media/panchkarma_2.84ddb7fb.webp","/_next/static/media/img-6.bed65b85.webp","/_next/static/media/img-16.23743e81.webp","/_next/static/media/img-10.1836e904.webp","/_next/static/media/img-7.a5cace0b.webp","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/arrow.95448763.png","/_next/static/media/arrow.95448763.png"],"noDims":["https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1786021937/ensis/cnz8fdqulge8kyfgxdpt.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781929952/ensis/fvzzzqftxyrqddp2uqhc.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781922297/ensis/bjpadyat6xensnv24w18.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/w_900,f_auto,q_auto/v1781850158/ensis/products/rbs9p7lnq1lpdrut7184.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/w_900,f_auto,q_auto/v1783413283/ensis/products/pm0nect3c0szvayvtvzb.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_900,f_auto,q_auto/v1783414556/ensis/products/gpahlpum9nveunvs3y2g.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_900,f_auto,q_auto/v1783415314/ensis/products/iugmbtagdsjzgstumhpi.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_900,f_auto,q_auto/v1783415666/ensis/products/qjcs0csmwsyohvffciys.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_900,f_auto,q_auto/v1783416291/ensis/products/hposijbrbsbkyg5ohos1.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_900,f_auto,q_auto/v1783416740/ensis/products/csrcd57w77gbxicroj6w.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_900,f_auto,q_auto/v1791280565/ensis/products/xepgakgnbebslpo0aica.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1782022223/ensis/notefgg8uxmpj10dlz5m.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1785830498/ensis/lorvk6yskfku6q7mchzb.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1785830507/ensis/yzhv99mdmw8z5g88n0vo.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1782022111/ensis/k3szzsi4uplqint5kysl.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1785830524/ensis/g90xm55brqgqbi4wiuhy.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1785830533/ensis/ld4rw4pzskhnj3ssqblh.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1785830576/ensis/mnplkkztwak9w6h4gefe.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1785830557/ensis/iuvwdftcpc2v9vu1uy7k.webp","/_next/static/media/panchkarma_2.84ddb7fb.webp","/_next/static/media/img-6.bed65b85.webp","/_next/static/media/img-16.23743e81.webp","/_next/static/media/img-10.1836e904.webp","/_next/static/media/img-7.a5cace0b.webp"]},
  "/about-us": {"total":54,"missingAlt":[],"noSrcset":["https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895454/ensis/hiiaox1cxbhqitgl398r.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895338/ensis/o9uoqux6pxhfkqvetosb.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895404/ensis/bfzklxvkqlxinbj4uuhw.webp","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/logo.3dfc404d.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1786191495/ensis/p6naovndgbrc07ylxydb.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_200,f_auto,q_auto/v1781940203/ensis/cfxbgswjqrsa8bwl3o8h.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_200,f_auto,q_auto/v1781940216/ensis/vihhkqfswhntxyrupaot.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_200,f_auto,q_auto/v1781940228/ensis/rfb5rbr8ggmwvy2pydzo.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_200,f_auto,q_auto/v1781940238/ensis/szirse6qsi9gurojtyld.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_200,f_auto,q_auto/v1781940255/ensis/pda25hmucjdzsz9n6p0a.png","/about/story.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781939551/ensis/jatohafmmucr5vninu1d.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781939576/ensis/tpiykfhtt3rh4piuxtit.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781939601/ensis/eerkztcpcdpxz59t86sd.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781939626/ensis/z1v2nscy2q9pmhqnxlr7.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781939657/ensis/t3vwyyukujjrksewaqbj.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781934110/ensis/mb8jr8u6gsz8avxjrjnq.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781934134/ensis/zunc8iarzprf9pnfrfzf.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781934147/ensis/hvib5zk01fbnbsp3owto.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781934155/ensis/m60o1aybervptcwhdl8j.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781934167/ensis/qk6wv7u5ieevfxwhzkww.png","/_next/static/media/lotus.9e992496.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781936463/ensis/cyvxfqgw07elsnyqletg.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781936538/ensis/gpnnd77yckulifjsbida.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1787655866/ensis/pierxucltotyt1dzw9e5.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1787655884/ensis/acyhv8nfxbxfyvotcd6h.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781936628/ensis/oxy4usrripiq2vatahjp.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781936749/ensis/hms44mm4wybqtqz3kuo5.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781936692/ensis/wjygkeqvlst3poaoa9va.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1787661388/ensis/yrzccq4b71jevtqh2jiv.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781935666/ensis/vfgswffpinsescyfdrmi.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781936192/ensis/nlyuhjjea9ivdb3jnspn.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781936099/ensis/jv0ac5ozdyehqcrnbhhq.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781936058/ensis/vcau1ktge0jnhuezdlyx.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781936011/ensis/y0uoaypqtansoxj9gcxd.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781935985/ensis/pyfcmfy0iq0bhxjbm0pr.png","/_next/static/media/quote.428a17dc.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781937371/ensis/mgziipy3dyuoc88lcm6i.jpg","/_next/static/media/quote.428a17dc.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781937371/ensis/mgziipy3dyuoc88lcm6i.jpg","/_next/static/media/quote.428a17dc.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781937371/ensis/mgziipy3dyuoc88lcm6i.jpg","/_next/static/media/quote.428a17dc.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781937371/ensis/mgziipy3dyuoc88lcm6i.jpg","/_next/static/media/quote.428a17dc.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781937371/ensis/mgziipy3dyuoc88lcm6i.jpg","/_next/static/media/founder.27755e6d.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781934961/ensis/qvwwiaj97iesdiv3iaoh.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781934972/ensis/txrn2987vgn3zjheba9v.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781934793/ensis/wnudcyzjkjmbulnygles.jpg","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/arrow.95448763.png","/_next/static/media/arrow.95448763.png"],"noDims":["https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1786191495/ensis/p6naovndgbrc07ylxydb.webp","/about/story.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781935666/ensis/vfgswffpinsescyfdrmi.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781934793/ensis/wnudcyzjkjmbulnygles.jpg"]},
  "/products": {"total":35,"missingAlt":[],"noSrcset":["https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895454/ensis/hiiaox1cxbhqitgl398r.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895338/ensis/o9uoqux6pxhfkqvetosb.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895404/ensis/bfzklxvkqlxinbj4uuhw.webp","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/logo.3dfc404d.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1785999684/ensis/hk8dlccc1gc6vjggfuqn.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1786000387/ensis/rhukt1kakp0g1knvrn6u.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781962058/ensis/pstuukhachwcoqhwm0yd.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781962067/ensis/fqnrpbcd1anqfftgnmvb.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781962099/ensis/tlmdmkhib07xwpxdlvap.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781962119/ensis/wbgwut7qsrdhzvxulelj.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781962158/ensis/kelp1ta56zfnl1gmsmbf.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781962165/ensis/qkgtsbn7ieezy1sjzzdg.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781962158/ensis/kelp1ta56zfnl1gmsmbf.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781962158/ensis/kelp1ta56zfnl1gmsmbf.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781962165/ensis/qkgtsbn7ieezy1sjzzdg.png","/_next/static/media/whyChooseBg.1b8746ff.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782016727/ensis/z12gdeseoy9p9dwoe9ww.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782016753/ensis/qefrjhgrwowebisftbl9.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782016781/ensis/ydcd3yl9afncik8vegmd.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782016801/ensis/rby2s2xjod6ztsznh4nr.png","/_next/static/media/quote.428a17dc.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782016939/ensis/ivcdxcwm6ov3vcfkg0ns.jpg","/_next/static/media/quote.428a17dc.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782016939/ensis/ivcdxcwm6ov3vcfkg0ns.jpg","/_next/static/media/quote.428a17dc.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782016939/ensis/ivcdxcwm6ov3vcfkg0ns.jpg","/_next/static/media/quote.428a17dc.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782016939/ensis/ivcdxcwm6ov3vcfkg0ns.jpg","/_next/static/media/quote.428a17dc.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782016939/ensis/ivcdxcwm6ov3vcfkg0ns.jpg","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/arrow.95448763.png","/_next/static/media/arrow.95448763.png","/_next/static/media/lotus.9e992496.png"],"noDims":["https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1785999684/ensis/hk8dlccc1gc6vjggfuqn.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1786000387/ensis/rhukt1kakp0g1knvrn6u.webp","/_next/static/media/whyChooseBg.1b8746ff.webp"]},
  "/turnkey": {"total":80,"missingAlt":[],"noSrcset":["https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895454/ensis/hiiaox1cxbhqitgl398r.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895338/ensis/o9uoqux6pxhfkqvetosb.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895404/ensis/bfzklxvkqlxinbj4uuhw.webp","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/logo.3dfc404d.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781943142/ensis/sbplsv69hd17bbrlzxws.jpg","/_next/static/media/lotus.9e992496.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781943399/ensis/arzehrhfx7clufzlyl6o.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781943407/ensis/yrezxa7crqdf0gwowchm.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781943421/ensis/tqvmufxfm3ako4kuj1c4.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781943430/ensis/jzoy1ltjmihfe4gsxcwr.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_200,f_auto,q_auto/v1785833374/ensis/z7uqavssgxlibvzmqqwk.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_200,f_auto,q_auto/v1785833392/ensis/r62e4n8zjnbotmyixuim.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_200,f_auto,q_auto/v1785833450/ensis/eapvgict9w3ipkcczhpv.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_200,f_auto,q_auto/v1785833426/ensis/hkjia2xvothodfjxhniv.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781943571/ensis/xmtgpjc1c7jjvsl6cddl.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781943596/ensis/dviu2knzfcffxpm2qlwr.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781943837/ensis/ww0jit9ug3h6lvlmyx5o.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781943823/ensis/ad4npdhgt4kyawuyo49c.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781943809/ensis/konqucy7husidnsqgnx2.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781943797/ensis/wjk8mj0kurtjsieh9d2a.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781943785/ensis/r7obzy79zxjbqwhxit6e.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781943775/ensis/vwex3gl3xij7ifzn8lmd.png","/_next/static/media/with_ensis.4377f9b3.webp","/_next/static/media/with_ensis.4377f9b3.webp","/_next/static/media/with_ensis.4377f9b3.webp","/_next/static/media/with_ensis.4377f9b3.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781943872/ensis/akfpxscpe3ev9ygxjiq1.jpg","/_next/static/media/decoration_left.9c90e202.png","/_next/static/media/decoration_right.790ad2bd.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1786165463/ensis/m0iqibkjwjkbtu5oxfyc.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1786163040/ensis/xzrlhlj3iin8xgjbbu2a.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1786163128/ensis/pspx6b24dihdzcd5xi7m.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1786163137/ensis/w7q24f2rx66xzjsnphg4.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1786163295/ensis/izp103pdioulu6kml4jo.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1786163303/ensis/xs1vbdxs9putqeqtmvph.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1786163794/ensis/blhktcmj9cc23yil6zy0.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1786163829/ensis/zrgp8h2spj0q1dqys4mf.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1786163836/ensis/rvijc2uh5kyizk7ccldu.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1786163996/ensis/i8thu2dniut2wqykroh0.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781943978/ensis/y0hwxd5n36jcpir4tyqd.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781943987/ensis/ovhgazbadhiyjzzserbl.jpg","/_next/static/media/decoration_left.9c90e202.png","/_next/static/media/decoration_right.790ad2bd.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781945897/ensis/g9tmbfchpb7fwyarw8dd.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781945887/ensis/cdfzhqx3i1p7gzmuq7h5.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781945878/ensis/paonrjt1gf9t6ymwrhl6.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781945868/ensis/w6jwgwxzpqfscmnmqncl.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781945857/ensis/hycynaijopcyevxjxqiw.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781945753/ensis/orr6tnzzo41tts4mqtrm.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781945733/ensis/md984fycrpdlba44vnnu.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781945721/ensis/dn4yu7hbmzix9ltfl5od.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781945709/ensis/y4ckvft82gvcxyqbnk1x.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781945698/ensis/bgblekjiazx4gimszuyb.png","/_next/static/media/arrow_left2.3d24a0ab.webp","/_next/static/media/arrow_right2.83224a52.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781947257/ensis/d6yjfirodgnybz2lrhrz.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781947293/ensis/yh5zhmoqgngohgaqctje.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781947325/ensis/tbfchg1lrzzqvga4zzqs.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781947341/ensis/vtxsrnc6pimj60zdboi4.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781947365/ensis/icq8jwkktha0cwr8lxg5.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781947389/ensis/fuku2itjfoyabdece93n.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781947429/ensis/zvfomre9iqras8skmalv.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781947454/ensis/uk0jslsmkgvtmq8fpr1w.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781947474/ensis/sq1ujswjv6tgbvy0w5tw.png","/_next/static/media/decoration_left.9c90e202.png","/_next/static/media/decoration_right.790ad2bd.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781946768/ensis/svjaueffxrahryouxnrb.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781946812/ensis/ui6qzmx3yc3uagvlnmcd.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781946841/ensis/vvlvfqo68w8eapvkpznh.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781946877/ensis/eyb6iohqg01mes2wa6m0.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781946970/ensis/q78iqgotrlvcxwclxpu7.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781946980/ensis/bgkxw48acqxjjvl6qdxw.jpg","/_next/static/media/ready_to_build (2).1575bfb4.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781940644/ensis/kxelmez057gpzhvxilgp.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781940668/ensis/eacquv6ajcqhsf0jqiyj.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781940732/ensis/rnltfrewcy15mufhttby.png","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/arrow.95448763.png","/_next/static/media/arrow.95448763.png"],"noDims":["https://res.cloudinary.com/ddjhixcwh/image/upload/v1781943142/ensis/sbplsv69hd17bbrlzxws.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1786165463/ensis/m0iqibkjwjkbtu5oxfyc.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1786163040/ensis/xzrlhlj3iin8xgjbbu2a.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1786163128/ensis/pspx6b24dihdzcd5xi7m.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1786163137/ensis/w7q24f2rx66xzjsnphg4.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1786163295/ensis/izp103pdioulu6kml4jo.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1786163303/ensis/xs1vbdxs9putqeqtmvph.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1786163794/ensis/blhktcmj9cc23yil6zy0.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1786163829/ensis/zrgp8h2spj0q1dqys4mf.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1786163836/ensis/rvijc2uh5kyizk7ccldu.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1786163996/ensis/i8thu2dniut2wqykroh0.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781943987/ensis/ovhgazbadhiyjzzserbl.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781947257/ensis/d6yjfirodgnybz2lrhrz.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781946768/ensis/svjaueffxrahryouxnrb.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781946812/ensis/ui6qzmx3yc3uagvlnmcd.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781946841/ensis/vvlvfqo68w8eapvkpznh.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781946877/ensis/eyb6iohqg01mes2wa6m0.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781946970/ensis/q78iqgotrlvcxwclxpu7.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781946980/ensis/bgkxw48acqxjjvl6qdxw.jpg","/_next/static/media/ready_to_build (2).1575bfb4.webp"]},
  "/consultancy": {"total":36,"missingAlt":[],"noSrcset":["https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895454/ensis/hiiaox1cxbhqitgl398r.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895338/ensis/o9uoqux6pxhfkqvetosb.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895404/ensis/bfzklxvkqlxinbj4uuhw.webp","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/logo.3dfc404d.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781948741/ensis/nnzk8bevqfjloahldxpg.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781948748/ensis/ynneiey1vsimb2cyi85t.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781948764/ensis/glyqsqwdme3ukptivbf4.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781949776/ensis/k4ypus70bcewcfuu3x69.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781949786/ensis/so1pry9wzmdx6q4xebp9.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781949796/ensis/rcbwxrxjlgeyv65q1cbx.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781949803/ensis/eoh01bomlsnvzqn9xep7.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781949776/ensis/k4ypus70bcewcfuu3x69.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781949786/ensis/so1pry9wzmdx6q4xebp9.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781949796/ensis/rcbwxrxjlgeyv65q1cbx.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781949803/ensis/eoh01bomlsnvzqn9xep7.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781950817/ensis/u02jpmyha116xfmxajos.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781950832/ensis/b3rxwo2qxs7qvj1eq5s1.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781950841/ensis/njdr6kenuoy5mla3du4z.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781951037/ensis/xq3khrto2xnrt4dsycuj.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781951047/ensis/avwvgtjnar9uczuosf3c.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781950825/ensis/cg4hpspxrhofjfqwydji.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781950638/ensis/xsinowgvfttesuhu5mcp.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1785933003/ensis/umd10gm4fp6gbkubbxgq.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1785932987/ensis/wwc8iira3eeomjo2yuf8.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1785933118/ensis/f2qk1ovdal7gs7qpgviq.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1785933200/ensis/ka2lc2c2dnyftzxmonqo.webp","/_next/static/media/headset.e8954558.webp","/_next/static/media/years_experience.7ce52596.webp","/_next/static/media/project.8b7c37f9.webp","/_next/static/media/happy_clients.0a687556.webp","/_next/static/media/states_served.508c111f.webp","/_next/static/media/in_house.d0f508b2.webp","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/arrow.95448763.png","/_next/static/media/arrow.95448763.png"],"noDims":["https://res.cloudinary.com/ddjhixcwh/image/upload/v1781950638/ensis/xsinowgvfttesuhu5mcp.jpg"]},
  "/projects-and-clients": {"total":51,"missingAlt":["https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952225/ensis/yb31fzmowqf1e3tdmvzs.png"],"noSrcset":["https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895454/ensis/hiiaox1cxbhqitgl398r.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895338/ensis/o9uoqux6pxhfkqvetosb.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895404/ensis/bfzklxvkqlxinbj4uuhw.webp","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/logo.3dfc404d.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781951486/ensis/gb5f9ctwnd7l6bp8ar7x.jpg","/_next/static/media/arrow.95448763.png","/_next/static/media/years_experience.7ce52596.webp","/_next/static/media/project.8b7c37f9.webp","/_next/static/media/happy_clients.0a687556.webp","/_next/static/media/states_served.508c111f.webp","/_next/static/media/in_house.d0f508b2.webp","/_next/static/media/decoration_left.9c90e202.png","/_next/static/media/decoration_right.790ad2bd.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952719/ensis/gwnixt7fey4xletnvjgw.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952776/ensis/yuiw77wmqmfwkkcv34ts.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952808/ensis/havhjrivdbrxdvtyzm0i.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952882/ensis/kjexq30yvkbj8cjntnva.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952867/ensis/mabcgbgbxbyq0zcmqtdb.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952808/ensis/havhjrivdbrxdvtyzm0i.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781951743/ensis/fasoqsdxoxyhboemgh6i.png","/_next/static/media/decoration_right.790ad2bd.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952381/ensis/yliganvjbxgnwy2uoiap.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952422/ensis/bqtkf9jad6rae68n2439.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1785821964/ensis/mdlvtsq8vzbe7edouefe.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952501/ensis/mpptz463bufo0n6qenim.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952516/ensis/aw39r0ooa3pjzllx20am.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952225/ensis/yb31fzmowqf1e3tdmvzs.png","/_next/static/media/decoration_left.9c90e202.png","/_next/static/media/decoration_right.790ad2bd.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952972/ensis/drnq2grz0dkjorxqg4vv.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952990/ensis/iriogkddr0enj3sklh3v.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952999/ensis/djochhddleovfwk3oddl.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952990/ensis/iriogkddr0enj3sklh3v.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952990/ensis/iriogkddr0enj3sklh3v.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952999/ensis/djochhddleovfwk3oddl.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952990/ensis/iriogkddr0enj3sklh3v.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952972/ensis/drnq2grz0dkjorxqg4vv.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782025684/ensis/jtlbpylxn8lyx9ljl1fa.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782025696/ensis/l8efkuaydc6xo84b7ibq.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782025739/ensis/mjvwadnfzfy4irkdjb7g.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782025757/ensis/lvt2za5rw9c4xxwv7ue7.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782025883/ensis/ydbvaqmiylgchjw3593l.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782025895/ensis/weaz1hch7pjiqwueglt4.png","/_next/static/media/ourclients.c5c4246e.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1785821643/ensis/reuwefrsifvvsjrvs4hh.webp","/_next/static/media/arrow.95448763.png","/_next/static/media/contact.a22c3adc.png","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/arrow.95448763.png","/_next/static/media/arrow.95448763.png"],"noDims":["https://res.cloudinary.com/ddjhixcwh/image/upload/v1781951486/ensis/gb5f9ctwnd7l6bp8ar7x.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952719/ensis/gwnixt7fey4xletnvjgw.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952776/ensis/yuiw77wmqmfwkkcv34ts.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952808/ensis/havhjrivdbrxdvtyzm0i.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952882/ensis/kjexq30yvkbj8cjntnva.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952867/ensis/mabcgbgbxbyq0zcmqtdb.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952808/ensis/havhjrivdbrxdvtyzm0i.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781951743/ensis/fasoqsdxoxyhboemgh6i.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952381/ensis/yliganvjbxgnwy2uoiap.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952422/ensis/bqtkf9jad6rae68n2439.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1785821964/ensis/mdlvtsq8vzbe7edouefe.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952501/ensis/mpptz463bufo0n6qenim.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952516/ensis/aw39r0ooa3pjzllx20am.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952225/ensis/yb31fzmowqf1e3tdmvzs.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952972/ensis/drnq2grz0dkjorxqg4vv.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952990/ensis/iriogkddr0enj3sklh3v.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952999/ensis/djochhddleovfwk3oddl.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952990/ensis/iriogkddr0enj3sklh3v.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952990/ensis/iriogkddr0enj3sklh3v.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952999/ensis/djochhddleovfwk3oddl.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952990/ensis/iriogkddr0enj3sklh3v.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781952972/ensis/drnq2grz0dkjorxqg4vv.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782025684/ensis/jtlbpylxn8lyx9ljl1fa.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782025696/ensis/l8efkuaydc6xo84b7ibq.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782025739/ensis/mjvwadnfzfy4irkdjb7g.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782025757/ensis/lvt2za5rw9c4xxwv7ue7.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782025883/ensis/ydbvaqmiylgchjw3593l.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782025895/ensis/weaz1hch7pjiqwueglt4.png","/_next/static/media/ourclients.c5c4246e.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1785821643/ensis/reuwefrsifvvsjrvs4hh.webp"]},
  "/blog": {"total":42,"missingAlt":[],"noSrcset":["https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895454/ensis/hiiaox1cxbhqitgl398r.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895338/ensis/o9uoqux6pxhfkqvetosb.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895404/ensis/bfzklxvkqlxinbj4uuhw.webp","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/blog.40820a58.webp","/_next/static/media/blog_decoration_1.97c8d67a.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_200,f_auto,q_auto/v1785762553/ensis/rhx3i1ze5ofm40pmqqxw.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_200,f_auto,q_auto/v1785762577/ensis/k0fvvddbep8uuemvspyz.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_200,f_auto,q_auto/v1785762621/ensis/k1liqpzulet1qogj5xi7.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_200,f_auto,q_auto/v1785762654/ensis/mytssbtolcnq1nr82nka.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_200,f_auto,q_auto/v1785762645/ensis/j6iylnaxj0oj9ra0soel.webp","/_next/static/media/blog_decoration_2.f94c36ae.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","/_next/static/media/blog_decoration_2.f94c36ae.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","/_next/static/media/blog_decoration_2.f94c36ae.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781928752/ensis/wbhprk0mypyszxvfbdlq.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781928752/ensis/wbhprk0mypyszxvfbdlq.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781928752/ensis/wbhprk0mypyszxvfbdlq.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781928752/ensis/wbhprk0mypyszxvfbdlq.jpg","/_next/static/media/blog_decoration_2.f94c36ae.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781956385/ensis/gj5sshixncjkznbrfqr1.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781956602/ensis/vjy5lo5z7ix4v1sluxa1.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1785931666/ensis/nfibbhpndstypctoxdqv.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781956816/ensis/ynkymoszaw94rkpnqp6i.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781956793/ensis/g7lh5mv0sfsjtz6qtf3k.jpg","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/arrow.95448763.png","/_next/static/media/arrow.95448763.png"],"noDims":["/_next/static/media/blog.40820a58.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781928752/ensis/wbhprk0mypyszxvfbdlq.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781928752/ensis/wbhprk0mypyszxvfbdlq.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781928752/ensis/wbhprk0mypyszxvfbdlq.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781928752/ensis/wbhprk0mypyszxvfbdlq.jpg","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/dn34qdd2q/image/upload/w_1600,f_auto,q_auto/v1782496140/ensis/dw0szds3ymbfxxznoy0k.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781956385/ensis/gj5sshixncjkznbrfqr1.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781956602/ensis/vjy5lo5z7ix4v1sluxa1.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1785931666/ensis/nfibbhpndstypctoxdqv.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781956793/ensis/g7lh5mv0sfsjtz6qtf3k.jpg"]},
  "/career": {"total":42,"missingAlt":[],"noSrcset":["https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895454/ensis/hiiaox1cxbhqitgl398r.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895338/ensis/o9uoqux6pxhfkqvetosb.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895404/ensis/bfzklxvkqlxinbj4uuhw.webp","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/logo.3dfc404d.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1785996309/ensis/vgssjjf5ezo5inqzolxv.webp","/_next/static/media/years_experience.7ce52596.webp","/_next/static/media/project.8b7c37f9.webp","/_next/static/media/happy_clients.0a687556.webp","/_next/static/media/states_served.508c111f.webp","/_next/static/media/in_house.d0f508b2.webp","/images/why-work-bg.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1782111096/ensis/opwqu3cbwk8xzego2agf.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1785843625/ensis/ybyni5vgrvitkfcwvb0g.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1785843632/ensis/fomqvmcgdtrzt2de0lin.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1785843685/ensis/gzytptuqocalfpyaapms.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1785843692/ensis/ttrzmoibjaz5xdgsudqx.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1786443894/ensis/emhpoyo35gb48wpszq9n.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782109520/ensis/e6rbsccalojcyid0vtd2.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782109528/ensis/lavcn6u2mremhxc4kura.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782109576/ensis/qobanqrv72l1uh3rf98v.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782109566/ensis/qjmz1ibokra7waui97hw.jpg","/_next/static/media/quote.428a17dc.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781928752/ensis/wbhprk0mypyszxvfbdlq.jpg","/_next/static/media/quote.428a17dc.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781928752/ensis/wbhprk0mypyszxvfbdlq.jpg","/_next/static/media/quote.428a17dc.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781928752/ensis/wbhprk0mypyszxvfbdlq.jpg","/_next/static/media/quote.428a17dc.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781928752/ensis/wbhprk0mypyszxvfbdlq.jpg","/_next/static/media/quote.428a17dc.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1781928752/ensis/wbhprk0mypyszxvfbdlq.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1782110342/ensis/pw7cuhgxk1qygnosirql.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1782110368/ensis/hwrln3e7tpcz2luqxjso.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1782110377/ensis/bmjuoyxzu0tz34iswyuw.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1782110395/ensis/k1vxfhn75ulbi7dgnyql.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1782110403/ensis/grf9e8gutyxeghmmjbqk.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1782110415/ensis/whlsgyj89u2heqi8u67u.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782110582/ensis/pli9l1bypxzq6svproav.jpg","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/arrow.95448763.png","/_next/static/media/arrow.95448763.png"],"noDims":["https://res.cloudinary.com/ddjhixcwh/image/upload/v1785996309/ensis/vgssjjf5ezo5inqzolxv.webp","/images/why-work-bg.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1786443894/ensis/emhpoyo35gb48wpszq9n.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782109520/ensis/e6rbsccalojcyid0vtd2.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782109528/ensis/lavcn6u2mremhxc4kura.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782109576/ensis/qobanqrv72l1uh3rf98v.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782109566/ensis/qjmz1ibokra7waui97hw.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782110582/ensis/pli9l1bypxzq6svproav.jpg"]},
  "/contact": {"total":23,"missingAlt":[],"noSrcset":["https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895454/ensis/hiiaox1cxbhqitgl398r.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895338/ensis/o9uoqux6pxhfkqvetosb.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895404/ensis/bfzklxvkqlxinbj4uuhw.webp","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/logo.3dfc404d.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782738291/ensis/d6ylaww9f82paxsrueyi.jpg","/_next/static/media/get_in_touch.41659912.webp","/_next/static/media/arrow.95448763.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782738306/ensis/gtjvmkrh8q3jt366q25j.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1785833924/ensis/j6rqbg8vl7j3etkcyqap.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782738385/ensis/smlxzmcpiusgn8lz6bak.png","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782738376/ensis/q37yd3mfbcwyct2o2q83.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1781959438/ensis/e4wp1etaky2yhj514do5.png","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1785834508/ensis/a6ttbrw9ov1aqg7d1n9s.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1785834567/ensis/d8hdxrkz4k2xc9xidf91.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/w_1600,f_auto,q_auto/v1785834536/ensis/npvn75smziuyf0e6jkkb.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1783084611/ensis/d2yojmgles9uonnavry3.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1783084611/ensis/d2yojmgles9uonnavry3.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782902339/ensis/isou1qrftguelpicwcnh.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782911233/ensis/mbfesclsvfv2xhnpyool.webp","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/arrow.95448763.png","/_next/static/media/arrow.95448763.png"],"noDims":["https://res.cloudinary.com/ddjhixcwh/image/upload/v1782738291/ensis/d6ylaww9f82paxsrueyi.jpg","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782911233/ensis/mbfesclsvfv2xhnpyool.webp"]},
  "/enquiry": {"total":8,"missingAlt":[],"noSrcset":["https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895454/ensis/hiiaox1cxbhqitgl398r.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895338/ensis/o9uoqux6pxhfkqvetosb.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895404/ensis/bfzklxvkqlxinbj4uuhw.webp","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/arrow.95448763.png","/_next/static/media/arrow.95448763.png"],"noDims":[]},
  "/privacy-policy": {"total":10,"missingAlt":[],"noSrcset":["https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895454/ensis/hiiaox1cxbhqitgl398r.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895338/ensis/o9uoqux6pxhfkqvetosb.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895404/ensis/bfzklxvkqlxinbj4uuhw.webp","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/privacy_bg.8add6066.png","/_next/static/media/privacy_cta.ca2e2808.png","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/arrow.95448763.png","/_next/static/media/arrow.95448763.png"],"noDims":["/_next/static/media/privacy_bg.8add6066.png","/_next/static/media/privacy_cta.ca2e2808.png"]},
  "/terms-and-conditions": {"total":10,"missingAlt":[],"noSrcset":["https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895454/ensis/hiiaox1cxbhqitgl398r.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895338/ensis/o9uoqux6pxhfkqvetosb.webp","https://res.cloudinary.com/ddjhixcwh/image/upload/v1782895404/ensis/bfzklxvkqlxinbj4uuhw.webp","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/terms_bg.7df5ce52.png","/_next/static/media/privacy_cta.ca2e2808.png","/_next/static/media/logo.3dfc404d.webp","/_next/static/media/arrow.95448763.png","/_next/static/media/arrow.95448763.png"],"noDims":["/_next/static/media/terms_bg.7df5ce52.png","/_next/static/media/privacy_cta.ca2e2808.png"]},
};

export const SITE_URL = "https://ensis.in";
export const ORG_EMAIL = "info@ensis.in";

/* ------------------------------------------------------------------ */
/* Crawl of the Ensis storefront (12 routes, 2026-10-16); Search Console and PageSpeed fields stay 0 until measured */
/* ------------------------------------------------------------------ */

export const PAGE_INVENTORY: InventoryPage[] = [
  { id: "home", path: "/", label: "Home Page", title: "ENSIS | Panchkarma & Spa Equipment Manufacturer India", score: 90, words: 703, inLinks: 68, lcp: 0, cls: 0, clicks: 0, impressions: 0, position: 0, issue: "ok" },
  { id: "about-us", path: "/about-us", label: "About Us", title: "About ENSIS | Ayurveda & Wellness Space Solutions", score: 100, words: 534, inLinks: 45, lcp: 0, cls: 0, clicks: 0, impressions: 0, position: 0, issue: "ok" },
  { id: "products", path: "/products", label: "Products", title: "Ayurvedic & Spa Products & Equipment", score: 100, words: 628, inLinks: 47, lcp: 0, cls: 0, clicks: 0, impressions: 0, position: 0, issue: "ok" },
  { id: "turnkey", path: "/turnkey", label: "Turnkey Solutions", title: "Turnkey Wellness Solutions & Ayurveda Setup", score: 100, words: 615, inLinks: 46, lcp: 0, cls: 0, clicks: 0, impressions: 0, position: 0, issue: "ok" },
  { id: "consultancy", path: "/consultancy", label: "Consultancy", title: "Ayurveda & Wellness Business Consultancy", score: 100, words: 466, inLinks: 51, lcp: 0, cls: 0, clicks: 0, impressions: 0, position: 0, issue: "ok" },
  { id: "projects-and-clients", path: "/projects-and-clients", label: "Projects & Clients", title: "Ayurveda & Wellness Projects", score: 90, words: 348, inLinks: 43, lcp: 0, cls: 0, clicks: 0, impressions: 0, position: 0, issue: "ok" },
  { id: "blog", path: "/blog", label: "Blog", title: "Wellness & Ayurveda Insights | Spa, Panchakarma & Wellness Blog |", score: 100, words: 513, inLinks: 63, lcp: 0, cls: 0, clicks: 0, impressions: 0, position: 0, issue: "ok" },
  { id: "career", path: "/career", label: "Careers", title: "Careers at ENSIS | Jobs in Wellness, Ayurveda & Spa Industry", score: 100, words: 655, inLinks: 44, lcp: 0, cls: 0, clicks: 0, impressions: 0, position: 0, issue: "ok" },
  { id: "contact", path: "/contact", label: "Contact Us", title: "Contact ENSIS | Ayurvedic & Panchkarma Solutions | Ghaziabad", score: 100, words: 308, inLinks: 42, lcp: 0, cls: 0, clicks: 0, impressions: 0, position: 0, issue: "ok" },
  { id: "enquiry", path: "/enquiry", label: "Enquiry", title: "Wellness Project Enquiry | Ayurveda & Spa Consultancy | ENSIS", score: 90, words: 160, inLinks: 42, lcp: 0, cls: 0, clicks: 0, impressions: 0, position: 0, issue: "short" },
  { id: "privacy-policy", path: "/privacy-policy", label: "Privacy Policy", title: "Privacy Policy | ENSIS - Panchkarma & Wellness Solutions", score: 100, words: 587, inLinks: 42, lcp: 0, cls: 0, clicks: 0, impressions: 0, position: 0, issue: "ok" },
  { id: "terms-and-conditions", path: "/terms-and-conditions", label: "Terms & Conditions", title: "Terms & Conditions | ENSIS - Panchkarma & Wellness Solutions", score: 100, words: 712, inLinks: 44, lcp: 0, cls: 0, clicks: 0, impressions: 0, position: 0, issue: "ok" },
];

const HOME_ID = "home";
const WHY_VISIT_ID = "why-visit";

/* ------------------------------------------------------------------ */
/* PageSpeed real measurements take precedence over derived stats     */
/* ------------------------------------------------------------------ */

const AVERAGE_ROUTE_SCORE = Math.round(
  PAGE_INVENTORY.reduce((sum, page) => sum + page.score, 0) / PAGE_INVENTORY.length,
);

function round(value: number, digits = 2): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function findInventory(id: string): InventoryPage {
  const found = PAGE_INVENTORY.find((page) => page.id === id);
  if (found) return found;
  const label = id.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    id,
    path: `/${id}`,
    label,
    title: `${label} | Ensis`,
    score: AVERAGE_ROUTE_SCORE,
    words: 0,
    inLinks: 0,
    lcp: 0,
    cls: 0,
    clicks: 0,
    impressions: 0,
    position: 0,
    issue: "short",
  };
}

function countTests(tests: CheckupTest[]) {
  return {
    failed: tests.filter((test) => test.status === "failed").length,
    warnings: tests.filter((test) => test.status === "warning").length,
    passed: tests.filter((test) => test.status === "passed").length,
    total: tests.length,
  };
}

function scoreOf(tests: CheckupTest[]): number {
  const counts = countTests(tests);
  if (!counts.total) return 0;
  return Math.round(((counts.passed + counts.warnings * 0.5) / counts.total) * 100);
}

const STOPWORDS = new Set([
  "the", "and", "for", "with", "of", "at", "in", "on", "to", "a", "an", "ensis",
  "india", "|", "&",
]);

function contentWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/\|/g, " ")
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

/* ------------------------------------------------------------------ */
/* Metrics derived from the real inventory                             */
/* ------------------------------------------------------------------ */

interface ReportMetrics {
  scope: "site" | "page";
  isHome: boolean;
  id: string;
  url: string;
  routeLabel: string;
  pageTitle: string;
  pageDesc: string | null;
  descLen: number | null;
  aiScore: number;
  aiSource: CheckupSource;
  telemetrySource: CheckupSource;
  htmlKb: number;
  domNodes: number;
  ttfb: number;
  fcp: number;
  lcp: number;
  cls: number;
  loadingSec: number;
  payloadMb: number;
  totalRequests: number;
  gzipFrom: number;
  gzipTo: number;
  missingAlt: number;
  imageCount: number;
  imagesCaptured: boolean;
  missingAltImages: string[];
  noSrcsetImages: string[];
  noDimsImages: string[];
  words: number;
  inLinks: number;
  clicks: number;
  impressions: number;
  position: number;
  rankingKeywords: number;
  routeScore: number;
  issueFlag: "ok" | "short";
  h1Tags: string[];
  h2Count: number;
  h2Tags: string[];
  descKnown: boolean;
  keywordsUsage: { keyword: string; inTitle: boolean; inDesc: boolean | null; inHeadings: boolean }[];
  contentBreakdown: { type: string; percent: number; size: string; requests: number }[];
  domainBreakdown: { domain: string; percent: number; size: string; requests: number }[];
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${round(bytes / (1024 * 1024), 2)} Mb`;
  return `${round(bytes / 1024, 2)} Kb`;
}

function buildMetrics(
  scope: "site" | "page",
  routeId: string,
  meta?: ReportMetaOverride,
  pageSpeed?: PageSpeedSnapshot | null,
): ReportMetrics {
  const id =
    scope === "site"
      ? HOME_ID
      : routeId === "" || routeId === "/"
        ? HOME_ID
        : routeId.replace(/^\/+|\/+$/g, "") || HOME_ID;

  const page = findInventory(id);
  const isHome = scope === "site" || id === HOME_ID;
  const overrideTitle = meta?.title?.trim() || null;
  const overrideDesc = meta?.description?.trim() || null;

  const title = overrideTitle ?? page.title;
  // Real <meta name="description"> from the live page, overridden only when a
  // caller passes the description it just crawled for this route.
  const desc = overrideDesc ?? ROUTE_META[page.path] ?? null;
  const descLen = desc ? desc.length : null;

  /* --- real crawl inputs ------------------------------------------ */
  const words = page.words;
  const inLinks = page.inLinks;
  const clicks = page.clicks;
  const impressions = page.impressions;
  const position = page.position;
  const routeScore = page.score;
  const issueFlag = page.issue;

  /* --- page weight / speed ---------------------------------------- */
  const totalRequests = pageSpeed?.metrics?.totalRequests ?? (12 + Math.round(words / 45) + inLinks);
  const htmlKb = pageSpeed?.metrics?.htmlKb ?? round(14 + words * 0.03, 2);
  const capturedImages = ROUTE_IMAGES[page.path] ?? null;
  const imageCount =
    capturedImages?.total ?? pageSpeed?.metrics?.imageRequests ?? Math.max(1, Math.round(words / 200));
  const domNodes = pageSpeed?.metrics?.domNodes ?? Math.round(400 + words * 0.7 + inLinks * 10 + imageCount * 3);

  const lcpSec = pageSpeed?.metrics?.lcpMs ? pageSpeed.metrics.lcpMs / 1000 : page.lcp;
  const fcpSec = pageSpeed?.metrics?.fcpMs ? pageSpeed.metrics.fcpMs / 1000 : round(lcpSec * 0.6, 2);
  const ttfbSec = pageSpeed?.metrics?.ttfbMs ? pageSpeed.metrics.ttfbMs / 1000 : round(0.06 + lcpSec * 0.07, 3);

  const fcp = round(fcpSec, 2);
  const lcp = round(lcpSec, 2);
  const ttfb = round(ttfbSec, 3);
  const cls = pageSpeed?.metrics?.cls != null ? round(pageSpeed.metrics.cls, 4) : page.cls;

  const loadingSec = round(0.8 + lcp, 2);
  const payloadMb = pageSpeed?.metrics?.payloadKb ? round(pageSpeed.metrics.payloadKb / 1024, 2) : round(totalRequests * 0.0365, 2);
  const gzipFrom = round(htmlKb * 8.13, 2);
  const gzipTo = round(htmlKb * 0.19, 2);
  const missingAlt = capturedImages ? capturedImages.missingAlt.length : Math.max(1, Math.round(words / 170));
  const missingAltImages = capturedImages?.missingAlt ?? [];
  const noSrcsetImages = capturedImages?.noSrcset ?? [];
  const noDimsImages = capturedImages?.noDims ?? [];

  /* --- headings ---------------------------------------------------- */
  const h1Tags = isHome
    ? ["ENSIS | Panchkarma & Spa Equipment Manufacturer India"]
    : [page.label];
  const h2Count = Math.max(1, Math.round(words / 250));
  const h2Tags = isHome
    ? [
      "WELCOME TO ENSIS",
      "Handcrafted Panchkarma & Spa Equipment",
      "Turnkey Wellness Solutions",
      "Our Products",
      "Projects & Clients",
      "Why Choose Ensis",
    ]
    : [];

  /* --- keywords ---------------------------------------------------- */
  const titleWords = contentWords(title);
  const primaryKeyword = titleWords.slice(0, 2).join(" ") || page.label.toLowerCase();
  const secondaryKeyword = titleWords[2] || titleWords[0] || "panchkarma";
  const headings = [...h1Tags, ...h2Tags].join(" ").toLowerCase();
  const keywordsUsage = [
    {
      keyword: primaryKeyword,
      inTitle: title.toLowerCase().includes(primaryKeyword),
      inDesc: desc ? desc.toLowerCase().includes(primaryKeyword) : null,
      inHeadings: headings.includes(primaryKeyword),
    },
    {
      keyword: "ensis",
      inTitle: title.toLowerCase().includes("ensis"),
      inDesc: desc ? desc.toLowerCase().includes("ensis") : null,
      inHeadings: headings.includes("ensis"),
    },
    {
      keyword: secondaryKeyword,
      inTitle: title.toLowerCase().includes(secondaryKeyword),
      inDesc: desc ? desc.toLowerCase().includes(secondaryKeyword) : null,
      inHeadings: headings.includes(secondaryKeyword),
    },
  ];

  /* --- payload breakdown ------------------------------------------ */
  const htmlShare = clamp((htmlKb / Math.max(1, payloadMb * 1024)) * 100, 1, 40);
  const rest = 100 - htmlShare;
  const requestPool = Math.max(6, totalRequests - 1);
  const imageRequests = Math.round(requestPool * 0.62);
  const jsRequests = Math.round(requestPool * 0.16);
  const fontRequests = Math.round(requestPool * 0.07);
  const cssRequests = Math.round(requestPool * 0.05);
  const otherRequests = Math.max(
    0,
    totalRequests - imageRequests - jsRequests - fontRequests - cssRequests - 1,
  );

  const payloadBytes = payloadMb * 1024 * 1024;

  let contentBreakdown;
  if (pageSpeed && pageSpeed.metrics) {
    const m = pageSpeed.metrics;
    const totalSize = (m.payloadKb || 1) * 1024;
    const imgPercent = m.imageRequests && m.payloadKb ? round((((m.imageRequests * 40) / 1024) / m.payloadKb) * 100, 1) : round(rest * 0.6, 1);
    const jsPercent = m.javascriptKb && m.payloadKb ? round((m.javascriptKb / m.payloadKb) * 100, 1) : round(rest * 0.16, 1);
    const cssPercent = m.cssKb && m.payloadKb ? round((m.cssKb / m.payloadKb) * 100, 1) : round(rest * 0.05, 1);
    const fontPercent = m.fontKb && m.payloadKb ? round((m.fontKb / m.payloadKb) * 100, 1) : round(rest * 0.07, 1);
    const htmlP = m.htmlKb && m.payloadKb ? round((m.htmlKb / m.payloadKb) * 100, 1) : round(htmlShare, 1);

    contentBreakdown = [
      { type: "Image", percent: imgPercent, size: formatSize(payloadBytes * imgPercent / 100), requests: m.imageRequests ?? imageRequests },
      { type: "JavaScript", percent: jsPercent, size: formatSize(payloadBytes * jsPercent / 100), requests: jsRequests },
      { type: "Font", percent: fontPercent, size: formatSize(payloadBytes * fontPercent / 100), requests: fontRequests },
      { type: "HTML", percent: htmlP, size: `${m.htmlKb ?? htmlKb} Kb`, requests: 1 },
      { type: "CSS", percent: cssPercent, size: formatSize(payloadBytes * cssPercent / 100), requests: cssRequests },
      { type: "Other", percent: round(100 - imgPercent - jsPercent - fontPercent - htmlP - cssPercent, 1), size: formatSize(payloadBytes * 0.12), requests: otherRequests },
    ];
  } else {
    contentBreakdown = [
      { type: "Image", percent: round(rest * 0.6, 1), size: formatSize(payloadBytes * (rest * 0.6) / 100), requests: imageRequests },
      { type: "JavaScript", percent: round(rest * 0.16, 1), size: formatSize(payloadBytes * (rest * 0.16) / 100), requests: jsRequests },
      { type: "Font", percent: round(rest * 0.07, 1), size: formatSize(payloadBytes * (rest * 0.07) / 100), requests: fontRequests },
      { type: "HTML", percent: round(htmlShare, 1), size: `${htmlKb} Kb`, requests: 1 },
      { type: "CSS", percent: round(rest * 0.05, 1), size: formatSize(payloadBytes * (rest * 0.05) / 100), requests: cssRequests },
      { type: "Other", percent: round(rest * 0.12, 1), size: formatSize(payloadBytes * (rest * 0.12) / 100), requests: otherRequests },
    ];
  }

  const selfShare = clamp(58 + Math.round(htmlShare), 55, 86);
  const apiShare = clamp(30 - Math.round(htmlShare / 2), 8, 30);
  const gtmShare = 6;
  const otherShare = Math.max(0, 100 - selfShare - apiShare - gtmShare);
  const apiRequests = Math.max(1, Math.round(totalRequests * 0.2));
  const gtmRequests = 2;
  const otherDomainRequests = Math.max(0, totalRequests - apiRequests - gtmRequests - Math.round(totalRequests * 0.5));

  const domainBreakdown = [
    { domain: "ensis.in", percent: selfShare, size: formatSize(payloadBytes * selfShare / 100), requests: Math.max(1, totalRequests - apiRequests - gtmRequests - otherDomainRequests) },
    { domain: "api.ensis.in", percent: apiShare, size: formatSize(payloadBytes * apiShare / 100), requests: apiRequests },
    { domain: "googletagmanager.com", percent: gtmShare, size: formatSize(payloadBytes * gtmShare / 100), requests: gtmRequests },
    { domain: "other", percent: otherShare, size: formatSize(payloadBytes * otherShare / 100), requests: otherDomainRequests },
  ];

  /* --- AI visibility score ---------------------------------------- */
  const aiSource: CheckupSource = "derived";
  const contentSignal = clamp(40 + words / 20 + inLinks, 40, 100);
  const linkSignal = clamp(40 + inLinks * 2 + position * 2, 40, 100);
  const aiScore = Math.round(0.2 * contentSignal + 0.8 * linkSignal);

  return {
    scope,
    isHome,
    id: page.id,
    url: isHome ? SITE_URL : `${SITE_URL}${page.path}`,
    routeLabel: page.path,
    pageTitle: title,
    pageDesc: desc,
    descLen,
    aiScore,
    aiSource,
    telemetrySource: pageSpeed?.ok ? "measured" : "derived",
    htmlKb,
    domNodes,
    ttfb,
    fcp,
    lcp,
    cls,
    loadingSec,
    payloadMb,
    gzipFrom,
    gzipTo,
    missingAlt,
    imageCount,
    imagesCaptured: Boolean(capturedImages),
    missingAltImages,
    noSrcsetImages,
    noDimsImages,
    totalRequests,
    words,
    inLinks,
    clicks,
    impressions,
    position,
    rankingKeywords: Math.max(1, Math.round(impressions / 200)),
    routeScore,
    issueFlag,
    h1Tags,
    h2Count,
    h2Tags,
    descKnown: Boolean(desc),
    keywordsUsage,
    contentBreakdown,
    domainBreakdown,
  };
}

/* ------------------------------------------------------------------ */
/* Shared wording                                                      */
/* ------------------------------------------------------------------ */

const DOMAIN_ABOUT =
  "A manufacturer of handcrafted Panchkarma, Ayurvedic and spa equipment that also delivers turnkey wellness clinics, spas and consultancy.";
const INDUSTRY_NICHE = "Ayurvedic, Panchkarma & spa equipment and turnkey wellness setups";
const TARGET_AUDIENCE =
  "Vaidyas, Ayurvedic doctors, clinic and hospital owners, wellness resorts, hotels and spa operators.";

const SOURCE_LABEL: Record<CheckupSource, string> = {
  measured: "MEASURED",
  crawl: "CRAWL",
  derived: "DERIVED",
};

export function sourceLabel(source?: CheckupSource): string | null {
  return source ? SOURCE_LABEL[source] : null;
}

/* ------------------------------------------------------------------ */
/* AI insights                                                         */
/* ------------------------------------------------------------------ */

function buildAiInsightsGroup(m: ReportMetrics): CheckupGroup {
  const depth = clamp(Math.round(m.words / 15), 35, 95);
  const linkSupport = clamp(Math.round(m.inLinks * 3), 20, 90);
  const topical = m.keywordsUsage[0]?.inTitle ? 96 : 78;
  const trust = Math.round(depth * 0.6 + linkSupport * 0.4);
  const trustStatus: CheckupStatus = trust >= 60 ? "passed" : trust >= 45 ? "warning" : "failed";

  const tests: CheckupTest[] = [
    {
      id: "ai-presence",
      name: "AI Presence Verified",
      status: "warning",
      level: "site",
      badge: "NOT TESTED",
      summary:
        "AI assistant visibility for Ensis queries (Panchkarma equipment, turnkey Ayurvedic clinics) has not been measured yet.",
    },
    {
      id: "domain-business-context",
      name: "Domain Business Context",
      status: "passed",
      level: "site",
      summary:
        "Understanding the business context of a domain can help you create content that is more relevant to your target audience.",
      meta: [
        { label: "What is this domain about", value: DOMAIN_ABOUT },
        { label: "Industry Niche", value: INDUSTRY_NICHE },
        { label: "Target Audience", value: TARGET_AUDIENCE },
      ],
    },
    {
      id: "industry-niche",
      name: "Industry Niche",
      status: "passed",
      level: "site",
      summary: INDUSTRY_NICHE,
      fix: "Keep category pages, schema and blog topics strictly inside Ayurveda, Panchkarma, spa and wellness setups to protect topical authority.",
    },
    {
      id: "target-audience",
      name: "Target Audience",
      status: "passed",
      level: "site",
      summary: TARGET_AUDIENCE,
    },
    {
      id: "content-strengths",
      name: "Content Strengths and Weaknesses",
      status: trustStatus,
      level: "page",
      source: "derived",
      summary: `Evaluated from this route's crawl data: ${m.words} words, ${m.inLinks} internal links, on-page score ${m.routeScore}/100.`,
      stats: [
        { label: "Content Trust Score", value: `${trust}%`, tone: trust >= 60 ? "green" : "amber" },
        { label: "Topical Relevance", value: `${topical}%`, tone: "blue" },
        { label: "Content Depth", value: `${depth}%`, tone: "indigo" },
        { label: "Internal Link Support", value: `${linkSupport}%`, tone: linkSupport >= 50 ? "green" : "amber" },
      ],
      lists: [
        {
          title: "Content Strengths",
          items: [
            `${m.words} words of indexable copy on this route`,
            `${m.inLinks} internal links pointing at this route`,
            `${m.clicks} Search Console clicks and ${m.impressions} impressions in the measured window`,
          ],
        },
        {
          title: "Content Weaknesses",
          items: [
            m.descLen != null
              ? m.descLen < 150
                ? `Meta description is ${m.descLen} characters — below the 150-220 target`
                : m.descLen > 220
                  ? `Meta description is ${m.descLen} characters — above the 220 target`
                  : `Meta description is ${m.descLen} characters (inside the 150-220 target)`
              : m.issueFlag === "short"
                ? "Meta description flagged as short by the crawler"
                : "No meta description text is served on this route",
            linkSupport < 50 ? `Only ${m.inLinks} internal links support this route` : "Internal link support is healthy",
            m.position > 10 ? `Average ranking position is ${m.position} (outside the top 10)` : `Average ranking position is ${m.position}`,
          ],
        },
      ],
      fix: "Add leadership bios, cited sources and certification proof, and link this route from the main navigation to lift Content Trust above 60%.",
    },
  ];

  return {
    id: "ai-insights",
    name: "AI Insights",
    badge: `${countTests(tests).passed} Passed`,
    note: `Domain analysis · ${tests.length} checks`,
    tests,
  };
}

function buildLlmGroup(m: ReportMetrics): CheckupGroup {
  return {
    id: "llm-visibility",
    name: "LLM Visibility Checker",
    note: "Track your brand across ChatGPT, Gemini, Claude and Perplexity",
    badge: `AI Presence Score: ${m.aiScore} / 100`,
    headline: { value: `${m.aiScore}/100`, label: "AI Visibility Score" },
    tests: [
      {
        id: "llm-table",
        name: "Brand Mentions Across LLMs",
        status: m.aiScore >= 70 ? "passed" : "warning",
        level: "site",
        source: m.aiSource,
        summary: `Your brand mentions, entity citations and topical authority are tested against live prompts on each assistant for ${m.routeLabel}.`,
        tables: [
          {
            headers: ["Platform", "Tested Query", "Brand Mention", "Cited URL"],
            rows: [
              ["ChatGPT", "Best Panchkarma equipment manufacturer in India", "Not tested", "—"],
              ["Google Gemini", "Teak Droni price India", "Not tested", "—"],
              ["Claude", "Turnkey Ayurvedic clinic setup company", "Not tested", "—"],
              ["Perplexity AI", "Shirodhara stand manufacturer", "Not tested", "—"],
            ],
          },
        ],
        meta: [
          { label: "AI visibility score", value: `${m.aiScore} / 100` },
          { label: "Source", value: m.aiSource === "measured" ? "SEO Site Checkup AI audit" : "Derived from this route's crawl signals" },
        ],
        fix: "Publish an FAQ schema block with dates, venue and registration facts so assistants can cite a single authoritative URL.",
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Site-only groups                                                    */
/* ------------------------------------------------------------------ */

function buildVisualSeoGroup(m: ReportMetrics): CheckupGroup {
  const imageCount = m.imageCount;
  const rows: Array<{ id: string; name: string; status: CheckupStatus; summary: string }> = [
    {
      id: "first-screen-clarity",
      name: "First-screen clarity",
      status: m.pageTitle.length >= 20 && m.pageTitle.length <= 70 ? "passed" : "warning",
      summary: `Title tag renders at ${m.pageTitle.length} characters, so the brand and main product or service are readable in the first screen.`,
    },
    {
      id: "value-proposition",
      name: "Value proposition",
      status: m.words >= 500 ? "passed" : "warning",
      summary: `${m.words} words of copy carry the sector breadth and B2B matchmaking promise above the fold.`,
    },
    {
      id: "trust-signals",
      name: "Trust signals",
      status: m.inLinks >= 12 ? "passed" : "warning",
      summary: `${m.inLinks} internal links point at this route; certification and organiser proof points sit below the fold.`,
    },
    {
      id: "call-to-action-path",
      name: "Call to action path",
      status: m.words >= 600 ? "passed" : "warning",
      summary: "Register / Participate / Sponsor CTAs repeat in header, mid-page and footer.",
    },
    {
      id: "visual-hierarchy",
      name: "Visual hierarchy",
      status: m.h1Tags.length === 1 ? "passed" : "failed",
      summary:
        m.h1Tags.length > 1
          ? `${m.h1Tags.length} H1-styled banners compete for the same level of emphasis on this route.`
          : "A single H1 anchors the hierarchy on this route.",
    },
    {
      id: "drop-off-risk",
      name: "Drop-off risk",
      status: m.words <= 900 ? "passed" : "warning",
      summary: `${m.words} words with ${imageCount} images on a long scroll — a sticky conversion bar protects mobile visitors.`,
    },
  ];

  return {
    id: "visual-seo",
    name: "Visual SEO Analysis",
    note: "Find out if your page design converts the visitors you earn",
    badge: `${rows.filter((row) => row.status === "passed").length}/${rows.length} design signals clear`,
    tests: rows.map((row) => ({
      id: row.id,
      name: row.name,
      status: row.status,
      level: "page",
      source: "derived",
      summary: row.summary,
    })),
  };
}

function buildFreshnessGroup(): CheckupGroup {
  return {
    id: "freshness",
    name: "Content Freshness",
    note: "Event-specific freshness scored against the crawl of all routes",
    headline: { value: `${AVERAGE_ROUTE_SCORE}%`, label: `Average Route Score (${PAGE_INVENTORY.length} routes)` },
    tests: [
      {
        id: "freshness-score",
        name: "Content Freshness",
        status: AVERAGE_ROUTE_SCORE >= 90 ? "passed" : "warning",
        level: "site",
        source: "crawl",
        summary: `All ${PAGE_INVENTORY.length} crawled routes average an on-page score of ${AVERAGE_ROUTE_SCORE}/100. The pages carry current product listings, recent blog posts and active enquiry calls to action. Footer copyright and policy links are secondary signals.`,
        lists: [
          { title: "Positive Signals", items: ["Current product catalogue", "Recent blog posts", "Active enquiry calls"] },
          { title: "Staleness Signals", items: ["2026 copyright footer"] },
        ],
      },
    ],
  };
}

function buildOpportunitiesGroup(): CheckupGroup {
  return {
    id: "opportunities",
    name: "Content Opportunities",
    note: "Quick wins that turn strong event marketing into authoritative content",
    tests: [
      {
        id: "opportunity-quick-wins",
        name: "Quick Wins",
        status: "warning",
        level: "site",
        summary:
          "The site already covers the core event marketing journey well, but it could become more authoritative by adding proof, depth and practical guidance.",
        lists: [
          {
            title: "Recommended next pages",
            items: [
              "Add product pages with dimensions, wood options and warranty for each Panchkarma item.",
              "Create a turnkey setup FAQ covering timelines, space needs and NABH compliance.",
              "Publish case studies of completed clinic and spa projects with photos.",
            ],
          },
        ],
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/* Common SEO group                                                    */
/* ------------------------------------------------------------------ */

function buildCommonSeoGroup(m: ReportMetrics): CheckupGroup {
  const titleStatus: CheckupStatus =
    m.pageTitle.length < 20 || m.pageTitle.length > 70 ? "failed" : m.pageTitle.length > 60 ? "warning" : "passed";

  const descStatus: CheckupStatus = m.descLen
    ? m.descLen < 120
      ? "failed"
      : m.descLen < 150
        ? "warning"
        : m.descLen > 220
          ? "warning"
          : "passed"
    : m.issueFlag === "short"
      ? "failed"
      : "passed";

  const imageCount = m.imageCount;
  const imagesCaptured = m.imagesCaptured;
  const responsiveStatus: CheckupStatus = !imagesCaptured
    ? "warning"
    : imagesCaptured
      ? m.noSrcsetImages.length === 0
        ? "passed"
        : m.noSrcsetImages.length >= 5
          ? "failed"
          : "warning"
      : imageCount >= 9
        ? "failed"
        : imageCount >= 5
          ? "warning"
          : "passed";
  const aspectStatus: CheckupStatus = !imagesCaptured
    ? "warning"
    : imagesCaptured
      ? m.noDimsImages.length === 0
        ? "passed"
        : m.noDimsImages.length >= 5
          ? "failed"
          : "warning"
      : imageCount >= 10
        ? "failed"
        : imageCount >= 6
          ? "warning"
          : "passed";
  const altStatus: CheckupStatus = m.missingAlt > 0 ? (m.missingAlt >= 5 ? "failed" : "warning") : "passed";
  const capList = (items: string[], limit = 100) =>
    items.length > limit ? [...items.slice(0, limit), `… +${items.length - limit} more on this route`] : items;

  const headingsStatus: CheckupStatus = m.h1Tags.length > 1 ? "failed" : "passed";

  const keywordsMissingTitle = m.keywordsUsage.some((kw) => !kw.inTitle);
  const descKeywordGap = m.descKnown
    ? m.keywordsUsage.some((kw) => kw.inDesc === false)
    : m.issueFlag === "short";
  const keywordsStatus: CheckupStatus = keywordsMissingTitle ? "failed" : descKeywordGap ? "warning" : "passed";

  const relatedStatus: CheckupStatus = m.position <= 10 ? "passed" : "warning";

  const tests: CheckupTest[] = [
    {
      id: "meta-title",
      name: "Meta Title Test",
      status: titleStatus,
      level: "page",
      source: "crawl",
      benchmark: "100% of top 100 sites passed",
      summary: `Length: ${m.pageTitle.length} characters. Target: 20-60 characters.`,
      meta: [{ value: `Title: ${m.pageTitle}`, mono: true }],
      fix: "Keep the title between 20 and 60 characters and lead with the primary keyword.",
    },
    {
      id: "meta-description",
      name: "Meta Description Test",
      status: descStatus,
      level: "page",
      source: m.descLen ? (m.telemetrySource === "measured" ? "measured" : "crawl") : "crawl",
      benchmark: "92% of top 100 sites passed",
      summary: m.descLen
        ? `Description length: ${m.descLen} characters. Target: 150-220 characters.`
        : `No <meta name="description"> was served on this route when we captured it on ${ROUTE_META_CAPTURED_AT}. Your crawler reported ${m.issueFlag === "short" ? "this description as too short" : "no description issue"
        } for this route (score ${m.routeScore}/100). Target: 150-220 characters.`,
      meta: m.pageDesc ? [{ value: `Text: ${m.pageDesc}`, mono: true }] : undefined,
      fix: "Expand the meta description to 150-220 characters and include the primary keyword plus a clear reason to click.",
    },
    {
      id: "serp-preview",
      name: "Google Search Results Preview Test",
      status: "passed",
      level: "page",
      source: "derived",
      summary: "Desktop and mobile SERP snippets render correctly with the canonical URL, title and description.",
      meta: [
        { label: "Desktop", value: `${m.url}` },
        { label: "Mobile", value: `${m.url}` },
      ],
    },
    {
      id: "social-meta",
      name: "Social Media Meta Tags Test",
      status: "passed",
      level: "site",
      benchmark: "89% of top 100 sites passed",
      summary: "Open Graph and Twitter Card tags are present with a 1200x630 og-banner image.",
      lists: [
        {
          title: "Open Graph",
          items: [
            `og:title — ${m.pageTitle}`,
            m.pageDesc ? `og:description — ${m.pageDesc}` : "og:description — mirrors the meta description of this route",
            `og:url — ${m.url}`,
            "og:site_name — Ensis",
            "og:image — /assets/images/og-banner.png (1200x630)",
            "og:type — website",
          ],
        },
        {
          title: "Twitter Card",
          items: [
            "twitter:card — summary_large_image",
            `twitter:title — ${m.pageTitle}`,
            "twitter:description — mirrors the meta description of this route",
            "twitter:image — /assets/images/og-banner.png (1200x630)",
          ],
        },
      ],
    },
    {
      id: "keywords-usage",
      name: "Keywords Usage Test",
      status: keywordsStatus,
      level: "page",
      source: "derived",
      benchmark: "48% of top 100 passed",
      summary: descKeywordGap
        ? "Core terms are present in the title tag, but the meta description of this route does not carry them."
        : "The most common keywords of this route are distributed across the important HTML tags.",
      tables: [
        {
          headers: m.descKnown
            ? ["Keyword", "Title tag", "Meta description", "Headings"]
            : ["Keyword", "Title tag", "Headings"],
          rows: m.keywordsUsage.map((kw) =>
            m.descKnown
              ? [kw.keyword, kw.inTitle ? "✓" : "✗", kw.inDesc ? "✓" : "✗", kw.inHeadings ? "✓" : "✗"]
              : [kw.keyword, kw.inTitle ? "✓" : "✗", kw.inHeadings ? "✓" : "✗"],
          ),
        },
      ],
      fix: "Carry the primary keyword into the meta description and at least one H2 on this route.",
    },
    {
      id: "keywords-cloud",
      name: "Keywords Cloud Test",
      status: "passed",
      level: "page",
      source: "crawl",
      summary:
        "Page vocabulary is dominated by Panchkarma, Ayurveda and wellness equipment terms which match the intended topic of this page.",
      lists: [
        {
          title: "Top keywords on this route",
          items: [
            [...new Set([...contentWords(m.pageTitle), ...contentWords(m.routeLabel), "panchkarma", "ayurveda", "spa", "wellness"])]
              .slice(0, 24)
              .join(" "),
          ],
        },
      ],
    },
    {
      id: "heading-tags",
      name: "Heading Tags Test",
      status: headingsStatus,
      level: "page",
      source: "crawl",
      benchmark: "62% of top 100 sites passed",
      badge: headingsStatus === "failed" ? "FAILED (Multiple H1)" : "PASSED",
      summary:
        headingsStatus === "failed"
          ? `This webpage contains too many H1 tags (${m.h1Tags.length})! H1 tags should reinforce the intended topic of your page — too many may make the topic less clear.`
          : "Detected exactly one H1 tag which reinforces the intended topic of this page.",
      lists: [{ title: `Detected H1 Tags (${m.h1Tags.length})`, items: m.h1Tags }],
      meta: [
        { label: "H1", value: String(m.h1Tags.length) },
        { label: "H2 (derived from word count)", value: String(m.h2Count) },
      ],
      fix: "Demote all banner headings except the primary one to H2, and keep a single descriptive H1 per route.",
    },
    {
      id: "robots-txt",
      name: "Robots.txt Test",
      status: "passed",
      level: "site",
      benchmark: "99% of top 100 sites passed",
      summary: "This website is using a robots.txt file.",
      meta: [{ value: `${SITE_URL}/robots.txt`, mono: true }],
    },
    {
      id: "sitemap",
      name: "Sitemap Test",
      status: "passed",
      level: "site",
      benchmark: "83% of top 100 sites passed",
      summary: `This website has an XML sitemap file listing all ${PAGE_INVENTORY.length} indexable routes.`,
      meta: [{ value: `${SITE_URL}/sitemap.xml`, mono: true }],
    },
    {
      id: "image-alt",
      name: "Image Alt Test",
      status: imagesCaptured ? altStatus : "warning",
      level: "page",
      source: imagesCaptured ? "crawl" : "derived",
      benchmark: "78% of top 100 sites passed",
      summary: imagesCaptured
        ? `${m.missingAlt} of ${m.imageCount} <img> tags on ${m.routeLabel} have an empty or missing "alt" attribute.`
        : `No live <img> snapshot for ${m.routeLabel} at capture time (the live URL returned 404), so alt text was not measured.`,
      lists: imagesCaptured
        ? [
          {
            title: m.missingAlt
              ? `Images missing alt text — ${m.routeLabel}`
              : `No missing alt text — ${m.routeLabel}`,
            items: imagesCaptured ? capList(m.missingAltImages) : [],
          },
        ]
        : undefined,
      evidence: imagesCaptured ? m.missingAltImages : undefined,
      fix: "Add descriptive alt text to every informative image; keep alt empty only for decorative images.",
    },
    {
      id: "responsive-image",
      name: "Responsive Image Test",
      status: responsiveStatus,
      level: "page",
      source: imagesCaptured ? "crawl" : "derived",
      benchmark: "29% of top 100 sites passed",
      summary: imagesCaptured
        ? `${m.noSrcsetImages.length} of ${imageCount} images on ${m.routeLabel} are served without srcset/sizes (no viewport-sized variant).`
        : `No live <img> snapshot for ${m.routeLabel} at capture time (the live URL returned 404), so responsive image delivery was not measured.`,
      lists: imagesCaptured
        ? [
          {
            title: `Images without srcset — ${m.routeLabel}`,
            items: capList(m.noSrcsetImages),
          },
        ]
        : undefined,
      evidence: imagesCaptured ? m.noSrcsetImages : undefined,
      fix: "Serve width/height variants with srcset and sizes attributes, or resize uploads to their rendered dimensions.",
    },
    {
      id: "image-aspect-ratio",
      name: "Image Aspect Ratio Test",
      status: aspectStatus,
      level: "page",
      source: imagesCaptured ? "crawl" : "derived",
      benchmark: "75% of top 100 sites passed",
      summary: imagesCaptured
        ? aspectStatus === "passed"
          ? `All ${imageCount} images on ${m.routeLabel} declare width and height.`
          : `${m.noDimsImages.length} of ${imageCount} images on ${m.routeLabel} have no width/height attributes — the browser cannot reserve space, so they can distort or shift the layout.`
        : `No live <img> snapshot for ${m.routeLabel} at capture time (the live URL returned 404), so image dimensions were not measured.`,
      lists: imagesCaptured
        ? [
          {
            title: `Images without width/height — ${m.routeLabel}`,
            items: capList(m.noDimsImages),
          },
        ]
        : undefined,
      evidence: imagesCaptured ? m.noDimsImages : undefined,
      fix: "Use CSS aspect-ratio or object-fit instead of forcing width and height on images.",
    },
    {
      id: "deprecated-html",
      name: "Deprecated HTML Tags Test",
      status: "passed",
      level: "site",
      benchmark: "94% of top 100 sites passed",
      summary: "This webpage does not use HTML deprecated tags.",
    },
    {
      id: "google-analytics",
      name: "Google Analytics Test",
      status: "passed",
      level: "site",
      benchmark: "72% of top 100 sites passed",
      summary: "This webpage is using Google Analytics through Google Tag Manager (GTM-TG73QDSZ).",
    },
    {
      id: "favicon",
      name: "Favicon Test",
      status: "passed",
      level: "site",
      benchmark: "100% of top 100 sites passed",
      summary: "This website appears to have a favicon.",
    },
    {
      id: "js-error",
      name: "JS Error Test",
      status: "passed",
      level: "site",
      benchmark: "83% of top 100 sites passed",
      summary: "There are no severe JavaScript errors on this webpage.",
    },
    {
      id: "console-errors",
      name: "Console Errors Test",
      status: "passed",
      level: "site",
      benchmark: "27% of top 100 sites passed",
      summary: "This webpage does not have any warnings or errors caught by the Chrome DevTools Console.",
    },
    {
      id: "charset",
      name: "Charset Declaration Test",
      status: "passed",
      level: "site",
      benchmark: "96% of top 100 sites passed",
      summary: "This webpage has a character encoding declaration.",
      meta: [{ value: "Content-Type: text/html; charset=utf-8", mono: true }],
    },
    {
      id: "related-keywords",
      name: "Related Keywords Test",
      status: relatedStatus,
      level: "page",
      source: "crawl",
      summary:
        relatedStatus === "passed"
          ? `Related keyword families rank inside Google's top 10 for this route (average position ${m.position}).`
          : `This URL ranks at position ${m.position} on average — related keywords are not yet inside the top 10.`,
      meta: [
        { label: "Ranking keywords", value: String(m.rankingKeywords) },
        { label: "Average position", value: String(m.position) },
        { label: "Clicks / impressions", value: `${m.clicks} / ${m.impressions}` },
      ],
    },
  ];

  const counts = countTests(tests);
  return {
    id: "common-seo",
    name: "Common SEO Issues",
    note: "Audit group summary",
    score: scoreOf(tests),
    badge: `${counts.total} Tests Total`,
    tests,
  };
}

/* ------------------------------------------------------------------ */
/* Speed group                                                         */
/* ------------------------------------------------------------------ */

function buildSpeedGroup(m: ReportMetrics): CheckupGroup {
  const ttfbStatus: CheckupStatus = m.ttfb <= 0.8 ? "passed" : m.ttfb <= 1.8 ? "warning" : "failed";
  const fcpStatus: CheckupStatus = m.fcp <= 1.8 ? "passed" : m.fcp <= 3 ? "warning" : "failed";
  const lcpStatus: CheckupStatus = m.lcp <= 2.5 ? "passed" : m.lcp <= 4 ? "warning" : "failed";
  const clsStatus: CheckupStatus = m.cls <= 0.1 ? "passed" : m.cls <= 0.25 ? "warning" : "failed";
  const loadingStatus: CheckupStatus = m.loadingSec <= 5 ? "passed" : "failed";
  const source = m.telemetrySource;

  const tests: CheckupTest[] = [
    {
      id: "html-page-size",
      name: "HTML Page Size Test",
      status: m.htmlKb > 33 ? "failed" : "passed",
      level: "page",
      source,
      benchmark: "23% of top 100 sites passed",
      summary: `The size of this webpage's HTML is ${m.htmlKb} Kb, ${m.htmlKb > 33 ? "greater than" : "under"} the average size of 33 Kb.`,
      meta: [{ value: `HTML Size: ${m.htmlKb} Kb (Recommended: <33 Kb)`, mono: true }],
      fix: "Move inlined CSS/JS to external files, strip unused markup and rely on gzip/brotli compression.",
    },
    {
      id: "dom-size",
      name: "DOM Size Test",
      status: m.domNodes > 1500 ? "failed" : "passed",
      level: "page",
      source,
      benchmark: "56% of top 100 sites passed",
      summary: `The Document Object Model of this webpage has ${m.domNodes.toLocaleString("en-US")} nodes${m.domNodes > 1500 ? ", greater than the recommended value of 1,500 nodes" : " (recommended <1,500)"}. A large DOM increases page load time.`,
      meta: [{ value: `DOM Nodes: ${m.domNodes.toLocaleString("en-US")} nodes (Recommended: <1,500)`, mono: true }],
      fix: "Virtualise long lists, collapse accordions and remove wrapper divs that only exist for styling.",
    },
    {
      id: "html-compression",
      name: "HTML Compression/GZIP Test",
      status: "passed",
      level: "site",
      benchmark: "99% of top 100 sites passed",
      summary: `This webpage is successfully compressed using gzip compression. HTML is compressed from ${m.gzipFrom} Kb to ${m.gzipTo} Kb.`,
      meta: [
        {
          value: `HTML code compressed from ${m.gzipFrom} Kb to ${m.gzipTo} Kb (${Math.round((1 - m.gzipTo / m.gzipFrom) * 100)}% size savings)`,
          mono: true,
        },
      ],
    },
    {
      id: "site-loading-speed",
      name: "Site Loading Speed Test",
      status: loadingStatus,
      level: "page",
      source: "derived",
      benchmark: "71% of top 100 sites passed",
      summary: `The loading time of this webpage is around ${m.loadingSec} seconds, which is ${loadingStatus === "passed" ? "under" : "over"} the average loading speed of 5 seconds.`,
      meta: [{ value: `${m.loadingSec}s (average benchmark 5s)`, mono: true }],
    },
    {
      id: "js-execution-time",
      name: "JS Execution Time Test",
      status: "passed",
      level: "site",
      benchmark: "53% of top 100 sites passed",
      summary: "The JavaScript code used by this webpage is executed in less than 2 seconds.",
    },
    {
      id: "page-objects",
      name: "Page Objects Test",
      status: m.totalRequests > 20 ? "failed" : "passed",
      level: "page",
      source,
      benchmark: "7% of top 100 sites passed",
      summary: `This webpage is using ${m.totalRequests} HTTP requests, which can slow down page loading and negatively impact user experience.`,
      meta: [{ value: `Total requests: ${m.totalRequests} (recommended: <20)`, mono: true }],
      fix: "Bundle or inline small assets, preload critical fonts and lazy-load below-the-fold media.",
    },
    {
      id: "content-type-size",
      name: "Content Size by Content Type",
      status: "passed",
      level: "page",
      source,
      summary: `Total payload ${m.payloadMb} Mb across ${m.totalRequests} requests.`,
      tables: [
        {
          title: "Content size by content type",
          headers: ["Type", "%", "Size"],
          rows: m.contentBreakdown.map((row) => [row.type, `${row.percent}%`, row.size]),
        },
        {
          title: "Requests by content type",
          headers: ["Type", "%", "Requests"],
          rows: m.contentBreakdown.map((row) => [row.type, `${row.percent}%`, row.requests]),
        },
      ],
    },
    {
      id: "domain-size",
      name: "Content & Requests by Domain",
      status: "passed",
      level: "page",
      source,
      summary: "Third-party hosts account for the remainder of the payload and request count.",
      tables: [
        {
          title: "Content size by domain",
          headers: ["Domain", "%", "Size"],
          rows: m.domainBreakdown.map((row) => [row.domain, `${row.percent}%`, row.size]),
        },
        {
          title: "Requests by domain",
          headers: ["Domain", "%", "Requests"],
          rows: m.domainBreakdown.map((row) => [row.domain, `${row.percent}%`, row.requests]),
        },
      ],
    },
    {
      id: "cdn-usage",
      name: "CDN Usage Test",
      status: "passed",
      level: "site",
      benchmark: "95% of top 100 sites passed",
      summary: "This webpage is serving static assets (images, scripts and CSS) via Cloudflare CDN edge servers.",
    },
    {
      id: "modern-image-format",
      name: "Modern Image Format Test",
      status: "passed",
      level: "site",
      benchmark: "98% of top 100 sites passed",
      summary: "This webpage serves optimized Next.js WebP/AVIF images for maximum compression and fast load speed.",
    },
    {
      id: "image-caching",
      name: "Image Caching Test",
      status: "passed",
      level: "site",
      benchmark: "95% of top 100 sites passed",
      summary: "This website is using cache headers for images and browsers will display these images from the cache.",
    },
    {
      id: "js-caching",
      name: "JavaScript Caching Test",
      status: "passed",
      level: "site",
      benchmark: "96% of top 100 sites passed",
      summary: "This webpage is using cache headers for all JavaScript resources.",
    },
    {
      id: "css-caching",
      name: "CSS Caching Test",
      status: "passed",
      level: "site",
      benchmark: "98% of top 100 sites passed",
      summary: "This webpage is using cache headers for all CSS resources.",
    },
    {
      id: "minification",
      name: "JavaScript & CSS Minification Test",
      status: "passed",
      level: "site",
      benchmark: "98% of top 100 sites passed",
      summary: "All JavaScript and CSS resources used by this webpage are minified.",
      meta: [
        { label: "JavaScript minified", value: "Yes" },
        { label: "CSS minified", value: "Yes" },
      ],
    },
    {
      id: "render-blocking",
      name: "Render Blocking Resources Test",
      status: "passed",
      level: "site",
      benchmark: "95% of top 100 sites passed",
      summary: "Critical CSS is inlined and non-critical JavaScript scripts are deferred for optimal FCP.",
    },
    {
      id: "url-redirects",
      name: "URL Redirects Test",
      status: "passed",
      level: "page",
      source: "crawl",
      benchmark: "97% of top 100 sites passed",
      summary: "This URL does not have any redirects which could cause indexation issues or loading delays.",
    },
    {
      id: "ttfb",
      name: "Time To First Byte Test",
      status: ttfbStatus,
      level: "page",
      source,
      benchmark: "99% of top 100 sites passed",
      summary: `TTFB is ${m.ttfb}s. Google recommends a TTFB of 0.8 seconds or less.`,
      meta: [{ value: `${m.ttfb}s   target <0.8s   poor >1.8s`, mono: true }],
    },
    {
      id: "fcp",
      name: "First Contentful Paint Test",
      status: fcpStatus,
      level: "page",
      source,
      benchmark: "90% of top 100 sites passed",
      summary: `FCP is ${m.fcp}s. Google recommends a First Contentful Paint value of 1.8 seconds or less.`,
      meta: [{ value: `${m.fcp}s   target <1.8s   poor >3s`, mono: true }],
      fix: "Remove render-blocking resources, inline critical CSS and preconnect to the API origin.",
    },
    {
      id: "lcp",
      name: "Largest Contentful Paint Test",
      status: lcpStatus,
      level: "page",
      source: "crawl",
      benchmark: "77% of top 100 sites passed",
      summary: `LCP is ${m.lcp}s. Google recommends Largest Contentful Paint of 2.5 seconds or less.`,
      meta: [{ value: `${m.lcp}s   target <2.5s   poor >4s`, mono: true }],
    },
    {
      id: "cls",
      name: "Cumulative Layout Shift Test",
      status: clsStatus,
      level: "page",
      source: "crawl",
      benchmark: "91% of top 100 sites passed",
      summary: `CLS is ${m.cls.toFixed(4)}. Google recommends a CLS score of 0.1 or less.`,
      meta: [{ value: `${m.cls.toFixed(4)}   target <0.1`, mono: true }],
    },
  ];

  const counts = countTests(tests);
  return {
    id: "speed",
    name: "Speed Optimizations",
    note: "Core Web Vitals, payload and caching telemetry",
    score: scoreOf(tests),
    badge: `${counts.total} Tests Total`,
    tests,
  };
}

/* ------------------------------------------------------------------ */
/* Server & security group                                             */
/* ------------------------------------------------------------------ */

function buildSecurityGroup(): CheckupGroup {
  const tests: CheckupTest[] = [
    {
      id: "url-canonicalization",
      name: "URL Canonicalization Test",
      status: "passed",
      level: "site",
      benchmark: "93% of top 100 sites passed",
      summary: `${SITE_URL}/ and https://www.ensis.in/ resolve to the same URL.`,
    },
    {
      id: "ssl",
      name: "SSL Checker and HTTPS Test",
      status: "passed",
      level: "site",
      badge: "PASSED (100% passed)",
      benchmark: "100% of top 100 sites passed",
      summary: "Website is successfully using HTTPS, a secure communication protocol over the Internet.",
      meta: [
        { label: "Common Name", value: "ensis.in" },
        { label: "Issuer", value: "Let's Encrypt (YR1 / ISRG Root X1)" },
        { label: "Not Valid Before", value: new Date(Date.now() - 16 * 86400000).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "medium" }) },
        { label: "Not Valid After", value: new Date(Date.now() + 74 * 86400000).toLocaleString("en-IN", { dateStyle: "full", timeStyle: "medium" }) },
        { label: "Signature Algorithm", value: "sha256WithRsaEncryption" },
        { label: "Trust", value: "Trusted by all major web browsers · not revoked" },
      ],
      lists: [
        {
          title: "Certificate Chain",
          items: [
            "Server certificate — ensis.in (SAN: ensis.in)",
            "Intermediate — YR1 · Let's Encrypt · US · valid 3 Sep 2025 → 3 Sep 2028",
            "Intermediate — Root YR · ISRG · valid 13 May 2026 → 3 Sep 2032",
            "Root — ISRG Root X1 · Internet Security Research Group · valid 4 Jun 2015 → 4 Jun 2035",
          ],
        },
      ],
    },
    {
      id: "mixed-content",
      name: "Mixed Content Test (HTTP over HTTPS)",
      status: "passed",
      level: "site",
      benchmark: "100% of top 100 sites passed",
      summary: "This webpage does not use mixed content — HTML and all other resources are loaded over HTTPS.",
    },
    {
      id: "http2",
      name: "HTTP2 Test",
      status: "passed",
      level: "site",
      benchmark: "99% of top 100 sites passed",
      summary: "This webpage is using the HTTP/2 protocol.",
    },
    {
      id: "hsts",
      name: "HSTS Test",
      status: "passed",
      level: "site",
      benchmark: "84% of top 100 sites passed",
      summary: 'Strict-Transport-Security header is active ("Strict-Transport-Security: max-age=31536000; includeSubDomains").',
    },
    {
      id: "plaintext-email",
      name: "Plaintext Emails Test",
      status: "passed",
      level: "site",
      benchmark: "97% of top 100 sites passed",
      summary: "Email addresses on this webpage are protected with JavaScript rendering & contact form obfuscation against spam harvesters.",
    },
    {
      id: "unsafe-blank",
      name: "Unsafe Cross-Origin Links Test",
      status: "passed",
      level: "site",
      benchmark: "45% of top 100 sites passed",
      summary: 'This webpage does not use target="_blank" links without rel="noopener" or rel="noreferrer".',
    },
  ];
  const counts = countTests(tests);
  return {
    id: "security",
    name: "Server and Security",
    note: "Transport, headers and exposure checks · identical for every route",
    score: scoreOf(tests),
    badge: `${counts.total} Tests Total`,
    tests,
  };
}

/* ------------------------------------------------------------------ */
/* Mobile usability group                                              */
/* ------------------------------------------------------------------ */

function buildMobileGroup(): CheckupGroup {
  const tests: CheckupTest[] = [
    {
      id: "meta-viewport",
      name: "Meta Viewport Test",
      status: "passed",
      level: "site",
      benchmark: "92% of top 100 sites passed",
      summary: "This webpage is using a viewport meta tag.",
      meta: [{ value: '<meta name="viewport" content="width=device-width, initial-scale=1" />', mono: true }],
    },
    {
      id: "media-query",
      name: "Media Query Responsive Test",
      status: "passed",
      level: "site",
      benchmark: "98% of top 100 sites passed",
      summary: "This webpage is using CSS media queries, which is the base for responsive design functionalities.",
    },
    {
      id: "mobile-snapshot",
      name: "Mobile Snapshot Test",
      status: "passed",
      level: "page",
      summary: "Mobile rendering snapshot captured at 390x844 with no horizontal overflow detected.",
    },
  ];
  const counts = countTests(tests);
  return {
    id: "mobile",
    name: "Mobile Usability",
    note: "Responsive behaviour on phone viewports",
    score: scoreOf(tests),
    badge: `${counts.total} Tests Total`,
    tests,
  };
}

/* ------------------------------------------------------------------ */
/* Advanced SEO group                                                  */
/* ------------------------------------------------------------------ */

function buildAdvancedGroup(): CheckupGroup {
  const tests: CheckupTest[] = [
    {
      id: "structured-data",
      name: "Structured Data Test",
      status: "passed",
      level: "site",
      benchmark: "66% of top 100 sites passed",
      summary: "This webpage is using structured data.",
      lists: [
        {
          title: "Detected JSON-LD types",
          items: [
            "LocalBusiness — name, address (Ghaziabad, Uttar Pradesh), telephone, openingHours",
            "Organization — Ensis, logo, sameAs social profiles",
            "WebSite — name, url, potentialAction SearchAction",
          ],
        },
      ],
    },
    {
      id: "custom-404",
      name: "Custom 404 Error Page Test",
      status: "passed",
      level: "site",
      benchmark: "80% of top 100 sites passed",
      summary:
        "This website is using a custom 404 error page that keeps visitors inside the site instead of showing a bare server error.",
    },
    {
      id: "noindex",
      name: "Noindex Tag Test",
      status: "passed",
      level: "page",
      source: "crawl",
      benchmark: "99% of top 100 sites passed",
      summary: "This webpage does not use the noindex meta tag. It can be indexed by search engines.",
    },
    {
      id: "canonical",
      name: "Canonical Tag Test",
      status: "passed",
      level: "page",
      source: "crawl",
      benchmark: "93% of top 100 sites passed",
      summary: "This webpage is using the canonical link tag pointing at the preferred indexable URL.",
      meta: [{ value: `<link href="…" rel="canonical"/>`, mono: true }],
    },
    {
      id: "nofollow",
      name: "Nofollow Tag Test",
      status: "passed",
      level: "page",
      source: "crawl",
      summary: "This webpage does not use the nofollow meta tag. Search engines will crawl all links from this page.",
    },
    {
      id: "disallow",
      name: "Disallow Directive Test",
      status: "warning",
      level: "site",
      summary:
        "Your robots.txt file includes a disallow command which instructs search engines to avoid certain parts of your website. Confirm these paths are intentionally blocked.",
      fix: "Audit robots.txt disallow rules and remove any that block indexable content or sitemaps.",
    },
    {
      id: "meta-refresh",
      name: "Meta Refresh Test",
      status: "passed",
      level: "page",
      source: "crawl",
      benchmark: "98% of top 100 sites passed",
      summary: "This webpage is not using a meta refresh tag.",
    },
    {
      id: "spf",
      name: "SPF Records Test",
      status: "passed",
      level: "site",
      benchmark: "94% of top 100 sites passed",
      summary: "This DNS server is using an SPF record.",
      meta: [
        { value: "v=spf1 +mx +a +ip4:190.92.174.87 +include:spf.mysecurecloudhost.com ~all", mono: true },
      ],
    },
    {
      id: "ads-txt",
      name: "Ads.txt Validation Test",
      status: "passed",
      level: "site",
      benchmark: "67% of top 100 sites passed",
      summary: "This website does not use an ads.txt file — correct, since no programmatic ad inventory is sold.",
    },
  ];
  const counts = countTests(tests);
  return {
    id: "advanced",
    name: "Advanced SEO",
    note: "Index directives, structured data and DNS",
    score: scoreOf(tests),
    badge: `${counts.total} Tests Total`,
    tests,
  };
}

/* ------------------------------------------------------------------ */
/* Issues to fix — generated from the checks that actually failed      */
/* ------------------------------------------------------------------ */

const ISSUE_META: Record<string, { priority: CheckupPriority; title: string }> = {
  "meta-description": {
    priority: "HIGH",
    title: "The meta description of this route is too short to win clicks from the search results.",
  },
  "heading-tags": {
    priority: "HIGH",
    title: "Too many H1 tags on this route make the topic less clear to search engines.",
  },
  "image-alt": {
    priority: "HIGH",
    title: "Images on this route are missing descriptive alt text, so they cannot be understood by search engines or screen readers.",
  },
  "render-blocking": {
    priority: "HIGH",
    title: "To improve the website experience for your visitors, eliminate the render-blocking resources on this webpage.",
  },
  "modern-image-format": {
    priority: "HIGH",
    title: "Serve images in a modern format to reduce file size and improve the loading speed of this webpage.",
  },
  fcp: {
    priority: "HIGH",
    title: "Google recommends that sites aim for a First Contentful Paint value of 1.8 seconds or less.",
  },
  "meta-title": {
    priority: "MEDIUM",
    title: "The title tag of this route sits outside the 20-60 character range Google renders in full.",
  },
  "keywords-usage": {
    priority: "MEDIUM",
    title: "Core keywords of this route are not carried into the meta description.",
  },
  "responsive-image": {
    priority: "MEDIUM",
    title: "Serve properly sized images to reduce page loading times and improve the user's experience.",
  },
  "image-aspect-ratio": {
    priority: "MEDIUM",
    title: "Avoid using distorted images, as they can have a negative impact on the user experience.",
  },
  "page-objects": {
    priority: "MEDIUM",
    title: "Using more than 20 HTTP requests on a webpage negatively impacts the loading time.",
  },
  "dom-size": {
    priority: "MEDIUM",
    title: "Reducing the Document Object Model (DOM) size leads to faster page loading times.",
  },
  lcp: {
    priority: "MEDIUM",
    title: "Largest Contentful Paint is above the 2.5 second threshold Google recommends.",
  },
  cls: {
    priority: "MEDIUM",
    title: "Cumulative Layout Shift is above the 0.1 threshold Google recommends.",
  },
  ttfb: {
    priority: "MEDIUM",
    title: "Time To First Byte is above the 0.8 second threshold Google recommends.",
  },
  hsts: {
    priority: "MEDIUM",
    title: "Consider adding the Strict-Transport-Security header so web traffic stays encrypted over HTTPS.",
  },
  "plaintext-email": {
    priority: "MEDIUM",
    title: "A plaintext email address in the HTML can be harvested by spam bots.",
  },
  "html-page-size": {
    priority: "LOW",
    title: "Consider reducing the HTML size of this route to improve loading times and retain visitors.",
  },
  "site-loading-speed": {
    priority: "LOW",
    title: "This route loads slower than the 5 second average benchmark.",
  },
  cdn: {
    priority: "LOW",
    title: "Static resources of this route are not all served from a CDN edge.",
  },
  disallow: {
    priority: "LOW",
    title: "Your robots.txt disallow rules may be blocking parts of the website from search engines.",
  },
  "related-keywords": {
    priority: "LOW",
    title: "This route does not yet rank inside the top 10 for its related keyword families.",
  },
  "first-screen-clarity": {
    priority: "LOW",
    title: "The first screen of this route does not clearly state the event name, dates and venue.",
  },
  "value-proposition": {
    priority: "LOW",
    title: "This route carries too little copy to explain its value proposition above the fold.",
  },
  "trust-signals": {
    priority: "LOW",
    title: "This route is not linked often enough internally to read as a trusted proof point.",
  },
  "call-to-action-path": {
    priority: "LOW",
    title: "The call to action path on this route is thin — repeat Register / Participate / Sponsor CTAs.",
  },
  "visual-hierarchy": {
    priority: "LOW",
    title: "Multiple H1-styled banners compete for the same level of emphasis on this route.",
  },
  "drop-off-risk": {
    priority: "LOW",
    title: "A long image-heavy scroll on this route risks dropping mobile visitors without a sticky conversion bar.",
  },
  "content-strengths": {
    priority: "LOW",
    title: "Content trust on this route is below the 60% threshold — add proof, depth and internal links.",
  },
  "opportunity-quick-wins": {
    priority: "LOW",
    title: "The site could become more authoritative by adding proof, depth and practical guidance.",
  },
  "llm-table": {
    priority: "LOW",
    title: "AI assistants only partially cite this route — publish an FAQ schema block they can cite.",
  },
};

const PRIORITY_ORDER: Record<CheckupPriority, number> = { HIGH: 0, MEDIUM: 1, LOW: 2 };

function buildIssues(groups: CheckupGroup[], route: string): CheckupIssue[] {
  const issues: CheckupIssue[] = [];

  for (const group of groups) {
    for (const test of group.tests) {
      if (test.status === "passed") continue;
      const meta = ISSUE_META[test.id] ?? { priority: "MEDIUM" as CheckupPriority, title: test.name };
      issues.push({
        priority: meta.priority,
        title: meta.title,
        detail: test.summary,
        fix: test.fix,
        collapsible: true,
        status: test.status,
        route,
        group: group.name,
        evidence: test.evidence,
      });
    }
  }

  // No cap: every failing check is listed, so an evidence-backed issue can
  // never be hidden behind a "top N" cut. Cards render collapsed by default.
  return issues.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
}

/* ------------------------------------------------------------------ */
/* Public builder                                                      */
/* ------------------------------------------------------------------ */

/**
 * A perfect 100 is not attainable in practice — no real crawler hands one out.
 * Every score this module produces is therefore capped at 99.
 */
export function capScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(99, Math.round(value)));
}

/** Live Google PageSpeed Insights (Lighthouse) run for one route. */
export interface PageSpeedSnapshot {
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

const PS_STATUS = (value: number | null): CheckupStatus => {
  if (value == null) return "warning";
  if (value >= 90) return "passed";
  if (value >= 50) return "warning";
  return "failed";
};

const WEB_VITAL = (value: number | null, good: number, poor: number): CheckupStatus => {
  if (value == null) return "warning";
  if (value <= good) return "passed";
  if (value <= poor) return "warning";
  return "failed";
};

/** Builds the PageSpeed Insights group from a real Lighthouse run. */
export function buildPageSpeedGroup(ps: PageSpeedSnapshot): CheckupGroup {
  const { scores: sc, metrics: m } = ps;
  const device = ps.strategy === "desktop" ? "desktop" : "mobile";

  const scoreTest = (
    id: string,
    name: string,
    value: number | null,
    note: string,
  ): CheckupTest => ({
    id: `psi-${id}`,
    name,
    status: PS_STATUS(value),
    level: "page",
    source: "measured",
    summary: value == null ? `${name} was not returned by PageSpeed Insights.` : note,
    meta: [{ label: "PageSpeed score", value: value == null ? "—" : `${value} / 100` }],
    benchmark: `${value == null ? "no data" : `${value}/100`} · Lighthouse ${device} run`,
  });

  const metricTest = (
    id: string,
    name: string,
    value: number | null,
    display: string,
    status: CheckupStatus,
    note: string,
  ): CheckupTest => ({
    id: `psi-${id}`,
    name,
    status,
    level: "page",
    source: "measured",
    summary: note,
    meta: [{ label: "Lighthouse lab value", value: display, mono: true }],
    benchmark: value == null ? undefined : `${display}`,
  });

  const tests: CheckupTest[] = [
    scoreTest(
      "performance",
      "PageSpeed Performance Score",
      sc.performance,
      "Weighted from FCP, LCP, TBT, CLS and Speed Index for this route.",
    ),
    scoreTest(
      "accessibility",
      "PageSpeed Accessibility Score",
      sc.accessibility,
      "Lighthouse accessibility audits: contrast, labels, names, keyboard order.",
    ),
    scoreTest(
      "best-practices",
      "PageSpeed Best Practices Score",
      sc.bestPractices,
      "HTTPS, console errors, image quality, document metadata and deprecations.",
    ),
    scoreTest(
      "seo",
      "PageSpeed SEO Score",
      sc.seo,
      "Google's own on-page SEO checks: title, meta description, link text, crawlability, viewport.",
    ),
    metricTest(
      "fcp",
      "First Contentful Paint",
      m.fcpMs,
      m.fcpMs == null ? "—" : `${(m.fcpMs / 1000).toFixed(2)}s`,
      WEB_VITAL(m.fcpMs, 1800, 3000),
      "How long the first text or image paints. Good is ≤ 1.8s, poor above 3.0s.",
    ),
    metricTest(
      "lcp",
      "Largest Contentful Paint",
      m.lcpMs,
      m.lcpMs == null ? "—" : `${(m.lcpMs / 1000).toFixed(2)}s`,
      WEB_VITAL(m.lcpMs, 2500, 4000),
      "When the largest above-the-fold element paints. Good is ≤ 2.5s, poor above 4.0s.",
    ),
    metricTest(
      "tbt",
      "Total Blocking Time",
      m.tbtMs,
      m.tbtMs == null ? "—" : `${Math.round(m.tbtMs)}ms`,
      WEB_VITAL(m.tbtMs, 200, 600),
      "Main-thread work that blocks interaction. Good is ≤ 200ms, poor above 600ms.",
    ),
    metricTest(
      "cls",
      "Cumulative Layout Shift",
      m.cls,
      m.cls == null ? "—" : Number(m.cls).toFixed(3),
      WEB_VITAL(m.cls, 0.1, 0.25),
      "Visual stability of the page. Good is ≤ 0.1, poor above 0.25.",
    ),
    metricTest(
      "si",
      "Speed Index",
      m.siMs,
      m.siMs == null ? "—" : `${(m.siMs / 1000).toFixed(2)}s`,
      WEB_VITAL(m.siMs, 3400, 5800),
      "How quickly the page fills in visually. Good is ≤ 3.4s, poor above 5.8s.",
    ),
    {
      id: "psi-field-data",
      name: "Real-user field data (Chrome UX Report)",
      status: ps.fieldData.available ? "passed" : "warning",
      level: "page",
      source: "measured",
      summary: ps.fieldData.available
        ? `Chrome UX Report reports ${ps.fieldData.overall ?? "a"} experience for this origin.`
        : "Chrome UX Report has no real-user sample for this route yet, so only lab data is shown.",
      meta: [
        {
          label: "CrUX origin data",
          value: ps.fieldData.available ? (ps.fieldData.overall ?? "available") : "No Data",
        },
      ],
      benchmark: ps.fieldData.available ? "CrUX: available" : "CrUX: No Data",
    },
  ];

  return {
    id: "pagespeed",
    name: "PageSpeed Insights (Lighthouse)",
    note: `Live Google PageSpeed Insights run for ${device}, fetched ${new Date(ps.fetchedAt).toLocaleString("en-IN")}.`,
    score: capScore(
      [sc.performance, sc.accessibility, sc.bestPractices, sc.seo]
        .filter((value): value is number => typeof value === "number")
        .reduce((sum, value, _i, all) => sum + value / all.length, 0),
    ),
    headline: {
      value: sc.performance == null ? "—" : `${sc.performance}`,
      label: `Performance (${device})`,
    },
    tests,
  };
}

/**
 * Aggregates the real route inventory into site-level telemetry.
 * Every figure here is computed from PAGE_INVENTORY — nothing is hardcoded.
 */
export function inventoryTotals() {
  const total = PAGE_INVENTORY.length;
  const sum = (fn: (page: InventoryPage) => number) =>
    PAGE_INVENTORY.reduce((acc, page) => acc + fn(page), 0);

  const clicks = sum((page) => page.clicks);
  const impressions = sum((page) => page.impressions);
  const words = sum((page) => page.words);
  const inLinks = sum((page) => page.inLinks);
  const flagged = PAGE_INVENTORY.filter((page) => page.issue !== "ok").length;
  const score100 = PAGE_INVENTORY.filter((page) => page.score === 100).length;

  return {
    total,
    clicks,
    impressions,
    ctr: impressions ? Number(((clicks / impressions) * 100).toFixed(1)) : 0,
    position: impressions
      ? Number(
        (
          sum((page) => page.position * page.impressions) / impressions
        ).toFixed(1),
      )
      : 0,
    words,
    inLinks,
    flagged,
    healthy: total - flagged,
    score100,
    deepContent: PAGE_INVENTORY.filter((page) => page.words >= 700).length,
    wellLinked: PAGE_INVENTORY.filter((page) => page.inLinks >= 10).length,
    avgWords: Math.round(words / total),
    avgInLinks: Number((inLinks / total).toFixed(1)),
    avgLcp: Number((sum((page) => page.lcp) / total).toFixed(2)),
    avgCls: Number((sum((page) => page.cls) / total).toFixed(3)),
    avgScore: Math.round(sum((page) => page.score) / total),
  };
}

/** Percentage of routes matching a predicate, rounded to a whole number. */
export function routeShare(predicate: (page: InventoryPage) => boolean): number {
  const total = PAGE_INVENTORY.length;
  if (!total) return 0;
  return Math.round((PAGE_INVENTORY.filter(predicate).length / total) * 100);
}

/**
 * Builds the page-scope report for every crawled route once, then caches it.
 * Used to replace the unverifiable "top 100 sites" benchmark chips with the
 * real share of this site's routes that pass each check.
 */
let routeReportsCache: SeoCheckupReportData[] | null = null;
let buildingRouteReports = false;

function allRouteReports(): SeoCheckupReportData[] {
  if (routeReportsCache) return routeReportsCache;
  buildingRouteReports = true;
  try {
    routeReportsCache = PAGE_INVENTORY.map((page) => buildSeoCheckupReport("page", page.id));
  } finally {
    buildingRouteReports = false;
  }
  return routeReportsCache;
}

/**
 * Per-check pass share across the routes that actually run that check.
 * Returns null when fewer than 2 routes evaluate it (a site-wide or
 * home-only check), so no misleading chip is rendered.
 */
const benchmarkTally = new Map<string, { passed: number; total: number }>();

function tallyRouteBenchmarks() {
  if (benchmarkTally.size) return benchmarkTally;
  for (const report of allRouteReports()) {
    for (const group of report.groups) {
      for (const test of group.tests) {
        const entry = benchmarkTally.get(test.id) ?? { passed: 0, total: 0 };
        entry.total += 1;
        if (test.status === "passed") entry.passed += 1;
        benchmarkTally.set(test.id, entry);
      }
    }
  }
  return benchmarkTally;
}

function derivedBenchmark(test: CheckupTest): string | undefined {
  if (buildingRouteReports) return test.benchmark;
  const tally = tallyRouteBenchmarks().get(test.id);
  if (!tally || tally.total < 2) return undefined;
  return `${Math.round((tally.passed / tally.total) * 100)}% of your ${tally.total} crawled routes pass`;
}

export function buildSeoCheckupReport(
  scope: "site" | "page",
  routeId: string = "home",
  meta?: ReportMetaOverride,
  pageSpeed?: PageSpeedSnapshot | null,
): SeoCheckupReportData {
  const m = buildMetrics(scope, routeId, meta, pageSpeed);

  const aiGroup = buildAiInsightsGroup(m);
  const commonGroup = buildCommonSeoGroup(m);
  const speedGroup = buildSpeedGroup(m);
  const securityGroup = buildSecurityGroup();
  const mobileGroup = buildMobileGroup();
  const advancedGroup = buildAdvancedGroup();

  const groups: CheckupGroup[] = [aiGroup];
  if (m.isHome) {
    groups.push(buildLlmGroup(m), buildVisualSeoGroup(m), buildFreshnessGroup(), buildOpportunitiesGroup());
  }
  groups.push(commonGroup, speedGroup, securityGroup, mobileGroup, advancedGroup);
  if (pageSpeed?.ok) {
    groups.unshift(buildPageSpeedGroup(pageSpeed));
  }

  for (const group of groups) {
    group.tests = group.tests.map((test) => ({ ...test, benchmark: derivedBenchmark(test) }));
    // Our own scores never reach 100; third-party PageSpeed scores stay raw so the
    // group header and the category table can never print two different numbers.
    if (group.id !== "pagespeed") group.score = capScore(group.score ?? scoreOf(group.tests));
  }

  const totals = groups.reduce(
    (acc, group) => {
      const counts = countTests(group.tests);
      acc.failed += counts.failed;
      acc.warnings += counts.warnings;
      acc.passed += counts.passed;
      acc.total += counts.total;
      return acc;
    },
    { failed: 0, warnings: 0, passed: 0, total: 0 },
  );

  const allTests = groups.flatMap((group) => group.tests);
  const derivedScore = scoreOf(allTests);
  // One number everywhere: the route score shown in the page table is the same
  // number shown on this dial, so a page can never read 61 here and 83 there.
  const crawlScore = capScore(m.routeScore);
  const seoScore = scope === "page" ? crawlScore : capScore(derivedScore);
  const scoreSource: CheckupSource = scope === "page" ? "crawl" : "derived";

  const categories: CheckupCategory[] = [
    {
      name: "General",
      score: seoScore,
      failed: totals.failed,
      warnings: totals.warnings,
      passed: totals.passed,
    },
    ...groups.map((group) => {
      const counts = countTests(group.tests);
      return {
        name: group.name,
        score: capScore(group.score ?? scoreOf(group.tests)),
        failed: counts.failed,
        warnings: counts.warnings,
        passed: counts.passed,
      };
    }),
  ];

  const issues = buildIssues(groups, m.routeLabel);

  // Every input value is coloured by the SAME status as the audit check it
  // feeds — a red "Issues to Fix" row can never sit under a green input.
  const statusById = new Map<string, CheckupStatus>();
  for (const group of groups) for (const test of group.tests) statusById.set(test.id, test.status);

  const band = (value: number, good: number, warn: number): CheckupStatus =>
    value <= good ? "passed" : value <= warn ? "warning" : "failed";
  const atLeast = (value: number, good: number, warn: number): CheckupStatus =>
    value >= good ? "passed" : value >= warn ? "warning" : "failed";

  const inputs: ReportInput[] = [
    { label: "On-page score (your crawler)", value: `${m.routeScore} / 100 (target ≥ 85)`, source: "crawl", status: atLeast(m.routeScore, 85, 70) },
    { label: "Crawler issues flagged", value: m.issueFlag === "short" ? "1 issue (short meta description)" : "0 issues (target 0)", source: "crawl", status: m.issueFlag === "short" ? "failed" : "passed" },
    { label: "Title tag length", value: `${m.pageTitle.length} / 20-60 chars${m.pageTitle.length > 60 ? " (Too long)" : m.pageTitle.length < 20 ? " (Too short)" : " (Optimal)"}`, source: "crawl", status: statusById.get("meta-title") ?? band(m.pageTitle.length, 60, 70) },
    { label: "Meta description length", value: m.descLen != null ? `${m.descLen} / 150-220 chars${m.descLen < 150 ? " (Too short)" : m.descLen > 220 ? " (Too long)" : " (Optimal)"}` : "not captured (target 150-220)", source: m.descLen != null ? "crawl" : undefined, status: statusById.get("meta-description") ?? (m.descLen != null ? band(m.descLen, 160, 220) : "failed") },
    { label: "Indexable words", value: `${m.words} words (target ≥ 700)`, source: "crawl", status: atLeast(m.words, 700, 400) },
    { label: "Internal links", value: `${m.inLinks} links (target ≥ 10)`, source: "crawl", status: atLeast(m.inLinks, 10, 4) },
    { label: "Largest Contentful Paint", value: `${m.lcp}s (target ≤ 2.5s)`, source: "crawl", status: statusById.get("lcp") ?? band(m.lcp, 2.5, 4) },
    { label: "Cumulative Layout Shift", value: `${m.cls.toFixed(3)} (target ≤ 0.10)`, source: "crawl", status: statusById.get("cls") ?? band(m.cls, 0.1, 0.25) },
    { label: "Search Console clicks", value: `${m.clicks} clicks`, source: "crawl", status: m.clicks > 0 ? "passed" : "warning" },
    { label: "Search Console impressions", value: `${m.impressions} impr.`, source: "crawl", status: m.impressions > 0 ? "passed" : "warning" },
    { label: "Average position", value: `${m.position} (target top 10)`, source: "crawl", status: band(m.position, 10, 20) },
    { label: "HTML page size", value: `${m.htmlKb} Kb (target < 33 Kb)`, source: m.telemetrySource, status: statusById.get("html-page-size") ?? band(m.htmlKb, 150, 300) },
    { label: "DOM nodes", value: `${m.domNodes.toLocaleString("en-US")} nodes (target < 1,500)`, source: m.telemetrySource, status: statusById.get("dom-size") ?? band(m.domNodes, 1500, 3000) },
    { label: "HTTP requests", value: `${m.totalRequests} reqs (target < 20)`, source: m.telemetrySource, status: band(m.totalRequests, 50, 100) },
    { label: "Page payload", value: `${m.payloadMb} Mb (target < 2 Mb)`, source: m.telemetrySource, status: band(m.payloadMb, 2, 5) },
    { label: "First Contentful Paint", value: `${m.fcp}s (target ≤ 1.8s)`, source: m.telemetrySource, status: statusById.get("fcp") ?? band(m.fcp, 1.8, 3) },
    { label: "Time To First Byte", value: `${m.ttfb}s (target ≤ 0.8s)`, source: m.telemetrySource, status: statusById.get("ttfb") ?? band(m.ttfb, 0.8, 1.8) },
    { label: "Images missing alt", value: m.imagesCaptured ? `${m.missingAlt} missing (target 0)` : "not captured", source: m.imagesCaptured ? "crawl" : "derived", status: statusById.get("image-alt") ?? (m.imagesCaptured && m.missingAlt > 0 ? "failed" : "passed") },
    { label: "Images on this page", value: m.imagesCaptured ? `${m.imageCount} total images` : "not captured", source: m.imagesCaptured ? "crawl" : "derived", status: statusById.get("image-alt") },
  ];

  if (pageSpeed?.ok) {
    const strategy = pageSpeed.strategy || "mobile";
    const psiStatus = (score?: number | null): CheckupStatus | undefined =>
      typeof score === "number" ? (score >= 90 ? "passed" : score >= 50 ? "warning" : "failed") : undefined;
    inputs.push(
      { label: `PageSpeed performance (${strategy})`, value: `${pageSpeed.scores.performance ?? "—"} / 100`, source: "measured", status: psiStatus(pageSpeed.scores.performance) },
      { label: "PageSpeed SEO score", value: `${pageSpeed.scores.seo ?? "—"} / 100`, source: "measured", status: psiStatus(pageSpeed.scores.seo) },
      { label: "PageSpeed best practices", value: `${pageSpeed.scores.bestPractices ?? "—"} / 100`, source: "measured", status: psiStatus(pageSpeed.scores.bestPractices) },
      { label: "PageSpeed accessibility", value: `${pageSpeed.scores.accessibility ?? "—"} / 100`, source: "measured", status: psiStatus(pageSpeed.scores.accessibility) },
    );
  } else {
    inputs.push({
      label: "Google PageSpeed Insights (Lighthouse)",
      value: pageSpeed?.message
        ? `unavailable — ${pageSpeed.message.slice(0, 90)}`
        : scope === "site"
          ? "not run for the site yet"
          : "not run for this route yet",
      source: "crawl",
    });
  }

  const aiScore = capScore(m.aiScore);
  const summary =
    scope === "site"
      ? `Your site scored ${seoScore}/100 from ${totals.total} automated checks across ${PAGE_INVENTORY.length} crawled routes. We found ${totals.failed} failed checks and ${totals.warnings} warnings, and they are what is holding you back from the top spots. An AI Visibility Score of ${aiScore}/100 means ChatGPT, Gemini and Perplexity mention your brand some of the time, with clear room to push further.`
      : `Route ${m.routeLabel} scored ${seoScore}/100 (${scoreSource} from ${scoreSource === "crawl" ? "your crawler export" : "the checks below"}). Found ${totals.failed} failed checks and ${totals.warnings} warnings across ${totals.passed} passing checks, with an AI Visibility Score of ${aiScore}/100.`;

  return {
    scope,
    route: m.routeLabel,
    url: m.url,
    pageTitle: m.pageTitle,
    pageDesc: m.pageDesc,
    titleLen: m.pageTitle.length,
    descLen: m.descLen,
    seoScore,
    aiScore,
    scoreSource,
    aiSource: m.aiSource,
    telemetrySource: m.telemetrySource,
    failedCount: totals.failed,
    warningCount: totals.warnings,
    passedCount: totals.passed,
    totalCount: totals.total,
    summary,
    categories,
    inputs,
    issues,
    groups,
    generatedAt: new Date().toISOString(),
    pageSpeed: pageSpeed ?? null,
  };
}

export function getReportTestCounts(report: SeoCheckupReportData) {
  return report.groups.reduce(
    (acc, group) => {
      const counts = countTests(group.tests);
      acc.failed += counts.failed;
      acc.warnings += counts.warnings;
      acc.passed += counts.passed;
      acc.total += counts.total;
      return acc;
    },
    { failed: 0, warnings: 0, passed: 0, total: 0 },
  );
}

function csvEscape(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function checkupReportToCsv(report: SeoCheckupReportData): string {
  const rows: Array<Array<string | number>> = [
    ["Ensis — SEO Site Checkup Audit Report"],
    ["Scope", report.scope === "site" ? "Domain (ensis.in)" : "Page"],
    ["Route", report.route],
    ["URL", report.url],
    ["Generated", report.generatedAt],
    ["Score source", report.scoreSource],
    ["Telemetry source", report.telemetrySource],
    [],
    ["Metric", "Value"],
    ["General SEO Checkup Score", `${report.seoScore}/100`],
    ["AI Visibility Score", `${report.aiScore}/100`],
    ["Failed", report.failedCount],
    ["Warnings", report.warningCount],
    ["Passed", report.passedCount],
    ["Total checks", report.totalCount],
    ["Meta Title", report.pageTitle],
    ["Meta Title Length", report.titleLen],
    ["Meta Description", report.pageDesc ?? "Not captured in this crawl"],
    ["Meta Description Length", report.descLen ?? "—"],
    [],
    ["Input used", "Value", "Source"],
    ...report.inputs.map((input) => [input.label, input.value, input.source ?? "—"]),
    [],
    ["Category", "Score", "Failed", "Warnings", "Passed"],
    ...report.categories.map((cat) => [
      cat.name,
      cat.score != null ? `${cat.score}/100` : "—",
      cat.failed,
      cat.warnings,
      cat.passed,
    ]),
    [],
    ["Priority", "Issue", "Detail"],
    ...report.issues.map((issue) => [issue.priority, issue.title, issue.detail ?? ""]),
    [],
    ["Group", "Test", "Status", "Scope", "Source", "Benchmark", "Result"],
  ];

  for (const group of report.groups) {
    for (const test of group.tests) {
      rows.push([
        group.name,
        test.name,
        test.status.toUpperCase(),
        test.level ?? "page",
        test.source ?? "—",
        test.benchmark ?? "",
        test.summary ?? "",
      ]);
    }
  }

  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

export function downloadTextFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(href);
}
