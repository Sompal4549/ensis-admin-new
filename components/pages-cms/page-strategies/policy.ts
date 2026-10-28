import { api } from "@/lib/api";
import type { SetSectionsDraft } from "./types";
import type { CmsJson, CmsRecord } from "@/lib/cmsJson";

const POLICY_KEY_MAP: Record<string, { compKey: string; defaultTitle: string; defaultEyebrow: string }> = {
  privacyPolicyPage: { compKey: "policy.privacy", defaultTitle: "Privacy Policy", defaultEyebrow: "POLICY GUIDE" },
  termsAndConditionsPage: { compKey: "policy.terms", defaultTitle: "Terms & Conditions", defaultEyebrow: "LEGAL NOTICE" },
  disclaimerPage: { compKey: "policy.disclaimer", defaultTitle: "Disclaimer", defaultEyebrow: "LEGAL NOTICE" },
  refundPolicyPage: { compKey: "policy.refund", defaultTitle: "Refund Policy", defaultEyebrow: "COMMERCIAL TERMS" },
};

export const isPolicyConfigKey = (configKey?: string) =>
  Boolean(configKey && POLICY_KEY_MAP[configKey]);

export function syncPolicySectionsFromLiveApi(
  configKey: string,
  setSectionsDraft: SetSectionsDraft,
): void {
  const meta = POLICY_KEY_MAP[configKey];
  if (!meta) return;

  api
    .get<CmsJson>(`/component-content/${meta.compKey}`)
    .then((res: any) => {
      const comp = res?.data?.data || res?.data || res;
      if (!comp) return;

      const heroData = comp.data?.hero || comp.hero || {};
      const liveLastUpdated =
        heroData.lastUpdated ||
        comp.data?.lastUpdated ||
        comp.lastUpdated ||
        "25 October 2026";
      const liveBanner =
        heroData.bannerImage ||
        heroData.backgroundImage ||
        comp.data?.bannerImage ||
        comp.data?.backgroundImage ||
        "/assets/privacy_and_enquiry.png";

      const liveSections: any[] = Array.isArray(comp.data?.sections)
        ? comp.data.sections
        : Array.isArray(comp.sections)
        ? comp.sections
        : [];

      setSectionsDraft((prev) => {
        const heroKey = `${meta.compKey}Hero`;
        const existingHero = prev.find(
          (s) =>
            s.key === "hero" ||
            s.key === heroKey ||
            String(s.key || "").toLowerCase().includes("hero") ||
            String(s.name || "").toLowerCase().includes("hero")
        );

        const heroSec: CmsRecord = {
          key: existingHero?.key || "hero",
          name: existingHero?.name || `${meta.defaultTitle} Hero Banner`,
          enabled: existingHero?.enabled !== false,
          eyebrow: heroData.eyebrow || existingHero?.eyebrow || meta.defaultEyebrow,
          title: heroData.title || existingHero?.title || meta.defaultTitle,
          subtitle: heroData.subtitle || heroData.description || existingHero?.subtitle || "",
          lastUpdated: liveLastUpdated || existingHero?.lastUpdated || "25 October 2026",
          backgroundImage: liveBanner || existingHero?.backgroundImage || "",
        };

        if (liveSections.length === 0) {
          // If no live sections found, just update the hero
          return prev.length > 0 ? [heroSec, ...prev.slice(1)] : [heroSec];
        }

        const clauseSections: CmsRecord[] = liveSections.map((sec: any, idx: number) => {
          const cleanNum = sec.number ? `${parseInt(sec.number, 10)}. ` : `${idx + 1}. `;
          const displayTitle = sec.title || `Clause ${idx + 1}`;
          const existingClause = prev.find(
            (p, pIdx) =>
              p !== existingHero &&
              (p.key === sec.id || p.key === `clause-${idx + 1}` || pIdx === idx + 1)
          );

          return {
            key: sec.id || `clause-${idx + 1}`,
            name: `${cleanNum}${displayTitle}`,
            enabled: existingClause?.enabled !== false,
            title: sec.title || existingClause?.title || "",
            description: sec.text || sec.description || existingClause?.description || "",
            extra: sec.extra !== undefined ? sec.extra : existingClause?.extra,
            extra2: sec.extra2 !== undefined ? sec.extra2 : existingClause?.extra2,
            icon: sec.icon || existingClause?.icon || "",
            cards: Array.isArray(sec.cards)
              ? sec.cards
              : Array.isArray(existingClause?.cards)
              ? existingClause?.cards
              : undefined,
            checkItems: Array.isArray(sec.checkItems)
              ? sec.checkItems
              : Array.isArray(existingClause?.checkItems)
              ? existingClause?.checkItems
              : undefined,
            bullets: Array.isArray(sec.bullets)
              ? sec.bullets
              : Array.isArray(existingClause?.bullets)
              ? existingClause?.bullets
              : undefined,
            link: sec.link
              ? { label: sec.link.label || "", href: sec.link.href || "" }
              : existingClause?.link
              ? existingClause.link
              : undefined,
          };
        });

        return [heroSec, ...clauseSections];
      });
    })
    .catch((err) => {
      console.warn(`Live policy sync failed for ${meta.compKey}:`, err);
    });
}
