import type { ReactNode } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { FieldLabel, ImageUploadField, PdfUploadField, TextInput, Textarea, Toggle } from "../fields";
import type { CmsRecord } from "@/lib/cmsJson";
import { FooterSocialLinks } from "./FooterSocialLinks";

type Data = CmsRecord;

/** Immutable set of a dotted path ("company.ensisLogo.imageUrl") inside the section data */
const setPath = (data: Data, path: string, value: unknown): Data => {
  const [head, ...rest] = path.split(".");
  if (!rest.length) return { ...data, [head]: value };
  const child = data?.[head] && typeof data[head] === "object" ? data[head] : {};
  return { ...data, [head]: setPath(child, rest.join("."), value) };
};

const getPath = (data: Data, path: string): unknown =>
  path.split(".").reduce<unknown>((value, key) => (value && typeof value === "object" ? (value as Data)[key] : undefined), data);

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 rounded-[6px] border border-[#e2e8f0] bg-white p-3">
      <div className="flex items-center gap-2 border-b border-gray-100 pb-1.5 text-[11px] font-bold text-[#1e40af]">
        <span>{title}</span>
      </div>
      {children}
    </div>
  );
}

type Column = { field: string; label: string; placeholder?: string; type?: "text" | "image" };

/** Editable list of small records (menu links, social icons…) with add / remove / reorder */
function ListEditor({
  items,
  columns,
  blank,
  addLabel,
  onChange,
}: {
  items: Data[];
  columns: Column[];
  blank: Data;
  addLabel: string;
  onChange: (items: Data[]) => void;
}) {
  const update = (index: number, field: string, value: unknown) =>
    onChange(items.map((item, i) => (i === index ? setPath(item, field, value) : item)));
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-2 rounded-[6px] border border-[#eef1f4] bg-[#fbfbfa] p-2">
          <span className="mt-[9px] w-[18px] shrink-0 text-center text-[10px] font-bold text-[#64748b]">{index + 1}</span>
          <div className={`grid flex-1 gap-2 ${columns.length > 1 ? "md:grid-cols-2" : ""}`}>
            {columns.map((column) =>
              column.type === "image" ? (
                <div key={column.field}>
                  <FieldLabel>{column.label}</FieldLabel>
                  <ImageUploadField
                    value={String(getPath(item, column.field) || "")}
                    onChange={(next) => update(index, column.field, next)}
                  />
                </div>
              ) : (
                <div key={column.field}>
                  <FieldLabel>{column.label}</FieldLabel>
                  <TextInput
                    value={String(getPath(item, column.field) || "")}
                    onChange={(next) => update(index, column.field, next)}
                    placeholder={column.placeholder}
                    hideLimit
                  />
                </div>
              ),
            )}
          </div>
          <div className="mt-[18px] flex shrink-0 items-center gap-1">
            <button type="button" title="Move up" onClick={() => move(index, -1)} className="grid h-[28px] w-[28px] place-items-center rounded-[5px] border border-[#e2e8f0] bg-white text-[#475569] hover:bg-slate-50">
              <ArrowUp className="h-[12px] w-[12px]" />
            </button>
            <button type="button" title="Move down" onClick={() => move(index, 1)} className="grid h-[28px] w-[28px] place-items-center rounded-[5px] border border-[#e2e8f0] bg-white text-[#475569] hover:bg-slate-50">
              <ArrowDown className="h-[12px] w-[12px]" />
            </button>
            <button type="button" title="Remove" onClick={() => onChange(items.filter((_, i) => i !== index))} className="grid h-[28px] w-[28px] place-items-center rounded-[5px] border border-rose-200 bg-white text-rose-500 hover:bg-rose-50">
              <Trash2 className="h-[12px] w-[12px]" />
            </button>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, blank])}
        className="inline-flex h-[32px] w-fit items-center gap-[6px] rounded-[5px] border border-dashed border-[#93c5fd] bg-white px-[12px] text-[10px] font-bold text-[#1e40af] hover:bg-blue-50"
      >
        <Plus className="h-[12px] w-[12px]" />
        {addLabel}
      </button>
    </div>
  );
}

function Text({ data, path, label, placeholder, onChange, required }: {
  data: Data; path: string; label: string; placeholder?: string; required?: boolean; onChange: (data: Data) => void;
}) {
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <TextInput value={String(getPath(data, path) || "")} onChange={(next) => onChange(setPath(data, path, next))} placeholder={placeholder} hideLimit />
    </div>
  );
}

function ImageField({ data, path, label, onChange }: { data: Data; path: string; label: string; onChange: (data: Data) => void }) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <ImageUploadField value={String(getPath(data, path) || "")} onChange={(next) => onChange(setPath(data, path, next))} />
    </div>
  );
}

const asList = (value: unknown): Data[] => (Array.isArray(value) ? value : []);

function HeaderForm({ data, onChange }: { data: Data; onChange: (data: Data) => void }) {
  return (
    <div className="flex flex-col gap-4">
      <Card title="Header Logo">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <ImageField data={data} path="logo.imageUrl" label="Logo Image" onChange={onChange} />
          <div className="flex flex-col gap-3">
            <Text data={data} path="logo.alt" label="Logo Alt Text" placeholder="Ensis Logo" onChange={onChange} />
            <Text data={data} path="logo.href" label="Logo Link" placeholder="/" onChange={onChange} />
          </div>
        </div>
      </Card>

      <Card title="Header Contact & E-Brochure">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Text data={data} path="phone" label="Phone Number" placeholder="+91 9654900525" required onChange={onChange} />
          <Text data={data} path="email" label="Contact Email" placeholder="info@ensis.in" required onChange={onChange} />
          <Text data={data} path="actions.brochureButton.text" label="Brochure Button Text" placeholder="E-Brochure" onChange={onChange} />
          <div>
            <FieldLabel>E-Brochure PDF</FieldLabel>
            <PdfUploadField
              value={String(data.brochureUrl || "")}
              onChange={(next) => onChange(setPath(setPath(data, "brochureUrl", next), "actions.brochureButton.href", next))}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-6">
          {[
            { path: "actions.wishlist", label: "Show Wishlist icon" },
            { path: "actions.cart", label: "Show Cart icon" },
          ].map((toggle) => (
            <label key={toggle.path} className="flex items-center gap-2 text-[10.5px] font-semibold text-[#233D4D]">
              <Toggle checked={getPath(data, toggle.path) !== false} onChange={(value) => onChange(setPath(data, toggle.path, value))} />
              {toggle.label}
            </label>
          ))}
        </div>
      </Card>

      <Card title="Top Bar Highlights">
        <ListEditor
          items={asList(data.contactInfo)}
          columns={[
            { field: "image.imageUrl", label: "Icon", type: "image" },
            { field: "text", label: "Text", placeholder: "Manufactured in India" },
          ]}
          blank={{ image: { imageUrl: "", alt: "" }, text: "" }}
          addLabel="Add Highlight"
          onChange={(items) => onChange({ ...data, contactInfo: items })}
        />
      </Card>

      <Card title="Header Navigation Menu">
        <ListEditor
          items={asList(data.navigation)}
          columns={[
            { field: "title", label: "Menu Label", placeholder: "Products" },
            { field: "slug", label: "Link", placeholder: "/products" },
          ]}
          blank={{ title: "", slug: "/" }}
          addLabel="Add Menu Link"
          onChange={(items) => onChange({ ...data, navigation: items })}
        />
      </Card>
    </div>
  );
}

function FooterForm({ data, onChange }: { data: Data; onChange: (data: Data) => void }) {
  const columns = asList(data.navigation);
  const updateColumn = (index: number, next: Data) =>
    onChange({ ...data, navigation: columns.map((column, i) => (i === index ? next : column)) });

  return (
    <div className="flex flex-col gap-4">
      <Card title="Footer Logos & About">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <ImageField data={data} path="company.ensisLogo.imageUrl" label="Ensis Logo" onChange={onChange} />
          <ImageField data={data} path="company.designHouselogo.imageUrl" label="Design House Logo" onChange={onChange} />
          <Text data={data} path="company.name" label="Company Name" placeholder="Design House India Pvt. Ltd." onChange={onChange} />
          <Text data={data} path="company.maplink" label="Google Map Embed Link" placeholder="https://www.google.com/maps/embed?..." onChange={onChange} />
        </div>
        <div>
          <FieldLabel required>Footer Description</FieldLabel>
          <Textarea
            value={String(getPath(data, "company.description") || "")}
            onChange={(next) => onChange(setPath(data, "company.description", next))}
            rows={4}
            noLimit
          />
        </div>
      </Card>

      <Card title="Get In Touch (Contact Information)">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Text data={data} path="contact.phone" label="Phone Number" placeholder="+919654900525" required onChange={onChange} />
          <Text data={data} path="contact.email" label="Contact Email" placeholder="info@ensis.in" required onChange={onChange} />
          <Text data={data} path="contact.whatsappPhone" label="WhatsApp Number" placeholder="+919654900525" onChange={onChange} />
        </div>
        <div>
          <FieldLabel>Address</FieldLabel>
          <Textarea value={String(getPath(data, "contact.address") || "")} onChange={(next) => onChange(setPath(data, "contact.address", next))} rows={2} noLimit />
        </div>
      </Card>

      <Card title="Social Links (footer icons)">
        <FooterSocialLinks />
      </Card>

      {columns.map((column, index) => (
        <Card key={index} title={`Footer Column ${index + 1}: ${column.title || "Untitled"}`}>
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <FieldLabel>Column Heading</FieldLabel>
              <TextInput value={String(column.title || "")} onChange={(next) => updateColumn(index, { ...column, title: next })} placeholder="Quick Links" hideLimit />
            </div>
            <button
              type="button"
              onClick={() => onChange({ ...data, navigation: columns.filter((_, i) => i !== index) })}
              className="inline-flex h-[34px] items-center gap-[6px] rounded-[5px] border border-rose-200 bg-white px-[10px] text-[10px] font-bold text-rose-500 hover:bg-rose-50"
            >
              <Trash2 className="h-[12px] w-[12px]" />
              Remove Column
            </button>
          </div>
          <ListEditor
            items={asList(column.links)}
            columns={[
              { field: "label", label: "Link Label", placeholder: "About Us" },
              { field: "href", label: "Link", placeholder: "/about" },
            ]}
            blank={{ label: "", href: "/" }}
            addLabel="Add Link"
            onChange={(links) => updateColumn(index, { ...column, links })}
          />
        </Card>
      ))}
      <button
        type="button"
        onClick={() => onChange({ ...data, navigation: [...columns, { title: "", links: [] }] })}
        className="inline-flex h-[34px] w-fit items-center gap-[6px] rounded-[5px] border border-dashed border-[#93c5fd] bg-white px-[12px] text-[10px] font-bold text-[#1e40af] hover:bg-blue-50"
      >
        <Plus className="h-[12px] w-[12px]" />
        Add Footer Column
      </button>

      <Card title="Copyright Bar">
        <Text data={data} path="copyright.text" label="Copyright Text" placeholder="© 2026 Design House India Pvt. Ltd. All rights reserved." onChange={onChange} />
        <ListEditor
          items={asList(getPath(data, "copyright.links"))}
          columns={[
            { field: "label", label: "Link Label", placeholder: "Sitemap" },
            { field: "href", label: "Link", placeholder: "/sitemap.xml" },
          ]}
          blank={{ label: "", href: "/" }}
          addLabel="Add Link"
          onChange={(links) => onChange(setPath(data, "copyright.links", links))}
        />
      </Card>

      <Card title="Developer Credit (Copyright Bar)">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Text data={data} path="copyright.developer.label" label="Credit Text" placeholder="Designed & Developed by" onChange={onChange} />
          <Text data={data} path="copyright.developer.name" label="Company Name" placeholder="enCodency" onChange={onChange} />
          <Text data={data} path="copyright.developer.href" label="Company Website" placeholder="https://encodency.com" onChange={onChange} />
        </div>
        <ImageField data={data} path="copyright.developer.logoUrl" label="Company Logo (optional, shown on the red badge)" onChange={onChange} />
        <p className="text-[10px] font-medium text-slate-500">Without a logo the badge shows the company name as text. Clear the company name to hide the credit.</p>
      </Card>
    </div>
  );
}

/** Editor for the site-wide header (layout.header) and footer (layout.footer) records */
export function LayoutSectionEditor({ section, onDataChange }: { section: CmsRecord; onDataChange: (data: Data) => void }) {
  const data: Data = section.data && typeof section.data === "object" ? section.data : {};
  return (
    <div className="flex flex-col gap-3">
      <p className="rounded-[6px] border border-[#dbeafe] bg-[#eff6ff] px-3 py-2 text-[10px] font-semibold text-[#1e40af]">
        This {section.key === "layout.header" ? "header" : "footer"} appears on every page of the website. Changes go live when you click Save.
      </p>
      {section.key === "layout.header" ? <HeaderForm data={data} onChange={onDataChange} /> : <FooterForm data={data} onChange={onDataChange} />}
    </div>
  );
}
