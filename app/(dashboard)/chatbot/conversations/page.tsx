"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Ban,
  Bot,
  CalendarClock,
  Check,
  CheckCheck,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  Headset,
  Inbox,
  Info,
  Loader2,
  Lock,
  Mail,
  MessageCircle,
  MessageCircleQuestion,
  MessagesSquare,
  Phone,
  RefreshCw,
  Search,
  Send,
  UserRound,
  Smile,
  Paperclip,
  X,
  FileSpreadsheet,
  FileArchive,
  Presentation,
  Download,
} from "lucide-react";
import typography from "../../pages/PagesTypography.module.css";
import DateRangeFilter, { rangeLabel, resolveRange, type DateRange } from "@/components/chatbot/DateRangeFilter";
import { avatarColor, dayLabel, formatDateTime, formatTime, MessageText, pagePath, timeAgo, whatsappLink } from "@/components/chatbot/chatbotUtils";
import { chatbotApi, type ChatDetail, type ChatFile, type ChatMessage, type ChatSummary } from "@/lib/chatbotApi";

const PAGE_SIZE = 30;
// The open chat and the list check for new messages this often (only while this tab is in view)
const DETAIL_POLL_MS = 4000;
const LIST_POLL_MS = 12000;
// Wrote within this long: shown as online (green dot, top of Recent Chats)
const ONLINE_MS = 10 * 60 * 1000;
const RECENT_COUNT = 12;
// Wallpaper behind the transcript: Ensis architectural wellness sketch
const DOODLE = { backgroundColor: "#f9f8f5", backgroundImage: "url(/assets/chatbot/bg.webp)", backgroundSize: "cover", backgroundPosition: "bottom" };

// Emoji picker in the reply box
const EMOJIS = [
  "😊", "😀", "😄", "😁", "🙂", "😉", "😍", "🤩", "😇", "🤗", "🤔", "😅",
  "😂", "🙏", "👍", "👌", "👏", "🙌", "💪", "🤝", "👋", "✌️", "👉", "☝️",
  "❤️", "🧡", "💙", "💚", "⭐", "✨", "🔥", "🎉", "✅", "☑️", "❌", "⚠️",
  "📞", "📱", "📧", "📍", "🗓️", "⏰", "📄", "📎", "📷", "🏠", "🏢", "🛋️",
  "🪑", "🛏️", "🚪", "🪟", "💡", "🖼️", "🪴", "🎨", "📐", "📏", "🛠️", "💰",
];
// What can be attached (the backend checks the same list)
const ATTACH_ACCEPT = "image/jpeg,image/png,image/webp,image/gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip";
const MAX_ATTACHMENT_MB = 25;

const fileSize = (bytes?: number) =>
  !bytes ? "" : bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
const isImageFile = (file: { type?: string; label?: string; name?: string }) =>
  (file.type || "").startsWith("image/") || /\.(jpe?g|png|webp|gif)$/i.test(file.label || file.name || "");

type ListFilter = "all" | "live" | "leads";
type Chat = ChatSummary | ChatDetail;

const isLive = (chat?: { agent?: { active: boolean } } | null) => Boolean(chat?.agent?.active);
const hasLead = (chat: ChatSummary) => Boolean(chat.lead?.phone || chat.lead?.email);
// The name the visitor gave; without one, their IP stands in for it
const nameOf = (chat: Chat) => chat.lead?.name?.trim() || "";
const titleOf = (chat: Chat) => nameOf(chat) || chat.visitor?.ip || "Visitor";
const shortOf = (chat: Chat) => nameOf(chat).split(/\s+/)[0] || chat.visitor?.ip || "Visitor";
// "Rahul Kumar Sharma" → "RS": first and last name
const firstLast = (name: string) => {
  const parts = name.split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
};
// "Today, 5 Nov" over each day of the transcript
const dayTitle = (value: string) => {
  const label = dayLabel(value);
  return label === "Today" || label === "Yesterday" ? `${label}, ${new Date(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : label;
};

export default function ChatbotConversationsPage() {
  return (
    <Suspense fallback={null}>
      <Conversations />
    </Suspense>
  );
}

function Conversations() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedId = searchParams.get("id");

  const [range, setRange] = useState<DateRange>({ key: "all" });
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [filter, setFilter] = useState<ListFilter>("all");
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  // When the list was last loaded: "online" is measured from it
  const [listAt, setListAt] = useState(0);

  const [loadedDetail, setLoadedDetail] = useState<{ key: string; chat: ChatDetail | null } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [draft, setDraft] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftRef = useRef<HTMLTextAreaElement>(null);
  // Preview of a photo about to be sent
  const attachmentPreview = useMemo(() => (attachment && isImageFile(attachment) ? URL.createObjectURL(attachment) : null), [attachment]);
  useEffect(() => () => {
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
  }, [attachmentPreview]);
  const [busy, setBusy] = useState<null | "takeover" | "release" | "reply">(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const scrolledRef = useRef<{ id?: string; count: number }>({ count: 0 });
  const scrollDownRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Loading = the list on screen is not for the current filter / page yet
  const listKey = JSON.stringify([range, debounced, page, reloadKey]);
  const [loadedListKey, setLoadedListKey] = useState<string | null>(null);
  const loading = loadedListKey !== listKey;

  // Conversation list (first page replaces, "Load more" appends)
  useEffect(() => {
    let cancelled = false;
    chatbotApi
      .list({ ...resolveRange(range), search: debounced, page, limit: PAGE_SIZE }, true)
      .then((res) => {
        if (cancelled) return;
        setChats((prev) => (page === 1 ? res.chats : [...prev, ...res.chats]));
        setTotal(res.total);
        setListAt(Date.now());
        setError(null);
      })
      .catch((e: Error) => !cancelled && setError(e.message || "Could not load conversations"))
      .finally(() => !cancelled && setLoadedListKey(listKey));
    return () => {
      cancelled = true;
    };
  }, [range, debounced, page, listKey]);

  // The first page refreshes quietly, so new chats and new messages show up without clicking refresh
  const refreshList = useCallback(() => {
    if (page !== 1) return Promise.resolve();
    return chatbotApi
      .list({ ...resolveRange(range), search: debounced, page: 1, limit: PAGE_SIZE }, true)
      .then((res) => {
        setChats(res.chats);
        setTotal(res.total);
        setListAt(Date.now());
      })
      .catch(() => undefined);
  }, [page, range, debounced]);

  useEffect(() => {
    const timer = setInterval(() => !document.hidden && void refreshList(), LIST_POLL_MS);
    return () => clearInterval(timer);
  }, [refreshList]);

  // Selected conversation
  const detailKey = selectedId ? `${selectedId}:${reloadKey}` : null;
  useEffect(() => {
    if (!selectedId || !detailKey) return;
    let cancelled = false;
    chatbotApi
      .get(selectedId, true)
      .then((d) => !cancelled && setLoadedDetail({ key: detailKey, chat: d }))
      .catch(() => !cancelled && setLoadedDetail({ key: detailKey, chat: null }));
    return () => {
      cancelled = true;
    };
  }, [selectedId, detailKey]);

  // The open chat checks for the visitor's new messages every few seconds
  useEffect(() => {
    if (!selectedId || !detailKey) return;
    const timer = setInterval(() => {
      if (document.hidden) return;
      chatbotApi
        .get(selectedId, true)
        .then((d) => setLoadedDetail((prev) => (prev?.key === detailKey ? { key: detailKey, chat: d } : prev)))
        .catch(() => undefined);
    }, DETAIL_POLL_MS);
    return () => clearInterval(timer);
  }, [selectedId, detailKey]);

  // Keep showing the current chat while it refreshes; switch only once the new one arrives
  const detailLoading = !!detailKey && loadedDetail?.key !== detailKey;
  const detail = selectedId && loadedDetail?.chat?._id === selectedId ? loadedDetail.chat : detailLoading ? null : (loadedDetail?.chat ?? null);
  const live = isLive(detail);

  // Scroll to the newest message when a chat opens, after sending, or when a message arrives while you're at the bottom
  useEffect(() => {
    const el = transcriptRef.current;
    if (!el || !detail) return;
    const before = scrolledRef.current;
    const count = detail.messages.length;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 260;
    if (before.id !== detail._id || scrollDownRef.current || (count !== before.count && nearBottom)) {
      el.scrollTop = el.scrollHeight;
    }
    scrollDownRef.current = false;
    scrolledRef.current = { id: detail._id, count };
  }, [detail]);

  const resetList = (fn: () => void) => {
    fn();
    setPage(1);
  };

  const select = (id: string | null) => {
    setDraft("");
    setAttachment(null);
    setEmojiOpen(false);
    setActionError(null);
    router.replace(id ? `/chatbot/conversations?id=${id}` : "/chatbot/conversations", { scroll: false });
  };

  const copy = (key: string, value?: string) => {
    if (!value) return;
    navigator.clipboard?.writeText(value).catch(() => undefined);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  /* ── Live chat: take the chat over from Ensis Assist, write to the visitor, hand it back ── */
  const runAction = async (kind: "takeover" | "release" | "reply", action: () => Promise<ChatDetail>) => {
    if (!detailKey) return false;
    setBusy(kind);
    setActionError(null);
    try {
      const updated = await action();
      scrollDownRef.current = true;
      setLoadedDetail({ key: detailKey, chat: updated });
      void refreshList();
      return true;
    } catch (e) {
      setActionError((e as Error).message || "That didn't work. Please try again.");
      return false;
    } finally {
      setBusy(null);
    }
  };

  const takeOver = () => detail && void runAction("takeover", () => chatbotApi.takeover(detail._id));
  const handBack = () => detail && void runAction("release", () => chatbotApi.release(detail._id));

  // Writing while Ensis Assist still has the chat takes it over first. A file goes with the text as its caption.
  const sendReply = async (e?: FormEvent) => {
    e?.preventDefault();
    const text = draft.trim();
    const file = attachment;
    if ((!text && !file) || !detail || detail.closed || busy) return;
    setDraft("");
    setAttachment(null);
    setEmojiOpen(false);
    const wasLive = live;
    const sent = await runAction("reply", async () => {
      if (!wasLive) await chatbotApi.takeover(detail._id);
      return file ? chatbotApi.attach(detail._id, file, text) : chatbotApi.reply(detail._id, text);
    });
    if (!sent) {
      setDraft(text);
      setAttachment(file);
    }
  };

  const pickFile = (file?: File) => {
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_MB * 1024 * 1024) {
      setActionError(`The file must be ${MAX_ATTACHMENT_MB} MB or smaller`);
      return;
    }
    setActionError(null);
    setAttachment(file);
    draftRef.current?.focus();
  };

  // The emoji goes where the cursor is
  const addEmoji = (emoji: string) => {
    const el = draftRef.current;
    const start = el?.selectionStart ?? draft.length;
    const end = el?.selectionEnd ?? draft.length;
    setDraft(draft.slice(0, start) + emoji + draft.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

  // Enter sends, Shift+Enter starts a new line
  const onDraftKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void sendReply();
    }
  };

  // The transcript by day, and within a day the runs of messages from the same person
  const days = useMemo(() => {
    const out: { day: string; first: string; blocks: Block[] }[] = [];
    for (const m of detail?.messages ?? []) {
      const day = new Date(m.createdAt).toDateString();
      if (!out.length || out[out.length - 1].day !== day) out.push({ day, first: m.createdAt, blocks: [] });
      const blocks = out[out.length - 1].blocks;
      const last = blocks[blocks.length - 1];
      if (m.event) blocks.push({ kind: "event", message: m });
      else if (last?.kind === "messages" && last.role === m.role && last.by === m.by) last.items.push(m);
      else blocks.push({ kind: "messages", role: m.role, by: m.by, items: [m] });
    }
    return out;
  }, [detail]);

  const isOnline = (chat: ChatSummary) => listAt > 0 && listAt - new Date(chat.updatedAt).getTime() < ONLINE_MS;
  const questionCount = detail?.messages.filter((m) => m.role === "user").length ?? 0;
  // "Online" while the visitor wrote in the last few minutes, else when they were last seen
  const lastVisitorAt = [...(detail?.messages ?? [])].reverse().find((m) => m.role === "user")?.createdAt;
  const visitorOnline = !!lastVisitorAt && listAt > 0 && listAt - new Date(lastVisitorAt).getTime() < ONLINE_MS;

  const counts = { all: chats.length, live: chats.filter(isLive).length, leads: chats.filter(hasLead).length };
  const shown = filter === "live" ? chats.filter(isLive) : filter === "leads" ? chats.filter(hasLead) : chats;
  // Recent Chats: whoever is chatting right now first, then the latest chats
  const recent = [...chats].sort((a, b) => Number(isOnline(b)) - Number(isOnline(a))).slice(0, RECENT_COUNT);

  return (
    <div className={`${typography.pages} min-h-[calc(100vh-100px)] w-full bg-white text-[#18233b]`}>
      <div className="flex min-h-full flex-col px-[18px] pb-[16px] pt-[14px]">
        {/* PAGE HEADER */}
        <div className="mb-[12px] flex flex-wrap items-end justify-between gap-[10px] border-b-[2px] border-[#293681] pb-[10px]">
          <div className="flex items-center gap-[10px]">
            <div className="grid h-[38px] w-[38px] place-items-center rounded-[10px] bg-gradient-to-br from-[#263016] to-[#1c2410] text-white shadow-[0_6px_14px_-4px_rgba(10,43,94,0.45)] ring-2 ring-[#D98E16]/40">
              <MessagesSquare className="h-[19px] w-[19px]" />
            </div>
            <div>
              <h1 className="text-[19px] font-bold leading-[1.15] tracking-[-0.018em] text-[#263016]">Chat Conversations</h1>
              <p className="mt-0.5 text-[9px] font-medium text-[#6c7587]">
                Every Ensis Assist chat with the visitor&apos;s details · <span className="font-semibold text-[#b87712]">{rangeLabel(range)}</span> ·{" "}
                {total} {total === 1 ? "chat" : "chats"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-[8px]">
            <DateRangeFilter value={range} onChange={(r) => resetList(() => setRange(r))} />
            <button
              type="button"
              onClick={() => resetList(() => setReloadKey((k) => k + 1))}
              aria-label="Refresh"
              className="grid h-[28px] w-[28px] place-items-center rounded-[6px] border border-[#e5e6e2] text-[#4b5563] transition hover:border-[#D98E16] hover:text-[#b87712]"
            >
              <RefreshCw className={`h-[13px] w-[13px] ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-[10px] rounded-[7px] border border-red-200 bg-red-50 px-[12px] py-[8px] text-[10px] font-medium text-red-700">{error}</div>
        )}

        {/* TWO-PANE CHAT */}
        <div
          className="flex h-[calc(100vh-190px)] min-h-[520px] overflow-hidden rounded-[8px] border border-[#e3e8ef] bg-white"
          style={{ boxShadow: "rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px" }}
        >
          {/* ── LEFT: chats ── */}
          <aside className={`w-full shrink-0 flex-col border-r border-[#e6ebf2] bg-white md:flex md:w-[350px] ${selectedId ? "hidden" : "flex"}`}>
            <div className="px-[16px] pb-[10px] pt-[16px]">
              <div className="mb-[12px] flex items-center justify-between">
                <h2 className="text-[17px] font-bold tracking-[-0.01em] text-[#263016]">Chats</h2>
                <span className="grid h-[26px] min-w-[26px] place-items-center rounded-full bg-[#263016] px-[8px] text-[10px] font-bold text-white shadow-[0_4px_10px_-3px_rgba(10,43,94,0.5)]">
                  {total}
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => resetList(() => setSearch(e.target.value))}
                  placeholder="Search name, IP, phone or message"
                  className="h-[40px] w-full rounded-[10px] border border-[#e6ebf2] bg-white pl-[14px] pr-[36px] text-[10.5px] font-medium text-[#1e293b] shadow-[0_1px_2px_rgba(10,30,74,0.04)] outline-none transition placeholder:text-[#94a3b8] focus:border-[#1c2410]/40 focus:ring-2 focus:ring-[#1c2410]/10"
                />
                <Search className="pointer-events-none absolute right-[13px] top-1/2 h-[14px] w-[14px] -translate-y-1/2 text-[#64748b]" />
              </div>

              <div className="mt-[12px] flex gap-[7px]">
                {(
                  [
                    ["all", "All"],
                    ["live", "Live"],
                    ["leads", "Leads"],
                  ] as [ListFilter, string][]
                ).map(([key, label]) => {
                  const on = filter === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFilter(key)}
                      aria-pressed={on}
                      className={`flex h-[27px] items-center gap-[5px] rounded-full border px-[11px] text-[9px] font-semibold transition ${
                        on
                          ? "border-[#263016] bg-[#263016] text-white shadow-[0_4px_10px_-4px_rgba(10,43,94,0.6)]"
                          : "border-[#e2e8f0] bg-white text-[#475569] hover:border-[#1c2410]/40"
                      }`}
                    >
                      {label}
                      {counts[key] > 0 && (
                        <span
                          className={`grid h-[14px] min-w-[14px] place-items-center rounded-full px-[3px] text-[7.5px] font-bold ${
                            on ? "bg-white text-[#263016]" : key === "live" ? "bg-[#22c55e] text-white" : "bg-[#D98E16] text-white"
                          }`}
                        >
                          {counts[key]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-[16px] pb-[14px]">
              {/* Recent Chats: who is chatting with Ensis Assist right now */}
              {recent.length > 0 && filter === "all" && !debounced && (
                <div className="mb-[14px] rounded-[12px] bg-gradient-to-br from-[#eef3fb] to-[#faf7f2] px-[10px] pb-[8px] pt-[10px]">
                  <div className="mb-[8px] flex items-center justify-between">
                    <p className="text-[11px] font-bold text-[#263016]">Recent Chats</p>
                    {recent.some(isOnline) && (
                      <span className="flex items-center gap-[5px] text-[8.5px] font-semibold text-[#15803d]">
                        <span className="h-[6px] w-[6px] animate-pulse rounded-full bg-[#22c55e]" />
                        {recent.filter(isOnline).length} online
                      </span>
                    )}
                  </div>
                  <div className="-mx-[4px] flex gap-[6px] overflow-x-auto px-[4px] pb-[4px] [scrollbar-width:none]">
                    {recent.map((c, i) => (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => select(c._id)}
                        title={titleOf(c)}
                        className="flex w-[52px] shrink-0 flex-col items-center gap-[4px] rounded-[10px] py-[4px] transition hover:bg-white/70"
                      >
                        <Avatar chat={c} size={40} online={isOnline(c)} ring={c._id === selectedId} color={RECENT_COLORS[i % RECENT_COLORS.length]} />
                        <span className={`w-full truncate text-center text-[8.5px] ${c._id === selectedId ? "font-bold text-[#263016]" : "font-medium text-[#475569]"}`}>{shortOf(c)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="mb-[8px] text-[9px] font-bold uppercase tracking-[0.1em] text-[#64748b]">
                {filter === "live" ? "Live chats" : filter === "leads" ? "Leads" : "All chats"}
              </p>

              {!loading && shown.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-[8px] rounded-[12px] bg-white p-[24px] text-center">
                  <Inbox className="h-[26px] w-[26px] text-[#cbd5e1]" />
                  <p className="text-[10px] font-semibold text-[#6c7587]">{filter === "live" ? "No live chats right now" : "No conversations found"}</p>
                  <p className="text-[8.5px] text-[#9aa0aa]">{filter === "live" ? "Open a chat and take it over to talk to the visitor." : "Try another date range or search."}</p>
                </div>
              ) : (
                <div className="flex flex-col gap-[7px]">
                  {shown.map((c) => (
                    <ChatCard key={c._id} chat={c} active={c._id === selectedId} online={isOnline(c)} onSelect={() => select(c._id)} />
                  ))}
                </div>
              )}

              {loading && (
                <div className="flex items-center justify-center gap-2 py-[14px] text-[9px] text-[#6c7587]">
                  <Loader2 className="h-[14px] w-[14px] animate-spin" /> Loading...
                </div>
              )}
              {!loading && chats.length < total && (
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  className="mt-[10px] w-full rounded-[10px] bg-white py-[10px] text-[9.5px] font-bold text-[#b87712] shadow-[0_1px_3px_rgba(10,30,74,0.08)] hover:bg-[#faf7f2]"
                >
                  Load more ({total - chats.length} more)
                </button>
              )}
            </div>
          </aside>

          {/* ── RIGHT: the conversation ── */}
          <section className={`min-w-0 flex-1 flex-col bg-white ${selectedId ? "flex" : "hidden md:flex"}`}>
            {!selectedId ? (
              <div className="flex h-full flex-col items-center justify-center gap-[10px] p-[24px] text-center" style={DOODLE}>
                <div className="grid h-[80px] w-[80px] place-items-center rounded-full bg-white shadow-[0_8px_20px_-8px_rgba(10,43,94,0.35)] ring-2 ring-[#D98E16]/50">
                  <Image src="/ensis-logo.webp" alt="Ensis" width={46} height={46} className="h-[44px] w-[44px] object-contain" />
                </div>
                <p className="text-[14px] font-bold text-[#263016]">Select a conversation</p>
                <p className="max-w-[320px] rounded-[10px] bg-white/90 px-[12px] py-[7px] text-[9.5px] text-[#64748b]">
                  Choose a chat on the left to read it. You can take any chat over from Ensis Assist and talk to the visitor yourself.
                </p>
              </div>
            ) : detailLoading && !detail ? (
              <div className="flex h-full items-center justify-center gap-2 text-[10px] text-[#6c7587]">
                <Loader2 className="h-[16px] w-[16px] animate-spin" /> Loading conversation...
              </div>
            ) : !detail ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <p className="text-[11px] font-semibold text-[#6c7587]">Conversation not found</p>
                <button type="button" onClick={() => select(null)} className="text-[9px] font-bold text-[#b87712] hover:underline">
                  Back to list
                </button>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center gap-[10px] border-b border-[#e3e9f2] bg-white px-[16px] py-[7px]">
                  <button
                    type="button"
                    onClick={() => select(null)}
                    aria-label="Back to list"
                    className="grid h-[30px] w-[30px] place-items-center rounded-full text-[#475569] hover:bg-[#f1f5f9] md:hidden"
                  >
                    <ArrowLeft className="h-[15px] w-[15px]" />
                  </button>
                  <Avatar chat={detail} size={38} online={visitorOnline} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] font-bold leading-tight text-[#263016]">{titleOf(detail)}</p>
                    <div className="mt-[2px] flex flex-wrap items-center gap-[6px] text-[9px]">
                      {visitorOnline ? (
                        <span className="font-semibold text-[#16a34a]">Online</span>
                      ) : (
                        <span className="text-[#64748b]">{lastVisitorAt ? `Last seen ${timeAgo(lastVisitorAt).toLowerCase()}` : "Hasn't written yet"}</span>
                      )}
                      {live ? (
                        <Chip tone="green" icon={<Headset className="h-[10px] w-[10px]" />}>Live with team</Chip>
                      ) : detail.closed ? (
                        <Chip tone="grey" icon={<Lock className="h-[10px] w-[10px]" />}>Closed</Chip>
                      ) : (
                        <Chip tone="blue" icon={<Bot className="h-[10px] w-[10px]" />}>Ensis Assist</Chip>
                      )}
                      {nameOf(detail) && detail.visitor?.ip && <Chip tone="grey" icon={<Globe className="h-[10px] w-[10px]" />}>{detail.visitor.ip}</Chip>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-[2px]">
                    {detail.lead?.phone && (
                      <>
                        <HeaderIcon href={`tel:${detail.lead.phone}`} label="Call">
                          <Phone className="h-[16px] w-[16px]" />
                        </HeaderIcon>
                        <HeaderIcon href={whatsappLink(detail.lead.phone)} label="WhatsApp" external tone="green">
                          <MessageCircle className="h-[16px] w-[16px]" />
                        </HeaderIcon>
                      </>
                    )}
                    {detail.lead?.email && (
                      <HeaderIcon href={`mailto:${detail.lead.email}`} label="Email">
                        <Mail className="h-[16px] w-[16px]" />
                      </HeaderIcon>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowInfo((v) => !v)}
                      aria-label="Visitor details"
                      aria-pressed={showInfo}
                      title="Visitor details"
                      className={`grid h-[30px] w-[30px] place-items-center rounded-full transition ${showInfo ? "bg-[#eef3fb] text-[#1c2410]" : "text-[#475569] hover:bg-[#f1f5f9]"}`}
                    >
                      <Info className="h-[16px] w-[16px]" />
                    </button>
                  </div>
                </div>

                {/* Visitor details (ⓘ) */}
                {showInfo && (
                  <div className="flex flex-wrap gap-[6px] border-b border-[#eef1f5] bg-[#f8fafc] px-[18px] py-[9px]">
                    {detail.lead?.phone && (
                      <DetailCell icon={<Phone className="h-[10px] w-[10px]" />} label="Mobile" tone="blue" onClick={() => copy("phone", detail.lead?.phone)}>
                        {detail.lead.phone}
                        {copied === "phone" ? <Check className="h-[10px] w-[10px] text-[#16a34a]" /> : <Copy className="h-[9px] w-[9px] text-[#94a3b8]" />}
                      </DetailCell>
                    )}
                    {detail.lead?.email && (
                      <DetailCell icon={<Mail className="h-[10px] w-[10px]" />} label="Email" tone="blue" onClick={() => copy("email", detail.lead?.email)}>
                        <span className="max-w-[160px] truncate">{detail.lead.email}</span>
                        {copied === "email" ? <Check className="h-[10px] w-[10px] text-[#16a34a]" /> : <Copy className="h-[9px] w-[9px] text-[#94a3b8]" />}
                      </DetailCell>
                    )}
                    <DetailCell icon={<CalendarClock className="h-[10px] w-[10px]" />} label="Started">
                      {formatDateTime(detail.createdAt)}
                    </DetailCell>
                    <DetailCell icon={<MessageCircleQuestion className="h-[10px] w-[10px]" />} label="Asked" tone="orange">
                      {questionCount} {questionCount === 1 ? "question" : "questions"}
                    </DetailCell>
                    {detail.visitor?.ip && (
                      <DetailCell icon={<Globe className="h-[10px] w-[10px]" />} label="IP address">
                        {detail.visitor.ip}
                      </DetailCell>
                    )}
                    {detail.pageUrl && (
                      <DetailCell icon={<FileText className="h-[10px] w-[10px]" />} label="Page" href={detail.pageUrl}>
                        <span className="max-w-[150px] truncate">{pagePath(detail.pageUrl)}</span>
                        <ExternalLink className="h-[9px] w-[9px] text-[#94a3b8]" />
                      </DetailCell>
                    )}
                    <DetailCell icon={<Send className="h-[10px] w-[10px]" />} label="WhatsApp" tone={detail.whatsappSentAt ? "green" : "grey"}>
                      {detail.whatsappSentAt ? `Sent ${timeAgo(detail.whatsappSentAt)}` : "Not sent"}
                    </DetailCell>
                    {detail.enquiryId && (
                      <Link href="/contact-us">
                        <DetailCell icon={<Inbox className="h-[10px] w-[10px]" />} label="Enquiry" tone="green">
                          Saved in Contact Us
                        </DetailCell>
                      </Link>
                    )}
                    {detail.blocked && (
                      <DetailCell icon={<Ban className="h-[10px] w-[10px]" />} label="Status" tone="red">
                        Blocked for abusive language
                      </DetailCell>
                    )}
                  </div>
                )}

                {/* Who is replying: Ensis Assist, or you (take over / hand back) */}
                <div className="bg-[#eaf0f8] px-[16px] pt-[8px]">
                  {detail.closed ? (
                    <Banner tone="grey" icon={<Lock className="h-[16px] w-[16px]" />} title="This chat was closed" text="The visitor's next message starts a new chat." />
                  ) : live ? (
                    <Banner
                      tone="green"
                      icon={<Headset className="h-[16px] w-[16px]" />}
                      title="You're chatting live"
                      text="Ensis Assist is paused. The visitor sees your messages in their chat window."
                      action={
                        <button
                          type="button"
                          onClick={handBack}
                          disabled={!!busy}
                          className="flex h-[25px] items-center gap-[5px] rounded-[7px] border border-[#15803d]/50 bg-white px-[11px] text-[9.5px] font-bold text-[#15803d] transition hover:bg-[#15803d] hover:text-white disabled:opacity-50"
                        >
                          {busy === "release" ? <Loader2 className="h-[11px] w-[11px] animate-spin" /> : <Bot className="h-[11px] w-[11px]" />}
                          Hand back to Ensis Assist
                        </button>
                      }
                    />
                  ) : (
                    <Banner
                      tone="blue"
                      icon={<Bot className="h-[16px] w-[16px]" />}
                      title="Ensis Assist is replying"
                      text="Take over to pause the bot and chat with this visitor yourself."
                      action={
                        <button
                          type="button"
                          onClick={takeOver}
                          disabled={!!busy}
                          className="flex h-[25px] items-center gap-[5px] rounded-[7px] bg-[#D98E16] px-[11px] text-[9.5px] font-bold text-white shadow-[0_4px_10px_rgba(253,110,21,0.35)] transition hover:bg-[#b87712] disabled:opacity-50"
                        >
                          {busy === "takeover" ? <Loader2 className="h-[11px] w-[11px] animate-spin" /> : <Headset className="h-[11px] w-[11px]" />}
                          Take over chat
                        </button>
                      }
                    />
                  )}
                </div>

                {/* Transcript */}
                <div ref={transcriptRef} className="flex-1 overflow-y-auto px-[18px] pb-[16px] pt-[4px]" style={DOODLE}>
                  {detail.messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <p className="rounded-full bg-white px-[14px] py-[7px] text-[9.5px] font-medium text-[#64748b] shadow-sm ring-1 ring-black/5">
                        Visitor filled their details but hasn&apos;t asked anything yet.
                      </p>
                    </div>
                  ) : (
                    days.map((d) => (
                      <div key={d.day}>
                        <div className="flex items-center gap-[12px] py-[12px]">
                          <span className="h-px flex-1 bg-[#cdd8e8]" />
                          <span className="rounded-full bg-[#263016] px-[13px] py-[4px] text-[9.5px] font-bold text-white shadow-[0_4px_10px_-4px_rgba(10,43,94,0.6)]">
                            {dayTitle(d.first)}
                          </span>
                          <span className="h-px flex-1 bg-[#cdd8e8]" />
                        </div>
                        <div className="flex flex-col gap-[14px]">
                          {d.blocks.map((b, i) => (b.kind === "event" ? <EventNote key={i} message={b.message} /> : <MessageBlock key={i} block={b} chat={detail} />))}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Composer: writing while Ensis Assist has the chat takes it over */}
                {actionError && <div className="border-t border-red-200 bg-red-50 px-[18px] py-[6px] text-[9px] font-medium text-red-700">{actionError}</div>}
                <form onSubmit={sendReply} className="relative border-t border-[#dfe6f0] bg-[#f6f8fc] px-[18px] py-[12px]">
                  {/* Emoji picker */}
                  {emojiOpen && (
                    <>
                      <button type="button" aria-label="Close emojis" className="fixed inset-0 z-20 cursor-default" onClick={() => setEmojiOpen(false)} />
                      <div className="absolute bottom-[calc(100%-4px)] left-[18px] z-30 w-[300px] rounded-[12px] bg-white p-[8px] shadow-[0_12px_30px_-10px_rgba(10,30,74,0.35),0_0_0_1px_rgba(27,31,35,0.08)]">
                        <p className="mb-[6px] px-[4px] text-[8.5px] font-bold uppercase tracking-[0.08em] text-[#94a3b8]">Emojis</p>
                        <div className="grid max-h-[180px] grid-cols-8 gap-[2px] overflow-y-auto">
                          {EMOJIS.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => addEmoji(emoji)}
                              className="grid h-[32px] w-full place-items-center rounded-[8px] text-[17px] transition hover:bg-[#f1f5f9]"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {/* The file about to be sent */}
                  {attachment && (
                    <div className="mb-[8px] flex items-center gap-[10px] rounded-[10px] bg-[#f8fafc] p-[7px] ring-1 ring-[#e6ebf2]">
                      {attachmentPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={attachmentPreview} alt="" className="h-[42px] w-[42px] shrink-0 rounded-[8px] object-cover" />
                      ) : (
                        <FileBadge name={attachment.name} />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[10px] font-semibold text-[#263016]">{attachment.name}</p>
                        <p className="text-[8.5px] text-[#64748b]">{fileSize(attachment.size)} · add a caption below, or just send</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setAttachment(null)}
                        aria-label="Remove file"
                        className="grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full text-[#64748b] transition hover:bg-[#e2e8f0]"
                      >
                        <X className="h-[13px] w-[13px]" />
                      </button>
                    </div>
                  )}

                  <div className={`flex items-end gap-[4px] rounded-[12px] bg-white py-[6px] pl-[6px] pr-[6px] ring-1 ring-[#e3e9f2] ${detail.closed ? "opacity-60" : ""}`}>
                    <button
                      type="button"
                      onClick={() => setEmojiOpen((v) => !v)}
                      disabled={detail.closed}
                      aria-label="Emoji"
                      title="Emoji"
                      className={`grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] transition ${emojiOpen ? "bg-[#fff1e6] text-[#b87712]" : "text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#263016]"}`}
                    >
                      <Smile className="h-[17px] w-[17px]" />
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={detail.closed}
                      aria-label="Attach a file"
                      title="Attach a photo, PDF or document"
                      className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[9px] text-[#64748b] transition hover:bg-[#f1f5f9] hover:text-[#263016]"
                    >
                      <Paperclip className="h-[16px] w-[16px]" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={ATTACH_ACCEPT}
                      className="hidden"
                      onChange={(e) => {
                        pickFile(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                    <textarea
                      ref={draftRef}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={onDraftKey}
                      disabled={detail.closed}
                      rows={Math.min(4, Math.max(1, draft.split("\n").length))}
                      maxLength={2000}
                      placeholder={detail.closed ? "This chat is closed" : attachment ? "Add a caption..." : live ? "Type your message..." : "Type to take over and reply..."}
                      aria-label="Message to the visitor"
                      className="max-h-[96px] min-h-[34px] flex-1 resize-none bg-transparent px-[4px] py-[8px] text-[11px] leading-[1.45] text-[#111b21] outline-none placeholder:text-[#94a3b8]"
                    />
                    <button
                      type="submit"
                      disabled={(!draft.trim() && !attachment) || !!busy || detail.closed}
                      aria-label="Send"
                      title={live ? "Send" : "Take over and send"}
                      className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] bg-[#D98E16] text-white shadow-[0_4px_10px_rgba(253,110,21,0.35)] transition hover:bg-[#b87712] disabled:bg-[#fdb98f] disabled:shadow-none"
                    >
                      {busy === "reply" ? <Loader2 className="h-[15px] w-[15px] animate-spin" /> : <Send className="h-[15px] w-[15px] -translate-x-px translate-y-px" />}
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

type Block = { kind: "event"; message: ChatMessage } | { kind: "messages"; role: ChatMessage["role"]; by?: string; items: ChatMessage[] };

/* ── Round avatar: first and last initials of the name; a person icon when the visitor gave no name ── */
// Recent Chats: each avatar in the row gets its own colour, so neighbours never look alike
const RECENT_COLORS = [
  "linear-gradient(135deg, #1d5bc0, #263016)",
  "linear-gradient(135deg, #fd8a3d, #b87712)",
  "linear-gradient(135deg, #14b8a6, #0f766e)",
  "linear-gradient(135deg, #a855f7, #6d28d9)",
  "linear-gradient(135deg, #f472b6, #be185d)",
  "linear-gradient(135deg, #22c55e, #15803d)",
  "linear-gradient(135deg, #38bdf8, #0369a1)",
  "linear-gradient(135deg, #fbbf24, #b45309)",
];

function Avatar({ chat, size, online, ring, color }: { chat: Chat; size: number; online?: boolean; ring?: boolean; color?: string }) {
  const name = nameOf(chat);
  const dot = Math.round(size * 0.26);
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }}>
      <span
        className={`grid h-full w-full place-items-center rounded-full font-bold text-white shadow-[0_2px_6px_-2px_rgba(10,30,74,0.35)] ${ring ? "ring-[3px] ring-[#D98E16] ring-offset-2" : ""}`}
        style={{ background: color || avatarColor(chat.lead?.phone || chat.visitor?.ip || chat._id), fontSize: Math.round(size * 0.34) }}
      >
        {name ? firstLast(name) : <UserRound style={{ width: size * 0.5, height: size * 0.5 }} />}
      </span>
      {online && <span className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-[#22c55e]" style={{ width: dot, height: dot }} />}
    </span>
  );
}

/* ── One chat in the list: a card with the name, the time and the last message ── */
function ChatCard({ chat: c, active, online, onSelect }: { chat: ChatSummary; active: boolean; online: boolean; onSelect: () => void }) {
  const last = c.lastMessage;
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{ boxShadow: "rgba(0, 0, 0, 0.02) 0px 1px 3px 0px, rgba(27, 31, 35, 0.15) 0px 0px 0px 1px" }}
      className={`flex w-full items-center gap-[9px] rounded-[10px] border-2 bg-white px-[10px] py-[8px] text-left transition ${
        active ? "border-[#1c2410]" : "border-transparent hover:border-[#1c2410]/20"
      }`}
    >
      <Avatar chat={c} size={36} online={online} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="truncate text-[10.5px] font-bold text-[#263016]">{titleOf(c)}</span>
          <span className={`shrink-0 text-[8px] ${online ? "font-semibold text-[#16a34a]" : "text-[#94a3b8]"}`}>{timeAgo(c.updatedAt)}</span>
        </span>
        <span className="mt-[2px] flex items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-[4px] text-[9px] text-[#64748b]">
            {last?.role === "agent" && !last.event && <CheckCheck className="h-[12px] w-[12px] shrink-0 text-[#b87712]" />}
            {last?.role === "assistant" && <Bot className="h-[11px] w-[11px] shrink-0 text-[#1c2410]" />}
            <span className={`truncate ${last?.event ? "italic" : ""}`}>
              {last ? last.content || (last.files?.length ? `📎 ${last.files[0].label}` : "") : "Filled details, no question yet"}
            </span>
          </span>
          {isLive(c) ? (
            <span className="shrink-0 rounded-full bg-[#22c55e] px-[7px] py-[2px] text-[7.5px] font-bold uppercase tracking-wide text-white">Live</span>
          ) : (
            c.questionCount > 0 && (
              <span className="grid h-[16px] min-w-[16px] shrink-0 place-items-center rounded-full bg-[#D98E16] px-[4px] text-[7.5px] font-bold text-white">{c.questionCount}</span>
            )
          )}
        </span>
      </span>
    </button>
  );
}

/* ── Messages in a row from one person: their name and time above, the avatar beside ── */
function MessageBlock({ block, chat }: { block: Extract<Block, { kind: "messages" }>; chat: ChatDetail }) {
  const visitor = block.role === "user";
  const team = block.role === "agent";
  const first = block.items[0];
  const who = visitor ? titleOf(chat) : team ? `${block.by || "Team"} (Team)` : "Ensis Assist";

  const avatar = visitor ? (
    <Avatar chat={chat} size={32} />
  ) : team ? (
    <span className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#fd7a26] to-[#b87712] text-white shadow-sm">
      <Headset className="h-[15px] w-[15px]" />
    </span>
  ) : (
    <span className="grid h-[32px] w-[32px] shrink-0 place-items-center overflow-hidden rounded-full bg-white p-[4px] shadow-sm ring-1 ring-[#D98E16]/40">
      <Image src="/ensis-logo.webp" alt="Ensis Assist" width={24} height={24} className="h-auto w-full object-contain" />
    </span>
  );

  return (
    <div className={`flex items-end gap-[10px] ${visitor ? "" : "flex-row-reverse"}`}>
      {avatar}
      <div className={`flex min-w-0 max-w-[70%] flex-col gap-[5px] ${visitor ? "items-start" : "items-end"}`}>
        <p className={`flex items-center gap-[6px] text-[9.5px] ${visitor ? "" : "flex-row-reverse"}`}>
          <span className="font-bold text-[#263016]">{who}</span>
          <span className="h-[3px] w-[3px] rounded-full bg-[#cbd5e1]" />
          <span className="text-[#64748b]">{formatTime(first.createdAt)}</span>
          {team && <CheckCheck className="h-[12px] w-[12px] text-[#b87712]" />}
        </p>
        {block.items.map((m, i) => (
          <div
            key={`${m.createdAt}-${i}`}
            title={formatTime(m.createdAt)}
            className={`break-words rounded-[14px] px-[14px] py-[10px] text-[11px] leading-[1.55] ${
              visitor
                ? `${m.flagged ? "border border-red-200 bg-red-50" : "border border-[#e6ebf2] bg-white"} text-[#1e293b] shadow-[0_2px_6px_-3px_rgba(10,30,74,0.15)] ${i === block.items.length - 1 ? "rounded-bl-[4px]" : ""}`
                : team
                  ? `bg-gradient-to-br from-[#fd7a26] to-[#b87712] text-white shadow-[0_6px_14px_-6px_rgba(232,90,5,0.55)] ${i === block.items.length - 1 ? "rounded-br-[4px]" : ""}`
                  : `bg-gradient-to-br from-[#1c2410] to-[#263016] text-white shadow-[0_6px_14px_-6px_rgba(10,43,94,0.55)] ${i === block.items.length - 1 ? "rounded-br-[4px]" : ""}`
            }`}
          >
            {m.flagged && <span className="mb-[3px] block text-[8px] font-bold uppercase tracking-wide text-red-600">Abusive · not shown to the visitor</span>}
            {m.files?.length ? <Attachments files={m.files} light={!visitor} /> : null}
            {!m.content ? null : visitor || team ? (
              <p className={`whitespace-pre-wrap ${m.files?.length ? "mt-[6px]" : ""}`}>{m.content}</p>
            ) : (
              <MessageText text={m.content} linkClass="font-semibold text-[#ffd3b0] underline underline-offset-2 break-words" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Files in a message: photos as pictures, everything else as a card to open or download ── */
function Attachments({ files, light }: { files: ChatFile[]; light: boolean }) {
  return (
    <div className="flex flex-col gap-[6px]">
      {files.map((file) =>
        isImageFile(file) ? (
          <a key={file.href} href={file.href} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-[10px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={file.href} alt={file.label} className="max-h-[220px] w-auto max-w-full object-cover" />
          </a>
        ) : (
          <a
            key={file.href}
            href={file.href}
            target="_blank"
            rel="noopener noreferrer"
            download
            className={`flex min-w-[200px] items-center gap-[9px] rounded-[10px] p-[7px] transition ${light ? "bg-white/15 hover:bg-white/25" : "bg-[#f8fafc] ring-1 ring-[#e6ebf2] hover:bg-[#f1f5f9]"}`}
          >
            <FileBadge name={file.label} />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[10px] font-semibold">{file.label}</span>
              {file.size ? <span className={`block text-[8.5px] ${light ? "text-white/75" : "text-[#64748b]"}`}>{fileSize(file.size)}</span> : null}
            </span>
            <Download className="h-[14px] w-[14px] shrink-0 opacity-80" />
          </a>
        )
      )}
    </div>
  );
}

// A coloured file icon with the file's extension
function FileBadge({ name }: { name: string }) {
  const ext = (name.split(".").pop() || "").toLowerCase();
  const look =
    ext === "pdf"
      ? { bg: "bg-red-50 text-red-600", icon: <FileText className="h-[17px] w-[17px]" /> }
      : ["xls", "xlsx", "csv"].includes(ext)
        ? { bg: "bg-green-50 text-green-700", icon: <FileSpreadsheet className="h-[17px] w-[17px]" /> }
        : ["ppt", "pptx"].includes(ext)
          ? { bg: "bg-orange-50 text-orange-600", icon: <Presentation className="h-[17px] w-[17px]" /> }
          : ext === "zip"
            ? { bg: "bg-amber-50 text-amber-700", icon: <FileArchive className="h-[17px] w-[17px]" /> }
            : { bg: "bg-blue-50 text-blue-700", icon: <FileText className="h-[17px] w-[17px]" /> };
  return (
    <span className={`relative grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[8px] ${look.bg}`}>
      {look.icon}
      <span className="absolute bottom-[3px] text-[6.5px] font-bold uppercase">{ext.slice(0, 4)}</span>
    </span>
  );
}

/* ── The team joined or left the chat: a note in the middle ── */
function EventNote({ message: m }: { message: ChatMessage }) {
  return (
    <div className="flex justify-center">
      <span className="flex items-center gap-[6px] rounded-full bg-[#faf7f2] px-[12px] py-[5px] text-[9px] font-semibold text-[#b84a08] shadow-[0_1px_3px_rgba(10,30,74,0.08)] ring-1 ring-[#D98E16]/25">
        {m.event === "joined" ? <Headset className="h-[11px] w-[11px]" /> : <Bot className="h-[11px] w-[11px]" />}
        {m.event === "joined" ? `${m.by || "Team"} took over the chat` : `${m.by || "Team"} handed the chat back to Ensis Assist`}
        <span className="font-normal text-[#c2733a]">· {formatTime(m.createdAt)}</span>
      </span>
    </div>
  );
}

const TONES = {
  grey: { chip: "bg-[#f1f5f9] text-[#64748b]", banner: "border-[#e2e8f0] bg-[#f8fafc]", icon: "text-[#64748b]" },
  blue: { chip: "bg-[#eef3fb] text-[#1c2410]", banner: "border-[#c9d6ee] bg-[#f1f5fc]", icon: "text-[#1c2410]" },
  green: { chip: "bg-[#e8f8ee] text-[#15803d]", banner: "border-[#bfe8cd] bg-[#f0fbf4]", icon: "text-[#15803d]" },
  orange: { chip: "bg-[#fff1e6] text-[#b87712]", banner: "border-[#fcd3b5] bg-[#fff7f0]", icon: "text-[#b87712]" },
  red: { chip: "bg-red-50 text-red-600", banner: "border-red-200 bg-red-50", icon: "text-red-600" },
};
type Tone = keyof typeof TONES;

function Chip({ tone, icon, children }: { tone: Tone; icon: React.ReactNode; children: React.ReactNode }) {
  return <span className={`inline-flex items-center gap-[4px] rounded-full px-[7px] py-[1px] text-[8.5px] font-semibold ${TONES[tone].chip}`}>{icon}{children}</span>;
}

function Banner({ tone, icon, title, text, action }: { tone: Tone; icon: React.ReactNode; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className={`flex flex-wrap items-center gap-[10px] rounded-[8px] border px-[12px] py-[6px] ${TONES[tone].banner}`}>
      <span className={`grid h-[24px] w-[24px] shrink-0 place-items-center rounded-full bg-white shadow-sm ${TONES[tone].icon} [&>svg]:h-[13px] [&>svg]:w-[13px]`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold leading-tight text-[#263016]">{title}</p>
        <p className="text-[8.5px] leading-snug text-[#475569]">{text}</p>
      </div>
      {action}
    </div>
  );
}

function HeaderIcon({ href, label, external, tone, children }: { href: string; label: string; external?: boolean; tone?: "green"; children: React.ReactNode }) {
  return (
    <a
      href={href}
      title={label}
      aria-label={label}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={`grid h-[30px] w-[30px] place-items-center rounded-full transition hover:bg-[#f1f5f9] ${tone === "green" ? "text-[#16a34a]" : "text-[#475569]"}`}
    >
      {children}
    </a>
  );
}

/* ── One visitor detail under the header: a small icon, a label and the value ── */
function DetailCell({
  icon,
  label,
  tone = "grey",
  href,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  tone?: Tone;
  href?: string;
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const body = (
    <>
      <span className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full ${TONES[tone].chip}`}>{icon}</span>
      <span className="min-w-0">
        <span className="block text-[7px] font-semibold uppercase tracking-[0.06em] text-[#94a3b8]">{label}</span>
        <span className="flex items-center gap-[4px] text-[9.5px] font-semibold text-[#1e293b]">{children}</span>
      </span>
    </>
  );
  const cls = "flex items-center gap-[7px] rounded-[10px] bg-white py-[4px] pl-[5px] pr-[10px] text-left ring-1 ring-[#e6ebf2] transition";
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${cls} hover:ring-[#1c2410]/30`}>
        {body}
      </a>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${cls} hover:ring-[#1c2410]/30`}>
        {body}
      </button>
    );
  }
  return <span className={cls}>{body}</span>;
}
