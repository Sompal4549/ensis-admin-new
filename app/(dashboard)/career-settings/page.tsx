"use client";

import { useEffect, useState } from "react";
import {
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Save,
  Shield,
  Sliders,
  Sparkles,
  Trash2,
  Users,
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

interface CareerSettingsData {
  hrEmails: string[];
  defaultEligibilityThreshold: number;
  defaultPartialMatchMin: number;
  hrContact: {
    email: string;
    phone: string;
    address: string;
  };
  retentionDays: number;
  resultMessages?: {
    eligible?: string;
    partial?: string;
    notEligible?: string;
  };
}

export default function CareerSettingsPage() {
  const { data, loading, reload } = useApiGet<CareerSettingsData>("/careers/admin/settings");

  const [hrEmails, setHrEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [eligibilityThreshold, setEligibilityThreshold] = useState(70);
  const [partialMatchMin, setPartialMatchMin] = useState(50);
  const [hrEmail, setHrEmail] = useState("careers@ensis.in");
  const [hrPhone, setHrPhone] = useState("+91 98765 43210");
  const [hrAddress, setHrAddress] = useState("Ensis Wellness Spaces, Industrial Area, Phase II, Ghaziabad, Delhi NCR, India");
  const [retentionDays, setRetentionDays] = useState(30);
  const [saving, setSaving] = useState(false);

  // Sync loaded data into state
  useEffect(() => {
    if (data) {
      setHrEmails(data.hrEmails || []);
      setEligibilityThreshold(data.defaultEligibilityThreshold ?? 70);
      setPartialMatchMin(data.defaultPartialMatchMin ?? 50);
      if (data.hrContact) {
        setHrEmail(data.hrContact.email || "careers@ensis.in");
        setHrPhone(data.hrContact.phone || "+91 98765 43210");
        setHrAddress(data.hrContact.address || "Ensis Wellness Spaces, Industrial Area, Phase II, Ghaziabad, Delhi NCR, India");
      }
      setRetentionDays(data.retentionDays ?? 30);
    }
  }, [data]);

  const handleAddEmail = () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (!trimmed) return;
    if (!trimmed.includes("@") || !trimmed.includes(".")) {
      Swal.fire({ icon: "warning", title: "Invalid Email", text: "Please enter a valid email address." });
      return;
    }
    if (hrEmails.includes(trimmed)) {
      Swal.fire({ icon: "info", title: "Already Added", text: "This email address is already in the recipient list." });
      return;
    }
    setHrEmails([...hrEmails, trimmed]);
    setNewEmail("");
  };

  const handleRemoveEmail = (index: number) => {
    setHrEmails(hrEmails.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/careers/admin/settings", {
        hrEmails,
        defaultEligibilityThreshold: Number(eligibilityThreshold),
        defaultPartialMatchMin: Number(partialMatchMin),
        hrContact: {
          email: hrEmail.trim(),
          phone: hrPhone.trim(),
          address: hrAddress.trim(),
        },
        retentionDays: Number(retentionDays),
      });

      Swal.fire({
        icon: "success",
        title: "Settings Saved",
        text: "Career configuration has been updated successfully.",
        timer: 2000,
        showConfirmButton: false,
      });

      reload();
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Save Failed",
        text: err instanceof Error ? err.message : "Failed to save settings.",
        confirmButtonColor: "#293681",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <OrganicPage>
        <div className="flex h-[350px] w-full items-center justify-center">
          <p className="text-[11px] font-semibold text-[#64748b]">Loading career settings…</p>
        </div>
      </OrganicPage>
    );
  }

  return (
    <OrganicPage>
      {/* HEADER */}
      <PageHeader
        title="Career Settings"
        subtitle="Manage HR notification emails, AI match thresholds, public candidate contact details, and data retention rules"
        actions={
          <HeaderButton icon={Save} onClick={handleSave} primary disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </HeaderButton>
        }
      />

      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* 1. HR NOTIFICATION EMAILS */}
        <SectionCard title="HR Notification Recipients" icon={Mail}>
          <div className="space-y-3 p-1">
            <p className="text-[10px] text-[#475A83]">
              Whenever a candidate completes an application, a comprehensive notification email
              mirroring the HR review sheet is automatically dispatched to all recipients listed below:
            </p>

            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {hrEmails.length === 0 ? (
                <div className="rounded-[6px] border border-dashed border-amber-300 bg-amber-50/60 p-3 text-center text-[10px] text-amber-800">
                  No recipient emails configured yet. Add at least one HR address to receive candidate alerts.
                </div>
              ) : (
                hrEmails.map((email, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-[6px] border border-[#e2e8f0] bg-white p-2 text-[10.5px]"
                  >
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-[#2563eb]" />
                      <span className="font-semibold text-[#0f172a]">{email}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveEmail(idx)}
                      className="rounded p-1 text-slate-400 hover:text-red-600"
                      title="Remove recipient"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddEmail();
                  }
                }}
                placeholder="e.g. hr@ensis.in, talent@ensis.in"
                className="h-[32px] flex-1 rounded-[6px] border border-[#cbd5e1] px-2.5 text-[10px] outline-none focus:border-[#293681]"
              />
              <button
                type="button"
                onClick={handleAddEmail}
                className="flex h-[32px] items-center gap-1 rounded-[6px] bg-[#293681] px-3 text-[10px] font-bold text-white hover:bg-[#1f2a6b]"
              >
                <Plus size={12} />
                Add Recipient
              </button>
            </div>
          </div>
        </SectionCard>

        {/* 2. DEFAULT AI SCREENING THRESHOLDS */}
        <SectionCard title="Default AI Eligibility Thresholds" icon={Sliders}>
          <div className="space-y-4 p-1">
            <p className="text-[10px] text-[#475A83]">
              Default match score thresholds applied to new job postings. Individual jobs can override these thresholds.
            </p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-[10px] font-bold text-[#1e293b]">
                  Eligible Threshold (%) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={eligibilityThreshold}
                  onChange={(e) => setEligibilityThreshold(Number(e.target.value))}
                  className="h-[32px] w-full rounded-[6px] border border-[#cbd5e1] px-2.5 text-[10.5px] font-bold text-[#1e293b] outline-none"
                />
                <p className="mt-1 text-[8.5px] text-[#64748b]">
                  Candidates scoring ≥ this value are classified as <strong>Eligible</strong>.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-[10px] font-bold text-[#1e293b]">
                  Partial Match Minimum (%) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={partialMatchMin}
                  onChange={(e) => setPartialMatchMin(Number(e.target.value))}
                  className="h-[32px] w-full rounded-[6px] border border-[#cbd5e1] px-2.5 text-[10.5px] font-bold text-[#1e293b] outline-none"
                />
                <p className="mt-1 text-[8.5px] text-[#64748b]">
                  Candidates scoring between {partialMatchMin}% and {eligibilityThreshold - 1}% are <strong>Partial Match</strong>.
                </p>
              </div>
            </div>

            {/* VISUAL BAND PREVIEW */}
            <div className="rounded-[6px] border border-[#e2e8f0] bg-[#f8fafc] p-3 text-[10px]">
              <span className="mb-2 block font-bold uppercase tracking-wider text-[#64748b]">
                Screening Bands Visualizer
              </span>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-[#23714a]">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    Eligible:
                  </span>
                  <span className="font-mono font-bold text-[#23714a]">
                    {eligibilityThreshold}% – 100%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-[#b78103]">
                    <span className="h-2 w-2 rounded-full bg-amber-500" />
                    Partial Match:
                  </span>
                  <span className="font-mono font-bold text-[#b78103]">
                    {partialMatchMin}% – {eligibilityThreshold - 1}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-bold text-[#c62828]">
                    <span className="h-2 w-2 rounded-full bg-red-600" />
                    Not Eligible:
                  </span>
                  <span className="font-mono font-bold text-[#c62828]">
                    0% – {partialMatchMin - 1}% (Application Rejected)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* 3. HR CONTACT DETAILS */}
        <SectionCard title="Public HR & Candidate Contact" icon={Phone}>
          <div className="space-y-3 p-1">
            <p className="text-[10px] text-[#475A83]">
              These details appear in candidate confirmation emails and the storefront careers assistance footer.
            </p>

            <div>
              <label className="mb-1 block text-[10px] font-bold text-[#1e293b]">HR Email Address *</label>
              <input
                type="email"
                value={hrEmail}
                onChange={(e) => setHrEmail(e.target.value)}
                className="h-[32px] w-full rounded-[6px] border border-[#cbd5e1] px-2.5 text-[10px] text-[#1e293b] outline-none focus:border-[#293681]"
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold text-[#1e293b]">HR Phone / Support Line *</label>
              <input
                type="text"
                value={hrPhone}
                onChange={(e) => setHrPhone(e.target.value)}
                className="h-[32px] w-full rounded-[6px] border border-[#cbd5e1] px-2.5 text-[10px] text-[#1e293b] outline-none focus:border-[#293681]"
              />
            </div>

            <div>
              <label className="mb-1 block text-[10px] font-bold text-[#1e293b]">Campus / Office Address *</label>
              <textarea
                rows={2}
                value={hrAddress}
                onChange={(e) => setHrAddress(e.target.value)}
                className="w-full rounded-[6px] border border-[#cbd5e1] p-2 text-[10px] text-[#1e293b] outline-none focus:border-[#293681]"
              />
            </div>
          </div>
        </SectionCard>

        {/* 4. DATA RETENTION & PRIVACY */}
        <SectionCard title="Data Retention & Privacy Compliance" icon={Shield}>
          <div className="space-y-3 p-1">
            <p className="text-[10px] text-[#475A83]">
              Controls how long unsubmitted candidate CVs and screening sessions are retained before automatic deletion.
            </p>

            <div>
              <label className="mb-1 block text-[10px] font-bold text-[#1e293b]">
                Screening Sessions & Private CV Retention (Days) *
              </label>
              <input
                type="number"
                min={7}
                max={365}
                value={retentionDays}
                onChange={(e) => setRetentionDays(Number(e.target.value))}
                className="h-[32px] w-full rounded-[6px] border border-[#cbd5e1] px-2.5 text-[10.5px] font-bold text-[#1e293b] outline-none focus:border-[#293681]"
              />
              <p className="mt-1 text-[8.5px] text-[#64748b]">
                MongoDB TTL index automatically purges screening sessions after {retentionDays} days.
              </p>
            </div>

            <div className="rounded-[6px] bg-[#f0fdf4] border border-[#bbf7d0] p-3 text-[10px] text-[#166534]">
              <div className="flex items-center gap-1.5 font-bold mb-1">
                <CheckCircle2 size={13} />
                <span>Secure Isolated Storage</span>
              </div>
              <p className="text-[9px] leading-relaxed">
                Candidate resumes and identity verification documents are kept in isolated private storage with HMAC-SHA256
                signed short-lived URLs. They are never exposed to public search crawlers or static web roots.
              </p>
            </div>
          </div>
        </SectionCard>
      </div>
    </OrganicPage>
  );
}
