"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  ChevronRight,
  CircleHelp,
  Eye,
  HelpCircle,
  MessageCircleMore,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  SlidersHorizontal,
  Star,
  ThumbsUp,
  Trash2,
} from "lucide-react";
import { api } from "@/lib/api";
import { useApiGet } from "@/lib/useApiGet";

type FaqStatus = "Published" | "Draft";
type FaqVisibility = "Public" | "Members Only" | "Internal";

type FAQ = {
  _id: string;
  question: string;
  answer: string;
  shortAnswer?: string;
  category: string;
  status: FaqStatus;
  visibility: FaqVisibility;
  isFeatured?: boolean;
  orderBy?: number;
  views?: number;
  votes?: number;
  updatedBy?: string;
  updatedAt?: string;
};

const FAQ_CATEGORIES =["General", "Request Process", "Services", "Support"];

const categoryTone: Record<string, string> = {
  General: "bg-emerald-50 text-emerald-700",
  "Request Process": "bg-blue-50 text-blue-700",
  Services: "bg-violet-50 text-violet-700",
  Support: "bg-amber-50 text-amber-700",
};

const categoryColors: Record<string, string> = {
  General: "#0f766e",
  "Request Process": "#2563eb",
  Services: "#7c3aed",
  Support: "#f59e0b",
};
const OTHER_COLOR = "#9ca3af";

const formatDate = (value?: string) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "—";

function MetricCard({
  icon,
  iconClass,
  label,
  value,
  note,
  noteTone = "text-[#64748b]",
}: {
  icon: React.ReactNode;
  iconClass: string;
  label: string;
  value: string;
  note: string;
  noteTone?: string;
}) {
  return (
    <div className="relative flex h-[56px] min-w-0 items-center gap-[10px] overflow-hidden rounded-[7px] border border-[#e7e9ec] bg-white px-[12px] py-[7px] shadow-[0_1px_2px_rgba(15,23,42,0.02)]">
      <div className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full ${iconClass}`}>
        {icon}
      </div>

      <div className="min-w-0 flex-1 overflow-hidden">
        <p className="break-words text-[9px] font-semibold leading-[11px] text-[#34435e]">{label}</p>
        <div className="mt-[2px] flex items-baseline gap-[6px]">
          <span className="text-[17px] font-semibold leading-none tracking-[-0.03em] text-[#10204a]">
            {value}
          </span>
          <span className={`truncate text-[8.5px] font-semibold ${noteTone}`}>
            {note}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function FAQsManagementPage() {
  const router = useRouter();
  const { data, loading, error, reload: load } = useApiGet<FAQ[]>("/faqs/admin/all");
  const faqs = useMemo(() => (Array.isArray(data) ? data : []), [data]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [status, setStatus] = useState("All Status");
  const [visibility, setVisibility] = useState("All Visibility");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (error) Swal.fire({ title: "Could not load FAQs", text: error instanceof Error ? error.message : "", icon: "error" });
  }, [error]);

  const categories = useMemo(
    () => Array.from(new Set([...FAQ_CATEGORIES, ...faqs.map((f) => f.category).filter(Boolean)])),
    [faqs],
  );

  const rows = useMemo(() => {
    return faqs.filter((item) => {
      const searchMatch =
        !query ||
        `${item.question} ${item.shortAnswer || ""} ${item.answer}`
          .toLowerCase()
          .includes(query.toLowerCase());

      const categoryMatch =
        category === "All Categories" || item.category === category;

      const statusMatch = status === "All Status" || item.status === status;

      const visibilityMatch =
        visibility === "All Visibility" || item.visibility === visibility;

      return searchMatch && categoryMatch && statusMatch && visibilityMatch;
    });
  }, [faqs, query, category, status, visibility]);

  const stats = useMemo(() => {
    const published = faqs.filter((f) => f.status === "Published").length;
    const onWebsite = faqs.filter((f) => f.status === "Published" && f.visibility === "Public").length;
    const featured = faqs.filter((f) => f.isFeatured).length;
    const usedCategories = new Set(faqs.map((f) => f.category)).size;
    return { published, onWebsite, featured, usedCategories, drafts: faqs.length - published };
  }, [faqs]);

  const categoryData = useMemo(() => {
    const counts = new Map<string, number>();
    faqs.forEach((f) => counts.set(f.category || "Others", (counts.get(f.category || "Others") || 0) + 1));
    return Array.from(counts, ([label, value]) => ({ label, value, color: categoryColors[label] || OTHER_COLOR }));
  }, [faqs]);

  const donut = useMemo(() => {
    const total = categoryData.reduce((sum, c) => sum + c.value, 0);
    if (!total) return "#e5e7eb";
    let start = 0;
    const stops = categoryData.map((c) => {
      const end = start + (c.value / total) * 100;
      const stop = `${c.color} ${start}% ${end}%`;
      start = end;
      return stop;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }, [categoryData]);

  const topViewedFaqs = useMemo(
    () => [...faqs].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 5),
    [faqs],
  );

  const clearFilters = () => {
    setQuery("");
    setCategory("All Categories");
    setStatus("All Status");
    setVisibility("All Visibility");
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const editFaq = (id: string) => router.push(`/faqs/new?id=${id}`);

  const deleteFaq = async (item: FAQ) => {
    const { isConfirmed } = await Swal.fire({
      title: "Delete this FAQ?",
      text: item.question,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/faqs/${item._id}`);
      load();
      Swal.fire({ title: "FAQ deleted", icon: "success", timer: 1200, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: "Could not delete FAQ", text: err instanceof Error ? err.message : "", icon: "error" });
    }
  };

  return (
    <main
      style={{
        fontFamily:
          'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
      className="h-full min-h-0 w-full overflow-y-auto overflow-x-hidden bg-[#fffefb] px-[18px] py-[14px] text-[#142347] [&::-webkit-scrollbar]:w-[6px] [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300"
    >
      <div className="min-h-full w-full">
        {/* HEADER */}
        <header className="flex items-start justify-between gap-[16px]">
          <div>
            <h1 className="text-[24px] font-semibold leading-none tracking-[-0.02em] text-[#075b33]">
              FAQs Management
            </h1>

            <nav className="mt-[9px] flex items-center gap-[8px] text-[10.5px] font-semibold text-[#1d2b58]">
              <span>Dashboard</span>
              <span className="text-[#7b8597]">›</span>
              <span>FAQs Management</span>
            </nav>
          </div>

          <div className="flex items-center gap-[12px]">
            <button
              type="button"
              onClick={() => router.push("/faqs/new")}
              className="inline-flex h-[40px] items-center gap-[8px] rounded-[6px] bg-[linear-gradient(180deg,#076636_0%,#03542c_100%)] px-[20px] text-[10.5px] font-semibold text-white shadow-[0_7px_16px_rgba(5,94,49,.12)] transition hover:opacity-95"
            >
              <Plus className="h-[15px] w-[15px]" />
              Add New FAQ
            </button>

            <button
              type="button"
              onClick={() => router.push("/faqs/settings")}
              className="inline-flex h-[40px] items-center gap-[8px] rounded-[6px] border border-[#dfe3e7] bg-white px-[18px] text-[10.5px] font-semibold text-[#273655] transition hover:bg-slate-50"
            >
              <Settings className="h-[15px] w-[15px]" />
              FAQ Settings
            </button>
          </div>
        </header>

        {/* STATS */}
        <section className="mt-[18px] grid grid-cols-5 gap-[14px]">
          <MetricCard
            icon={<MessageCircleMore className="h-[16px] w-[16px]" strokeWidth={1.8} />}
            iconClass="bg-emerald-50 text-emerald-700"
            label="Total FAQs"
            value={String(faqs.length)}
            note={`Published: ${stats.published}`}
          />

          <MetricCard
            icon={<SlidersHorizontal className="h-[16px] w-[16px]" strokeWidth={1.8} />}
            iconClass="bg-violet-50 text-violet-600"
            label="Categories"
            value={String(stats.usedCategories)}
            note="In use"
          />

          <MetricCard
            icon={<Eye className="h-[16px] w-[16px]" strokeWidth={1.8} />}
            iconClass="bg-orange-50 text-orange-500"
            label="On Website"
            value={String(stats.onWebsite)}
            note="Published & public"
            noteTone="text-emerald-700"
          />

          <MetricCard
            icon={<Star className="h-[16px] w-[16px]" strokeWidth={1.8} />}
            iconClass="bg-blue-50 text-blue-600"
            label="Featured"
            value={String(stats.featured)}
            note="Shown first"
          />

          <MetricCard
            icon={<CircleHelp className="h-[16px] w-[16px]" strokeWidth={1.8} />}
            iconClass="bg-rose-50 text-rose-500"
            label="Drafts"
            value={String(stats.drafts)}
            note={stats.drafts ? "Not on website" : "All published"}
            noteTone={stats.drafts ? "text-rose-500" : "text-emerald-700"}
          />
        </section>

        {/* MAIN CONTENT */}
        <section className="mt-[16px] grid items-start gap-[14px] xl:grid-cols-[minmax(0,1fr)_320px]">
          {/* LEFT */}
          <div className="min-w-0 overflow-hidden">
            {/* FILTERS */}
            <div className="flex flex-wrap items-center gap-[10px]">
              <label className="relative min-w-[180px] flex-1">
                <Search className="absolute right-[13px] top-1/2 h-[15px] w-[15px] -translate-y-1/2 text-[#5d6b84]" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search FAQs by question or keyword..."
                  className="h-[40px] w-full rounded-[6px] border border-[#dfe4e8] bg-white px-[14px] pr-[40px] text-[10.5px] font-semibold text-[#273655] outline-none placeholder:text-[#8b95a7]"
                />
              </label>

              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                className="h-[40px] min-w-[125px] rounded-[6px] border border-[#dfe4e8] bg-white px-[10px] text-[10px] font-semibold text-[#2a3855] outline-none"
              >
                <option>All Categories</option>
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>

              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                className="h-[40px] min-w-[110px] rounded-[6px] border border-[#dfe4e8] bg-white px-[10px] text-[10px] font-semibold text-[#2a3855] outline-none"
              >
                <option>All Status</option>
                <option>Published</option>
                <option>Draft</option>
              </select>

              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value)}
                className="h-[40px] min-w-[115px] rounded-[6px] border border-[#dfe4e8] bg-white px-[10px] text-[10px] font-semibold text-[#2a3855] outline-none"
              >
                <option>All Visibility</option>
                <option>Public</option>
                <option>Members Only</option>
                <option>Internal</option>
              </select>

              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-[40px] items-center justify-center gap-[6px] rounded-[6px] border border-[#dfe4e8] bg-white px-[12px] text-[10px] font-semibold text-[#35445f] shrink-0"
              >
                <RefreshCw className="h-[14px] w-[14px]" />
                Clear
              </button>
            </div>

            {/* TABLE */}
            <div className="mt-[12px] overflow-hidden rounded-[8px] border border-[#e7e9ec] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.025)]">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[930px] border-collapse text-left">
                  <thead>
                    <tr className="h-[42px] border-b border-[#e7e9ec] bg-[#fafbfc] text-[8.5px] font-semibold uppercase tracking-[0.04em] text-[#44516a]">
                      <th className="w-[42px] px-[12px] text-center">#</th>
                      <th className="px-[8px]">Question</th>
                      <th className="px-[8px]">Category</th>
                      <th className="px-[8px]">Status</th>
                      <th className="px-[8px]">Visibility</th>
                      <th className="px-[8px] whitespace-nowrap">Updated On</th>
                      <th className="px-[8px] text-center">Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading && !faqs.length && (
                      <tr>
                        <td colSpan={7} className="px-[12px] py-[28px] text-center text-[10px] font-semibold text-[#68758d]">
                          Loading FAQs…
                        </td>
                      </tr>
                    )}

                    {!loading && rows.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-[12px] py-[28px] text-center text-[10px] font-semibold text-[#68758d]">
                          {faqs.length ? "No FAQs match these filters." : "No FAQs yet. Click “Add New FAQ” to create one."}
                        </td>
                      </tr>
                    )}

                    {rows.map((item) => {
                      const isExpanded = expandedId === item._id;
                      const isPublished = item.status === "Published";

                      return (
                        <React.Fragment key={item._id}>
                          <tr
                            onClick={() => toggleExpand(item._id)}
                            className={`h-[62px] cursor-pointer border-b border-[#eef0f2] align-middle transition ${isExpanded ? "bg-[#f5fbf7]" : "hover:bg-slate-50/60"
                              }`}
                          >
                            <td className="px-[12px] text-center text-[9.5px] font-semibold tabular-nums text-[#2f3d58]">
                              {item.orderBy || "—"}
                            </td>

                            <td className="px-[8px]">
                              <div className="min-w-[300px]">
                                <p className="flex items-center gap-[6px] text-[10.5px] font-semibold leading-tight text-[#19274a]">
                                  {item.question}
                                  {item.isFeatured && <Star className="h-[11px] w-[11px] shrink-0 fill-amber-400 text-amber-400" />}
                                </p>
                                <p className="mt-[4px] max-w-[330px] truncate text-[8.8px] font-semibold leading-[1.35] text-[#53627c]">
                                  {item.shortAnswer || item.answer}
                                </p>
                              </div>
                            </td>

                            <td className="px-[8px]">
                              <span
                                className={`inline-flex whitespace-nowrap rounded-[5px] px-[8px] py-[4px] text-[8px] font-semibold ${categoryTone[item.category] || "bg-slate-100 text-slate-600"}`}
                              >
                                {item.category}
                              </span>
                            </td>

                            <td className="px-[8px]">
                              <span className={`inline-flex items-center gap-[5px] rounded-[5px] px-[8px] py-[4px] text-[8px] font-semibold ${isPublished ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                                <span className={`h-[5px] w-[5px] rounded-full ${isPublished ? "bg-emerald-500" : "bg-slate-400"}`} />
                                {item.status}
                              </span>
                            </td>

                            <td className="px-[8px] text-[9px] font-semibold text-[#2c3a58]">
                              {item.visibility}
                            </td>

                            <td className="px-[8px] whitespace-nowrap">
                              <span className="text-[9px] font-semibold text-[#2c3a58]">
                                {formatDate(item.updatedAt)}
                              </span>
                              {item.updatedBy && (
                                <span className="ml-[4px] text-[8px] font-semibold text-[#68758d]">
                                  By {item.updatedBy}
                                </span>
                              )}
                            </td>

                            <td
                              className="px-[8px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="flex items-center justify-center gap-[8px]">
                                <button
                                  type="button"
                                  title="View"
                                  onClick={() => toggleExpand(item._id)}
                                  className="grid h-[30px] w-[30px] place-items-center rounded-[5px] border border-[#e1e5e9] bg-white text-[#4b5871] hover:bg-slate-50"
                                >
                                  <Eye className="h-[12px] w-[12px]" />
                                </button>
                                <button
                                  type="button"
                                  title="Edit"
                                  onClick={() => editFaq(item._id)}
                                  className="grid h-[30px] w-[30px] place-items-center rounded-[5px] border border-[#e1e5e9] bg-white text-[#4b5871] hover:bg-slate-50"
                                >
                                  <Pencil className="h-[12px] w-[12px]" />
                                </button>
                                <button
                                  type="button"
                                  title="Delete"
                                  onClick={() => deleteFaq(item)}
                                  className="grid h-[30px] w-[30px] place-items-center rounded-[5px] border border-[#e1e5e9] bg-white text-rose-500 hover:bg-rose-50"
                                >
                                  <Trash2 className="h-[12px] w-[12px]" />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* EXPANDED ACCORDION PANEL */}
                          {isExpanded && (
                            <tr className="bg-[#f7fbf8] border-b border-[#e5ece7]">
                              <td colSpan={7} className="px-[24px] py-[14px]">
                                <div className="rounded-[7px] border border-[#d6e6dc] bg-white p-[14px] shadow-[0_2px_6px_rgba(7,91,51,0.04)]">
                                  <div className="flex items-center justify-between gap-[12px]">
                                    <div className="flex items-center gap-[8px]">
                                      <span className="grid h-[22px] w-[22px] place-items-center rounded-full bg-[#eaf4ee] text-[10px] font-semibold text-[#075b33]">
                                        Q
                                      </span>
                                      <h4 className="text-[12px] font-semibold text-[#172648]">
                                        {item.question}
                                      </h4>
                                    </div>
                                    <span className="rounded-[4px] border border-[#d0e4d7] bg-[#f2f8f4] px-[8px] py-[2px] text-[8.5px] font-semibold text-[#075b33]">
                                      Visibility: {item.visibility}
                                    </span>
                                  </div>

                                  <div className="mt-[10px] pl-[30px]">
                                    <p className="whitespace-pre-line text-[10px] font-semibold leading-[1.6] text-[#34435e]">
                                      {item.answer}
                                    </p>

                                    <div className="mt-[12px] flex items-center justify-between border-t border-[#f0f4f2] pt-[10px]">
                                      <div className="flex items-center gap-[14px] text-[9px] font-semibold text-[#5c6a83]">
                                        <span>Category: <span className="text-[#075b33]">{item.category}</span></span>
                                        <span>Display Order: <span className="text-[#19274a]">{item.orderBy || "Last"}</span></span>
                                        {isPublished && item.visibility === "Public" ? (
                                          <span className="text-emerald-700">Shown on website home page</span>
                                        ) : (
                                          <span className="text-rose-500">Not shown on website</span>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-[8px]">
                                        <button
                                          type="button"
                                          onClick={() => editFaq(item._id)}
                                          className="inline-flex h-[28px] items-center gap-[6px] rounded-[5px] border border-[#d6ded9] bg-white px-[10px] text-[8.5px] font-semibold text-[#075b33] hover:bg-emerald-50"
                                        >
                                          <Pencil className="h-[10px] w-[10px]" />
                                          Edit FAQ
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex min-h-[48px] items-center justify-between gap-[12px] border-t border-[#e7e9ec] px-[12px]">
                <p className="text-[9px] font-semibold text-[#47546c]">
                  Showing {rows.length} of {faqs.length} FAQs
                </p>
                <button
                  type="button"
                  onClick={load}
                  className="inline-flex h-[30px] items-center gap-[6px] rounded-[5px] border border-[#dfe3e7] bg-white px-[10px] text-[9px] font-semibold text-[#35445f]"
                >
                  <RefreshCw className="h-[12px] w-[12px]" />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside className="space-y-[12px]">
            {/* CATEGORY DONUT */}
            <section className="rounded-[8px] border border-[#e7e9ec] bg-white px-[14px] py-[13px] shadow-[0_1px_3px_rgba(15,23,42,0.025)]">
              <h2 className="text-[12px] font-semibold text-[#19274a]">
                FAQ Categories
              </h2>

              <div className="mt-[12px] flex items-center gap-[14px]">
                <div
                  className="grid h-[120px] w-[120px] shrink-0 place-items-center rounded-full"
                  style={{ background: donut }}
                >
                  <div className="grid h-[76px] w-[76px] place-items-center rounded-full bg-white text-center">
                    <div>
                      <p className="text-[18px] font-semibold leading-none text-[#10204a]">{categoryData.length}</p>
                      <p className="mt-[4px] text-[8px] font-semibold text-[#61708c]">
                        Categories
                      </p>
                    </div>
                  </div>
                </div>

                <div className="min-w-0 flex-1 space-y-[8px]">
                  {categoryData.map((item) => (
                    <div
                      key={item.label}
                      className="grid grid-cols-[8px_1fr_auto] items-center gap-[7px]"
                    >
                      <span
                        className="h-[8px] w-[8px] rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="truncate text-[8.5px] font-semibold text-[#34425e]">
                        {item.label}
                      </span>
                      <span className="whitespace-nowrap text-[8.3px] font-semibold text-[#34425e]">
                        ({item.value})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* QUICK ACTIONS */}
            <section className="rounded-[8px] border border-[#e7e9ec] bg-white px-[14px] py-[13px] shadow-[0_1px_3px_rgba(15,23,42,0.025)]">
              <h2 className="text-[12px] font-semibold text-[#19274a]">
                Quick Actions
              </h2>

              <div className="mt-[10px] space-y-[7px]">
                <button
                  type="button"
                  onClick={() => router.push("/faqs/new")}
                  className="flex h-[36px] w-full items-center gap-[9px] rounded-[5px] border border-[#e2e6ea] bg-white px-[10px] text-[9px] font-semibold text-[#293854] transition hover:bg-slate-50"
                >
                  <Plus className="h-[13px] w-[13px]" />
                  Add New FAQ
                </button>

                <button
                  type="button"
                  onClick={() => router.push("/faqs/settings")}
                  className="flex h-[36px] w-full items-center gap-[9px] rounded-[5px] border border-[#e2e6ea] bg-white px-[10px] text-[9px] font-semibold text-[#293854] transition hover:bg-slate-50"
                >
                  <Settings className="h-[13px] w-[13px]" />
                  FAQ Settings
                </button>
              </div>
            </section>

            {/* TOP VIEWED */}
            {topViewedFaqs.some((f) => f.views) && (
              <section className="rounded-[8px] border border-[#e7e9ec] bg-white px-[14px] py-[13px] shadow-[0_1px_3px_rgba(15,23,42,0.025)]">
                <h2 className="text-[12px] font-semibold text-[#19274a]">
                  Top Viewed FAQs
                </h2>

                <div className="mt-[10px] space-y-[8px]">
                  {topViewedFaqs.map((faq, index) => (
                    <div
                      key={faq._id}
                      className="grid grid-cols-[20px_1fr_auto] items-center gap-[8px]"
                    >
                      <span className="text-[13px] font-semibold text-[#17234a]">
                        {index + 1}
                      </span>

                      <span className="truncate text-[8.5px] font-semibold text-[#34425e]">
                        {faq.question}
                      </span>

                      <span className="flex items-center gap-[5px] whitespace-nowrap text-[8.5px] font-semibold text-[#4b5870]">
                        <ThumbsUp className="h-[10px] w-[10px] text-[#7c8799]" />
                        {(faq.views || 0).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* GREEN CTA */}
            <section className="relative overflow-hidden rounded-[8px] bg-[linear-gradient(135deg,#08643a_0%,#07542f_100%)] px-[18px] py-[18px] text-white shadow-[0_7px_18px_rgba(5,94,49,.12)]">
              <div className="relative z-10 max-w-[210px]">
                <p className="text-[12px] font-semibold leading-[1.5]">
                  Published, public FAQs appear
                  <br />
                  on the website home page.
                </p>

                <button
                  type="button"
                  onClick={() => router.push("/faqs/new")}
                  className="mt-[16px] inline-flex h-[36px] items-center gap-[8px] rounded-[5px] bg-white px-[14px] text-[9px] font-semibold text-[#075b33] transition hover:bg-slate-100"
                >
                  Add New FAQ
                  <ChevronRight className="h-[12px] w-[12px]" />
                </button>
              </div>

              <HelpCircle className="absolute -bottom-[20px] right-[10px] h-[96px] w-[96px] text-emerald-200/20" strokeWidth={1.2} />
            </section>
          </aside>
        </section>
      </div>
    </main>
  );
}
