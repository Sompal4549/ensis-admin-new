"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { AlarmClock, CalendarClock, Download, Eye, Flame, Handshake, Plus, Snowflake, Trash2, UserPlus, Users } from "lucide-react";
import { api } from "@/lib/api";
import { useApiGet } from "@/lib/useApiGet";
import { downloadCsv } from "@/lib/csv";
import { formatDate } from "@/lib/sales";
import { LEAD_STATUSES, PRIORITIES, assigneeName, isOpenLead, leadName, leadStatusTone, priorityTone, todayISO, type Lead } from "@/lib/leads";
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

type LeadsResponse = {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
  summary: { total: number; byStatus: Record<string, number>; byCategory: Record<string, number>; followUpsToday: number; followUpsOverdue: number };
};

const STATUS_COLORS: Record<string, string> = { New: "#3379DE", Contacted: "#38BDF8", Qualified: "#8851DA", Negotiation: "#F49B16", Converted: "#2CA25F", Lost: "#94A3B8" };

export default function LeadsPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [followUp, setFollowUp] = useState("");

  const params = new URLSearchParams({ page: String(page), limit: String(perPage) });
  if (search) params.set("search", search);
  if (status) params.set("leadStatus", status);
  if (priority) params.set("priority", priority);
  if (category) params.set("leadCategory", category);
  if (followUp) params.set("followUp", followUp);
  const { data, loading, error, reload } = useApiGet<LeadsResponse>(`/leads?${params}`);

  useEffect(() => {
    if (error) Swal.fire({ title: "Could not load leads", text: error instanceof Error ? error.message : "", icon: "error" });
  }, [error]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const showOnly = (patch: { status?: string; category?: string; followUp?: string }) => {
    setPage(1);
    setStatus(patch.status ?? "");
    setCategory(patch.category ?? "");
    setFollowUp(patch.followUp ?? "");
  };
  const reset = () => { setSearchInput(""); setSearch(""); setPriority(""); showOnly({}); };

  const changeStatus = async (lead: Lead, leadStatus: string) => {
    try {
      await api.put(`/leads/${lead._id}`, { leadStatus });
      reload();
    } catch (err) {
      Swal.fire({ title: "Could not update lead", text: err instanceof Error ? err.message : "", icon: "error" });
    }
  };

  const remove = async (lead: Lead) => {
    const { isConfirmed } = await Swal.fire({
      title: `Delete ${leadName(lead)}?`,
      text: "Leads with orders or invoices cannot be deleted — mark them as Lost instead.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/leads/${lead._id}`);
      reload();
    } catch (err) {
      Swal.fire({ title: "Could not delete lead", text: err instanceof Error ? err.message : "", icon: "error" });
    }
  };

  const summary = data?.summary;
  const leads = data?.leads || [];
  const total = summary?.total || 0;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const pipeline = (summary?.byStatus?.Contacted || 0) + (summary?.byStatus?.Qualified || 0) + (summary?.byStatus?.Negotiation || 0);
  const today = todayISO();

  const exportCsv = () => {
    if (!leads.length) {
      Swal.fire({ title: "Nothing to export", icon: "info" });
      return;
    }
    downloadCsv(
      `ensis-leads-${today}.csv`,
      ["Name", "Company", "Email", "Phone", "City", "Interested In", "Status", "Priority", "Temperature", "Follow-up", "Assigned To", "Source"],
      leads.map((l) => [leadName(l), l.companyName, l.email, `${l.phoneCode || ""} ${l.phone}`, l.city, l.interestedProduct, l.leadStatus, l.priority, l.leadCategory, l.followUpDate, assigneeName(l), l.leadSource]),
    );
  };

  return (
    <OrganicPage>
      <PageHeader
        title="Leads CRM"
        subtitle="Track every enquiry from first contact to order — follow-ups, quotes and invoices in one place."
        actions={
          <>
            <HeaderButton icon={Download} onClick={exportCsv}>Export</HeaderButton>
            <HeaderButton icon={AlarmClock} onClick={() => showOnly({ followUp: "today" })}>Today&apos;s Follow-ups</HeaderButton>
            <HeaderButton icon={Plus} href="/leads/new" primary>Add New Lead</HeaderButton>
          </>
        }
      />

      <MainWithSidebar
        sidebar={
          <>
            <SideCard title="Lead Pipeline">
              <SummaryDonut slices={LEAD_STATUSES.map((s) => ({ label: s, value: summary?.byStatus?.[s] || 0, color: STATUS_COLORS[s] }))} />
            </SideCard>
            <SideCard title="Lead Temperature">
              <div className="space-y-[11px]">
                <SidebarBar label="Hot" value={summary?.byCategory?.hot || 0} total={total} color="#E4463E" />
                <SidebarBar label="Cold" value={summary?.byCategory?.cold || 0} total={total} color="#2784E1" />
                <SidebarBar label="Not set" value={summary?.byCategory?.none || 0} total={total} color="#94A3B8" />
              </div>
            </SideCard>
            <QuickActions
              actions={[
                { label: "Add New Lead", icon: Plus, href: "/leads/new" },
                { label: "Follow-ups Due Today", icon: CalendarClock, onClick: () => showOnly({ followUp: "today" }) },
                { label: "Overdue Follow-ups", icon: AlarmClock, onClick: () => showOnly({ followUp: "overdue" }) },
                { label: "Download Report", icon: Download, onClick: exportCsv },
              ]}
            />
          </>
        }
      >
        <StatGrid columns={5}>
          <StatCard label="Total Leads" value={total} note="Live current data" icon={Users} tone="violet" active={!status && !category && !followUp} onClick={() => showOnly({})} />
          <StatCard label="New Leads" value={summary?.byStatus?.New || 0} note="Not contacted yet" icon={UserPlus} tone="blue" active={status === "New"} onClick={() => showOnly({ status: "New" })} />
          <StatCard label="In Pipeline" value={pipeline} note="Contacted → Negotiation" icon={Handshake} tone="amber" active={status === "Negotiation"} onClick={() => showOnly({ status: "Negotiation" })} />
          <StatCard label="Due Today" value={summary?.followUpsToday || 0} note="Follow-ups today" icon={CalendarClock} tone="emerald" active={followUp === "today"} onClick={() => showOnly({ followUp: "today" })} />
          <StatCard label="Overdue" value={summary?.followUpsOverdue || 0} note="Missed follow-ups" icon={AlarmClock} tone="rose" active={followUp === "overdue"} onClick={() => showOnly({ followUp: "overdue" })} />
        </StatGrid>

        <FilterBar>
          <SearchBox value={searchInput} onChange={setSearchInput} placeholder="Search by name, company, email, phone, city or product..." />
          <FilterSelect value={status} onChange={(v) => { setPage(1); setStatus(v); }}>
            <option value="">All Status</option>
            {LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}
          </FilterSelect>
          <FilterSelect value={priority} onChange={(v) => { setPage(1); setPriority(v); }}>
            <option value="">All Priority</option>
            {PRIORITIES.map((p) => <option key={p}>{p}</option>)}
          </FilterSelect>
          <FilterSelect value={category} onChange={(v) => { setPage(1); setCategory(v); }}>
            <option value="">Hot &amp; Cold</option>
            <option value="hot">Hot</option>
            <option value="cold">Cold</option>
          </FilterSelect>
          <FilterSelect value={followUp} onChange={(v) => { setPage(1); setFollowUp(v); }}>
            <option value="">Any Follow-up</option>
            <option value="today">Due Today</option>
            <option value="overdue">Overdue</option>
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
                noun="leads"
                onPage={setPage}
                perPage={perPage}
                onPerPage={(n) => { setPerPage(n); setPage(1); }}
              />
            )
          }
        >
          <table className="w-full min-w-[840px] table-fixed border-collapse">
            <colgroup>
              <col style={{ width: "18%" }} />
              <col style={{ width: "17%" }} />
              <col style={{ width: "15%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "8%" }} />
              <col style={{ width: "13%" }} />
              <col style={{ width: "9%" }} />
              <col style={{ width: "7%" }} />
            </colgroup>
            <thead>
              <tr className={theadRowClass}>
                <th className={thClass}>Lead</th>
                <th className={thClass}>Contact</th>
                <th className={thClass}>Interested In</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Priority</th>
                <th className={thClass}>Next Follow-up</th>
                <th className={thClass}>Assigned</th>
                <th className={thClass}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading && !leads.length && <LoadingRows colSpan={8} />}
              {!loading && !leads.length && <EmptyRow colSpan={8}>{search || status || priority || category || followUp ? "No leads match these filters." : "No leads yet. Click “Add New Lead”."}</EmptyRow>}
              {leads.map((lead) => {
                const overdue = isOpenLead(lead) && !!lead.followUpDate && lead.followUpDate < today;
                const dueToday = isOpenLead(lead) && lead.followUpDate === today;
                return (
                  <tr key={lead._id} className={rowClass}>
                    <td className="min-w-0 px-[8px]">
                      <Link href={`/leads/${lead._id}`} className={`flex items-center gap-[5px] ${cellPrimary} hover:underline`}>
                        <span className="truncate">{leadName(lead)}</span>
                        {lead.leadCategory === "hot" && <Flame size={11} className="shrink-0 text-rose-500" />}
                        {lead.leadCategory === "cold" && <Snowflake size={11} className="shrink-0 text-sky-500" />}
                      </Link>
                      <p className={cellSecondary}>{lead.companyName}{lead.city && lead.city !== "—" ? ` · ${lead.city}` : ""}</p>
                    </td>
                    <td className="min-w-0 px-[8px]">
                      <a href={`tel:${lead.phoneCode || ""}${lead.phone}`} className={`block truncate ${cellText} hover:underline`}>{lead.phoneCode} {lead.phone}</a>
                      <a href={`mailto:${lead.email}`} className={`block ${cellSecondary} hover:underline`}>{lead.email}</a>
                    </td>
                    <td className="min-w-0 px-[8px]"><p className="truncate text-[8px] font-medium text-slate-700">{lead.interestedProduct || "—"}</p></td>
                    <td className="px-[8px]">
                      <select
                        value={lead.leadStatus || "New"}
                        onChange={(e) => changeStatus(lead, e.target.value)}
                        className={`h-[26px] max-w-full rounded-[4px] border px-[5px] text-[10px] font-semibold outline-none ${leadStatusTone[lead.leadStatus || "New"]}`}
                        aria-label="Lead status"
                      >
                        {LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className={`px-[8px] text-[10px] font-bold ${priorityTone[lead.priority || "Medium"]}`}>{lead.priority || "—"}</td>
                    <td className="min-w-0 px-[8px]">
                      <p className={`truncate text-[10px] font-semibold ${overdue ? "text-rose-600" : dueToday ? "text-emerald-700" : "text-[#324374]"}`}>
                        {lead.followUpDate ? formatDate(lead.followUpDate) : "—"}
                        {overdue && " · overdue"}
                        {dueToday && " · today"}
                      </p>
                      {lead.followUpMethod && <p className={cellSecondary}>{lead.followUpMethod}{lead.followUpTime ? ` at ${lead.followUpTime}` : ""}</p>}
                    </td>
                    <td className="min-w-0 px-[8px]"><p className={`truncate ${cellText}`}>{assigneeName(lead) || "—"}</p></td>
                    <td className="px-[8px]">
                      <div className="flex items-center gap-[5px]">
                        <Link href={`/leads/${lead._id}`} title="Open lead" className="grid h-[28px] w-[28px] place-items-center rounded-[5px] border border-[#E3E7ED] bg-white text-[#293681] hover:bg-[#F4F6FA]"><Eye size={13} /></Link>
                        <button type="button" title="Delete" onClick={() => remove(lead)} className="grid h-[28px] w-[28px] place-items-center rounded-[5px] border border-rose-200 bg-white text-rose-500 hover:bg-rose-50"><Trash2 size={12} /></button>
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
