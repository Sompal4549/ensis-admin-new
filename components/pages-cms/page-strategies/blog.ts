import { api } from "@/lib/api";
import type { SectionsDraft, SetSectionsDraft } from "./types";
import type { CmsJson, CmsRecord } from "@/lib/cmsJson";

const HERO_ENDPOINT = "/component-content/blog.hero";
const isHero = (sec: CmsRecord) =>
  sec.key === "blog.hero" ||
  sec.key === "blog-hero" ||
  sec.key === "hero" ||
  sec.componentKey === "blog.hero";

export function syncBlogSectionsFromLiveApi(setSectionsDraft: SetSectionsDraft): void {
  api.get(HERO_ENDPOINT)
    .then((res: CmsJson) => {
      const data = res?.data?.data || res?.data || res;
      if (data && typeof data === "object") {
        setSectionsDraft((prev) =>
          prev.map((sec) => {
            if (!isHero(sec)) return sec;
            const bg =
              (typeof data.backgroundImage === "object" ? data.backgroundImage?.imageUrl : data.backgroundImage) ||
              data.bannerImage ||
              (typeof data.image === "object" ? data.image?.imageUrl : data.image) ||
              data.bgImage;
            return {
              ...sec,
              eyebrow: data.eyebrow || sec.eyebrow,
              title: data.heading || data.title || sec.title,
              heading: data.heading || data.title || sec.heading,
              highlight: data.highlight || data.highlightedText || sec.highlight,
              highlightedText: data.highlight || data.highlightedText || sec.highlightedText,
              subtitle: data.subtitle || sec.subtitle,
              description: data.description || sec.description,
              backgroundImage: bg || sec.backgroundImage,
              image: bg || sec.image,
              imageAlt: data.imageAlt || sec.imageAlt,
            };
          })
        );
      }
    })
    .catch(() => {});
}

export async function saveBlogSections(sectionsDraft: SectionsDraft): Promise<void> {
  const heroSec = sectionsDraft.find(isHero);
  if (heroSec) {
    const bg = heroSec.backgroundImage || heroSec.image || heroSec.bgImage;
    await api.put(HERO_ENDPOINT, {
      eyebrow: heroSec.eyebrow || "",
      heading: heroSec.heading || heroSec.title || "",
      title: heroSec.title || heroSec.heading || "",
      highlight: heroSec.highlight || heroSec.highlightedText || "",
      highlightedText: heroSec.highlight || heroSec.highlightedText || "",
      subtitle: heroSec.subtitle || "",
      description: heroSec.description || "",
      backgroundImage: bg ? (typeof bg === "string" ? { imageUrl: bg, alt: heroSec.title || "" } : bg) : undefined,
      bannerImage: typeof bg === "string" ? bg : (bg?.imageUrl || ""),
      image: bg || "",
      imageAlt: heroSec.imageAlt || "",
    });
  }
}
