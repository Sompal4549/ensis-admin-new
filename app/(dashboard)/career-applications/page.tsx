"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Briefcase, Download, ExternalLink, FileText, Mail, Phone, RefreshCw, Search, Trash2, X } from "lucide-react";
import Swal from "sweetalert2";
import { api } from "@/lib/api";

/** An application from the website's career form (backend models/applicationModel.ts) */
type Application = {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  currentLocation: string;
  department: string;
  experience: string;
  coverLetter?: string;
  resume: string;
  status: Status;
  notes?: string;
  /** "career-form" = general form, "ai-cv" = job Apply flow with CV screening */
  source?: "career-form" | "ai-cv";
  jobTitle?: string;
  aiScore?: number;
  aiSummary?: string;
  linkedin?: string;
  currentCompany?: string;
  currentDesignation?: string;
  noticePeriod?: string;
  expectedCTC?: string;
  willingToRelocate?: string;
  employmentStatus?: string;
  createdAt: string;
};

const SOURCE_LABEL = { "career-form": "General form", "ai-cv": "Job apply (AI CV)" } as const;
const sourceOf = (a: Application) => a.source || "career-form";

const STATUSES = ["pending", "reviewed", "shortlisted", "rejected"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_META: Record<Status, { label: string; pill: string }> = {
  pending: { label: "New", pill: "bg-[#fdf3e1] text-[#b45309]" },
  reviewed: { label: "Reviewed", pill: "bg-[#e0f2fe] text-[#0369a1]" },
  shortlisted: { label: "Shortlisted", pill: "bg-[#e6f6ea] text-[#15803d]" },
  rejected: { label: "Rejected", pill: "bg-[#fee2e2] text-[#b91c1c]" },
};

const formatDate = (iso: string) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export default function CareerApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [department, setDepartment] = useState("all");
  const [source, setSource] = useState<"all" | "career-form" | "ai-cv">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const list = await api.get<Application[]>(`/applications?t=${Date.now()}`);
      setApplications(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load applications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const departments = useMemo(
    () => [...new Set(applications.map((a) => a.department).filter(Boolean))].sort(),
    [applications]
  );

  const counts = useMemo(() => {
    const c: Record<Status, number> = { pending: 0, reviewed: 0, shortlisted: 0, rejected: 0 };
    applications.forEach((a) => (c[a.status] = (c[a.status] || 0) + 1));
    return c;
  }, [applications]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return applications.filter(
      (a) =>
        (statusFilter === "all" || a.status === statusFilter) &&
        (department === "all" || a.department === department) &&
        (source === "all" || sourceOf(a) === source) &&
        (!q || [a.fullName, a.email, a.phone, a.currentLocation, a.department].some((v) => (v || "").toLowerCase().includes(q)))
    );
  }, [applications, query, statusFilter, department, source]);

  const open = applications.find((a) => a._id === openId) || null;

  const replace = (updated: Application) => setApplications((list) => list.map((a) => (a._id === updated._id ? updated : a)));

  const setStatus = async (app: Application, status: Status) => {
    const previous = app.status;
    replace({ ...app, status });
    try {
      replace(await api.put<Application>(`/applications/${app._id}`, { status }));
    } catch (err) {
      replace({ ...app, status: previous });
      Swal.fire({ title: "Could not update status", text: err instanceof Error ? err.message : "", icon: "error" });
    }
  };

  const openDetails = (app: Application) => {
    setOpenId(app._id);
    setNotesDraft(app.notes || "");
    // Opening a new application marks it as seen
    if (app.status === "pending") setStatus(app, "reviewed");
  };

  const saveNotes = async () => {
    if (!open) return;
    setSavingNotes(true);
    try {
      replace(await api.put<Application>(`/applications/${open._id}`, { notes: notesDraft }));
      Swal.fire({ title: "Notes saved", icon: "success", timer: 1200, showConfirmButton: false });
    } catch (err) {
      Swal.fire({ title: "Could not save notes", text: err instanceof Error ? err.message : "", icon: "error" });
    } finally {
      setSavingNotes(false);
    }
  };

  const remove = async (app: Application) => {
    const ok = await Swal.fire({
      title: `Delete ${app.fullName}'s application?`,
      text: "This cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });
    if (!ok.isConfirmed) return;
    try {
      await api.delete(`/applications/${app._id}`);
      setApplications((list) => list.filter((a) => a._id !== app._id));
      setOpenId(null);
    } catch (err) {
      Swal.fire({ title: "Delete failed", text: err instanceof Error ? err.message : "", icon: "error" });
    }
  };

  const exportCsv = () => {
    const header = ["Name", "Email", "Phone", "Location", "Department / Job", "Experience", "Source", "AI Score", "Current Company", "Notice Period", "Expected CTC", "Status", "Applied On", "Resume", "Cover Letter", "Notes"];
    const rows = filtered.map((a) =>
      [a.fullName, a.email, a.phone, a.currentLocation, a.department, a.experience, SOURCE_LABEL[sourceOf(a)], a.aiScore ?? "", a.currentCompany, a.noticePeriod, a.expectedCTC, STATUS_META[a.status]?.label, formatDate(a.createdAt), a.resume, a.coverLetter, a.notes]
        .map(csvCell)
        .join(",")
    );
    const blob = new Blob([[header.map(csvCell).join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `career-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-[19px] font-bold text-[#0f2a1c]">
            <Briefcase className="h-5 w-5 text-[#15633a]" /> Career Applications
          </h1>
          <p className="text-[9px] text-[#64748b]">Applications sent from the website&apos;s Career page, with the uploaded resume.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={load} className="inline-flex items-center gap-1 rounded-[6px] border border-[#cbd5e1] bg-white px-3 py-2 text-[9px] font-semibold">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!filtered.length}
            className="inline-flex items-center gap-1 rounded-[6px] bg-[#15633a] px-3 py-2 text-[9px] font-semibold text-white disabled:opacity-50"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <button
          type="button"
          onClick={() => setStatusFilter("all")}
          className={`rounded-[8px] border bg-white p-3 text-left ${statusFilter === "all" ? "border-[#15633a]" : "border-[#e2e8f0]"}`}
        >
          <p className="text-[8.5px] text-[#64748b]">All applications</p>
          <p className="text-[16px] font-bold text-[#0f172a]">{applications.length}</p>
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-[8px] border bg-white p-3 text-left ${statusFilter === s ? "border-[#15633a]" : "border-[#e2e8f0]"}`}
          >
            <p className="text-[8.5px] text-[#64748b]">{STATUS_META[s].label}</p>
            <p className="text-[16px] font-bold text-[#0f172a]">{counts[s]}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-w-[240px] flex-1 items-center gap-2 rounded-[6px] border border-[#dfe3e8] bg-white px-2">
          <Search className="h-4 w-4 text-[#94a3b8]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone, city"
            className="h-[34px] flex-1 bg-transparent text-[9.5px] outline-none"
          />
        </label>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="h-[36px] rounded-[6px] border border-[#dfe3e8] bg-white px-2 text-[9.5px]"
        >
          <option value="all">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={source}
          onChange={(e) => setSource(e.target.value as typeof source)}
          className="h-[36px] rounded-[6px] border border-[#dfe3e8] bg-white px-2 text-[9.5px]"
        >
          <option value="all">All sources</option>
          <option value="career-form">{SOURCE_LABEL["career-form"]}</option>
          <option value="ai-cv">{SOURCE_LABEL["ai-cv"]}</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-[8px] border border-[#e2e8f0] bg-white">
        <table className="w-full min-w-[820px] text-left text-[9px]">
          <thead className="bg-[#f8fafc] text-[8.5px] uppercase tracking-wide text-[#64748b]">
            <tr>
              <th className="px-3 py-2">Candidate</th>
              <th className="px-3 py-2">Department / Job</th>
              <th className="px-3 py-2">Experience</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Applied</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2 text-right">Resume</th>
            </tr>
          </thead>
          <tbody>
            {loading && !applications.length ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-[#64748b]">
                  Loading applications…
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-[#b91c1c]">
                  {error}
                </td>
              </tr>
            ) : !filtered.length ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-[#64748b]">
                  {applications.length ? "No applications match these filters." : "No applications yet. They appear here as soon as someone applies on the Career page."}
                </td>
              </tr>
            ) : (
              filtered.map((a) => (
                <tr key={a._id} onClick={() => openDetails(a)} className="cursor-pointer border-t border-[#eef2f6] hover:bg-[#f8fafc]">
                  <td className="px-3 py-2">
                    <p className="font-semibold text-[#0f172a]">{a.fullName}</p>
                    <p className="text-[8.5px] text-[#64748b]">
                      {a.email} · {a.phone}
                    </p>
                  </td>
                  <td className="px-3 py-2">
                    {a.department}
                    <span className="mt-0.5 flex items-center gap-1 text-[8px] text-[#64748b]">
                      {SOURCE_LABEL[sourceOf(a)]}
                      {typeof a.aiScore === "number" && (
                        <span className="rounded-full bg-[#eef2ff] px-1.5 font-semibold text-[#4338ca]">AI {a.aiScore}%</span>
                      )}
                    </span>
                  </td>
                  <td className="px-3 py-2">{a.experience}</td>
                  <td className="px-3 py-2">{a.currentLocation}</td>
                  <td className="px-3 py-2 text-[#64748b]">{formatDate(a.createdAt)}</td>
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={a.status}
                      onChange={(e) => setStatus(a, e.target.value as Status)}
                      className={`rounded-full border-0 px-2 py-1 text-[8.5px] font-semibold ${STATUS_META[a.status]?.pill}`}
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_META[s].label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    {a.resume && (
                      <a href={a.resume} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-[#2563eb]">
                        <FileText className="h-4 w-4" /> Open
                      </a>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setOpenId(null)}>
          <aside className="flex h-full w-full max-w-[460px] flex-col gap-4 overflow-y-auto bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[14px] font-bold text-[#0f172a]">{open.fullName}</p>
                <p className="text-[9px] text-[#64748b]">
                  {open.department} · {open.experience} · applied {formatDate(open.createdAt)}
                </p>
              </div>
              <button type="button" onClick={() => setOpenId(null)} aria-label="Close" className="text-[#64748b]">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2 rounded-[8px] bg-[#f8fafc] p-3 text-[9.5px]">
              <a href={`mailto:${open.email}`} className="inline-flex items-center gap-2 text-[#0f172a] hover:underline">
                <Mail className="h-4 w-4 text-[#15633a]" /> {open.email}
              </a>
              <a href={`tel:${open.phone}`} className="inline-flex items-center gap-2 text-[#0f172a] hover:underline">
                <Phone className="h-4 w-4 text-[#15633a]" /> {open.phone}
              </a>
              <p className="text-[#475569]">Location: {open.currentLocation}</p>
              {open.linkedin && (
                <a href={open.linkedin.startsWith("http") ? open.linkedin : `https://${open.linkedin}`} target="_blank" rel="noreferrer" className="text-[#2563eb] hover:underline">
                  LinkedIn profile
                </a>
              )}
            </div>

            {sourceOf(open) === "ai-cv" && (
              <div className="rounded-[8px] border border-[#e0e7ff] bg-[#f5f7ff] p-3 text-[9px] text-[#334155]">
                <p className="mb-1 font-semibold text-[#3730a3]">
                  Applied through job Apply{open.jobTitle ? ` — ${open.jobTitle}` : ""}
                  {typeof open.aiScore === "number" ? ` · AI match ${open.aiScore}%` : ""}
                </p>
                {open.aiSummary && <p className="mb-2 leading-5">{open.aiSummary}</p>}
                <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {[
                    ["Current company", open.currentCompany],
                    ["Designation", open.currentDesignation],
                    ["Employment", open.employmentStatus],
                    ["Notice period", open.noticePeriod],
                    ["Expected CTC", open.expectedCTC],
                    ["Willing to relocate", open.willingToRelocate],
                  ]
                    .filter(([, v]) => v)
                    .map(([k, v]) => (
                      <div key={k}>
                        <dt className="text-[8px] text-[#64748b]">{k}</dt>
                        <dd className="font-medium">{v}</dd>
                      </div>
                    ))}
                </dl>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[9px] text-[#64748b]">Status</span>
              {STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(open, s)}
                  className={`rounded-full px-3 py-1 text-[9px] font-semibold ${open.status === s ? STATUS_META[s].pill : "bg-[#f1f5f9] text-[#475569]"}`}
                >
                  {STATUS_META[s].label}
                </button>
              ))}
            </div>

            {open.resume && (
              <a
                href={open.resume}
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-fit items-center gap-2 rounded-[6px] bg-[#15633a] px-3 py-2 text-[9px] font-semibold text-white"
              >
                <ExternalLink className="h-4 w-4" /> Open resume
              </a>
            )}

            <div>
              <p className="mb-1 text-[9px] font-semibold text-[#334155]">Cover letter</p>
              <p className="whitespace-pre-line rounded-[8px] border border-[#eef2f6] p-3 text-[9.5px] leading-6 text-[#334155]">
                {open.coverLetter?.trim() || "No cover letter."}
              </p>
            </div>

            <div>
              <p className="mb-1 text-[9px] font-semibold text-[#334155]">HR notes (only visible in the admin)</p>
              <textarea
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                rows={4}
                maxLength={5000}
                placeholder="e.g. Called on 16 Oct — interview on Monday"
                className="w-full rounded-[8px] border border-[#dfe3e8] p-3 text-[9.5px] outline-none focus:border-[#15633a]"
              />
              <button
                type="button"
                onClick={saveNotes}
                disabled={savingNotes || notesDraft === (open.notes || "")}
                className="mt-2 rounded-[6px] bg-[#15633a] px-3 py-1.5 text-[9px] font-semibold text-white disabled:opacity-50"
              >
                {savingNotes ? "Saving…" : "Save notes"}
              </button>
            </div>

            <button
              type="button"
              onClick={() => remove(open)}
              className="mt-auto inline-flex w-fit items-center gap-1 rounded-[6px] border border-[#fecaca] px-3 py-1.5 text-[9px] font-semibold text-[#dc2626]"
            >
              <Trash2 className="h-4 w-4" /> Delete application
            </button>
          </aside>
        </div>
      )}
    </div>
  );
}
