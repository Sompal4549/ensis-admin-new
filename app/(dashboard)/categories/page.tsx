"use client";

import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { Download, Eye, EyeOff, FolderOpen, FolderTree, Package, Pencil, Plus, Save, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { useApiGet } from "@/lib/useApiGet";
import { downloadCsv } from "@/lib/csv";
import { PUBLIC_SITE_URL } from "@/lib/cmsPages";
import { ImageUploadField, Toggle } from "@/components/pages-cms/fields";
import {
  EmptyRow,
  FilterBar,
  FilterSelect,
  HeaderButton,
  LoadingRows,
  MainWithSidebar,
  OrganicPage,
  PageHeader,
  Pill,
  QuickActions,
  ResetButton,
  SearchBox,
  SideCard,
  SidebarBar,
  StatCard,
  StatGrid,
  TableCard,
  cellPrimary,
  cellSecondary,
  inputClass,
  labelClass,
  outlineButtonClass,
  primaryButtonClass,
  rowClass,
  thClass,
  theadRowClass,
} from "@/components/organic/OrganicUI";

type Category = { _id: string; name: string; slug: string; image?: string; isActive: boolean; productCount?: number };
type Draft = { _id?: string; name: string; slug: string; image: string; isActive: boolean };

const EMPTY: Draft = { name: "", slug: "", image: "", isActive: true };
const toSlug = (value: string) =>
  value.toLowerCase().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const BAR_COLORS = ["#29A15D", "#2784E1", "#8851DA", "#F39B16", "#7C9DB7", "#E4463E"];

export default function CategoriesPage() {
  const { data, loading, error, reload } = useApiGet<Category[]>("/categories?all=1");
  const categories = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const [search, setSearch] = useState("");
  const [visibility, setVisibility] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (error) Swal.fire({ title: "Could not load categories", text: error instanceof Error ? error.message : "", icon: "error" });
  }, [error]);

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return categories.filter((c) => {
      if (visibility === "visible" && c.isActive === false) return false;
      if (visibility === "hidden" && c.isActive !== false) return false;
      if (visibility === "empty" && c.productCount) return false;
      return !term || `${c.name} ${c.slug}`.toLowerCase().includes(term);
    });
  }, [categories, search, visibility]);

  const visible = categories.filter((c) => c.isActive !== false).length;
  const totalProducts = categories.reduce((sum, c) => sum + (c.productCount || 0), 0);
  const empty = categories.filter((c) => !c.productCount).length;
  const top = [...categories].sort((a, b) => (b.productCount || 0) - (a.productCount || 0)).slice(0, 6);

  const openNew = () => { setDraft({ ...EMPTY }); setSlugTouched(false); };
  const openEdit = (c: Category) => {
    setDraft({ _id: c._id, name: c.name, slug: c.slug, image: c.image || "", isActive: c.isActive !== false });
    setSlugTouched(true);
  };

  const save = async () => {
    if (!draft) return;
    if (!draft.name.trim()) {
      Swal.fire({ title: "Category name is required", icon: "warning" });
      return;
    }
    setSaving(true);
    try {
      const payload = { name: draft.name.trim(), slug: draft.slug || toSlug(draft.name), image: draft.image, isActive: draft.isActive };
      if (draft._id) await api.put(`/categories/${draft._id}`, payload);
      else await api.post("/categories", payload);
      setDraft(null);
      reload();
      Swal.fire({ title: "Category saved", icon: "success", timer: 1100, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: "Could not save category", text: err instanceof Error ? err.message : "", icon: "error" });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: Category) => {
    try {
      await api.put(`/categories/${c._id}`, { isActive: c.isActive === false });
      reload();
    } catch (err) {
      Swal.fire({ title: "Could not update category", text: err instanceof Error ? err.message : "", icon: "error" });
    }
  };

  const remove = async (c: Category) => {
    if (c.productCount) {
      Swal.fire({
        title: "Category in use",
        text: `${c.productCount} product${c.productCount === 1 ? " uses" : "s use"} "${c.name}". Move those products to another category first, or switch the category off to hide it.`,
        icon: "info",
      });
      return;
    }
    const { isConfirmed } = await Swal.fire({ title: `Delete "${c.name}"?`, icon: "warning", showCancelButton: true, confirmButtonText: "Delete", confirmButtonColor: "#dc2626" });
    if (!isConfirmed) return;
    try {
      await api.delete(`/categories/${c._id}`);
      reload();
      Swal.fire({ title: "Category deleted", icon: "success", timer: 1100, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: "Could not delete category", text: err instanceof Error ? err.message : "", icon: "error" });
    }
  };

  const exportCsv = () =>
    downloadCsv(
      `ensis-categories-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Name", "Address", "Products", "On Website"],
      rows.map((c) => [c.name, c.slug, c.productCount || 0, c.isActive !== false ? "Visible" : "Hidden"]),
    );

  return (
    <OrganicPage>
      <PageHeader
        title="Product Categories"
        subtitle="Group products for the website's filters and footer. Hidden categories keep their products."
        actions={
          <>
            <HeaderButton icon={Download} onClick={exportCsv}>Export</HeaderButton>
            <HeaderButton icon={Package} href="/products">Products</HeaderButton>
            <HeaderButton icon={Plus} onClick={openNew} primary>Add Category</HeaderButton>
          </>
        }
      />

      <MainWithSidebar
        sidebar={
          <>
            <SideCard title="Products by Category">
              <div className="space-y-[11px]">
                {top.map((c, i) => <SidebarBar key={c._id} label={c.name} value={c.productCount || 0} total={totalProducts} color={BAR_COLORS[i % BAR_COLORS.length]} />)}
                {!top.length && <p className="py-[10px] text-center text-[10px] font-semibold text-[#667085]">No categories yet</p>}
              </div>
            </SideCard>
            <QuickActions
              actions={[
                { label: "Add New Category", icon: Plus, onClick: openNew },
                { label: "Hidden Categories", icon: EyeOff, onClick: () => setVisibility("hidden") },
                { label: "Empty Categories", icon: FolderOpen, onClick: () => setVisibility("empty") },
                { label: "Manage Products", icon: Package, href: "/products" },
              ]}
            />
          </>
        }
      >
        <StatGrid columns={5}>
          <StatCard label="Total Categories" value={categories.length} note="Live current data" icon={FolderTree} tone="violet" active={!visibility} onClick={() => setVisibility("")} />
          <StatCard label="Visible" value={visible} note="Shown on website" icon={Eye} tone="emerald" active={visibility === "visible"} onClick={() => setVisibility("visible")} />
          <StatCard label="Hidden" value={categories.length - visible} note="Not on website" icon={EyeOff} tone="slate" active={visibility === "hidden"} onClick={() => setVisibility("hidden")} />
          <StatCard label="Products" value={totalProducts} note="Across all categories" icon={Package} tone="blue" />
          <StatCard label="Empty" value={empty} note="No products yet" icon={FolderOpen} tone="amber" active={visibility === "empty"} onClick={() => setVisibility("empty")} />
        </StatGrid>

        <FilterBar>
          <SearchBox value={search} onChange={setSearch} placeholder="Search categories by name or address..." />
          <FilterSelect value={visibility} onChange={setVisibility}>
            <option value="">All Categories</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
            <option value="empty">Empty</option>
          </FilterSelect>
          <ResetButton onClick={() => { setSearch(""); setVisibility(""); }} />
        </FilterBar>

        <TableCard
          footer={
            <div className="flex h-[49px] items-center border-t border-[#E6E9ED] px-[16px]">
              <p className="text-[10px] font-semibold text-[#475A83]">Showing {rows.length} of {categories.length} categories</p>
            </div>
          }
        >
          <table className="w-full min-w-[760px] table-fixed border-collapse">
            <colgroup>
              <col style={{ width: "34%" }} />
              <col style={{ width: "28%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "12%" }} />
            </colgroup>
            <thead>
              <tr className={theadRowClass}>
                <th className={thClass}>Category</th>
                <th className={thClass}>Website Address</th>
                <th className={thClass}>Products</th>
                <th className={thClass}>On Website</th>
                <th className={thClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && !categories.length && <LoadingRows colSpan={5} />}
              {!loading && !rows.length && <EmptyRow colSpan={5}>{categories.length ? "No categories match these filters." : "No categories yet. Click “Add Category”."}</EmptyRow>}
              {rows.map((c) => (
                <tr key={c._id} className={rowClass}>
                  <td className="min-w-0 px-[8px]">
                    <div className="flex min-w-0 items-center gap-[8px]">
                      <div className="grid h-[34px] w-[34px] shrink-0 place-items-center overflow-hidden rounded-[6px] border border-[#E9ECF0] bg-[#F8FAFC] text-[#94a3b8]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {c.image ? <img src={c.image} alt="" className="h-full w-full object-cover" /> : <FolderTree size={15} />}
                      </div>
                      <p className={cellPrimary}>{c.name}</p>
                    </div>
                  </td>
                  <td className="min-w-0 px-[8px]">
                    <a href={`${PUBLIC_SITE_URL}/products?category=${c.slug}`} target="_blank" rel="noreferrer" className={`${cellSecondary} hover:text-[#293681] hover:underline`}>/products?category={c.slug}</a>
                  </td>
                  <td className="px-[8px] text-[10px] font-bold tabular-nums text-[#0f172a]">{c.productCount || 0}</td>
                  <td className="px-[8px]">
                    <div className="flex items-center gap-[6px]">
                      <Toggle checked={c.isActive !== false} onChange={() => toggleActive(c)} />
                      <Pill className={c.isActive !== false ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}>{c.isActive !== false ? "Visible" : "Hidden"}</Pill>
                    </div>
                  </td>
                  <td className="px-[8px]">
                    <div className="flex items-center gap-[5px]">
                      <button type="button" title="Edit" onClick={() => openEdit(c)} className="grid h-[28px] w-[28px] place-items-center rounded-[5px] border border-[#E3E7ED] bg-white text-[#293681] hover:bg-[#F4F6FA]"><Pencil size={12} /></button>
                      <button type="button" title={c.productCount ? "In use — cannot delete" : "Delete"} onClick={() => remove(c)} className="grid h-[28px] w-[28px] place-items-center rounded-[5px] border border-rose-200 bg-white text-rose-500 hover:bg-rose-50"><Trash2 size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableCard>
      </MainWithSidebar>

      {draft && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/40 p-[24px]" role="dialog" aria-modal="true">
          <div className="w-full max-w-[640px] overflow-hidden rounded-[8px] bg-white shadow-2xl">
            <div className="flex h-[44px] items-center justify-between border-b border-slate-200/80 bg-[#f0f3f6] px-[14px]">
              <h2 className="text-[12px] font-semibold text-[#0f172a]">{draft._id ? `Edit Category` : "Add New Category"}</h2>
              <button type="button" onClick={() => setDraft(null)} className="grid h-[28px] w-[28px] place-items-center rounded-[5px] border border-[#E3E7ED] bg-white" aria-label="Close"><X size={13} /></button>
            </div>
            <div className="grid gap-[14px] p-[14px] md:grid-cols-[1fr_220px]">
              <div className="space-y-[12px]">
                <div>
                  <label className={labelClass}>Category Name *</label>
                  <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value, slug: slugTouched ? draft.slug : toSlug(e.target.value) })} placeholder="e.g. Panchkarma Equipment" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Website Address (slug)</label>
                  <input value={draft.slug} onChange={(e) => { setSlugTouched(true); setDraft({ ...draft, slug: toSlug(e.target.value) }); }} placeholder="panchkarma-equipment" className={inputClass} />
                  <p className="mt-[4px] text-[9px] font-semibold text-[#64748b]">Filter link: /products?category={draft.slug || "…"}</p>
                </div>
                <label className="flex items-center gap-[8px] text-[10px] font-semibold text-[#334155]">
                  <Toggle checked={draft.isActive} onChange={(value) => setDraft({ ...draft, isActive: value })} />
                  Show on website
                </label>
              </div>
              <div>
                <label className={labelClass}>Category Image</label>
                <ImageUploadField value={draft.image} onChange={(url) => setDraft({ ...draft, image: url })} />
              </div>
            </div>
            <div className="flex justify-end gap-[10px] border-t border-[#EDF0F4] px-[14px] py-[12px]">
              <button type="button" onClick={() => setDraft(null)} className={outlineButtonClass}>Cancel</button>
              <button type="button" disabled={saving} onClick={save} className={primaryButtonClass}><Save size={14} /> {saving ? "Saving…" : "Save Category"}</button>
            </div>
          </div>
        </div>
      )}
    </OrganicPage>
  );
}
