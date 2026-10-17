"use client";

import React from "react";
import { FileText, Handshake, IndianRupee, MessageSquareText, RefreshCcw, ShoppingBag, Star, Users, Wallet } from "lucide-react";
import { useApiGet } from "@/lib/useApiGet";
import { capitalize, formatINR } from "@/lib/sales";
import { LEAD_STATUSES } from "@/lib/leads";
import {
  HeaderButton,
  OrganicPage,
  PageHeader,
  QuickActions,
  SideCard,
  SidebarBar,
  StatCard,
  StatGrid,
  SummaryDonut,
} from "@/components/organic/OrganicUI";

type OrdersSummary = { summary: { total: number; byStatus: Record<string, number>; byPayment?: Record<string, number>; paidRevenue: number; paidOrders: number } };
type InvoicesSummary = { summary: { count: number; byStatus: Record<string, number>; billed: number; received: number; outstanding: number } };
type LeadsSummary = { summary: { total: number; byStatus: Record<string, number>; byCategory: Record<string, number>; followUpsToday: number; followUpsOverdue: number } };
type ReviewsSummary = { summary: { total: number; byStatus: Record<string, number>; averageApprovedRating: number } };

const ORDER_COLORS: Record<string, string> = { pending: "#F49B16", confirmed: "#3379DE", shipped: "#8851DA", delivered: "#2CA25F", cancelled: "#E4463E" };
const LEAD_COLORS: Record<string, string> = { New: "#3379DE", Contacted: "#38BDF8", Qualified: "#8851DA", Negotiation: "#F49B16", Converted: "#2CA25F", Lost: "#94A3B8" };

/** Business overview built from the live Orders, Invoices, Leads and Reviews modules */
export default function ReportsPage() {
  const orders = useApiGet<OrdersSummary>("/orders/admin/all?limit=1");
  const invoices = useApiGet<InvoicesSummary>("/invoices?limit=1");
  const leads = useApiGet<LeadsSummary>("/leads?limit=1");
  const reviews = useApiGet<ReviewsSummary>("/reviews?limit=1");

  const o = orders.data?.summary;
  const i = invoices.data?.summary;
  const l = leads.data?.summary;
  const r = reviews.data?.summary;
  const loading = orders.loading || invoices.loading || leads.loading || reviews.loading;
  const failed = [orders, invoices, leads, reviews].filter((x) => x.error).length;

  const converted = l?.byStatus?.Converted || 0;
  const conversion = l?.total ? `${((converted / l.total) * 100).toFixed(1)}% converted` : "No leads yet";
  const avgOrder = o?.paidOrders ? formatINR(Math.round((o.paidRevenue || 0) / o.paidOrders)) : "—";
  const reload = () => { orders.reload(); invoices.reload(); leads.reload(); reviews.reload(); };

  return (
    <OrganicPage>
      <PageHeader
        title="Business Reports"
        subtitle="A live overview of sales, collections, leads and customer reviews across Ensis."
        actions={<HeaderButton icon={RefreshCcw} onClick={reload} primary>{loading ? "Refreshing…" : "Refresh"}</HeaderButton>}
      />

      {failed > 0 && (
        <div className="mt-[10px] rounded-[6px] border border-red-200 bg-red-50 px-[11px] py-[8px] text-[10px] font-semibold text-red-700">
          {failed} section{failed === 1 ? "" : "s"} could not be loaded. Check that the backend is running, then Refresh.
        </div>
      )}

      <div className="mt-[22px]">
        <StatGrid columns={5}>
          <StatCard label="Paid Revenue" value={formatINR(o?.paidRevenue)} note={`${o?.paidOrders || 0} paid orders`} icon={IndianRupee} tone="emerald" />
          <StatCard label="Average Order" value={avgOrder} note="Paid orders only" icon={ShoppingBag} tone="violet" />
          <StatCard label="Invoiced" value={formatINR(i?.billed)} note={`${formatINR(i?.received)} received`} icon={FileText} tone="blue" />
          <StatCard label="Outstanding" value={formatINR(i?.outstanding)} note="Still to collect" icon={Wallet} tone="rose" />
          <StatCard label="Lead Conversion" value={converted} note={conversion} icon={Handshake} tone="amber" />
        </StatGrid>
      </div>

      <div className="mt-[16px] grid gap-[13px] md:grid-cols-2 xl:grid-cols-3">
        <SideCard title="Orders by Status">
          <SummaryDonut slices={Object.keys(ORDER_COLORS).map((s) => ({ label: capitalize(s), value: o?.byStatus?.[s] || 0, color: ORDER_COLORS[s] }))} />
        </SideCard>

        <SideCard title="Lead Pipeline">
          <SummaryDonut slices={LEAD_STATUSES.map((s) => ({ label: s, value: l?.byStatus?.[s] || 0, color: LEAD_COLORS[s] }))} />
        </SideCard>

        <SideCard title="Payments & Collections">
          <div className="space-y-[11px]">
            <SidebarBar label="Orders paid" value={o?.byPayment?.paid || 0} total={o?.total || 0} color="#29A15D" />
            <SidebarBar label="Orders pending" value={o?.byPayment?.pending || 0} total={o?.total || 0} color="#F39B16" />
            <SidebarBar label="Invoices paid" value={i?.byStatus?.paid || 0} total={i?.count || 0} color="#2784E1" />
            <SidebarBar label="Part paid" value={i?.byStatus?.partial || 0} total={i?.count || 0} color="#8851DA" />
          </div>
        </SideCard>

        <SideCard title="Follow-ups">
          <div className="space-y-[11px]">
            <SidebarBar label="Due today" value={l?.followUpsToday || 0} total={l?.total || 0} color="#29A15D" />
            <SidebarBar label="Overdue" value={l?.followUpsOverdue || 0} total={l?.total || 0} color="#E4463E" />
            <SidebarBar label="Hot leads" value={l?.byCategory?.hot || 0} total={l?.total || 0} color="#F39B16" />
          </div>
        </SideCard>

        <SideCard title="Customer Reviews">
          <div className="flex items-center gap-[10px]">
            <span className="text-[23px] font-bold leading-none text-[#0f172a]">{r?.averageApprovedRating || "—"}</span>
            <div className="text-[10px] font-semibold text-[#475A83]">
              <p className="flex items-center gap-[4px]"><Star size={12} className="fill-amber-400 text-amber-400" /> average rating</p>
              <p className="mt-[3px]">{r?.byStatus?.approved || 0} published · {r?.byStatus?.rejected || 0} hidden</p>
            </div>
          </div>
        </SideCard>

        <QuickActions
          actions={[
            { label: "Orders", icon: ShoppingBag, href: "/orders" },
            { label: "Invoices", icon: FileText, href: "/invoices" },
            { label: "Leads CRM", icon: Users, href: "/leads" },
            { label: "Product Reviews", icon: MessageSquareText, href: "/product-reviews" },
          ]}
        />
      </div>
    </OrganicPage>
  );
}
