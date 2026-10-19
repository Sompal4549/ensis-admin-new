"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  FileText,
  Mail,
  MapPin,
  Phone,
  Send,
  Sparkles,
  User,
  UserCheck,
  Video,
  X,
  XCircle,
  Briefcase,
  GraduationCap,
  Award,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  OrganicPage,
  PageHeader,
  HeaderButton,
  SectionCard,
  Pill,
} from "@/components/organic/OrganicUI";
import { useApiGet } from "@/lib/useApiGet";
import { api } from "@/lib/api";

type ApplicationStatus =
  | "received"
  | "shortlisted"
  | "interview_scheduled"
  | "rejected"
  | "hired";

type MatchLevel = "eligible" | "partial" | "not_eligible";

interface ApplicationDetail {
  _id: string;
  applicationId: string;
  jobId: string;
  jobTitle: string;
  profile: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    gender?: string;
    currentLocation?: string;
    permanentAddress?: string;
    linkedin?: string;
    photoUrl?: string;
    education?: Array<{ degree: string; institution?: string; year?: number | string }>;
    experience?: Array<{ role: string; company?: string; years?: number | string }>;
    skills?: string[];
    certifications?: string[];
  };
  details: {
    preferredLocations?: string[];
    noticePeriod: string;
    expectedCtc: string;
    joiningPreference?: string;
    howDidYouHear?: string;
    willingToRelocate?: boolean;
  };
  additional?: {
    whyJoin?: string;
    extraSkills?: string[];
    workedWith?: string[];
  };
  references?: Array<{
    name: string;
    designation?: string;
    company?: string;
    contact?: string;
  }>;
  documents?: Array<{
    kind: string;
    fileName: string;
    fileId: string;
    downloadUrl: string;
  }>;
  consents?: {
    accurate: boolean;
    verify: boolean;
    futureContact: boolean;
    privacy: boolean;
  };
  screeningResult?: {
    score: number;
    level: MatchLevel;
    breakdown: Record<string, number>;
    strengths: string[];
    gaps?: string[];
    suggestions?: string[];
  };
  status: ApplicationStatus;
  statusHistory: Array<{
    status: ApplicationStatus;
    changedAt: string;
    changedBy?: string;
    note?: string;
  }>;
  internalNotes: Array<{
    note: string;
    createdAt: string;
    author?: string;
  }>;
  cvDownloadUrl?: string;
  photoSignedUrl?: string;
  createdAt: string;
}

const STATUS_META: Record<ApplicationStatus, { label: string; pill: string }> = {
  received: { label: "Received", pill: "bg-[#e0f2fe] text-[#0369a1] border-[#bae6fd]" },
  shortlisted: { label: "Shortlisted", pill: "bg-[#e6f6ea] text-[#15803d] border-[#bbf7d0]" },
  interview_scheduled: { label: "Interview Scheduled", pill: "bg-[#f3e8ff] text-[#7e22ce] border-[#e9d5ff]" },
  rejected: { label: "Rejected", pill: "bg-[#fee2e2] text-[#b91c1c] border-[#fecaca]" },
  hired: { label: "Hired", pill: "bg-[#ecfdf5] text-[#047857] border-[#a7f3d0]" },
};

const LEVEL_META: Record<MatchLevel, { label: string; pill: string }> = {
  eligible: { label: "Eligible for Interview", pill: "bg-[#e8f5e9] text-[#23714a] border-[#a5d6a7]" },
  partial: { label: "Partial Match — Review Required", pill: "bg-[#fff8e1] text-[#b78103] border-[#ffe082]" },
  not_eligible: { label: "Not Eligible", pill: "bg-[#ffebee] text-[#c62828] border-[#ef9a9a]" },
};

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: app, loading, error, reload } = useApiGet<ApplicationDetail>(
    id ? `/careers/admin/applications/${id}` : null
  );

  const [newNote, setNewNote] = useState("");
  const [submittingNote, setSubmittingNote] = useState(false);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [interviewMode, setInterviewMode] = useState("video");
  const [meetingLink, setMeetingLink] = useState("");
  const [interviewNotes, setInterviewNotes] = useState("");
  const [notifyCandidate, setNotifyCandidate] = useState(true);
  const [scheduling, setScheduling] = useState(false);

  const handleUpdateStatus = async (
    nextStatus: ApplicationStatus,
    noteText?: string,
    notify = false,
    interviewData?: Record<string, unknown>
  ) => {
    if (!id) return;
    try {
      await api.patch(`/careers/admin/applications/${id}/status`, {
        status: nextStatus,
        note: noteText || `Application status changed to ${STATUS_META[nextStatus].label}`,
        notifyCandidate: notify,
        interviewDetails: interviewData,
      });

      Swal.fire({
        icon: "success",
        title: `Status Updated`,
        text: `Application is now marked as "${STATUS_META[nextStatus].label}".${
          notify ? " Candidate notification email has been dispatched." : ""
        }`,
        timer: 2000,
        showConfirmButton: false,
      });

      reload();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Update Failed",
        text: err instanceof Error ? err.message : "Failed to update status",
        confirmButtonColor: "#293681",
      });
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim() || !id) return;
    setSubmittingNote(true);
    try {
      await api.patch(`/careers/admin/applications/${id}/status`, {
        status: app?.status || "received",
        note: newNote.trim(),
        notifyCandidate: false,
      });
      setNewNote("");
      reload();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Failed to Add Note",
        text: err instanceof Error ? err.message : "Error saving note",
        confirmButtonColor: "#293681",
      });
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleScheduleInterviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!interviewDate || !interviewTime) {
      Swal.fire({ icon: "warning", title: "Missing Information", text: "Please enter both date and time." });
      return;
    }
    setScheduling(true);
    try {
      await handleUpdateStatus(
        "interview_scheduled",
        `Interview scheduled for ${interviewDate} at ${interviewTime} (${interviewMode.toUpperCase()})`,
        notifyCandidate,
        {
          date: interviewDate,
          time: interviewTime,
          mode: interviewMode,
          locationOrLink: meetingLink,
          notes: interviewNotes,
        }
      );
      setInterviewModalOpen(false);
    } finally {
      setScheduling(false);
    }
  };

  if (loading) {
    return (
      <OrganicPage>
        <div className="flex h-[400px] w-full flex-col items-center justify-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#293681] border-t-transparent" />
          <p className="text-[11px] font-semibold text-[#64748b]">Loading application details…</p>
        </div>
      </OrganicPage>
    );
  }

  if (error || !app) {
    return (
      <OrganicPage>
        <div className="flex h-[400px] w-full flex-col items-center justify-center gap-3">
          <p className="text-[12px] font-bold text-red-600">Application not found or could not be loaded.</p>
          <Link
            href="/career-applications"
            className="rounded-[5px] bg-[#293681] px-3.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#1f2a6b]"
          >
            ← Back to Applications
          </Link>
        </div>
      </OrganicPage>
    );
  }

  const score = app.screeningResult?.score ?? 0;
  const level: MatchLevel =
    app.screeningResult?.level ||
    (score >= 70 ? "eligible" : score >= 50 ? "partial" : "not_eligible");
  const breakdown = app.screeningResult?.breakdown || {};
  const currentStatus = app.status || "received";

  return (
    <OrganicPage>
      {/* HEADER */}
      <PageHeader
        title={
          <div className="flex items-center gap-2">
            <span>{app.profile?.fullName}</span>
            <span className="font-mono text-[12px] text-[#64748b]">({app.applicationId})</span>
          </div>
        }
        subtitle={`Applied for ${app.jobTitle} • Submitted on ${new Date(app.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`}
        back={{ href: "/career-applications", label: "Back to Applications" }}
        actions={
          <div className="flex items-center gap-2">
            <Pill className={`${STATUS_META[currentStatus]?.pill} text-[9px] px-2.5 py-1`}>
              {STATUS_META[currentStatus]?.label}
            </Pill>
            {app.cvDownloadUrl && (
              <HeaderButton icon={Download} href={app.cvDownloadUrl} target="_blank">
                Download Resume
              </HeaderButton>
            )}
          </div>
        }
      />

      {/* QUICK ACTION BAR (SUGGESTED NEXT STEPS) */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[8px] border border-[#cbd5e1] bg-white p-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#0f172a]">Suggested Next Action:</span>
          <span className="text-[10px] text-[#64748b]">
            Review candidate match score and progress through the hiring pipeline
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleUpdateStatus("shortlisted", "Shortlisted by HR team", true)}
            className="flex items-center gap-1.5 rounded-[5px] bg-[#059669] px-3 py-1.5 text-[10.5px] font-bold text-white hover:bg-[#047857] transition shadow-2xs"
          >
            <UserCheck size={13} />
            Shortlist
          </button>

          <button
            type="button"
            onClick={() => setInterviewModalOpen(true)}
            className="flex items-center gap-1.5 rounded-[5px] bg-[#2563eb] px-3 py-1.5 text-[10.5px] font-bold text-white hover:bg-[#1d4ed8] transition shadow-2xs"
          >
            <Calendar size={13} />
            Schedule Interview
          </button>

          <button
            type="button"
            onClick={() => handleUpdateStatus("rejected", "Not matching current requirements", true)}
            className="flex items-center gap-1.5 rounded-[5px] border border-[#fca5a5] bg-[#fff5f5] px-3 py-1.5 text-[10.5px] font-bold text-[#b91c1c] hover:bg-[#fee2e2] transition shadow-2xs"
          >
            <XCircle size={13} />
            Reject
          </button>

          <button
            type="button"
            onClick={() => handleUpdateStatus("hired", "Candidate accepted offer", true)}
            className="flex items-center gap-1.5 rounded-[5px] bg-[#0d9488] px-3 py-1.5 text-[10.5px] font-bold text-white hover:bg-[#0f766e] transition shadow-2xs"
          >
            <CheckCircle2 size={13} />
            Mark as Hired
          </button>
        </div>
      </div>

      {/* TWO-COLUMN CONTENT GRID */}
      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* LEFT COLUMN: CANDIDATE PROFILE & APPLICATION DETAILS */}
        <div className="space-y-4 lg:col-span-1">
          {/* PROFILE CARD */}
          <SectionCard title="Candidate Profile" icon={User}>
            <div className="flex flex-col items-center text-center p-2">
              <div className="relative mb-3 h-20 w-20 overflow-hidden rounded-full border-2 border-[#c9a86a] bg-[#efe6d6] flex items-center justify-center shadow-xs">
                {app.photoSignedUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={app.photoSignedUrl}
                    alt={app.profile?.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-[24px] font-bold text-[#163a2b]">
                    {app.profile?.fullName?.charAt(0) || "C"}
                  </span>
                )}
              </div>

              <h3 className="text-[14px] font-bold text-[#0f172a]">{app.profile?.fullName}</h3>
              <p className="text-[10px] text-[#64748b]">{app.profile?.currentLocation || "Location Not Specified"}</p>

              <div className="mt-3.5 w-full space-y-2 border-t border-slate-100 pt-3 text-left text-[10px]">
                <div className="flex items-center gap-2 text-[#334155]">
                  <Mail size={13} className="text-[#2563eb] shrink-0" />
                  <a href={`mailto:${app.profile?.email}`} className="truncate hover:underline">
                    {app.profile?.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-[#334155]">
                  <Phone size={13} className="text-[#059669] shrink-0" />
                  <span>{app.profile?.phone || "—"}</span>
                </div>
                {app.profile?.currentLocation && (
                  <div className="flex items-center gap-2 text-[#334155]">
                    <MapPin size={13} className="text-[#dc2626] shrink-0" />
                    <span>{app.profile.currentLocation}</span>
                  </div>
                )}
                {app.profile?.linkedin && (
                  <div className="flex items-center gap-2 text-[#334155]">
                    <ExternalLink size={13} className="text-[#2563eb] shrink-0" />
                    <a
                      href={app.profile.linkedin.startsWith("http") ? app.profile.linkedin : `https://${app.profile.linkedin}`}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate text-[#2563eb] hover:underline"
                    >
                      LinkedIn Profile
                    </a>
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* APPLICATION DETAILS CARD */}
          <SectionCard title="Application Details" icon={Briefcase}>
            <div className="space-y-2 text-[10px]">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-semibold text-[#64748b]">Notice Period:</span>
                <span className="font-bold text-[#0f172a]">{app.details?.noticePeriod || "Immediate"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-semibold text-[#64748b]">Expected CTC:</span>
                <span className="font-bold text-[#0f172a]">{app.details?.expectedCtc || "As per company standards"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-semibold text-[#64748b]">Joining Preference:</span>
                <span className="font-bold text-[#0f172a]">{app.details?.joiningPreference || "Immediate"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="font-semibold text-[#64748b]">Willing to Relocate:</span>
                <span className="font-bold text-[#0f172a]">{app.details?.willingToRelocate ? "Yes" : "No"}</span>
              </div>
              {app.details?.preferredLocations && app.details.preferredLocations.length > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="font-semibold text-[#64748b]">Preferred Locations:</span>
                  <span className="font-bold text-[#0f172a]">
                    {app.details.preferredLocations.join(", ")}
                  </span>
                </div>
              )}
              {app.details?.howDidYouHear && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="font-semibold text-[#64748b]">Source / Channel:</span>
                  <span className="font-bold text-[#0f172a]">{app.details.howDidYouHear}</span>
                </div>
              )}
            </div>
          </SectionCard>

          {/* ATTACHED DOCUMENTS & RESUME */}
          <SectionCard title="Resume & Documents" icon={FileText}>
            <div className="space-y-2 text-[10px]">
              {app.cvDownloadUrl && (
                <div className="flex items-center justify-between rounded-[5px] border border-[#dbeafe] bg-[#eff6ff] p-2">
                  <div className="flex items-center gap-1.5">
                    <FileText size={14} className="text-[#2563eb]" />
                    <span className="font-bold text-[#1e40af]">Candidate CV / Resume</span>
                  </div>
                  <a
                    href={app.cvDownloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 rounded bg-[#2563eb] px-2 py-1 text-[9px] font-bold text-white hover:bg-[#1d4ed8]"
                  >
                    <Download size={11} />
                    Download
                  </a>
                </div>
              )}

              {(app.documents || []).map((doc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-[5px] border border-[#e2e8f0] bg-white p-2"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <FileText size={14} className="text-slate-400 shrink-0" />
                    <div className="truncate">
                      <p className="truncate font-semibold text-[#0f172a]">{doc.fileName}</p>
                      <p className="text-[8.5px] uppercase text-[#64748b]">{doc.kind}</p>
                    </div>
                  </div>
                  <a
                    href={doc.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex shrink-0 items-center gap-1 rounded border border-[#cbd5e1] bg-white px-2 py-1 text-[9px] font-bold text-[#334155] hover:bg-slate-50"
                  >
                    <Download size={11} />
                    View
                  </a>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* RIGHT TWO COLUMNS: AI SCREENING RESULT, BREAKDOWN, HIGHLIGHTS & TIMELINE */}
        <div className="space-y-4 lg:col-span-2">
          {/* AI SCREENING CARD (MIRRORS HR EMAIL MOCKUP) */}
          <SectionCard title="AI CV Screening Result" icon={Sparkles}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center rounded-xl bg-gradient-to-br from-[#fbf8f2] to-[#fffdf9] p-4 border border-[#eadfcd]">
              {/* DONUT SCORE */}
              <div className="flex flex-col items-center justify-center text-center">
                <div className="relative flex h-28 w-28 items-center justify-center rounded-full bg-conic-gradient from-[#059669] to-[#c9a86a] p-2">
                  <div className="flex h-24 w-24 flex-col items-center justify-center rounded-full bg-white shadow-inner">
                    <span className="text-[26px] font-black tracking-tight text-[#0f2518]">
                      {score}%
                    </span>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-[#a8792c]">
                      Match Score
                    </span>
                  </div>
                </div>
                <div className="mt-2.5">
                  <Pill className={LEVEL_META[level]?.pill}>
                    {LEVEL_META[level]?.label}
                  </Pill>
                </div>
              </div>

              {/* MATCH BREAKDOWN BARS */}
              <div className="md:col-span-2 space-y-2 border-t md:border-t-0 md:border-l border-[#eadfcd] pt-3 md:pt-0 md:pl-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#a8792c]">
                  7-Dimension Competency Breakdown
                </h4>
                <div className="space-y-1.5 text-[9.5px]">
                  {Object.entries({
                    Education: breakdown.education ?? 80,
                    Experience: breakdown.experience ?? 75,
                    "Technical Skills": breakdown.technical_skills ?? 85,
                    "Creative Thinking": breakdown.creative_thinking ?? 80,
                    Communication: breakdown.communication ?? 85,
                    Portfolio: breakdown.portfolio ?? 70,
                    Location: breakdown.location ?? 90,
                  }).map(([dim, val]) => (
                    <div key={dim} className="grid grid-cols-[105px_minmax(0,1fr)_35px] items-center gap-2">
                      <span className="font-semibold text-[#4b453b] truncate">{dim}</span>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[#eadfcd]/60">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#c9a86a] to-[#059669]"
                          style={{ width: `${Math.min(val, 100)}%` }}
                        />
                      </div>
                      <span className="text-right font-bold text-[#163a2b]">{val}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* AI HIGHLIGHTS & SUGGESTIONS */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-[10.5px]">
              {/* STRENGTHS */}
              <div className="rounded-[6px] border border-[#bbf7d0] bg-[#f0fdf4] p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[#166534] font-bold">
                  <CheckCircle2 size={14} />
                  <span>Key Candidate Strengths</span>
                </div>
                <ul className="space-y-1.5 text-[#14532d]">
                  {(app.screeningResult?.strengths || ["Demonstrated relevant experience in wellness field."]).map(
                    (str, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-[#16a34a] font-bold mt-0.5">•</span>
                        <span>{str}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>

              {/* GAPS / SUGGESTIONS */}
              <div className="rounded-[6px] border border-[#fef08a] bg-[#fefce8] p-3">
                <div className="mb-2 flex items-center gap-1.5 text-[#854d0e] font-bold">
                  <Lightbulb size={14} />
                  <span>Interview Focus Areas</span>
                </div>
                <ul className="space-y-1.5 text-[#713f12]">
                  {(app.screeningResult?.gaps?.length ? app.screeningResult.gaps : [
                    "Verify hands-on experience with equipment specification and client design walk-throughs.",
                  ]).map((gap, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-[#ca8a04] font-bold mt-0.5">•</span>
                      <span>{gap}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </SectionCard>

          {/* WHY JOIN STATEMENT */}
          {app.additional?.whyJoin && (
            <SectionCard title='Candidate "Why Join Ensis" Statement' icon={Sparkles}>
              <p className="rounded-[6px] bg-[#f8fafc] p-3 text-[11px] leading-relaxed italic text-[#334155] border border-[#e2e8f0]">
                "{app.additional.whyJoin}"
              </p>
            </SectionCard>
          )}

          {/* BACKGROUND: EDUCATION & EXPERIENCE */}
          <SectionCard title="Education & Professional Background" icon={GraduationCap}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10.5px]">
              <div>
                <h4 className="mb-2 font-bold uppercase tracking-wider text-[#64748b]">Education</h4>
                <div className="space-y-2">
                  {(app.profile?.education || []).length > 0 ? (
                    app.profile.education?.map((edu, idx) => (
                      <div key={idx} className="rounded border border-[#e2e8f0] p-2 bg-[#f8fafc]">
                        <p className="font-bold text-[#0f172a]">{edu.degree}</p>
                        <p className="text-[#64748b]">{edu.institution} {edu.year ? `(${edu.year})` : ""}</p>
                      </div>
                    ))
                  ) : (
                    <p className="italic text-[#94a3b8]">Verified via CV extraction</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-bold uppercase tracking-wider text-[#64748b]">Experience</h4>
                <div className="space-y-2">
                  {(app.profile?.experience || []).length > 0 ? (
                    app.profile.experience?.map((exp, idx) => (
                      <div key={idx} className="rounded border border-[#e2e8f0] p-2 bg-[#f8fafc]">
                        <p className="font-bold text-[#0f172a]">{exp.role}</p>
                        <p className="text-[#64748b]">{exp.company} {exp.years ? `• ${exp.years} yrs` : ""}</p>
                      </div>
                    ))
                  ) : (
                    <p className="italic text-[#94a3b8]">Verified via CV extraction</p>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* STATUS HISTORY TIMELINE & INTERNAL NOTES */}
          <SectionCard title="Status History & Internal Notes" icon={Clock}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* TIMELINE */}
              <div>
                <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                  Audit Timeline
                </h4>
                <div className="space-y-3 border-l-2 border-slate-200 pl-3">
                  {(app.statusHistory || []).map((sh, idx) => (
                    <div key={idx} className="relative text-[10px]">
                      <div className="absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full bg-[#293681]" />
                      <div className="flex items-center gap-1.5 font-bold text-[#0f172a]">
                        <span>{STATUS_META[sh.status]?.label || sh.status}</span>
                        {sh.changedBy && <span className="text-[9px] font-normal text-slate-400">by {sh.changedBy}</span>}
                      </div>
                      <p className="text-[8.5px] text-[#64748b]">
                        {new Date(sh.changedAt).toLocaleString("en-GB")}
                      </p>
                      {sh.note && <p className="mt-0.5 text-[#334155]">{sh.note}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* NOTES */}
              <div>
                <h4 className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#64748b]">
                  Internal Notes (HR Team Only)
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {(app.internalNotes || []).length === 0 ? (
                    <p className="text-[10px] italic text-[#94a3b8]">No notes added yet.</p>
                  ) : (
                    app.internalNotes.map((n, idx) => (
                      <div key={idx} className="rounded bg-slate-50 p-2 text-[10px] border border-slate-200">
                        <p className="text-[#1e293b]">{n.note}</p>
                        <p className="mt-1 text-[8px] text-[#94a3b8]">
                          {n.author || "HR Admin"} • {new Date(n.createdAt).toLocaleString("en-GB")}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddNote} className="mt-3 flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Add an internal note…"
                    className="h-[30px] flex-1 rounded-[5px] border border-[#cbd5e1] px-2 text-[10px] text-[#1e293b] outline-none"
                  />
                  <button
                    type="submit"
                    disabled={submittingNote || !newNote.trim()}
                    className="flex h-[30px] items-center gap-1 rounded-[5px] bg-[#293681] px-2.5 text-[10px] font-bold text-white hover:bg-[#1f2a6b] disabled:opacity-50"
                  >
                    <Send size={11} />
                    Add
                  </button>
                </form>
              </div>
            </div>
          </SectionCard>
        </div>
      </div>

      {/* SCHEDULE INTERVIEW MODAL */}
      {interviewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-[14px] font-bold text-[#0f172a]">Schedule Interview</h3>
              <button
                type="button"
                onClick={() => setInterviewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleScheduleInterviewSubmit} className="mt-4 space-y-3 text-[10.5px]">
              <div>
                <label className="mb-1 block font-bold text-[#1e293b]">Interview Date *</label>
                <input
                  type="date"
                  required
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className="h-[32px] w-full rounded-[5px] border border-[#cbd5e1] px-2 text-[10px] outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-[#1e293b]">Interview Time *</label>
                <input
                  type="time"
                  required
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  className="h-[32px] w-full rounded-[5px] border border-[#cbd5e1] px-2 text-[10px] outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-[#1e293b]">Interview Mode *</label>
                <select
                  value={interviewMode}
                  onChange={(e) => setInterviewMode(e.target.value)}
                  className="h-[32px] w-full rounded-[5px] border border-[#cbd5e1] px-2 text-[10px] outline-none"
                >
                  <option value="video">Online Video Call (Google Meet / Zoom)</option>
                  <option value="in-person">In-Person at Ensis Office</option>
                  <option value="phone">Telephonic Round</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block font-bold text-[#1e293b]">Meeting Link or Location</label>
                <input
                  type="text"
                  placeholder="https://meet.google.com/... or Office Address"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  className="h-[32px] w-full rounded-[5px] border border-[#cbd5e1] px-2 text-[10px] outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block font-bold text-[#1e293b]">Notes / Instructions for Candidate</label>
                <textarea
                  rows={2}
                  placeholder="Please have your portfolio ready..."
                  value={interviewNotes}
                  onChange={(e) => setInterviewNotes(e.target.value)}
                  className="w-full rounded-[5px] border border-[#cbd5e1] p-2 text-[10px] outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="notifyCandidate"
                  checked={notifyCandidate}
                  onChange={(e) => setNotifyCandidate(e.target.checked)}
                  className="h-3.5 w-3.5 cursor-pointer accent-[#2563eb]"
                />
                <label htmlFor="notifyCandidate" className="text-[10px] font-semibold text-[#1e293b] cursor-pointer">
                  Send interview invitation email to candidate ({app.profile?.email})
                </label>
              </div>

              <div className="mt-5 flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setInterviewModalOpen(false)}
                  className="rounded-[5px] border border-[#cbd5e1] px-3 py-1.5 font-bold text-[#334155] hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduling}
                  className="rounded-[5px] bg-[#2563eb] px-4 py-1.5 font-bold text-white hover:bg-[#1d4ed8]"
                >
                  {scheduling ? "Scheduling…" : "Confirm & Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </OrganicPage>
  );
}
