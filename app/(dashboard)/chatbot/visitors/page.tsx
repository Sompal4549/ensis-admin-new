"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  ArrowRight,
  CalendarClock,
  Eraser,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  Globe,
  Mail,
  MessageSquareX,
  MessagesSquare,
  MonitorSmartphone,
  Phone,
  RefreshCw,
  Search,
  ShieldBan,
  ShieldCheck,
  Trash2,
  UserCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import typography from "../../pages/PagesTypography.module.css";
import { chatVisitorsApi, type ChatVisitor, type ChatVisitorCounts, type ChatVisitorDetail, type VisitorFilter } from "@/lib/chatbotApi";

/*
 * Chatbot → Chat Visitors: everyone Ensis Assist has chatted with, one row per visitor (by IP).
 * Shows whether the IP is blocked, the last message and when, and whether their latest chat is
 * open; the team can block / unblock the IP, close the chat or delete its history.
 * Laid out like Testimonials Management, in the website's colours (navy #263016, orange #D98E16).
 */

const NAVY = "#263016";
const ORANGE = "#D98E16";
const RING_SHADOW = "rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px";
const PER_PAGE = 10;

const fmt = (iso?: string) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true })
    : "—";

const ago = (iso?: string) => {
  if (!iso) return "";
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 1440) return `${Math.round(m / 60)} hr ago`;
  const d = Math.round(m / 1440);
  return d === 1 ? "Yesterday" : `${d} days ago`;
};

const displayName = (v: Pick<ChatVisitor, "name" | "ip">) => v.name || `Visitor ${v.ip}`;
const initials = (v: Pick<ChatVisitor, "name" | "ip">) =>
  v.name
    ? v.name
        .split(/\s+/)
        .filter(Boolean)
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "V";

const AVATARS = ["bg-[#263016]", "bg-[#D98E16]", "bg-[#1c2410]", "bg-[#b87712]"];
const avatarOf = (ip: string) => AVATARS[[...ip].reduce((h, c) => h + c.charCodeAt(0), 0) % AVATARS.length];

/* ── KPI cards (Testimonials Management layout, website colours) ── */
const KPI: {
  key: keyof ChatVisitorCounts;
  filter?: VisitorFilter;
  title: string;
  footer: string;
  icon: LucideIcon;
  tone: string;
  tint: string;
  border: string;
  num: string;
}[] = [
  { key: "all", filter: "all", title: "TOTAL VISITORS", footer: "View all visitors", icon: UsersRound, tone: "bg-[#eef3fb] text-[#263016] ring-[#c9d6ec]", tint: "#d6e2f5", border: "#c3d3ee", num: NAVY },
  { key: "active", filter: "active", title: "ACTIVE", footer: "Can chat", icon: UserCheck, tone: "bg-emerald-50 text-emerald-700 ring-emerald-200", tint: "#c9f5d9", border: "#a7e8be", num: "#15803d" },
  { key: "blocked", filter: "blocked", title: "BLOCKED IPs", footer: "View blocked", icon: ShieldBan, tone: "bg-rose-50 text-rose-700 ring-rose-200", tint: "#fecdd3", border: "#fda4af", num: "#be123c" },
  { key: "open", filter: "open", title: "OPEN CHATS", footer: "View open chats", icon: MessagesSquare, tone: "bg-[#faf7f2] text-[#b87712] ring-[#fdc89c]", tint: "#ffdcbf", border: "#fdc89c", num: "#b87712" },
  { key: "closed", filter: "closed", title: "CLOSED CHATS", footer: "View closed chats", icon: MessageSquareX, tone: "bg-[#eaf2fd] text-[#1c2410] ring-[#bcd3f3]", tint: "#cfe2fb", border: "#b3cdf3", num: "#1c2410" },
  { key: "today", title: "CHATTED TODAY", footer: "Last activity today", icon: CalendarClock, tone: "bg-[#faf7f2] text-[#b87712] ring-[#fdc89c]", tint: "#ffdcbf", border: "#fdc89c", num: "#b87712" },
];

const FILTER_OPTIONS: { value: VisitorFilter; label: string }[] = [
  { value: "all", label: "All Visitors" },
  { value: "active", label: "Active" },
  { value: "blocked", label: "Blocked" },
  { value: "open", label: "Chat Open" },
  { value: "closed", label: "Chat Closed" },
];

const StatusPill = ({ status }: { status: ChatVisitor["status"] }) =>
  status === "blocked" ? (
    <span className="inline-flex h-[20px] items-center gap-[4px] rounded-[4px] border border-[#ef9a9a] bg-[#ffebee] px-[7px] text-[7px] font-bold text-[#c62828] shadow-xs">
      <ShieldBan className="h-[11px] w-[11px]" /> Blocked
    </span>
  ) : (
    <span className="inline-flex h-[20px] items-center gap-[4px] rounded-[4px] border border-[#a5d6a7] bg-[#e8f5e9] px-[7px] text-[7px] font-bold text-[#23714a] shadow-xs">
      <span className="h-[6px] w-[6px] rounded-full bg-[#22a447]" /> Active
    </span>
  );

const ChatPill = ({ open }: { open: boolean }) =>
  open ? (
    <span className="inline-flex h-[20px] items-center rounded-[4px] border border-[#fdc89c] bg-[#faf7f2] px-[7px] text-[7px] font-bold text-[#b87712] shadow-xs">Open</span>
  ) : (
    <span className="inline-flex h-[20px] items-center rounded-[4px] border border-[#cbd5e1] bg-[#f1f5f9] px-[7px] text-[7px] font-bold text-[#475569] shadow-xs">Closed</span>
  );

const iconBtn = "flex h-[25px] w-[25px] items-center justify-center rounded-[6px] border backdrop-blur-md transition-all disabled:cursor-not-allowed disabled:opacity-35";

const confirmColors = { confirmButtonColor: NAVY, cancelButtonColor: "#94a3b8" };

export default function ChatVisitorsPage() {
  const [visitors, setVisitors] = useState<ChatVisitor[]>([]);
  const [counts, setCounts] = useState<ChatVisitorCounts>({ all: 0, active: 0, blocked: 0, open: 0, closed: 0, today: 0 });
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<VisitorFilter>("all");
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [selectedIp, setSelectedIp] = useState<string | null>(null);
  const [detail, setDetail] = useState<ChatVisitorDetail | null>(null);
  const [busy, setBusy] = useState(false);

  // Search waits for the typing to pause
  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Loading = the list on screen is not for the current search / filter / refresh yet
  const listKey = `${query}|${filter}|${reloadKey}`;
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const loading = loadedKey !== listKey;

  useEffect(() => {
    let cancelled = false;
    chatVisitorsApi
      .list({ search: query, status: filter })
      .then((r) => {
        if (cancelled) return;
        setVisitors(r.visitors);
        setCounts(r.counts);
        setError("");
      })
      .catch((e: Error) => !cancelled && setError(e.message || "Could not load visitors"))
      .finally(() => !cancelled && setLoadedKey(listKey));
    return () => {
      cancelled = true;
    };
  }, [query, filter, listKey]);

  const reload = () => setReloadKey((k) => k + 1);

  // The details panel shows the selected visitor, or the first one in the list
  const selected = useMemo(() => visitors.find((v) => v.ip === selectedIp) ?? visitors[0] ?? null, [visitors, selectedIp]);

  // The selected visitor's chats (the panel ignores a detail that belongs to someone else)
  const detailKey = selected ? `${selected.ip}|${reloadKey}` : "";
  const [detailLoadedKey, setDetailLoadedKey] = useState("");
  const detailLoading = Boolean(selected) && detailLoadedKey !== detailKey;

  useEffect(() => {
    if (!selected) return;
    let cancelled = false;
    chatVisitorsApi
      .get(selected.ip)
      .then((d) => !cancelled && setDetail(d))
      .catch(() => !cancelled && setDetail(null))
      .finally(() => !cancelled && setDetailLoadedKey(detailKey));
    return () => {
      cancelled = true;
    };
  }, [selected, detailKey]);

  const pageCount = Math.max(1, Math.ceil(visitors.length / PER_PAGE));
  const current = Math.min(page, pageCount);
  const rows = visitors.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const toast = (title: string, icon: "success" | "error" = "success") =>
    Swal.fire({ toast: true, position: "bottom", icon, title, showConfirmButton: false, timer: 2200 });

  const run = useCallback(async (work: () => Promise<unknown>, done: string) => {
    setBusy(true);
    try {
      await work();
      toast(done);
      setReloadKey((k) => k + 1);
    } catch (e) {
      toast((e as Error).message || "Something went wrong", "error");
    } finally {
      setBusy(false);
    }
  }, []);

  const block = async (v: ChatVisitor) => {
    const res = await Swal.fire({
      title: `Block ${displayName(v)}?`,
      html: `Ensis Assist will stop replying to IP <b>${v.ip}</b> until you unblock it.`,
      input: "text",
      inputPlaceholder: "Reason (optional), e.g. spam or abusive messages",
      showCancelButton: true,
      confirmButtonText: "Block IP",
      ...confirmColors,
      confirmButtonColor: "#c62828",
    });
    if (res.isConfirmed) run(() => chatVisitorsApi.block(v.ip, res.value || undefined), `${v.ip} blocked`);
  };

  const unblock = async (v: ChatVisitor) => {
    const res = await Swal.fire({
      title: `Unblock ${displayName(v)}?`,
      html: `Ensis Assist will reply to IP <b>${v.ip}</b> again, and its warnings are reset.`,
      showCancelButton: true,
      confirmButtonText: "Unblock",
      ...confirmColors,
    });
    if (res.isConfirmed) run(() => chatVisitorsApi.unblock(v.ip), `${v.ip} unblocked`);
  };

  const close = async (v: ChatVisitor) => {
    const res = await Swal.fire({
      title: "Close this chat?",
      text: `${displayName(v)}'s chat is closed. If they write again, a new chat starts.`,
      showCancelButton: true,
      confirmButtonText: "Close Chat",
      ...confirmColors,
      confirmButtonColor: ORANGE,
    });
    if (res.isConfirmed) run(() => chatVisitorsApi.close(v.ip), "Chat closed");
  };

  const clear = async (v: ChatVisitor) => {
    const res = await Swal.fire({
      title: "Clear chat?",
      html: `The messages in <b>${displayName(v)}</b>'s chat are cleared. They stay in this list with their name, IP and status.`,
      icon: "question",
      showCancelButton: true,
      showDenyButton: v.chats > 1,
      confirmButtonText: v.chats > 1 ? "Clear Last Chat" : "Clear Chat",
      denyButtonText: "Clear All Chats",
      ...confirmColors,
      confirmButtonColor: ORANGE,
      denyButtonColor: "#b87712",
    });
    if (res.isConfirmed) run(() => chatVisitorsApi.clear(v.ip, "last"), "Chat cleared");
    if (res.isDenied) run(() => chatVisitorsApi.clear(v.ip, "all"), "All chats cleared");
  };

  const remove = async (v: ChatVisitor) => {
    const res = await Swal.fire({
      title: "Delete chat history?",
      html: `Delete <b>${displayName(v)}</b>'s last chat, or every chat from IP <b>${v.ip}</b> (${v.chats} chat${v.chats === 1 ? "" : "s"}). Deleting every chat also removes them from this list. This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      showDenyButton: v.chats > 1,
      confirmButtonText: "Delete Last Chat",
      denyButtonText: "Delete All History",
      ...confirmColors,
      confirmButtonColor: "#c62828",
      denyButtonColor: "#7f1d1d",
    });
    if (res.isConfirmed) run(() => chatVisitorsApi.deleteHistory(v.ip, "last"), "Last chat deleted");
    if (res.isDenied) run(() => chatVisitorsApi.deleteHistory(v.ip, "all"), "Chat history deleted");
  };

  const copyIp = (ip: string) => {
    navigator.clipboard?.writeText(ip).then(() => toast("IP copied"));
  };

  const clearFilters = () => {
    setSearch("");
    setFilter("all");
    setPage(1);
  };

  return (
    <div className={`${typography.pages} min-h-[calc(100vh-100px)] w-full bg-white text-[#18233b]`}>
      <div className="flex min-h-full flex-col px-[18px] pb-[16px] pt-[14px]">
        {/* ── Header ── */}
        <div className="mb-[14px] flex flex-wrap items-start justify-between gap-[10px] border-b-[2px] border-[#293681] pb-[10px]">
          <div>
            <h1 className="text-[19px] font-bold leading-[1.15] tracking-[-0.018em] text-[#263016]">Chat Visitors</h1>
            <p className="mt-0.5 text-[9px] font-medium text-[#6c7587]">
              Everyone Ensis Assist has chatted with — their status, last chat and controls to block, close, clear or delete a chat.
            </p>
          </div>
          <div className="flex items-center gap-[10px]">
            <button
              type="button"
              onClick={reload}
              className="flex h-[30px] items-center gap-[5px] rounded-[6px] border border-[#c9d6ec] bg-[#eef3fb] px-[14px] text-[8.5px] font-semibold text-[#263016] shadow-sm transition hover:bg-[#e2eaf6]"
            >
              <RefreshCw className={`h-[12px] w-[12px] ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
            <Link
              href="/chatbot/conversations"
              className="flex h-[30px] items-center gap-[5px] rounded-[6px] bg-[#D98E16] px-[14px] text-[8.5px] font-semibold text-white shadow-[0_5px_12px_rgba(253,110,21,0.3)] transition hover:bg-[#b87712]"
            >
              Chat Conversations <ArrowRight className="h-[12px] w-[12px]" />
            </Link>
          </div>
        </div>

        {/* ── KPI cards ── */}
        <div className="mb-[12px] grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
          {KPI.map((k) => {
            const Icon = k.icon;
            const active = k.filter && filter === k.filter && k.key !== "all";
            return (
              <button
                key={k.key}
                type="button"
                onClick={() => {
                  if (!k.filter) return;
                  setFilter(k.filter);
                  setPage(1);
                }}
                className={`group relative flex h-[82px] flex-col overflow-hidden rounded-[10px] border p-1.5 !pb-4.5 text-left transition-all hover:translate-y-[-1px] ${
                  active ? "ring-2 ring-[#D98E16]" : ""
                } ${k.filter ? "cursor-pointer" : "cursor-default"}`}
                style={{ background: `linear-gradient(135deg, #ffffff 0%, #ffffff 42%, ${k.tint} 100%)`, borderColor: k.border, boxShadow: RING_SHADOW }}
              >
                <span className="flex items-start gap-1.5">
                  <span className={`grid h-[24px] w-[24px] shrink-0 place-items-center rounded-full bg-white/80 shadow-xs ring-1 ${k.tone}`}>
                    <Icon className="h-3 w-3" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[7px] !font-semibold tracking-[0.01em]" style={{ fontWeight: 600, color: "#0f172a" }}>
                      {k.title}
                    </span>
                    <span className="mt-1 block text-[16px] !font-semibold leading-none tracking-[-0.04em]" style={{ color: k.num, fontWeight: 600 }}>
                      {loading && !visitors.length ? "—" : counts[k.key]}
                    </span>
                  </span>
                </span>
                <span className="absolute bottom-1 left-1.5 right-1.5 flex items-center justify-center gap-1 text-[7px] font-semibold text-[#293957] transition group-hover:text-[#b87712]">
                  {k.footer}
                  {k.filter && <ArrowRight className="h-2.5 w-2.5" />}
                </span>
              </button>
            );
          })}
        </div>

        <div className="grid min-h-0 flex-1 items-start gap-[14px] xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* ── Table ── */}
          <div className="flex min-w-0 flex-col overflow-hidden rounded-[7px] border border-[#e8e5df] bg-white" style={{ boxShadow: RING_SHADOW }}>
            {/* Search + filters */}
            <div className="flex flex-wrap items-center gap-[8px] border-b border-[#f0f0ec] px-[16px] py-[10px]">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-[9px] top-1/2 h-[12px] w-[12px] -translate-y-1/2 text-[#9aa0aa]" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search visitors by name, phone, email, IP or message..."
                  className="h-[30px] w-full rounded-[5px] border border-[#e5e6e2] bg-white pl-[26px] pr-[9px] text-[9.5px] font-medium text-[#414b5e] outline-none placeholder:text-[#9aa0aa] focus:border-[#263016]"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value as VisitorFilter);
                  setPage(1);
                }}
                aria-label="Status"
                className="h-[30px] cursor-pointer rounded-[5px] border border-[#e5e6e2] bg-white px-[9px] text-[9.5px] font-medium text-[#414b5e] outline-none focus:border-[#263016]"
              >
                {FILTER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={clearFilters}
                disabled={!search && filter === "all"}
                className="h-[30px] rounded-[5px] border border-[#e5e6e2] bg-white px-[12px] text-[9.5px] font-semibold text-[#263016] transition hover:border-[#263016] disabled:opacity-40"
              >
                Clear
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] border-collapse text-left">
                <thead>
                  <tr className="h-[32px] border-b border-[#e8e5df] bg-[#263016]">
                    {["S.No", "Visitor", "IP Address", "Status", "Chats", "Last Chat", "Last Activity", "Chat", "Actions"].map((h, i, all) => (
                      <th
                        key={h}
                        className={`whitespace-nowrap px-[12px] py-[6px] text-[7.5px] font-bold uppercase tracking-wide text-white ${i === all.length - 1 ? "text-right" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#f0f0ec]">
                  {loading && !visitors.length ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[10px] text-[#6c7587]">
                        Loading visitors…
                      </td>
                    </tr>
                  ) : error ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[10px] font-semibold text-red-600">
                        {error}
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-[10px] text-[#6c7587]">
                        {search || filter !== "all" ? "No visitors match these filters." : "Nobody has chatted with Ensis Assist yet."}
                      </td>
                    </tr>
                  ) : (
                    rows.map((v, i) => {
                      const isSelected = selected?.ip === v.ip;
                      return (
                        <tr
                          key={v.ip}
                          onClick={() => setSelectedIp(v.ip)}
                          className={`cursor-pointer transition ${isSelected ? "bg-[#fff8f2]" : "hover:bg-slate-50/80"}`}
                        >
                          <td className="px-[12px] py-[8px] text-[8px] font-semibold text-[#6c7587]">{(current - 1) * PER_PAGE + i + 1}</td>
                          <td className="px-[12px] py-[8px]">
                            <span className="flex min-w-[170px] items-center gap-[9px]">
                              <span className={`grid h-[30px] w-[30px] shrink-0 place-items-center rounded-full text-[7.5px] font-bold text-white ${avatarOf(v.ip)}`}>{initials(v)}</span>
                              <span className="min-w-0 leading-tight">
                                <span className="block truncate text-[8px] font-bold text-[#263016]">{displayName(v)}</span>
                                <span className="block truncate text-[7px] text-[#6c7587]">{v.phone || v.email || "No contact shared"}</span>
                              </span>
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-[12px] py-[8px]">
                            <span className="inline-flex items-center rounded-[4px] border border-[#c9d6ec] bg-[#eef3fb] px-[6px] py-[1px] font-mono text-[7.5px] font-semibold text-[#263016]">{v.ip}</span>
                          </td>
                          <td className="whitespace-nowrap px-[12px] py-[8px]">
                            <StatusPill status={v.status} />
                          </td>
                          <td className="px-[12px] py-[8px] text-[8px] font-bold text-[#334155]">{v.chats}</td>
                          <td className="max-w-[240px] px-[12px] py-[8px]" title={v.lastMessage?.content}>
                            <span className="block truncate text-[8px] font-medium text-[#334155]">
                              <span className={`font-bold ${v.lastMessage?.role === "user" ? "text-[#b87712]" : "text-[#1c2410]"}`}>
                                {v.lastMessage ? (v.lastMessage.role === "user" ? "Visitor: " : "Ensis Assist: ") : ""}
                              </span>
                              {v.lastMessage?.content || (v.clearedAt ? <i className="text-[#6c7587]">Chat cleared</i> : "—")}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-[12px] py-[8px]">
                            <span className="block text-[7.5px] font-semibold text-[#334155]">{fmt(v.lastAt)}</span>
                            <span className="block text-[7px] text-[#6c7587]">{ago(v.lastAt)}</span>
                          </td>
                          <td className="whitespace-nowrap px-[12px] py-[8px]">
                            <ChatPill open={v.chatOpen} />
                          </td>
                          <td className="px-[12px] py-[8px]" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                title="View chat"
                                onClick={() => setSelectedIp(v.ip)}
                                className={`${iconBtn} border-[#263016]/25 bg-[#263016]/10 text-[#263016] shadow-[0_2px_6px_rgba(10,43,94,0.12)] hover:bg-[#263016]/20`}
                              >
                                <Eye className="h-[12px] w-[12px]" />
                              </button>
                              {v.status === "blocked" ? (
                                <button
                                  type="button"
                                  title="Unblock IP"
                                  disabled={busy}
                                  onClick={() => unblock(v)}
                                  className={`${iconBtn} border-emerald-400/30 bg-emerald-500/10 text-emerald-600 shadow-[0_2px_6px_rgba(16,185,129,0.12)] hover:bg-emerald-500/20`}
                                >
                                  <ShieldCheck className="h-[12px] w-[12px]" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  title="Block IP"
                                  disabled={busy}
                                  onClick={() => block(v)}
                                  className={`${iconBtn} border-red-400/30 bg-red-500/10 text-red-600 shadow-[0_2px_6px_rgba(220,38,38,0.12)] hover:bg-red-500/20`}
                                >
                                  <ShieldBan className="h-[12px] w-[12px]" />
                                </button>
                              )}
                              <button
                                type="button"
                                title={v.chatOpen ? "Close chat" : "Chat already closed"}
                                disabled={busy || !v.chatOpen}
                                onClick={() => close(v)}
                                className={`${iconBtn} border-orange-400/30 bg-orange-500/10 text-orange-600 shadow-[0_2px_6px_rgba(249,115,22,0.12)] hover:bg-orange-500/20`}
                              >
                                <MessageSquareX className="h-[12px] w-[12px]" />
                              </button>
                              <button
                                type="button"
                                title="Clear chat (visitor stays in the list)"
                                disabled={busy || v.messages === 0}
                                onClick={() => clear(v)}
                                className={`${iconBtn} border-[#1c2410]/25 bg-[#1c2410]/10 text-[#1c2410] shadow-[0_2px_6px_rgba(19,70,152,0.12)] hover:bg-[#1c2410]/20`}
                              >
                                <Eraser className="h-[12px] w-[12px]" />
                              </button>
                              <button
                                type="button"
                                title="Delete chat history"
                                disabled={busy}
                                onClick={() => remove(v)}
                                className={`${iconBtn} border-red-400/30 bg-red-500/10 text-red-600 shadow-[0_2px_6px_rgba(220,38,38,0.12)] hover:bg-red-500/20`}
                              >
                                <Trash2 className="h-[12px] w-[12px]" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e8e5df] bg-[#fafafa] px-[12px] py-[8px] text-[8px]">
              <span className="font-semibold text-[#5f6a7c]">
                Total Visitors: {visitors.length}
                {visitors.length > 0 && ` (Showing ${(current - 1) * PER_PAGE + 1}–${Math.min(current * PER_PAGE, visitors.length)} of ${visitors.length})`}
              </span>
              <div className="flex items-center gap-[4px]">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, current - 1))}
                  disabled={current === 1}
                  aria-label="Previous page"
                  className="flex h-[22px] w-[22px] items-center justify-center rounded-[4px] border border-[#d8dce2] bg-white text-[#334155] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`flex h-[22px] min-w-[22px] items-center justify-center rounded-[4px] border px-1.5 text-[8px] font-bold transition ${
                      n === current ? "border-[#263016] bg-[#263016] text-white" : "border-[#d8dce2] bg-white text-[#334155] hover:bg-slate-50"
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage(Math.min(pageCount, current + 1))}
                  disabled={current === pageCount}
                  aria-label="Next page"
                  className="flex h-[22px] w-[22px] items-center justify-center rounded-[4px] border border-[#d8dce2] bg-white text-[#334155] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
                <span className="ml-[6px] font-semibold text-[#5f6a7c]">{PER_PAGE} / page</span>
              </div>
            </div>
          </div>

          {/* ── Visitor details ── */}
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-[7px] border border-[#e8e5df] bg-white xl:sticky xl:top-2" style={{ boxShadow: RING_SHADOW }}>
            <div className="flex h-[38px] shrink-0 items-center justify-between border-b border-[#e8e5df] bg-[#fafafa] px-[14px]">
              <h2 className="text-[10px] font-bold uppercase tracking-wide text-[#263016]">Visitor Details</h2>
              {detailLoading && <RefreshCw className="h-[12px] w-[12px] animate-spin text-[#6c7587]" />}
            </div>

            {!selected ? (
              <p className="px-[14px] py-[24px] text-center text-[9px] text-[#6c7587]">Select a visitor to see their chat.</p>
            ) : (
              <>
                <div className="flex items-center gap-[10px] px-[14px] pt-[12px]">
                  <span className={`grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full text-[9px] font-bold text-white ${avatarOf(selected.ip)}`}>{initials(selected)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[9.5px] font-bold text-[#263016]">{displayName(selected)}</p>
                    <button
                      type="button"
                      onClick={() => copyIp(selected.ip)}
                      title="Copy IP"
                      className="mt-[2px] inline-flex items-center gap-[4px] rounded-[4px] border border-[#c9d6ec] bg-[#eef3fb] px-[6px] py-[1px] font-mono text-[7.5px] font-semibold text-[#263016] hover:bg-[#e2eaf6]"
                    >
                      {selected.ip} <Copy className="h-[10px] w-[10px]" />
                    </button>
                  </div>
                  <div className="flex flex-col items-end gap-[4px]">
                    <StatusPill status={selected.status} />
                    <ChatPill open={selected.chatOpen} />
                  </div>
                </div>

                <dl className="mx-[14px] mt-[10px] grid grid-cols-2 gap-[6px]">
                  {(
                    [
                      [Phone, "Phone", selected.phone || "—"],
                      [Mail, "Email", selected.email || "—"],
                      [MessagesSquare, "Chats", `${selected.chats} chat${selected.chats === 1 ? "" : "s"} · ${selected.messages} msgs`],
                      [Globe, "Language", selected.language === "en" ? "English" : "हिंदी"],
                      [CalendarClock, "First Seen", fmt(selected.firstAt)],
                      [CalendarClock, "Last Chat", fmt(selected.lastAt)],
                    ] as [LucideIcon, string, string][]
                  ).map(([Icon, label, value]) => (
                    <div key={label} className="min-w-0 rounded-[4px] border border-[#e4e7eb] bg-[#f8fafc] px-[8px] py-[5px]">
                      <dt className="flex items-center gap-1 text-[7px] font-bold uppercase tracking-wide text-[#94a3b8]">
                        <Icon className="h-2.5 w-2.5" /> {label}
                      </dt>
                      <dd className="mt-[1px] truncate text-[7.5px] font-semibold text-[#18233b]" title={value}>
                        {value}
                      </dd>
                    </div>
                  ))}
                  <div className="col-span-2 min-w-0 rounded-[4px] border border-[#e4e7eb] bg-[#f8fafc] px-[8px] py-[5px]">
                    <dt className="flex items-center gap-1 text-[7px] font-bold uppercase tracking-wide text-[#94a3b8]">
                      <MonitorSmartphone className="h-2.5 w-2.5" /> Device
                    </dt>
                    <dd className="mt-[1px] truncate text-[7.5px] font-semibold text-[#18233b]" title={selected.userAgent}>
                      {selected.userAgent || "—"}
                    </dd>
                  </div>
                  {selected.status === "blocked" && (
                    <div className="col-span-2 rounded-[4px] border border-[#ef9a9a] bg-[#ffebee] px-[8px] py-[5px] text-[7.5px] font-semibold text-[#c62828]">
                      Blocked{selected.blockedBy ? ` by ${selected.blockedBy}` : ""}
                      {selected.blockReason ? ` — ${selected.blockReason}` : ""}
                      {selected.blockedForever ? " · until unblocked" : selected.blockedUntil ? ` · until ${fmt(selected.blockedUntil)}` : ""}
                    </div>
                  )}
                </dl>

                {/* Chat history */}
                <p className="mx-[14px] mt-[12px] text-[7.5px] font-bold uppercase tracking-wide text-[#263016]">Chat History</p>
                <div className="mx-[14px] mt-[6px] max-h-[360px] min-h-[120px] overflow-y-auto rounded-[8px] border border-[#e3e9f3] bg-[#f4f7fb] p-[8px]">
                  {!detail || detail.ip !== selected.ip ? (
                    <p className="py-[20px] text-center text-[8px] text-[#6c7587]">{detailLoading ? "Loading chat…" : "No messages."}</p>
                  ) : (
                    detail.chats.map((c) => (
                      <div key={c._id} className="mb-[10px] last:mb-0">
                        <div className="mb-[6px] flex items-center gap-[6px]">
                          <span className="h-px flex-1 bg-[#d5deee]" />
                          <span className="text-[7px] font-semibold text-[#6c7587]">
                            {fmt(c.createdAt)} {c.closed && <b className="text-[#475569]">· Closed{c.closedBy ? ` by ${c.closedBy}` : ""}</b>}
                          </span>
                          <span className="h-px flex-1 bg-[#d5deee]" />
                        </div>
                        <div className="space-y-[5px]">
                          {c.messages.map((m, i) =>
                            m.role === "user" ? (
                              <div key={i} className="flex justify-end">
                                <p className="max-w-[85%] whitespace-pre-line rounded-[12px] rounded-tr-[4px] bg-gradient-to-br from-[#1c2410] to-[#263016] px-[9px] py-[5px] text-[7.5px] leading-snug text-white">
                                  {m.content}
                                </p>
                              </div>
                            ) : (
                              <div key={i} className="flex justify-start">
                                <p className="max-w-[85%] whitespace-pre-line rounded-[12px] rounded-tl-[4px] bg-white px-[9px] py-[5px] text-[7.5px] leading-snug text-[#1f2d44] shadow-[0_1px_3px_rgba(10,30,74,0.10)]">
                                  {m.content}
                                </p>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Controls */}
                <div className="mt-[12px] grid grid-cols-2 gap-[6px] border-t border-[#e8e5df] bg-[#fafafa] px-[14px] py-[10px]">
                  {selected.status === "blocked" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => unblock(selected)}
                      className="flex h-[30px] items-center justify-center gap-[5px] rounded-[6px] border border-[#a5d6a7] bg-[#e8f5e9] text-[8.5px] font-semibold text-[#23714a] transition hover:bg-[#d7efda] disabled:opacity-50"
                    >
                      <ShieldCheck className="h-[12px] w-[12px]" /> Unblock IP
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => block(selected)}
                      className="flex h-[30px] items-center justify-center gap-[5px] rounded-[6px] border border-[#ef9a9a] bg-[#ffebee] text-[8.5px] font-semibold text-[#c62828] transition hover:bg-[#ffdde2] disabled:opacity-50"
                    >
                      <ShieldBan className="h-[12px] w-[12px]" /> Block IP
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy || !selected.chatOpen}
                    onClick={() => close(selected)}
                    className="flex h-[30px] items-center justify-center gap-[5px] rounded-[6px] border border-[#fdc89c] bg-[#faf7f2] text-[8.5px] font-semibold text-[#b87712] transition hover:bg-[#ffe8d5] disabled:opacity-50"
                  >
                    <MessageSquareX className="h-[12px] w-[12px]" /> {selected.chatOpen ? "Close Chat" : "Chat Closed"}
                  </button>
                  <button
                    type="button"
                    disabled={busy || selected.messages === 0}
                    onClick={() => clear(selected)}
                    className="flex h-[30px] items-center justify-center gap-[5px] rounded-[6px] border border-[#c9d6ec] bg-[#eef3fb] text-[8.5px] font-semibold text-[#263016] transition hover:bg-[#e2eaf6] disabled:opacity-50"
                  >
                    <Eraser className="h-[12px] w-[12px]" /> Clear Chat
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => remove(selected)}
                    className="flex h-[30px] items-center justify-center gap-[5px] rounded-[6px] bg-[#263016] text-[8.5px] font-semibold text-white shadow-[0_5px_12px_rgba(10,43,94,0.25)] transition hover:bg-[#081f45] disabled:opacity-50"
                  >
                    <Trash2 className="h-[12px] w-[12px]" /> Delete History
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
