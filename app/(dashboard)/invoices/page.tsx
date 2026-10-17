"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { Ban, Download, Eye, FileText, Mail, MessageCircle, RefreshCcw, ShoppingBag, Trash2, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { useApiGet } from "@/lib/useApiGet";
import { downloadCsv } from "@/lib/csv";
import { capitalize, formatDate, formatINR, type Customer } from "@/lib/sales";
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
  SidebarBar,
  StatCard,
  StatGrid,
  SummaryDonut,
  TableCard,
  cellPrimary,
  cellSecondary,
  rowClass,
  thClass,
  theadRowClass,
} from "@/components/organic/OrganicUI";

type Invoice = {
  _id: string;
  invoiceNumber: string;
  type: "proforma" | "tax" | "credit_note" | "debit_note" | "delivery_challan";
  lead?: Customer | null;
  order?: { _id: string } | string | null;
  billingAddress?: { name?: string; phone?: string; city?: string };
  totalAmount: number;
  paymentReceived: number;
  paymentDate?: string;
  dueDate?: string;
  status: "draft" | "sent" | "paid" | "partial" | "overdue" | "cancelled";
  createdAt?: string;
};

type InvoicesResponse = {
  invoices: Invoice[];
  total: number;
  page: number;
  limit: number;
  summary: { count: number; byStatus: Record<string, number>; billed: number; received: number; outstanding: number };
};

const TYPES: Record<Invoice["type"], string> = {
  tax: "Tax Invoice",
  proforma: "Estimate / Proforma",
  credit_note: "Credit Note",
  debit_note: "Debit Note",
  delivery_challan: "Delivery Challan",
};
const STATUSES: Invoice["status"][] = ["draft", "sent", "partial", "paid", "overdue", "cancelled"];
const statusTone: Record<string, string> = {
  draft: "bg-slate-100 text-slate-600 border-slate-200",
  sent: "bg-blue-50 text-blue-700 border-blue-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  overdue: "bg-rose-50 text-rose-600 border-rose-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200 line-through",
};
const STATUS_COLORS: Record<string, string> = { draft: "#94A3B8", sent: "#3379DE", partial: "#F49B16", paid: "#2CA25F", overdue: "#E4463E", cancelled: "#CBD5E1" };

const customerLabel = (inv: Invoice) => {
  const c = inv.lead || {};
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || c.companyName || inv.billingAddress?.name || "Customer";
};
const orderIdOf = (inv: Invoice) => (inv.order && typeof inv.order === "object" ? inv.order._id : inv.order || "");
const iconButton = "grid h-[28px] w-[28px] place-items-center rounded-[5px] border bg-white disabled:opacity-40";

export default function InvoicesPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const params = new URLSearchParams({ page: String(page), limit: String(perPage) });
  if (search) params.set("search", search);
  if (type) params.set("type", type);
  if (status) params.set("status", status);
  const { data, loading, error, reload } = useApiGet<InvoicesResponse>(`/invoices?${params}`);

  useEffect(() => {
    if (error) Swal.fire({ title: "Could not load invoices", text: error instanceof Error ? error.message : "", icon: "error" });
  }, [error]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const run = async (invoiceId: string, task: () => Promise<unknown>, success?: string) => {
    setBusyId(invoiceId);
    try {
      await task();
      if (success) Swal.fire({ title: success, icon: "success", timer: 1200, showConfirmButton: false });
      reload();
    } catch (err) {
      Swal.fire({ title: "Action failed", text: err instanceof Error ? err.message : "", icon: "error" });
    } finally {
      setBusyId(null);
    }
  };

  const view = (inv: Invoice) =>
    run(inv._id, async () => {
      const html = await api.getHtml(`/invoices/${inv._id}/html`);
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
      }
    });

  const recordPayment = async (inv: Invoice) => {
    const balance = Math.max(0, inv.totalAmount - (inv.paymentReceived || 0));
    const { value, isConfirmed } = await Swal.fire({
      title: `Record payment · ${inv.invoiceNumber}`,
      html: `<p style="font-size:13px;margin-bottom:8px">Invoice total ${formatINR(inv.totalAmount)} · received so far ${formatINR(inv.paymentReceived)}</p>`,
      input: "number",
      inputLabel: "Total amount received (₹)",
      inputValue: String(inv.paymentReceived ? inv.totalAmount : balance || inv.totalAmount),
      inputAttributes: { min: "0", step: "0.01" },
      showCancelButton: true,
      confirmButtonText: "Save payment",
      confirmButtonColor: "#293681",
      inputValidator: (v) => (v === "" || Number(v) < 0 ? "Enter the amount received" : undefined),
    });
    if (!isConfirmed) return;
    const received = Math.min(Number(value), inv.totalAmount);
    const nextStatus: Invoice["status"] = received >= inv.totalAmount ? "paid" : received > 0 ? "partial" : inv.status === "paid" ? "sent" : inv.status;
    await run(
      inv._id,
      () => api.put(`/invoices/${inv._id}`, { paymentReceived: received, paymentDate: received > 0 ? new Date().toISOString() : null, status: nextStatus }),
      "Payment recorded",
    );
  };

  const cancel = async (inv: Invoice) => {
    const { isConfirmed } = await Swal.fire({
      title: `Cancel ${inv.invoiceNumber}?`,
      text: "The invoice stays on record marked as cancelled.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Cancel invoice",
      confirmButtonColor: "#dc2626",
    });
    if (isConfirmed) await run(inv._id, () => api.put(`/invoices/${inv._id}`, { status: "cancelled" }), "Invoice cancelled");
  };

  const remove = async (inv: Invoice) => {
    const { isConfirmed } = await Swal.fire({
      title: `Delete ${inv.invoiceNumber}?`,
      text: "Only delete invoices created by mistake. Issued invoices should be cancelled instead.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });
    if (isConfirmed) await run(inv._id, () => api.delete(`/invoices/${inv._id}`), "Invoice deleted");
  };

  const summary = data?.summary;
  const invoices = data?.invoices || [];
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const totalCount = summary?.count || 0;
  const count = (key: string) => summary?.byStatus?.[key] || 0;
  const pct = (n: number) => `${totalCount ? ((n / totalCount) * 100).toFixed(1) : "0.0"}%`;
  const showStatus = (s: string) => { setPage(1); setStatus(s); };
  const reset = () => { setSearchInput(""); setSearch(""); setType(""); setStatus(""); setPage(1); };

  const exportCsv = () => {
    if (!invoices.length) {
      Swal.fire({ title: "Nothing to export", text: "No invoices match the current filters.", icon: "info" });
      return;
    }
    downloadCsv(
      `ensis-invoices-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Invoice No", "Type", "Date", "Customer", "Email", "Total", "Received", "Balance", "Status"],
      invoices.map((inv) => [
        inv.invoiceNumber, TYPES[inv.type] || inv.type, formatDate(inv.createdAt), customerLabel(inv), inv.lead?.email,
        inv.totalAmount, inv.paymentReceived, Math.max(0, inv.totalAmount - (inv.paymentReceived || 0)), inv.status,
      ]),
    );
  };

  return (
    <OrganicPage>
      <PageHeader
        title="Invoices"
        subtitle="Tax invoices, estimates and challans — record payments and send them to customers."
        actions={
          <>
            <HeaderButton icon={Download} onClick={exportCsv}>Export</HeaderButton>
            <HeaderButton icon={RefreshCcw} onClick={reload}>{loading ? "Refreshing…" : "Refresh"}</HeaderButton>
            <HeaderButton icon={ShoppingBag} href="/orders" primary>Go to Orders</HeaderButton>
          </>
        }
      />

      <MainWithSidebar
        sidebar={
          <>
            <SideCard title="Invoice Summary">
              <SummaryDonut slices={STATUSES.map((s) => ({ label: capitalize(s), value: count(s), color: STATUS_COLORS[s] }))} />
            </SideCard>
            <SideCard title="Collections">
              <div className="space-y-[11px]">
                <SidebarBar label="Received" value={Math.round(summary?.received || 0)} total={Math.round(summary?.billed || 0)} color="#29A15D" />
                <SidebarBar label="Outstanding" value={Math.round(summary?.outstanding || 0)} total={Math.round(summary?.billed || 0)} color="#E4463E" />
              </div>
              <div className="mt-[12px] space-y-[6px] border-t border-[#EDF0F4] pt-[10px] text-[10px] font-semibold text-[#475A83]">
                <p className="flex justify-between"><span>Total billed</span><span className="text-[#0f172a]">{formatINR(summary?.billed)}</span></p>
                <p className="flex justify-between"><span>Received</span><span className="text-[#047857]">{formatINR(summary?.received)}</span></p>
                <p className="flex justify-between"><span>Outstanding</span><span className="text-[#be123c]">{formatINR(summary?.outstanding)}</span></p>
              </div>
            </SideCard>
            <QuickActions
              actions={[
                { label: "Unpaid (Sent)", icon: Mail, onClick: () => showStatus("sent") },
                { label: "Partly Paid", icon: Wallet, onClick: () => showStatus("partial") },
                { label: "Create from an Order", icon: ShoppingBag, href: "/orders" },
                { label: "Download Report", icon: Download, onClick: exportCsv },
              ]}
            />
          </>
        }
      >
        <StatGrid columns={5}>
          <StatCard label="Total Invoices" value={totalCount} note="Live current data" icon={FileText} tone="violet" active={!status} onClick={() => showStatus("")} />
          <StatCard label="Sent" value={count("sent")} note={`${pct(count("sent"))} current data`} icon={Mail} tone="blue" active={status === "sent"} onClick={() => showStatus("sent")} />
          <StatCard label="Partly Paid" value={count("partial")} note={`${pct(count("partial"))} current data`} icon={Wallet} tone="amber" active={status === "partial"} onClick={() => showStatus("partial")} />
          <StatCard label="Paid" value={count("paid")} note={`${pct(count("paid"))} current data`} icon={Wallet} tone="emerald" active={status === "paid"} onClick={() => showStatus("paid")} />
          <StatCard label="Outstanding" value={formatINR(summary?.outstanding)} note="Still to collect" icon={Ban} tone="rose" />
        </StatGrid>

        <FilterBar>
          <SearchBox value={searchInput} onChange={setSearchInput} placeholder="Search by invoice number, customer name, email, phone or company..." />
          <FilterSelect value={type} onChange={(v) => { setPage(1); setType(v); }}>
            <option value="">All Types</option>
            {Object.entries(TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </FilterSelect>
          <FilterSelect value={status} onChange={(v) => { setPage(1); setStatus(v); }}>
            <option value="">All Status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{capitalize(s)}</option>)}
          </FilterSelect>
          <ResetButton onClick={reset} />
        </FilterBar>

        <TableCard
          footer={
            data && (
              <Pagination
                page={data.page}
                pages={pages}
                total={data.total}
                from={data.total ? (data.page - 1) * data.limit + 1 : 0}
                to={Math.min(data.page * data.limit, data.total)}
                noun="invoices"
                onPage={setPage}
                perPage={perPage}
                onPerPage={(n) => { setPerPage(n); setPage(1); }}
              />
            )
          }
        >
          <table className="w-full min-w-[900px] table-fixed border-collapse">
            <colgroup>
              <col style={{ width: "21%" }} />
              <col style={{ width: "19%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "20%" }} />
            </colgroup>
            <thead>
              <tr className={theadRowClass}>
                <th className={thClass}>Invoice</th>
                <th className={thClass}>Customer</th>
                <th className={thClass}>Date</th>
                <th className={`${thClass} text-right`}>Total</th>
                <th className={`${thClass} text-right`}>Received</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && !invoices.length && <LoadingRows colSpan={7} />}
              {!loading && !invoices.length && <EmptyRow colSpan={7}>{search || type || status ? "No invoices match these filters." : "No invoices yet."}</EmptyRow>}
              {invoices.map((inv) => {
                const busy = busyId === inv._id;
                const closed = inv.status === "cancelled";
                const orderId = orderIdOf(inv);
                return (
                  <tr key={inv._id} className={rowClass}>
                    <td className="min-w-0 px-[8px]">
                      <p className={cellPrimary}>{inv.invoiceNumber}</p>
                      <p className={cellSecondary}>
                        {TYPES[inv.type] || inv.type}
                        {orderId && (
                          <>
                            {" · "}
                            <Link href={`/orders/${orderId}`} className="text-[#006132] hover:underline">Order #{String(orderId).slice(-8).toUpperCase()}</Link>
                          </>
                        )}
                      </p>
                    </td>
                    <td className="min-w-0 px-[8px]">
                      <p className={cellPrimary}>{customerLabel(inv)}</p>
                      <p className={cellSecondary}>{inv.lead?.email || inv.billingAddress?.phone || "—"}</p>
                    </td>
                    <td className="px-[8px] text-[10px] font-semibold text-[#324374]">{formatDate(inv.createdAt)}</td>
                    <td className="px-[8px] text-right text-[10px] font-bold tabular-nums text-[#0f172a]">{formatINR(inv.totalAmount)}</td>
                    <td className="px-[8px] text-right text-[10px] font-semibold tabular-nums text-[#047857]">{formatINR(inv.paymentReceived)}</td>
                    <td className="px-[8px]"><Pill className={statusTone[inv.status] || ""}>{capitalize(inv.status)}</Pill></td>
                    <td className="px-[8px]">
                      <div className="flex items-center gap-[5px]">
                        <button type="button" title="View / print" disabled={busy} onClick={() => view(inv)} className={`${iconButton} border-[#E3E7ED] text-[#293681] hover:bg-[#F4F6FA]`}><Eye size={13} /></button>
                        <button type="button" title="Record payment" disabled={busy || closed} onClick={() => recordPayment(inv)} className={`${iconButton} border-emerald-200 text-emerald-700 hover:bg-emerald-50`}><Wallet size={13} /></button>
                        <button type="button" title="Email to customer" disabled={busy || closed} onClick={() => run(inv._id, () => api.post(`/invoices/${inv._id}/send-email`), "Invoice emailed")} className={`${iconButton} border-[#E3E7ED] text-[#293681] hover:bg-[#F4F6FA]`}><Mail size={13} /></button>
                        <button type="button" title="Send on WhatsApp" disabled={busy || closed} onClick={() => run(inv._id, () => api.post(`/invoices/${inv._id}/send-whatsapp`), "Sent on WhatsApp")} className={`${iconButton} border-[#cde8d6] text-[#15803d] hover:bg-emerald-50`}><MessageCircle size={13} /></button>
                        <button type="button" title="Cancel invoice" disabled={busy || closed} onClick={() => cancel(inv)} className={`${iconButton} border-amber-200 text-amber-600 hover:bg-amber-50`}><Ban size={13} /></button>
                        <button type="button" title="Delete" disabled={busy} onClick={() => remove(inv)} className={`${iconButton} border-rose-200 text-rose-500 hover:bg-rose-50`}><Trash2 size={13} /></button>
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
