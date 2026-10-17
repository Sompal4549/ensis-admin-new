"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { CheckCircle2, Clock3, Download, Eye, FileText, PackageCheck, RefreshCcw, ShoppingBag, Truck } from "lucide-react";
import { useApiGet } from "@/lib/useApiGet";
import { downloadCsv } from "@/lib/csv";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  capitalize,
  customerName,
  customerOf,
  formatDate,
  formatINR,
  itemName,
  orderStatusTone,
  paymentStatusTone,
  plainText,
  shortId,
  type Order,
} from "@/lib/sales";
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
  cellText,
  rowClass,
  thClass,
  theadRowClass,
} from "@/components/organic/OrganicUI";

type OrdersResponse = {
  orders: Order[];
  pagination: { page: number; limit: number; total: number; pages: number };
  summary: { total: number; byStatus: Record<string, number>; byPayment?: Record<string, number>; paidRevenue: number; paidOrders: number };
};

const STATUS_COLORS: Record<string, string> = { pending: "#F49B16", confirmed: "#3379DE", shipped: "#8851DA", delivered: "#2CA25F", cancelled: "#E4463E" };

export default function OrdersPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");

  const params = new URLSearchParams({ page: String(page), limit: String(perPage) });
  if (search) params.set("search", search);
  if (status) params.set("status", status);
  if (paymentStatus) params.set("paymentStatus", paymentStatus);
  const { data, loading, error, reload } = useApiGet<OrdersResponse>(`/orders/admin/all?${params}`);

  useEffect(() => {
    if (error) Swal.fire({ title: "Could not load orders", text: error instanceof Error ? error.message : "", icon: "error" });
  }, [error]);

  // Search runs shortly after typing stops
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const summary = data?.summary;
  const orders = data?.orders || [];
  const pagination = data?.pagination;
  const total = summary?.total || 0;
  const count = (key: string) => summary?.byStatus?.[key] || 0;
  const pct = (n: number) => `${total ? ((n / total) * 100).toFixed(1) : "0.0"}%`;
  const showStatus = (s: string) => { setPage(1); setStatus(s); };

  const reset = () => { setSearchInput(""); setSearch(""); setStatus(""); setPaymentStatus(""); setPage(1); };

  const exportCsv = () => {
    if (!orders.length) {
      Swal.fire({ title: "Nothing to export", text: "No orders match the current filters.", icon: "info" });
      return;
    }
    downloadCsv(
      `ensis-orders-${new Date().toISOString().slice(0, 10)}.csv`,
      ["Order ID", "Date", "Customer", "Email", "Phone", "Items", "Amount", "Payment", "Status", "City", "State", "Courier", "Tracking"],
      orders.map((o) => {
        const c = customerOf(o.user);
        return [
          o._id, formatDate(o.createdAt, true), customerName(o.user), c.email, c.phone,
          o.items.map((i) => `${plainText(itemName(i))} x${i.quantity}`).join("; "),
          o.totalAmount, o.paymentStatus, o.orderStatus, o.shippingAddress?.city, o.shippingAddress?.state, o.courierPartner, o.trackingNumber,
        ];
      }),
    );
  };

  return (
    <OrganicPage>
      <PageHeader
        title="Orders"
        subtitle="Track website orders, update their status, dispatch them and issue tax invoices."
        actions={
          <>
            <HeaderButton icon={Download} onClick={exportCsv}>Export</HeaderButton>
            <HeaderButton icon={RefreshCcw} onClick={reload}>{loading ? "Refreshing…" : "Refresh"}</HeaderButton>
            <HeaderButton icon={FileText} href="/invoices" primary>View Invoices</HeaderButton>
          </>
        }
      />

      <MainWithSidebar
        sidebar={
          <>
            <SideCard title="Order Summary">
              <SummaryDonut slices={ORDER_STATUSES.map((s) => ({ label: capitalize(s), value: count(s), color: STATUS_COLORS[s] }))} />
            </SideCard>
            <SideCard title="Payments">
              <div className="space-y-[11px]">
                <SidebarBar label="Paid" value={summary?.byPayment?.paid || 0} total={total} color="#29A15D" />
                <SidebarBar label="Pending" value={summary?.byPayment?.pending || 0} total={total} color="#F39B16" />
                <SidebarBar label="Failed" value={summary?.byPayment?.failed || 0} total={total} color="#E4463E" />
              </div>
              <p className="mt-[12px] border-t border-[#EDF0F4] pt-[10px] text-[10px] font-semibold text-[#475A83]">
                Paid revenue <span className="float-right text-[#047857]">{formatINR(summary?.paidRevenue)}</span>
              </p>
            </SideCard>
            <QuickActions
              actions={[
                { label: "Pending Orders", icon: Clock3, onClick: () => showStatus("pending") },
                { label: "Ready to Dispatch", icon: Truck, onClick: () => showStatus("confirmed") },
                { label: "All Invoices", icon: FileText, href: "/invoices" },
                { label: "Download Report", icon: Download, onClick: exportCsv },
              ]}
            />
          </>
        }
      >
        <StatGrid columns={5}>
          <StatCard label="Total Orders" value={total} note="Live current data" icon={ShoppingBag} tone="violet" active={!status} onClick={() => showStatus("")} />
          <StatCard label="Pending" value={count("pending")} note={`${pct(count("pending"))} current data`} icon={Clock3} tone="amber" active={status === "pending"} onClick={() => showStatus("pending")} />
          <StatCard label="Confirmed" value={count("confirmed")} note={`${pct(count("confirmed"))} current data`} icon={CheckCircle2} tone="blue" active={status === "confirmed"} onClick={() => showStatus("confirmed")} />
          <StatCard label="Shipped" value={count("shipped")} note={`${pct(count("shipped"))} current data`} icon={Truck} tone="violet" active={status === "shipped"} onClick={() => showStatus("shipped")} />
          <StatCard label="Delivered" value={count("delivered")} note={`${pct(count("delivered"))} current data`} icon={PackageCheck} tone="emerald" active={status === "delivered"} onClick={() => showStatus("delivered")} />
        </StatGrid>

        <FilterBar>
          <SearchBox value={searchInput} onChange={setSearchInput} placeholder="Search by order ID, customer, email, phone, city or tracking no..." />
          <FilterSelect value={status} onChange={(v) => { setPage(1); setStatus(v); }}>
            <option value="">All Status</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{capitalize(s)}</option>)}
          </FilterSelect>
          <FilterSelect value={paymentStatus} onChange={(v) => { setPage(1); setPaymentStatus(v); }}>
            <option value="">All Payments</option>
            {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{capitalize(s)}</option>)}
          </FilterSelect>
          <ResetButton onClick={reset} />
        </FilterBar>

        <TableCard
          footer={
            pagination && (
              <Pagination
                page={pagination.page}
                pages={Math.max(pagination.pages, 1)}
                total={pagination.total}
                from={pagination.total ? (pagination.page - 1) * pagination.limit + 1 : 0}
                to={Math.min(pagination.page * pagination.limit, pagination.total)}
                noun="orders"
                onPage={setPage}
                perPage={perPage}
                onPerPage={(n) => { setPerPage(n); setPage(1); }}
              />
            )
          }
        >
          <table className="w-full min-w-[860px] table-fixed border-collapse">
            <colgroup>
              <col style={{ width: "13%" }} />
              <col style={{ width: "17%" }} />
              <col style={{ width: "20%" }} />
              <col style={{ width: "11%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "10%" }} />
              <col style={{ width: "12%" }} />
              <col style={{ width: "8%" }} />
            </colgroup>
            <thead>
              <tr className={theadRowClass}>
                <th className={thClass}>Order</th>
                <th className={thClass}>Customer</th>
                <th className={thClass}>Items</th>
                <th className={`${thClass} text-right`}>Amount</th>
                <th className={thClass}>Payment</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Ship To</th>
                <th className={thClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && !orders.length && <LoadingRows colSpan={8} />}
              {!loading && !orders.length && (
                <EmptyRow colSpan={8}>{search || status || paymentStatus ? "No orders match these filters." : "No orders yet. Orders placed on the website appear here."}</EmptyRow>
              )}
              {orders.map((order) => {
                const customer = customerOf(order.user);
                const firstItem = order.items?.[0];
                return (
                  <tr key={order._id} className={rowClass}>
                    <td className="px-[8px]">
                      <Link href={`/orders/${order._id}`} className="font-mono text-[10px] font-semibold text-[#293681] hover:underline">{shortId(order._id)}</Link>
                      <p className={cellSecondary}>{formatDate(order.createdAt, true)}</p>
                    </td>
                    <td className="min-w-0 px-[8px]">
                      <p className={cellPrimary}>{customerName(order.user)}</p>
                      <p className={cellSecondary}>{customer.email || customer.phone || "—"}</p>
                    </td>
                    <td className="min-w-0 px-[8px]">
                      <p className="truncate text-[8px] font-medium text-slate-700">{firstItem ? plainText(itemName(firstItem)) : "—"}</p>
                      {order.items.length > 1 && <p className={cellSecondary}>+{order.items.length - 1} more item{order.items.length > 2 ? "s" : ""}</p>}
                    </td>
                    <td className="px-[8px] text-right text-[10px] font-bold tabular-nums text-[#0f172a]">{formatINR(order.totalAmount)}</td>
                    <td className="px-[8px]"><Pill className={paymentStatusTone[order.paymentStatus] || ""}>{capitalize(order.paymentStatus)}</Pill></td>
                    <td className="px-[8px]"><Pill className={orderStatusTone[order.orderStatus] || ""}>{capitalize(order.orderStatus)}</Pill></td>
                    <td className="min-w-0 px-[8px]"><p className={`truncate ${cellText}`}>{[order.shippingAddress?.city, order.shippingAddress?.state].filter(Boolean).join(", ") || "—"}</p></td>
                    <td className="px-[8px]">
                      <Link href={`/orders/${order._id}`} title="Manage order" className="grid h-[28px] w-[28px] place-items-center rounded-[5px] border border-[#E3E7ED] bg-white text-[#293681] hover:bg-[#F4F6FA]">
                        <Eye size={13} />
                      </Link>
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

