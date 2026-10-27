"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  OrganicPage,
  PageHeader,
  HeaderButton,
  StatCard,
  StatGrid,
  FilterBar,
  SearchBox,
  FilterSelect,
  ResetButton,
  MainWithSidebar,
  TableCard,
  theadRowClass,
  thClass,
  rowClass,
  LoadingRows,
  EmptyRow,
  Pagination,
  SideCard,
  SummaryDonut,
  SidebarBar,
  QuickActions,
  Pill,
} from "@/components/organic/OrganicUI";
import { useApiGet } from "@/lib/useApiGet";
import { api, authHeader, getBackendUrl } from "@/lib/api";

type ApplicationStatus =
  | "received"
  | "shortlisted"
  | "interview_scheduled"
  | "rejected"
  | "hired";

type MatchLevel = "eligible" | "partial" | "not_eligible";

interface ApplicationItem {
  _id: string;
  applicationId?: string;
  jobId: string;
  jobTitle?: string;
  department?: string;
  profile?: {
    fullName: string;
    email: string;
    phone: string;
    photoUrl?: string;
    currentLocation?: string;
  };
  screeningResult?: {
    score: number;
    level: MatchLevel;
    breakdown?: Record<string, number>;
    strengths?: string[];
  };
  status: ApplicationStatus;
  createdAt: string;
  // Legacy compatibility fallbacks
  fullName?: string;
  email?: string;
  phone?: string;
  aiScore?: number;
}

interface ApplicationsApiResponse {
  items: ApplicationItem[];
  total: number;
  page: number;
  pages: number;
  stats: {
    total: number;
    received: number;
    shortlisted: number;
    interview: number;
    rejected: number;
    hired: number;
    averageMatch: number;
  };
}

const STATUS_META: Record<ApplicationStatus, { label: string; pill: string }> = {
  received: { label: "Received", pill: "bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]" },
  shortlisted: { label: "Shortlisted", pill: "bg-[#e6f6ea] text-[#15803d] border-[#bbf7d0]" },
  interview_scheduled: { label: "Interview", pill: "bg-[#f3e8ff] text-[#7e22ce] border-[#e9d5ff]" },
  rejected: { label: "Rejected", pill: "bg-[#fee2e2] text-[#b91c1c] border-[#fecaca]" },
  hired: { label: "Hired", pill: "bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]" },
};

const LEVEL_META: Record<MatchLevel, { label: string; pill: string }> = {
  eligible: { label: "Eligible", pill: "bg-[#e8f5e9] text-[#23714a] border-[#a5d6a7]" },
  partial: { label: "Partial Match", pill: "bg-[#fff8e1] text-[#b78103] border-[#ffe082]" },
  not_eligible: { label: "Not Eligible", pill: "bg-[#ffebee] text-[#c62828] border-[#ef9a9a]" },
};

export default function CareerApplicationsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [jobFilter, setJobFilter] = useState<string>("all");
  const [exporting, setExporting] = useState(false);

  const queryParams = new URLSearchParams({
    page: String(page),
    limit: "10",
  });
  if (search.trim()) queryParams.set("search", search.trim());
  if (statusFilter !== "all") queryParams.set("status", statusFilter);
  if (levelFilter !== "all") queryParams.set("level", levelFilter);
  if (jobFilter !== "all") queryParams.set("jobId", jobFilter);

  const { data, loading, reload } = useApiGet<ApplicationsApiResponse>(
    `/careers/admin/applications?${queryParams.toString()}`
  );

  const applications = data?.items || [];
  const stats = data?.stats || {
    total: 0,
    received: 0,
    shortlisted: 0,
    interview: 0,
    rejected: 0,
    hired: 0,
    averageMatch: 0,
  };

  // Distinct job titles
  const jobOptions = useMemo(() => {
    const map = new Map<string, string>();
    applications.forEach((a) => {
      if (a.jobId && a.jobTitle) {
        map.set(a.jobId, a.jobTitle);
      }
    });
    return Array.from(map.entries());
  }, [applications]);

  const handleStatusChange = async (appId: string, nextStatus: ApplicationStatus) => {
    try {
      await api.patch(`/careers/admin/applications/${appId}/status`, {
        status: nextStatus,
        note: `Status updated to ${STATUS_META[nextStatus].label} from applications board`,
      });
      reload();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Status Update Failed",
        text: err instanceof Error ? err.message : "Could not update status.",
        confirmButtonColor: "#293681",
      });
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${getBackendUrl()}/api/v1/careers/admin/applications/export.csv`, {
        headers: authHeader(),
      });
      if (!res.ok) throw new Error("Failed to export applications.");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ensis-career-applications-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Export Failed",
        text: err instanceof Error ? err.message : "Could not export CSV.",
        confirmButtonColor: "#293681",
      });
    } finally {
      setExporting(false);
    }
  };

  const donutSlices = [
    { label: "Received", value: stats.received, color: "#0284c7" },
    { label: "Shortlisted", value: stats.shortlisted, color: "#16a34a" },
    { label: "Interview", value: stats.interview, color: "#9333ea" },
    { label: "Rejected", value: stats.rejected, color: "#dc2626" },
    { label: "Hired", value: stats.hired, color: "#0d9488" },
  ];

  return (
    <OrganicPage>
      {/* HEADER */}
      <PageHeader
        title="Career Applications"
        subtitle="Review candidate submissions, AI match scores, screening profiles, and hiring stages"
        actions={
          <>
            <HeaderButton icon={Download} onClick={handleExportCsv} disabled={exporting}>
              {exporting ? "Exporting…" : "Export CSV"}
            </HeaderButton>
            <HeaderButton icon={Briefcase} href="/job-postings" primary>
              Job Postings
            </HeaderButton>
          </>
        }
      />

      {/* STAT CARDS */}
      <div className="mt-4">
        <StatGrid columns={6}>
          <StatCard
            label="Total Applications"
            value={stats.total}
            tone="slate"
            icon={Users}
            active={statusFilter === "all"}
            onClick={() => {
              setStatusFilter("all");
              setPage(1);
            }}
          />
          <StatCard
            label="Received"
            value={stats.received}
            tone="blue"
            icon={FileText}
            active={statusFilter === "received"}
            onClick={() => {
              setStatusFilter("received");
              setPage(1);
            }}
          />
          <StatCard
            label="Shortlisted"
            value={stats.shortlisted}
            tone="emerald"
            icon={UserCheck}
            active={statusFilter === "shortlisted"}
            onClick={() => {
              setStatusFilter("shortlisted");
              setPage(1);
            }}
          />
          <StatCard
            label="Interview"
            value={stats.interview}
            tone="violet"
            icon={Clock}
            active={statusFilter === "interview_scheduled"}
            onClick={() => {
              setStatusFilter("interview_scheduled");
              setPage(1);
            }}
          />
          <StatCard
            label="Rejected"
            value={stats.rejected}
            tone="rose"
            icon={XCircle}
            active={statusFilter === "rejected"}
            onClick={() => {
              setStatusFilter("rejected");
              setPage(1);
            }}
          />
          <StatCard
            label="Avg Match Score"
            value={`${stats.averageMatch}%`}
            tone="amber"
            icon={Sparkles}
            note="AI CV screening avg"
          />
        </StatGrid>
      </div>

      {/* FILTER BAR */}
      <FilterBar>
        <SearchBox
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by candidate name, application ID, email or job…"
        />

        <FilterSelect
          value={statusFilter}
          onChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
        >
          <option value="all">All Statuses</option>
          <option value="received">Received</option>
          <option value="shortlisted">Shortlisted</option>
          <option value="interview_scheduled">Interview Scheduled</option>
          <option value="rejected">Rejected</option>
          <option value="hired">Hired</option>
        </FilterSelect>

        <FilterSelect
          value={levelFilter}
          onChange={(v) => {
            setLevelFilter(v);
            setPage(1);
          }}
        >
          <option value="all">All Match Levels</option>
          <option value="eligible">Eligible (≥ 70%)</option>
          <option value="partial">Partial Match (50-69%)</option>
          <option value="not_eligible">Not Eligible (&lt; 50%)</option>
        </FilterSelect>

        {jobOptions.length > 0 && (
          <FilterSelect
            value={jobFilter}
            onChange={(v) => {
              setJobFilter(v);
              setPage(1);
            }}
          >
            <option value="all">All Jobs</option>
            {jobOptions.map(([id, title]) => (
              <option key={id} value={id}>
                {title}
              </option>
            ))}
          </FilterSelect>
        )}

        <ResetButton
          onClick={() => {
            setSearch("");
            setStatusFilter("all");
            setLevelFilter("all");
            setJobFilter("all");
            setPage(1);
          }}
        />
      </FilterBar>

      {/* MAIN TWO-COLUMN LAYOUT */}
      <MainWithSidebar
        sidebar={
          <>
            <SideCard title="Application Status">
              <SummaryDonut slices={donutSlices} centerLabel="TOTAL" />
            </SideCard>

            <SideCard title="Status Pipeline">
              <div className="space-y-2">
                <SidebarBar
                  label="Received"
                  value={stats.received}
                  total={stats.total}
                  color="#0284c7"
                />
                <SidebarBar
                  label="Shortlisted"
                  value={stats.shortlisted}
                  total={stats.total}
                  color="#16a34a"
                />
                <SidebarBar
                  label="Interview"
                  value={stats.interview}
                  total={stats.total}
                  color="#9333ea"
                />
                <SidebarBar
                  label="Rejected"
                  value={stats.rejected}
                  total={stats.total}
                  color="#dc2626"
                />
                <SidebarBar
                  label="Hired"
                  value={stats.hired}
                  total={stats.total}
                  color="#0d9488"
                />
              </div>
            </SideCard>

            <QuickActions
              actions={[
                { label: "Job Postings", icon: Briefcase, href: "/job-postings" },
                { label: "Career Settings", icon: Filter, href: "/career-settings" },
                { label: "Export to CSV", icon: Download, onClick: handleExportCsv },
              ]}
            />
          </>
        }
      >
        <TableCard
          footer={
            <Pagination
              page={page}
              pages={data?.pages || 1}
              total={data?.total || 0}
              from={Math.min((page - 1) * 10 + 1, data?.total || 0)}
              to={Math.min(page * 10, data?.total || 0)}
              noun="applications"
              onPage={setPage}
            />
          }
        >
          <table className="w-full min-w-[850px] border-collapse text-left">
            <thead>
              <tr className={theadRowClass}>
                <th className={`${thClass} w-[140px]`}>Application ID</th>
                <th className={`${thClass} min-w-[180px]`}>Candidate</th>
                <th className={`${thClass} min-w-[160px]`}>Applied Role</th>
                <th className={`${thClass} w-[130px]`}>AI Match</th>
                <th className={`${thClass} w-[140px]`}>Status</th>
                <th className={`${thClass} w-[120px]`}>Submitted</th>
                <th className={`${thClass} w-[100px] text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E9ECF0]">
              {loading ? (
                <LoadingRows colSpan={7} rows={6} />
              ) : applications.length === 0 ? (
                <EmptyRow colSpan={7}>
                  No career applications found matching the selected filters.
                </EmptyRow>
              ) : (
                applications.map((app) => {
                  const appId = app.applicationId || app._id;
                  const name = app.profile?.fullName || app.fullName || "Candidate";
                  const email = app.profile?.email || app.email || "—";
                  const phone = app.profile?.phone || app.phone || "";
                  const jobName = app.jobTitle || "Ayurvedic Specialist";
                  const dept = app.department || "Ensis Wellness";
                  const score = app.screeningResult?.score ?? app.aiScore ?? 0;
                  const level: MatchLevel =
                    app.screeningResult?.level ||
                    (score >= 70 ? "eligible" : score >= 50 ? "partial" : "not_eligible");
                  const currentStatus = (app.status || "received") as ApplicationStatus;

                  return (
                    <tr key={app._id} className={rowClass}>
                      {/* ID */}
                      <td className="px-2 py-2">
                        <Link
                          href={`/career-applications/${appId}`}
                          className="font-mono text-[9px] font-bold text-[#293681] hover:underline"
                        >
                          {appId}
                        </Link>
                      </td>

                      {/* Candidate */}
                      <td className="px-2 py-2">
                        <div className="flex items-center gap-2">
                          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#f4ece1] font-bold text-[10px] text-[#163a2b]">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <Link
                              href={`/career-applications/${appId}`}
                              className="truncate block text-[10px] font-bold text-[#0f172a] hover:text-[#293681]"
                            >
                              {name}
                            </Link>
                            <p className="truncate text-[8.5px] text-[#64748b]">{email}</p>
                            {phone && <p className="truncate text-[8px] text-[#94a3b8]">{phone}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-2 py-2">
                        <p className="truncate text-[10px] font-bold text-[#1e293b]">{jobName}</p>
                        <p className="truncate text-[8.5px] text-[#64748b]">{dept}</p>
                      </td>

                      {/* AI Match */}
                      <td className="px-2 py-2">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-bold text-[11px] text-[#0f172a]">
                            {score}%
                          </span>
                          <Pill className={LEVEL_META[level]?.pill || "bg-slate-100 text-slate-700"}>
                            {LEVEL_META[level]?.label || level}
                          </Pill>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-2 py-2">
                        <select
                          value={currentStatus}
                          onChange={(e) =>
                            handleStatusChange(appId, e.target.value as ApplicationStatus)
                          }
                          className={`h-[24px] cursor-pointer rounded-[4px] border px-2 text-[8px] font-bold outline-none ${
                            STATUS_META[currentStatus]?.pill || "bg-white text-slate-700"
                          }`}
                        >
                          <option value="received">Received</option>
                          <option value="shortlisted">Shortlisted</option>
                          <option value="interview_scheduled">Interview</option>
                          <option value="rejected">Rejected</option>
                          <option value="hired">Hired</option>
                        </select>
                      </td>

                      {/* Submitted */}
                      <td className="px-2 py-2 text-[9px] text-[#64748b] whitespace-nowrap">
                        {app.createdAt
                          ? new Date(app.createdAt).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-2 py-2 text-right">
                        <Link
                          href={`/career-applications/${appId}`}
                          className="inline-flex items-center gap-1 rounded-[4px] border border-[#cbd5e1] bg-white px-2 py-1 text-[8.5px] font-bold text-[#293681] hover:bg-[#eff6ff] transition"
                        >
                          <Eye size={11} />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </TableCard>
      </MainWithSidebar>
    </OrganicPage>
  );
}
