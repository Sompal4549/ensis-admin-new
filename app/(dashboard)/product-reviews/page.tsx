"use client";

import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { BadgeCheck, Download, Eye, EyeOff, MessageSquareText, Package, RefreshCcw, Star, Trash2 } from "lucide-react";
import { api } from "@/lib/api";
import { useApiGet } from "@/lib/useApiGet";
import { downloadCsv } from "@/lib/csv";
import { PUBLIC_SITE_URL } from "@/lib/cmsPages";
import { formatDate, plainText } from "@/lib/sales";
import {
  EmptyRow,
  FilterBar,
  FilterSelect,
  HeaderButton,
  LoadingRows,
  MainWithSidebar,
  OrganicPage,
  PageHeader,
  Pagination,
  Pill,
  QuickActions,
  ResetButton,
  SearchBox,
  SideCard,
  StatCard,
  StatGrid,
  SummaryDonut,
  TableCard,
  cellPrimary,
  cellSecondary,
  outlineButtonClass,
  rowClass,
  thClass,
  theadRowClass,
} from "@/components/organic/OrganicUI";

type Review = {
  _id: string;
  rating: number;
  title?: string;
  comment: string;
  status: "pending" | "approved" | "rejected";
  verifiedBuyer?: boolean;
  authorName?: string;
  user?: { name?: string; email?: string } | null;
  product?: { _id: string; title?: string; slug?: string; images?: Array<string | { imageUrl?: string; url?: string }> } | null;
  createdAt?: string;
};

type ReviewsResponse = {
  reviews: Review[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  summary: { total: number; byStatus: Record<string, number>; averageApprovedRating: number };
};

const STATUS_LABEL: Record<Review["status"], string> = { approved: "Published", rejected: "Hidden", pending: "Pending" };
const statusTone: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-slate-100 text-slate-600 border-slate-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
};

const imageOf = (review: Review) => {
  const first = review.product?.images?.[0];
  return typeof first === "string" ? first : first?.imageUrl || first?.url || "";
};

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-[1px]" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} size={11} className={n <= value ? "fill-amber-400 text-amber-400" : "text-slate-300"} />)}
    </span>
  );
}

export default function ProductReviewsPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [rating, setRating] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const params = new URLSearchParams({ page: String(page), limit: String(perPage) });
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (rating) params.set("rating", rating);
  const { data, loading, error, reload } = useApiGet<ReviewsResponse>(`/reviews?${params}`);

  useEffect(() => {
    if (error) Swal.fire({ title: "Could not load reviews", text: error instanceof Error ? error.message : "", icon: "error" });
  }, [error]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const reviews = data?.reviews || [];
  const summary = data?.summary;
  const total = summary?.total || 0;
  const published = summary?.byStatus?.approved || 0;
  const hidden = (summary?.byStatus?.rejected || 0) + (summary?.byStatus?.pending || 0);
  const pct = (n: number) => `${total ? ((n / total) * 100).toFixed(1) : "0.0"}%`;
  const allOnPageSelected = reviews.length > 0 && reviews.every((r) => selected.has(r._id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allOnPageSelected ? new Set() : new Set(reviews.map((r) => r._id)));
  const showStatus = (s: string) => { setPage(1); setStatus(s); };
  const reset = () => { setSearchInput(""); setSearch(""); setStatus(""); setRating(""); setPage(1); };

  const act = async (ids: string[], action: "approve" | "reject" | "delete") => {
    if (!ids.length) return;
    if (action === "delete") {
      const { isConfirmed } = await Swal.fire({
        title: `Delete ${ids.length} review${ids.length === 1 ? "" : "s"}?`,
        text: "Deleted reviews cannot be recovered. Hide them instead if you may need them later.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Delete",
        confirmButtonColor: "#dc2626",
      });
      if (!isConfirmed) return;
    }
    setBusy(true);
    try {
      if (ids.length === 1 && action !== "delete") {
        await api.patch(`/reviews/${ids[0]}/status`, { status: action === "approve" ? "approved" : "rejected" });
      } else if (ids.length === 1) {
        await api.delete(`/reviews/${ids[0]}`);
      } else {
        await api.post("/reviews/bulk", { ids, action });
      }
      setSelected(new Set());
      reload();
      Swal.fire({ title: action === "approve" ? "Published on website" : action === "reject" ? "Hidden from website" : "Deleted", icon: "success", timer: 1100, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: "Action failed", text: err instanceof Error ? err.message : "", icon: "error" });
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    if (!reviews.length) {
      Swal.fire({ title: "Nothing to export", icon: "info" });
      return;
    }
    downloadCsv(
      `ensis-product-reviews-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Date", "Product", "Customer", "Verified Buyer", "Rating", "Review", "Status"],
      reviews.map((r) => [formatDate(r.createdAt), plainText(r.product?.title), r.authorName || r.user?.name, r.verifiedBuyer ? "Yes" : "No", r.rating, r.comment, STATUS_LABEL[r.status]]),
    );
  };

  return (
    <OrganicPage>
      <PageHeader
        title="Product Reviews"
        subtitle="Reviews customers write on product pages go live immediately — hide any review to take it off the website."
        actions={
          <>
            <HeaderButton icon={Download} onClick={exportCsv}>Export</HeaderButton>
            <HeaderButton icon={RefreshCcw} onClick={reload}>{loading ? "Refreshing…" : "Refresh"}</HeaderButton>
            <HeaderButton icon={Package} href="/products" primary>Products</HeaderButton>
          </>
        }
      />

      <MainWithSidebar
        sidebar={
          <>
            <SideCard title="Review Summary">
              <SummaryDonut
                slices={[
                  { label: "Published", value: published, color: "#2CA25F" },
                  { label: "Hidden", value: summary?.byStatus?.rejected || 0, color: "#94A3B8" },
                  { label: "Pending", value: summary?.byStatus?.pending || 0, color: "#F49B16" },
                ]}
              />
            </SideCard>
            <SideCard title="Average Rating">
              <div className="flex items-center gap-[10px]">
                <span className="text-[23px] font-bold leading-none text-[#0f172a]">{summary?.averageApprovedRating || "—"}</span>
                <div>
                  <Stars value={Math.round(summary?.averageApprovedRating || 0)} />
                  <p className="mt-[3px] text-[9px] font-semibold text-[#475A83]">from {published} published review{published === 1 ? "" : "s"}</p>
                </div>
              </div>
            </SideCard>
            <QuickActions
              actions={[
                { label: "Low Ratings (1–2★)", icon: Star, onClick: () => { setPage(1); setRating("1"); } },
                { label: "Hidden Reviews", icon: EyeOff, onClick: () => showStatus("rejected") },
                { label: "Published Reviews", icon: Eye, onClick: () => showStatus("approved") },
                { label: "Download Report", icon: Download, onClick: exportCsv },
              ]}
            />
          </>
        }
      >
        <StatGrid columns={4}>
          <StatCard label="All Reviews" value={total} note="Live current data" icon={MessageSquareText} tone="violet" active={!status} onClick={() => showStatus("")} />
          <StatCard label="Published" value={published} note={`${pct(published)} current data`} icon={Eye} tone="emerald" active={status === "approved"} onClick={() => showStatus("approved")} />
          <StatCard label="Hidden" value={hidden} note={`${pct(hidden)} current data`} icon={EyeOff} tone="slate" active={status === "rejected"} onClick={() => showStatus("rejected")} />
          <StatCard label="Average Rating" value={summary?.averageApprovedRating ? `${summary.averageApprovedRating} / 5` : "—"} note="Published reviews" icon={Star} tone="amber" />
        </StatGrid>

        <FilterBar>
          <SearchBox value={searchInput} onChange={setSearchInput} placeholder="Search by product, customer name or review text..." />
          <FilterSelect value={status} onChange={(v) => showStatus(v)}>
            <option value="">All Status</option>
            <option value="approved">Published</option>
            <option value="rejected">Hidden</option>
            <option value="pending">Pending</option>
          </FilterSelect>
          <FilterSelect value={rating} onChange={(v) => { setPage(1); setRating(v); }}>
            <option value="">All Ratings</option>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n === 1 ? "" : "s"}</option>)}
          </FilterSelect>
          <ResetButton onClick={reset} />
        </FilterBar>

        {selected.size > 0 && (
          <div className="mt-[10px] flex flex-wrap items-center gap-[8px] rounded-[6px] border border-[#E2E6EB] bg-[#F4F6FA] px-[12px] py-[7px]">
            <span className="text-[10px] font-semibold text-[#293681]">{selected.size} selected</span>
            <button type="button" disabled={busy} onClick={() => act([...selected], "approve")} className={`${outlineButtonClass} h-[28px] text-[#047857]`}><Eye size={13} /> Publish</button>
            <button type="button" disabled={busy} onClick={() => act([...selected], "reject")} className={`${outlineButtonClass} h-[28px]`}><EyeOff size={13} /> Hide</button>
            <button type="button" disabled={busy} onClick={() => act([...selected], "delete")} className={`${outlineButtonClass} h-[28px] text-rose-600`}><Trash2 size={13} /> Delete</button>
            <button type="button" onClick={() => setSelected(new Set())} className="ml-auto text-[10px] font-semibold text-[#475A83] hover:underline">Clear selection</button>
          </div>
        )}

        <TableCard
          footer={
            data && (
              <Pagination
                page={data.currentPage}
                pages={Math.max(data.totalPages, 1)}
                total={data.totalCount}
                from={data.totalCount ? (data.currentPage - 1) * perPage + 1 : 0}
                to={Math.min(data.currentPage * perPage, data.totalCount)}
                noun="reviews"
                onPage={setPage}
                perPage={perPage}
                onPerPage={(n) => { setPerPage(n); setPage(1); }}
              />
            )
          }
        >
          <table className="w-full min-w-[900px] table-fixed border-collapse">
            <colgroup>
              <col style={{ width: "4%" }} />
              <col style={{ width: "22%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "35%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "14%" }} />
            </colgroup>
            <thead>
              <tr className={theadRowClass}>
                <th className="px-[8px]"><input type="checkbox" checked={allOnPageSelected} onChange={toggleAll} aria-label="Select all on this page" /></th>
                <th className={thClass}>Product</th>
                <th className={thClass}>Customer</th>
                <th className={thClass}>Review</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && !reviews.length && <LoadingRows colSpan={6} />}
              {!loading && !reviews.length && <EmptyRow colSpan={6}>{search || status || rating ? "No reviews match these filters." : "No product reviews yet."}</EmptyRow>}
              {reviews.map((review) => {
                const image = imageOf(review);
                return (
                  <tr key={review._id} className={`${rowClass} align-top`}>
                    <td className="px-[8px] py-[12px]"><input type="checkbox" checked={selected.has(review._id)} onChange={() => toggle(review._id)} aria-label="Select review" /></td>
                    <td className="min-w-0 px-[8px] py-[10px]">
                      <div className="flex min-w-0 items-center gap-[8px]">
                        <div className="h-[34px] w-[34px] shrink-0 overflow-hidden rounded-[6px] border border-[#E9ECF0] bg-[#F8FAFC]">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          {image && <img src={image} alt="" className="h-full w-full object-cover" />}
                        </div>
                        {review.product?.slug ? (
                          <a href={`${PUBLIC_SITE_URL}/products/${review.product.slug}`} target="_blank" rel="noreferrer" className={`${cellPrimary} hover:underline`}>{plainText(review.product.title)}</a>
                        ) : (
                          <span className={cellSecondary}>Deleted product</span>
                        )}
                      </div>
                    </td>
                    <td className="min-w-0 px-[8px] py-[10px]">
                      <p className={cellPrimary}>{review.authorName || review.user?.name || "Customer"}</p>
                      {review.verifiedBuyer && <p className="mt-[3px] flex items-center gap-[3px] text-[7.5px] font-semibold text-emerald-700"><BadgeCheck size={11} /> Verified buyer</p>}
                      <p className={cellSecondary}>{formatDate(review.createdAt)}</p>
                    </td>
                    <td className="min-w-0 px-[8px] py-[10px]">
                      <Stars value={review.rating} />
                      {review.title && <p className="mt-[3px] text-[8px] font-semibold text-[#0f172a]">{review.title}</p>}
                      <p className="mt-[3px] line-clamp-3 whitespace-pre-line text-[8px] font-medium text-slate-700">{review.comment}</p>
                    </td>
                    <td className="px-[8px] py-[12px]"><Pill className={statusTone[review.status] || ""}>{STATUS_LABEL[review.status]}</Pill></td>
                    <td className="px-[8px] py-[10px]">
                      <div className="flex items-center gap-[5px]">
                        {review.status === "approved" ? (
                          <button type="button" disabled={busy} title="Hide from website" onClick={() => act([review._id], "reject")} className="grid h-[28px] w-[28px] place-items-center rounded-[5px] border border-[#E3E7ED] bg-white text-[#475A83] hover:bg-[#F4F6FA] disabled:opacity-40"><EyeOff size={13} /></button>
                        ) : (
                          <button type="button" disabled={busy} title="Publish on website" onClick={() => act([review._id], "approve")} className="grid h-[28px] w-[28px] place-items-center rounded-[5px] border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"><Eye size={13} /></button>
                        )}
                        <button type="button" disabled={busy} title="Delete" onClick={() => act([review._id], "delete")} className="grid h-[28px] w-[28px] place-items-center rounded-[5px] border border-rose-200 bg-white text-rose-500 hover:bg-rose-50 disabled:opacity-40"><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableCard>
      </MainWithSidebar>
    </OrganicPage>
  );
}
