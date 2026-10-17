/** Shared types and options for the Leads CRM pages (match backend models/lead.model.ts) */

export type Lead = {
  _id: string;
  leadImage?: string;
  firstName: string;
  lastName?: string;
  companyName: string;
  designation?: string;
  email: string;
  officialEmail?: string;
  phone: string;
  phoneCode?: string;
  altPhone?: string;
  website?: string;
  title?: string;
  typeOfBusiness?: string;
  industrySector?: string;
  marketType?: "Domestic" | "International";
  leadType?: "Individual" | "Corporate";
  leadSource?: string;
  leadStatus?: "New" | "Contacted" | "Qualified" | "Negotiation" | "Converted" | "Lost";
  priority?: "High" | "Medium" | "Low";
  assignedTo?: { _id: string; name?: string; email?: string } | string | null;
  eventAttribution?: string;
  leadDate?: string;
  followUpDate?: string;
  followUpTime?: string;
  followUpMethod?: "WhatsApp" | "Email" | "Phone" | "Meeting" | "Other";
  interestedProduct?: string;
  expectedBudget?: string;
  estimatedDealValue?: string;
  expectedClosingDate?: string;
  addressLine?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  leadNotes?: string;
  internalNotes?: string;
  leadCategory?: "hot" | "cold";
  createdAt?: string;
};

export const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Negotiation", "Converted", "Lost"] as const;
export const PRIORITIES = ["High", "Medium", "Low"] as const;
export const LEAD_SOURCES = ["Website", "WhatsApp", "Instagram", "Facebook", "Google", "LinkedIn", "Referral", "Cold Call", "Event", "Other"] as const;
export const FOLLOW_UP_METHODS = ["Phone", "WhatsApp", "Email", "Meeting", "Other"] as const;

export const leadStatusTone: Record<string, string> = {
  New: "bg-blue-50 text-blue-700 border-blue-200",
  Contacted: "bg-sky-50 text-sky-700 border-sky-200",
  Qualified: "bg-violet-50 text-violet-700 border-violet-200",
  Negotiation: "bg-amber-50 text-amber-700 border-amber-200",
  Converted: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Lost: "bg-slate-100 text-slate-500 border-slate-200",
};

export const priorityTone: Record<string, string> = {
  High: "text-rose-600",
  Medium: "text-amber-600",
  Low: "text-slate-500",
};

export const leadName = (lead: Pick<Lead, "firstName" | "lastName">) => [lead.firstName, lead.lastName].filter(Boolean).join(" ");

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const isOpenLead = (lead: Pick<Lead, "leadStatus">) => lead.leadStatus !== "Converted" && lead.leadStatus !== "Lost";

export const assigneeName = (lead: Pick<Lead, "assignedTo">) =>
  lead.assignedTo && typeof lead.assignedTo === "object" ? lead.assignedTo.name || lead.assignedTo.email || "" : "";
