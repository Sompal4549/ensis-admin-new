import { PUBLIC_SITE_URL, type CmsPage } from "@/lib/cmsPages";
import { FieldLabel, SearchableSelectField, SelectField, TextInput } from "../fields";
import { SectionTitle } from "../section-editor";
import type { FormState } from "../types";
import { getTemplateForPage } from "../utils/templateMapping";

const NO_PARENT = "— No Parent (Top Level) —";

export function BasicInfoPanel({
  form,
  updateField,
  pages,
  onTemplateChange,
}: {
  form: FormState;
  updateField: <K extends keyof FormState>(key: K, value: FormState[K]) => void;
  pages: CmsPage[];
  onTemplateChange: (value: string) => void;
}) {
  return (
    <section
      className="
        shrink-0
        border
        border-[#dedfdb]
        shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_0_0_1px_rgba(27,31,35,0.15)]
        bg-white
        px-[16px]
        py-[11px]
      "
    >
      <SectionTitle
        number={1}
        title="Basic Information"
      />

      <div
        className="
          mt-[9px]
          grid
          grid-cols-[1.12fr_1fr_.63fr]
          gap-x-[20px]
          gap-y-[7px]
        "
      >
        <div>
          <FieldLabel required>
            Page Title
          </FieldLabel>

          <TextInput
            value={
              form.pageTitle
            }
            onChange={(
              value,
            ) =>
              updateField(
                "pageTitle",
                value,
              )
            }
          />

          <p className="mt-[2px] text-right text-[9px] font-medium text-[#218DAE]">
            {
              form
                .pageTitle
                .length
            }{" "}
            / 100
          </p>
        </div>

        <div>
          <FieldLabel required>
            URL Slug
          </FieldLabel>

          <div
            className="
              flex
              h-[35px]
              overflow-hidden
              rounded-none
              shadow-[0_1px_3px_0_rgba(0,0,0,0.02),0_0_0_1px_rgba(27,31,35,0.15)]
              bg-white
            "
          >
            <div
              className="
                flex
                shrink-0
                items-center
                border-r
                border-[#e5e6e2]
                bg-[#fafaf8]
                px-[9px]
                text-[9.5px]
                font-medium
                text-[#5f6a7c]
              "
            >
              {PUBLIC_SITE_URL}/
            </div>

            <input
              value={
                form.slug
              }
              onChange={(
                event,
              ) =>
                updateField(
                  "slug",
                  event
                    .target
                    .value,
                )
              }
              placeholder="enter-page-slug"
              className="
                min-w-0
                flex-1
                cursor-default
                px-[9px]
                text-[10.5px]
                font-medium
                text-[#414b5e]
                outline-none
                placeholder:text-[#9aa0aa]
              "
            />
          </div>

          <p className="mt-[2px] text-right text-[9px] font-medium text-[#218DAE]">
            {
              form.slug
                .length
            }{" "}
            / 80
          </p>
        </div>

        <div>
          <FieldLabel>
            Select Template
          </FieldLabel>

          <SearchableSelectField
            value={
              form.template
            }
            placeholder="Select Template"
            searchPlaceholder="Search page or template..."
            onChange={onTemplateChange}
            options={Array.from(new Set(pages.map((p) => getTemplateForPage(p))))}
          />
        </div>

        <div>
          <FieldLabel>
            Page Parent
          </FieldLabel>

          <SelectField
            value={
              form.parent
            }
            onChange={(
              value,
            ) => {
              updateField("parent", value);
            }}
            options={[NO_PARENT, "Home", ...pages.map((p) => p.title).filter((t) => t !== "Home")]}
          />

          <p className="mt-[2px] text-[9px] font-medium leading-[11px] text-red-500">
            Choose parent page
            (if any)
          </p>
        </div>

      </div>
    </section>
  );
}
