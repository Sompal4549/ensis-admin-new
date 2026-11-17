import { api, getAccessToken, getApiBaseUrl } from "./api";

export interface ChatLead {
  name?: string;
  email?: string;
  phone?: string;
}

export interface ChatFile {
  href: string;
  label: string;
  type?: string;
  size?: number;
}

export interface ChatMessage {
  /** "agent": written by someone from the team after taking the chat over */
  role: "user" | "assistant" | "agent";
  content: string;
  createdAt: string;
  flagged?: boolean;
  by?: string;
  event?: "joined" | "left";
  files?: ChatFile[];
}

export interface ChatRequest {
  type: "stall-quotation" | "sales-callback";
  stallSize?: string;
  company?: string;
  preferredTime?: string;
  createdAt?: string;
}

export type InboxStatus = "New" | "In Progress" | "Follow-up" | "Assigned" | "Waiting for Visitor" | "Resolved";
export type InboxPriority = "High" | "Medium" | "Low";
export type InboxCategory = "lead" | "enquiry" | "support" | "feedback" | "complaint";
export type InboxActivity = { kind: "reply" | "note" | "event"; text: string; by?: string; at?: string };

/** The team's follow-up on a chat (Inbox & Leads) */
export interface ChatWorkflow {
  assignedTo?: string;
  team?: string;
  status?: InboxStatus;
  priority?: InboxPriority;
  followUpKind?: "date" | "review" | "assign" | "none";
  followUpAt?: string;
  resolvedAt?: string;
  spam?: boolean;
  seenAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  activity?: InboxActivity[];
}

/** Saved inbox state for one record; fields left out are not changed */
export type WorkflowUpdate = Partial<Omit<ChatWorkflow, "updatedAt" | "updatedBy">> & { id: string };

export interface NewManualEnquiry {
  name: string;
  mobile?: string;
  email?: string;
  category: InboxCategory;
  type: string;
  topic: string;
  detail: string;
  priority: InboxPriority;
  assignedTo: string;
  team?: string;
  source: string;
  followUpAt?: string;
}

export interface ChatSummary {
  _id: string;
  sessionId: string;
  lead?: ChatLead;
  visitorName?: string;
  visitor?: { ip?: string; userAgent?: string };
  blocked?: boolean;
  agent?: { active: boolean; by?: string; since?: string };
  closed?: boolean;
  phoneVerifiedAt?: string;
  feedback?: "yes" | "no";
  requests?: ChatRequest[];
  pageUrl?: string;
  enquiryId?: string;
  whatsappSentAt?: string;
  source?: "chat" | "manual";
  manual?: { channel?: string; category?: InboxCategory; type?: string; topic?: string; detail?: string };
  workflow?: ChatWorkflow;
  booking?: { status: string; paid: boolean };
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  questionCount: number;
  firstQuestion?: ChatMessage;
  lastMessage?: ChatMessage;
}

export interface ChatDetail extends Omit<ChatSummary, "messageCount" | "questionCount" | "firstQuestion" | "lastMessage"> {
  messages: ChatMessage[];
}

export interface ChatListResponse {
  chats: ChatSummary[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChatStats {
  totals: {
    chats: number;
    leads: number;
    questions: number;
    replies: number;
    whatsappSent: number;
    engaged: number;
    verifiedLeads: number;
    handovers: number;
    feedbackYes: number;
    feedbackNo: number;
    unanswered: number;
    returningVisitors: number;
  };
  popularQuestions: { question: string; count: number }[];
  followUp: { unassigned: number; overdue: number; dueToday: number; openComplaints: number };
  contentUpdatedAt: string | null;
  daily: { date: string; chats: number; questions: number }[];
  topPages: { pageUrl: string; chats: number }[];
  latestQuestions: { _id: string; chatId: string; name?: string; content: string; createdAt: string }[];
}

export interface ChatQuery {
  from?: string;
  to?: string;
  search?: string;
  page?: number;
  limit?: number;
  source?: "all";
}

const toQuery = (q: ChatQuery) => {
  const params = new URLSearchParams();
  Object.entries(q).forEach(([k, v]) => {
    if (v !== undefined && v !== "") params.set(k, String(v));
  });
  const s = params.toString();
  return s ? `?${s}` : "";
};

export const chatbotApi = {
  list: (q: ChatQuery = {}, fresh = false) => api.get<ChatListResponse>(`/admin/chats${toQuery(q)}`, { forceFresh: fresh }),
  stats: (q: Pick<ChatQuery, "from" | "to"> = {}) => api.get<ChatStats>(`/admin/chats/stats${toQuery(q)}`),
  get: (id: string, fresh = false) => api.get<ChatDetail>(`/admin/chats/${id}`, { forceFresh: fresh }),
  takeover: (id: string) => api.post<ChatDetail>(`/admin/chats/${id}/takeover`),
  release: (id: string) => api.post<ChatDetail>(`/admin/chats/${id}/release`),
  reply: (id: string, text: string) => api.post<ChatDetail>(`/admin/chats/${id}/reply`, { text }),
  attach: (id: string, file: File, text?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (text) form.append("text", text);
    return api.postForm<ChatDetail>(`/admin/chats/${id}/attach`, form, { timeoutMs: 120000 });
  },
  saveWorkflow: (items: WorkflowUpdate[]) => api.put<{ matched: number; modified: number }>("/admin/chats/workflow", { items }),
  createManual: (enquiry: NewManualEnquiry) => api.post<{ id: string; createdAt: string }>("/admin/chats/manual", enquiry),
};

/* ─── AI Training Types & API ─── */

export type TrainingKind = "instruction" | "note" | "file";

export interface TrainingItem {
  _id: string;
  kind: TrainingKind;
  title: string;
  content: string;
  always: boolean;
  enabled: boolean;
  file?: { name?: string; mime?: string; size?: number; pages?: number };
  chars: number;
  passages: number;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingOverview {
  items: TrainingItem[];
  counts: { website: number; taught: number };
  rulesChars: number;
  maxRulesChars: number;
  model: string;
  voiceModel: string;
  aiReady: boolean;
}

export interface TrainingTestReply {
  text: string;
  files?: { href: string; label: string }[];
  link?: { href: string; label: string };
  searched: { query: string; results: { title: string; url: string; text: string }[] }[];
  trace: string[];
  finished: boolean;
}

export interface GreetingLines {
  title: string;
  chat: string;
  call: string;
  again: string;
  callAgain: string;
}

export interface ContactDetails {
  phones: string[];
  emails: string[];
  whatsapp: string;
  address: string;
  hours: string;
  website: string;
}

export interface ChatbotSettings {
  greeting: { en: GreetingLines; hi: GreetingLines };
  ending: { en: string; hi: string };
  contact: ContactDetails;
  defaults: { greeting: { en: GreetingLines; hi: GreetingLines }; ending: { en: string; hi: string }; contact: ContactDetails };
  saved: { greeting: boolean; ending: boolean; contact: boolean };
  updatedBy?: string;
  updatedAt?: string;
}

export interface KnowledgeOverview {
  basics: { title: string; url: string; text: string }[];
  services: string[];
  documents: { title: string; category?: string; fileSize?: string }[];
  pages: { url: string; title: string; passages: number; text: string; checkedAt: string }[];
  rules: { title: string; text: string }[];
}

export const chatTrainingApi = {
  get: () => api.get<TrainingOverview>("/admin/chats/training", { forceFresh: true }),
  settings: () => api.get<ChatbotSettings>("/admin/chats/training/settings", { forceFresh: true }),
  saveSettings: (patch: { greeting?: ChatbotSettings["greeting"] | null; ending?: ChatbotSettings["ending"] | null; contact?: ContactDetails | null }) =>
    api.put<ChatbotSettings>("/admin/chats/training/settings", patch),
  knowledge: () => api.get<KnowledgeOverview>("/admin/chats/training/knowledge", { forceFresh: true }),
  add: (item: { kind: "instruction" | "note"; title: string; content: string; always?: boolean }) => api.post<TrainingItem>("/admin/chats/training", item),
  upload: (file: File, title: string, always: boolean) => {
    const form = new FormData();
    form.append("file", file);
    form.append("title", title);
    form.append("always", String(always));
    return api.postForm<TrainingItem>("/admin/chats/training/file", form, { timeoutMs: 180000 });
  },
  update: (id: string, change: Partial<Pick<TrainingItem, "title" | "content" | "enabled" | "always">>) => api.put<TrainingItem>(`/admin/chats/training/${id}`, change),
  remove: (id: string) => api.delete<null>(`/admin/chats/training/${id}`),
  test: (message: string, history: { role: "user" | "assistant"; content: string }[]) =>
    api.post<TrainingTestReply>("/admin/chats/training/test", { message, history }, { timeoutMs: 90000 }),
  speak: async (text: string): Promise<Blob> => {
    const token = getAccessToken();
    const res = await fetch(`${getApiBaseUrl()}/admin/chats/training/speak?text=${encodeURIComponent(text.slice(0, 600))}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      credentials: "include",
    });
    if (!res.ok) throw new Error("Couldn't read the reply out");
    return res.blob();
  },
  reindex: () => api.post<{ pages?: number; passages?: number; embedded?: number; skipped?: string }>("/admin/chats/reindex", undefined, { timeoutMs: 300000 }),
};

/* ─── Chat Visitors: one row per visitor (by IP) with block / close / delete controls ─── */

export type VisitorStatus = "active" | "blocked";
export type VisitorFilter = "all" | VisitorStatus | "open" | "closed";

export interface ChatVisitor {
  ip: string;
  name: string;
  phone: string;
  email: string;
  userAgent: string;
  language?: "en" | "hi";
  pageUrl: string;
  chats: number;
  messages: number;
  firstAt: string;
  lastAt: string;
  lastChatId: string;
  lastMessage?: ChatMessage;
  chatOpen: boolean;
  closedAt?: string;
  clearedAt?: string;
  status: VisitorStatus;
  blockedUntil?: string;
  blockedForever?: boolean;
  blockReason?: string;
  blockedBy?: string;
  strikes: number;
}

export interface ChatVisitorCounts {
  all: number;
  active: number;
  blocked: number;
  open: number;
  closed: number;
  today: number;
}

export interface VisitorChat {
  _id: string;
  sessionId: string;
  lead?: ChatLead;
  pageUrl?: string;
  language?: "en" | "hi";
  closed: boolean;
  closedAt?: string;
  closedBy?: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface ChatVisitorDetail {
  ip: string;
  status: VisitorStatus;
  chats: VisitorChat[];
}

const ipPath = (ip: string) => `/admin/chats/visitors/${encodeURIComponent(ip)}`;

export const chatVisitorsApi = {
  list: (q: { search?: string; status?: VisitorFilter } = {}) =>
    api.get<{ visitors: ChatVisitor[]; counts: ChatVisitorCounts }>(
      `/admin/chats/visitors?${new URLSearchParams(Object.entries(q).filter(([, v]) => v) as [string, string][])}`,
      { forceFresh: true },
    ),
  get: (ip: string) => api.get<ChatVisitorDetail>(ipPath(ip), { forceFresh: true }),
  block: (ip: string, reason?: string) => api.post<null>(`${ipPath(ip)}/block`, { reason }),
  unblock: (ip: string) => api.post<null>(`${ipPath(ip)}/unblock`),
  close: (ip: string) => api.post<{ closed: number }>(`${ipPath(ip)}/close`),
  clear: (ip: string, scope: "last" | "all") => api.post<{ cleared: number }>(`${ipPath(ip)}/clear?scope=${scope}`),
  deleteHistory: (ip: string, scope: "last" | "all") => api.delete<{ deleted: number }>(`${ipPath(ip)}/history?scope=${scope}`),
};
