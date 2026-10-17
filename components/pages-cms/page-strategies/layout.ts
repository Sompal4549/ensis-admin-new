import { api } from "@/lib/api";
import type { CmsRecord } from "@/lib/cmsJson";
import type { SectionsDraft, SetSectionsDraft } from "./types";

/**
 * Site-wide header and footer (Organic admin keeps them as "Header Navigation" and
 * "Footer & Social Links" on the Home page). On Ensis they live in the ComponentContent
 * records the storefront reads — layout.header and layout.footer — so they are loaded
 * from and saved to those records, never into the Home page's own section list.
 */
export const LAYOUT_SECTIONS = [
  { key: "layout.header", name: "Header Navigation" },
  { key: "layout.footer", name: "Footer & Social Links" },
] as const;

export const isLayoutSection = (section: CmsRecord) =>
  typeof section.key === "string" && section.key.startsWith("layout.");

type ComponentContentRecord = { _id: string; key: string; data?: CmsRecord };

export function syncLayoutSectionsFromLiveApi(setSectionsDraft: SetSectionsDraft): void {
  Promise.all(
    LAYOUT_SECTIONS.map(({ key }) =>
      api.get<ComponentContentRecord>(`/component-content/${key}`).catch(() => null),
    ),
  ).then(([header, footer]) => {
    const toSection = (meta: (typeof LAYOUT_SECTIONS)[number], record: ComponentContentRecord | null): CmsRecord | null =>
      record?._id
        ? { key: meta.key, componentKey: meta.key, name: meta.name, layoutId: record._id, data: record.data || {} }
        : null;

    const headerSection = toSection(LAYOUT_SECTIONS[0], header);
    const footerSection = toSection(LAYOUT_SECTIONS[1], footer);

    setSectionsDraft((previous) => {
      const pageSections = previous.filter((section) => !isLayoutSection(section));
      return [
        ...(headerSection ? [headerSection] : []),
        ...pageSections,
        ...(footerSection ? [footerSection] : []),
      ];
    });
  });
}

export async function saveLayoutSections(sectionsDraft: SectionsDraft): Promise<void> {
  const layoutSections = sectionsDraft.filter((section) => isLayoutSection(section) && section.layoutId);
  for (const section of layoutSections) {
    await api.put(`/component-content/${section.layoutId}`, { data: section.data || {} });
  }
}

/** The Home page's own sections, without the header/footer records shown alongside them. */
export const withoutLayoutSections = (sectionsDraft: SectionsDraft): SectionsDraft =>
  sectionsDraft.filter((section) => !isLayoutSection(section));
