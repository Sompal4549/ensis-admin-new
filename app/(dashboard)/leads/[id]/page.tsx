"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { Eye, FilePlus2, Mail, MessageCircle, Phone, Plus, Save, Trash2, X } from "lucide-react";
import { api } from "@/lib/api";
import { useApiGet } from "@/lib/useApiGet";
import { HeaderButton, OrganicPage, PageHeader, Pill, inputClass, labelClass, outlineButtonClass, primaryButtonClass } from "@/components/organic/OrganicUI";
import { capitalize, formatDate, formatINR, orderStatusTone, plainText, shortId, type Order } from "@/lib/sales";
import {
  FOLLOW_UP_METHODS,
  LEAD_SOURCES,
  LEAD_STATUSES,
  PRIORITIES,
  leadName,
  leadStatusTone,
  todayISO,
  type Lead,
} from "@/lib/leads";

type Staff = { _id: string; name?: string; email?: string; role?: string };
type LeadDoc = {
  _id: string;
  invoiceNumber: string;
  type: string;
  totalAmount: number;
  paymentReceived: number;
  status: string;
  createdAt?: string;
};
type ProductOption = { _id: string; title: string; price: number; discountPrice?: number; gstRate?: number; hsnCode?: string };
type EstimateItem = { product?: string; name: string; quantity: number; unitPrice: number; gstRate: number; hsn?: string };

const DOC_TYPES: Record<string, string> = {
  proforma: "Estimate / Proforma",
  tax: "Tax Invoice",
  delivery_challan: "Delivery Challan",
  credit_note: "Credit Note",
  debit_note: "Debit Note",
};

const EMPTY_LEAD: Partial<Lead> = {
  firstName: "",
  lastName: "",
  companyName: "",
  email: "",
  phoneCode: "+91",
  phone: "",
  leadSource: "Website",
  leadStatus: "New",
  priority: "Medium",
  leadType: "Individual",
  marketType: "Domestic",
  followUpMethod: "Phone",
  country: "India",
};

// Organic admin card: grey title bar (titleClass) on top of a white body
const cardClass = "overflow-hidden rounded-[7px] border border-[#e1e5ec] bg-white p-[12px] shadow-[rgba(0,0,0,0.02)_0px_1px_3px_0px,rgba(27,31,35,0.15)_0px_0px_0px_1px]";
const titleClass = "-mx-[12px] -mt-[12px] mb-[12px] flex h-[34px] items-center border-b border-slate-200/80 bg-[#f0f3f6] px-3 text-[11.5px] font-semibold tracking-[-0.01em] text-[#0f172a]";

const blankItem = (): EstimateItem => ({ name: "", quantity: 1, unitPrice: 0, gstRate: 18 });

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const isNew = id === "new";

  const { data: lead, loading, error, reload } = useApiGet<Lead>(isNew ? null : `/leads/${id}`);
  const { data: staff } = useApiGet<Staff[]>("/admin/users");
  const { data: ordersData } = useApiGet<{ orders: Order[]; total: number }>(isNew ? null : `/orders/lead/${id}?limit=50`);
  const { data: docsData, reload: reloadDocs } = useApiGet<{ invoices: LeadDoc[]; total: number }>(isNew ? null : `/invoices/lead/${id}?limit=50`);

  // Form starts from the saved lead (or blank for a new one) and resets when the lead reloads
  const [draft, setDraft] = useState<{ base: Lead | undefined; form: Partial<Lead> } | null>(null);
  const form: Partial<Lead> = draft && draft.base === lead ? draft.form : isNew ? { ...EMPTY_LEAD, followUpDate: todayISO() } : lead || {};
  const set = (patch: Partial<Lead>) => setDraft({ base: lead, form: { ...form, ...patch } });
  const [saving, setSaving] = useState(false);

  const [estimate, setEstimate] = useState<{ type: string; items: EstimateItem[]; discount: number; shipping: number; dueDate: string; notes: string } | null>(null);
  const { data: productsData } = useApiGet<{ products: ProductOption[] }>(estimate ? "/products?limit=100&page=1" : null);
  const products = productsData?.products || [];
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (error) Swal.fire({ title: "Could not load this lead", text: error instanceof Error ? error.message : "", icon: "error" });
  }, [error]);

  const field = (key: keyof Lead, label: string, opts: { type?: string; placeholder?: string; required?: boolean } = {}) => (
    <div>
      <label className={labelClass}>{label}{opts.required ? " *" : ""}</label>
      <input
        type={opts.type || "text"}
        value={String(form[key] ?? "")}
        onChange={(e) => set({ [key]: e.target.value } as Partial<Lead>)}
        placeholder={opts.placeholder}
        className={inputClass}
      />
    </div>
  );
  const select = (key: keyof Lead, label: string, options: readonly string[] | Array<{ value: string; label: string }>) => (
    <div>
      <label className={labelClass}>{label}</label>
      <select value={String(form[key] ?? "")} onChange={(e) => set({ [key]: e.target.value } as Partial<Lead>)} className={inputClass}>
        {options.map((o) => (typeof o === "string" ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>))}
      </select>
    </div>
  );

  const save = async () => {
    if (!form.firstName?.trim() || !form.companyName?.trim() || !form.email?.trim() || !form.phone?.trim()) {
      Swal.fire({ title: "First name, company, email and phone are required", icon: "warning" });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form } as Record<string, unknown>;
      delete payload._id;
      delete payload.createdAt;
      payload.assignedTo = form.assignedTo && typeof form.assignedTo === "object" ? form.assignedTo._id : form.assignedTo || undefined;
      if (isNew) {
        const created = await api.post<Lead>("/leads", payload);
        Swal.fire({ title: "Lead created", icon: "success", timer: 1100, showConfirmButton: false });
        router.replace(`/leads/${created._id}`);
      } else {
        await api.put(`/leads/${id}`, payload);
        setDraft(null);
        reload();
        Swal.fire({ title: "Lead saved", icon: "success", timer: 1100, showConfirmButton: false });
      }
    } catch (err) {
      Swal.fire({ title: "Could not save lead", text: err instanceof Error ? err.message : "", icon: "error" });
    } finally {
      setSaving(false);
    }
  };

  const viewDoc = async (docId: string) => {
    try {
      const html = await api.getHtml(`/invoices/${docId}/html`);
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
      }
    } catch (err) {
      Swal.fire({ title: "Could not open document", text: err instanceof Error ? err.message : "", icon: "error" });
    }
  };

  const updateItem = (index: number, patch: Partial<EstimateItem>) =>
    estimate && setEstimate({ ...estimate, items: estimate.items.map((item, i) => (i === index ? { ...item, ...patch } : item)) });

  const pickProduct = (index: number, productId: string) => {
    const product = products.find((p) => p._id === productId);
    if (!product) return updateItem(index, { product: undefined });
    updateItem(index, {
      product: product._id,
      name: plainText(product.title),
      unitPrice: product.discountPrice || product.price || 0,
      gstRate: product.gstRate ?? 18,
      hsn: product.hsnCode,
    });
  };

  const estimateTotals = (() => {
    const items = estimate?.items || [];
    const subtotal = items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
    const tax = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice * i.gstRate) / 100, 0);
    const total = Math.max(0, subtotal + tax - (estimate?.discount || 0) + (estimate?.shipping || 0));
    return { subtotal, tax, total };
  })();

  const createDocument = async () => {
    if (!estimate || !lead) return;
    const items = estimate.items.filter((i) => i.name.trim());
    if (!items.length || items.some((i) => i.quantity < 1 || i.unitPrice < 0)) {
      Swal.fire({ title: "Add at least one item with a name, quantity and price", icon: "warning" });
      return;
    }
    setCreating(true);
    try {
      const doc = await api.post<{ _id: string; invoiceNumber: string }>("/invoices", {
        lead: lead._id,
        type: estimate.type,
        items: items.map((i) => ({ ...i, name: i.name.trim(), quantity: Number(i.quantity), unitPrice: Number(i.unitPrice), gstRate: Number(i.gstRate) })),
        discount: Number(estimate.discount) || 0,
        shipping: Number(estimate.shipping) || 0,
        dueDate: estimate.dueDate || undefined,
        notes: estimate.notes,
        status: "draft",
        billingAddress: {
          name: lead.companyName || leadName(lead),
          phone: `${lead.phoneCode || ""}${lead.phone}`,
          addressLine: lead.addressLine,
          city: lead.city,
          state: lead.state,
          postalCode: lead.zipCode,
          country: lead.country,
        },
      });
      setEstimate(null);
      reloadDocs();
      await Swal.fire({ title: `${doc.invoiceNumber} created`, icon: "success", timer: 1300, showConfirmButton: false });
      viewDoc(doc._id);
    } catch (err) {
      Swal.fire({ title: "Could not create document", text: err instanceof Error ? err.message : "", icon: "error" });
    } finally {
      setCreating(false);
    }
  };

  if (!isNew && loading && !lead) {
    return <main className="p-[24px] text-[12px] font-semibold text-[#68758d]">Loading lead…</main>;
  }

  const phoneDigits = `${form.phoneCode || ""}${form.phone || ""}`.replace(/\D/g, "");
  const docs = docsData?.invoices || [];
  const orders = ordersData?.orders || [];
  const billed = docs.filter((d) => d.status !== "cancelled" && d.type === "tax").reduce((sum, d) => sum + d.totalAmount, 0);
  const received = docs.filter((d) => d.status !== "cancelled").reduce((sum, d) => sum + (d.paymentReceived || 0), 0);

  return (
    <OrganicPage>
      <PageHeader
        back={{ href: "/leads", label: "All leads" }}
        title={
          <>
            {isNew ? "Add New Lead" : leadName(lead || { firstName: "" }) || "Lead"}
            {!isNew && lead?.leadStatus && <Pill className={leadStatusTone[lead.leadStatus]}>{lead.leadStatus}</Pill>}
          </>
        }
        subtitle={isNew ? "Capture the enquiry, then plan the follow-up and send a quote." : `${lead?.companyName || ""} · added ${formatDate(lead?.createdAt)}`}
        actions={
          <>
            {!isNew && form.phone && (
              <>
                <a href={`tel:+${phoneDigits}`} className={outlineButtonClass}><Phone size={14} /> Call</a>
                <a href={`https://wa.me/${phoneDigits}`} target="_blank" rel="noreferrer" className={`${outlineButtonClass} text-[#15803d]`}><MessageCircle size={14} /> WhatsApp</a>
              </>
            )}
            {!isNew && form.email && <a href={`mailto:${form.email}`} className={outlineButtonClass}><Mail size={14} /> Email</a>}
            <HeaderButton icon={Save} disabled={saving} onClick={save} primary>{saving ? "Saving…" : isNew ? "Create Lead" : "Save Lead"}</HeaderButton>
          </>
        }
      />

      <section className="mt-[22px] grid items-start gap-[16px] xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="flex min-w-0 flex-col gap-[14px]">
          <div className={cardClass}>
            <h2 className={titleClass}>Contact</h2>
            <div className="grid gap-[12px] md:grid-cols-3">
              {field("firstName", "First Name", { required: true })}
              {field("lastName", "Last Name")}
              {field("companyName", "Company / Clinic", { required: true })}
              {field("designation", "Designation", { placeholder: "e.g. Ayurveda Doctor" })}
              {field("email", "Email", { type: "email", required: true })}
              <div className="grid grid-cols-[70px_1fr] gap-[6px]">
                <div>
                  <label className={labelClass}>Code</label>
                  <input value={form.phoneCode || ""} onChange={(e) => set({ phoneCode: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Phone *</label>
                  <input value={form.phone || ""} onChange={(e) => set({ phone: e.target.value.replace(/[^\d]/g, "") })} className={inputClass} />
                </div>
              </div>
              {field("altPhone", "Alternate Phone")}
              {field("website", "Website")}
            </div>
          </div>

          <div className={cardClass}>
            <h2 className={titleClass}>Requirement & Pipeline</h2>
            <div className="grid gap-[12px] md:grid-cols-3">
              {select("leadStatus", "Status", LEAD_STATUSES)}
              {select("priority", "Priority", PRIORITIES)}
              {select("leadCategory", "Temperature", [{ value: "", label: "—" }, { value: "hot", label: "Hot" }, { value: "cold", label: "Cold" }])}
              {select("leadSource", "Source", LEAD_SOURCES)}
              {select("leadType", "Lead Type", ["Individual", "Corporate"])}
              {select("marketType", "Market", ["Domestic", "International"])}
              {field("interestedProduct", "Interested In", { placeholder: "e.g. Panchkarma clinic setup" })}
              {field("expectedBudget", "Expected Budget", { placeholder: "e.g. ₹5–8 lakh" })}
              {field("estimatedDealValue", "Estimated Deal Value")}
              {field("expectedClosingDate", "Expected Closing", { type: "date" })}
              {field("typeOfBusiness", "Type of Business", { placeholder: "Clinic, Spa, Hospital…" })}
              <div>
                <label className={labelClass}>Assigned To</label>
                <select
                  value={form.assignedTo && typeof form.assignedTo === "object" ? form.assignedTo._id : String(form.assignedTo || "")}
                  onChange={(e) => set({ assignedTo: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Me</option>
                  {(staff || []).map((s) => <option key={s._id} value={s._id}>{s.name || s.email}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <h2 className={titleClass}>Next Follow-up</h2>
            <div className="grid gap-[12px] md:grid-cols-3">
              {field("followUpDate", "Date", { type: "date" })}
              {field("followUpTime", "Time", { type: "time" })}
              {select("followUpMethod", "Method", FOLLOW_UP_METHODS)}
            </div>
          </div>

          <div className={cardClass}>
            <h2 className={titleClass}>Address</h2>
            <div className="grid gap-[12px] md:grid-cols-3">
              <div className="md:col-span-3">{field("addressLine", "Street Address")}</div>
              {field("city", "City")}
              {field("state", "State")}
              {field("zipCode", "PIN Code")}
              {field("country", "Country")}
            </div>
          </div>

          <div className={cardClass}>
            <h2 className={titleClass}>Notes</h2>
            <div className="grid gap-[12px] md:grid-cols-2">
              <div>
                <label className={labelClass}>Lead Notes (requirement, conversation)</label>
                <textarea value={form.leadNotes || ""} onChange={(e) => set({ leadNotes: e.target.value })} rows={5} className="w-full rounded-[6px] border border-[#dfe4e8] bg-white p-[10px] text-[11px] font-semibold text-[#2f3d58] outline-none focus:border-[#233D4D]" />
              </div>
              <div>
                <label className={labelClass}>Internal Notes (team only)</label>
                <textarea value={form.internalNotes || ""} onChange={(e) => set({ internalNotes: e.target.value })} rows={5} className="w-full rounded-[6px] border border-[#dfe4e8] bg-white p-[10px] text-[11px] font-semibold text-[#2f3d58] outline-none focus:border-[#233D4D]" />
              </div>
            </div>
          </div>
        </div>

        {!isNew && (
          <aside className="flex flex-col gap-[14px]">
            <div className={cardClass}>
              <div className={`${titleClass} justify-between`}>
                <h2>Quotes & Invoices</h2>
                <button
                  type="button"
                  onClick={() => setEstimate({ type: "proforma", items: [blankItem()], discount: 0, shipping: 0, dueDate: "", notes: "" })}
                  className="inline-flex h-[24px] items-center gap-[4px] rounded-[4px] bg-[#293681] px-[8px] text-[10px] font-semibold text-white hover:bg-[#1f2a6b]"
                >
                  <FilePlus2 className="h-[12px] w-[12px]" /> New
                </button>
              </div>
              <div className="mb-[10px] grid grid-cols-2 gap-[8px]">
                <div className="rounded-[6px] bg-[#f8fafc] px-[10px] py-[8px]">
                  <p className="text-[9.5px] font-semibold text-[#68758d]">Invoiced</p>
                  <p className="text-[13px] font-bold text-[#10204a]">{formatINR(billed)}</p>
                </div>
                <div className="rounded-[6px] bg-[#f0fdf4] px-[10px] py-[8px]">
                  <p className="text-[9.5px] font-semibold text-[#68758d]">Received</p>
                  <p className="text-[13px] font-bold text-emerald-700">{formatINR(received)}</p>
                </div>
              </div>
              {docs.length ? (
                <ul className="divide-y divide-[#f1f5f9]">
                  {docs.map((doc) => (
                    <li key={doc._id} className="flex items-center justify-between gap-[8px] py-[8px]">
                      <div className="min-w-0">
                        <p className="truncate text-[10.5px] font-bold text-[#10204a]">{doc.invoiceNumber}</p>
                        <p className="text-[9.5px] font-semibold text-[#68758d]">{DOC_TYPES[doc.type] || doc.type} · {capitalize(doc.status)} · {formatDate(doc.createdAt)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-[6px]">
                        <span className="text-[10.5px] font-bold tabular-nums">{formatINR(doc.totalAmount)}</span>
                        <button type="button" title="View / print" onClick={() => viewDoc(doc._id)} className="grid h-[26px] w-[26px] place-items-center rounded-[5px] border border-[#e1e5e9] bg-white text-[#4b5871] hover:bg-slate-50">
                          <Eye className="h-[12px] w-[12px]" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[10.5px] font-semibold text-[#68758d]">No quotes or invoices yet. Click “New” to send an estimate.</p>
              )}
            </div>

            <div className={cardClass}>
              <h2 className={titleClass}>Website Orders ({ordersData?.total || 0})</h2>
              {orders.length ? (
                <ul className="divide-y divide-[#f1f5f9]">
                  {orders.map((order) => (
                    <li key={order._id} className="flex items-center justify-between gap-[8px] py-[8px]">
                      <div>
                        <Link href={`/orders/${order._id}`} className="text-[10.5px] font-bold text-[#293681] hover:underline">{shortId(order._id)}</Link>
                        <p className="text-[9.5px] font-semibold text-[#68758d]">{formatDate(order.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-[6px]">
                        <span className={`rounded-[5px] border px-[6px] py-[2px] text-[9px] font-bold ${orderStatusTone[order.orderStatus]}`}>{capitalize(order.orderStatus)}</span>
                        <span className="text-[10.5px] font-bold tabular-nums">{formatINR(order.totalAmount)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[10.5px] font-semibold text-[#68758d]">This lead has not ordered on the website yet.</p>
              )}
            </div>
          </aside>
        )}
      </section>

      {estimate && (
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/40 p-[20px]" role="dialog" aria-modal="true">
          <div className="w-full max-w-[920px] rounded-[10px] bg-white p-[18px] shadow-2xl">
            <div className="mb-[14px] flex items-center justify-between">
              <h2 className="text-[15px] font-semibold text-[#17234a]">New document for {lead ? lead.companyName || leadName(lead) : ""}</h2>
              <button type="button" onClick={() => setEstimate(null)} className="grid h-[30px] w-[30px] place-items-center rounded-[5px] border border-[#dfe3e7]" aria-label="Close">
                <X className="h-[14px] w-[14px]" />
              </button>
            </div>
            <div className="grid gap-[12px] md:grid-cols-3">
              <div>
                <label className={labelClass}>Document Type</label>
                <select value={estimate.type} onChange={(e) => setEstimate({ ...estimate, type: e.target.value })} className={inputClass}>
                  <option value="proforma">Estimate / Proforma Invoice</option>
                  <option value="tax">Tax Invoice</option>
                  <option value="delivery_challan">Delivery Challan</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Valid Till / Due Date</label>
                <input type="date" value={estimate.dueDate} onChange={(e) => setEstimate({ ...estimate, dueDate: e.target.value })} className={inputClass} />
              </div>
            </div>

            <div className="mt-[14px] overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#eef0f2] text-[9px] font-semibold uppercase tracking-[0.04em] text-[#44516a]">
                    <th className="pb-[6px]">Product (or type a custom item)</th>
                    <th className="w-[70px] pb-[6px]">Qty</th>
                    <th className="w-[120px] pb-[6px]">Unit Price ₹</th>
                    <th className="w-[80px] pb-[6px]">GST %</th>
                    <th className="w-[110px] pb-[6px] text-right">Amount</th>
                    <th className="w-[36px]" />
                  </tr>
                </thead>
                <tbody>
                  {estimate.items.map((item, index) => (
                    <tr key={index} className="align-top">
                      <td className="py-[6px] pr-[8px]">
                        <select value={item.product || ""} onChange={(e) => pickProduct(index, e.target.value)} className={`${inputClass} mb-[4px]`}>
                          <option value="">— Custom item —</option>
                          {products.map((p) => <option key={p._id} value={p._id}>{plainText(p.title)}</option>)}
                        </select>
                        <input value={item.name} onChange={(e) => updateItem(index, { name: e.target.value })} placeholder="Item description" className={inputClass} />
                      </td>
                      <td className="py-[6px] pr-[8px]"><input type="number" min={1} value={item.quantity} onChange={(e) => updateItem(index, { quantity: Math.max(1, Number(e.target.value) || 1) })} className={inputClass} /></td>
                      <td className="py-[6px] pr-[8px]"><input type="number" min={0} value={item.unitPrice} onChange={(e) => updateItem(index, { unitPrice: Math.max(0, Number(e.target.value) || 0) })} className={inputClass} /></td>
                      <td className="py-[6px] pr-[8px]">
                        <select value={item.gstRate} onChange={(e) => updateItem(index, { gstRate: Number(e.target.value) })} className={inputClass}>
                          {[0, 5, 12, 18, 28].map((g) => <option key={g} value={g}>{g}%</option>)}
                        </select>
                      </td>
                      <td className="py-[6px] pt-[16px] text-right text-[11px] font-bold tabular-nums">{formatINR(item.quantity * item.unitPrice)}</td>
                      <td className="py-[6px] pl-[6px] pt-[10px]">
                        <button type="button" disabled={estimate.items.length === 1} onClick={() => setEstimate({ ...estimate, items: estimate.items.filter((_, i) => i !== index) })} className="grid h-[28px] w-[28px] place-items-center rounded-[5px] border border-rose-200 text-rose-500 disabled:opacity-30" aria-label="Remove item">
                          <Trash2 className="h-[12px] w-[12px]" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button type="button" onClick={() => setEstimate({ ...estimate, items: [...estimate.items, blankItem()] })} className="mt-[6px] inline-flex h-[30px] items-center gap-[6px] rounded-[5px] border border-dashed border-[#93c5fd] px-[10px] text-[10px] font-bold text-[#1e40af]">
              <Plus className="h-[12px] w-[12px]" /> Add Item
            </button>

            <div className="mt-[14px] grid gap-[14px] md:grid-cols-[1fr_280px]">
              <div>
                <label className={labelClass}>Notes on the document</label>
                <textarea value={estimate.notes} onChange={(e) => setEstimate({ ...estimate, notes: e.target.value })} rows={4} placeholder="Delivery timeline, installation, payment terms…" className="w-full rounded-[6px] border border-[#dfe4e8] p-[10px] text-[11px] font-semibold outline-none focus:border-[#233D4D]" />
              </div>
              <dl className="space-y-[6px] text-[11px] font-semibold text-[#44516a]">
                <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{formatINR(estimateTotals.subtotal)}</dd></div>
                <div className="flex justify-between"><dt>GST</dt><dd className="tabular-nums">{formatINR(estimateTotals.tax)}</dd></div>
                <div className="flex items-center justify-between gap-[8px]">
                  <dt>Discount ₹</dt>
                  <dd><input type="number" min={0} value={estimate.discount} onChange={(e) => setEstimate({ ...estimate, discount: Math.max(0, Number(e.target.value) || 0) })} className="h-[30px] w-[110px] rounded-[5px] border border-[#dfe4e8] px-[8px] text-right text-[11px] outline-none" /></dd>
                </div>
                <div className="flex items-center justify-between gap-[8px]">
                  <dt>Shipping / Installation ₹</dt>
                  <dd><input type="number" min={0} value={estimate.shipping} onChange={(e) => setEstimate({ ...estimate, shipping: Math.max(0, Number(e.target.value) || 0) })} className="h-[30px] w-[110px] rounded-[5px] border border-[#dfe4e8] px-[8px] text-right text-[11px] outline-none" /></dd>
                </div>
                <div className="flex justify-between border-t border-[#eef0f2] pt-[8px] text-[14px] font-bold text-[#10204a]"><dt>Total</dt><dd className="tabular-nums">{formatINR(estimateTotals.total)}</dd></div>
              </dl>
            </div>

            <div className="mt-[16px] flex justify-end gap-[8px]">
              <button type="button" onClick={() => setEstimate(null)} className={outlineButtonClass}>Cancel</button>
              <button type="button" disabled={creating} onClick={createDocument} className={primaryButtonClass}>
                <FilePlus2 className="h-[14px] w-[14px]" /> {creating ? "Creating…" : `Create ${estimate.type === "proforma" ? "Estimate" : estimate.type === "tax" ? "Invoice" : "Challan"}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </OrganicPage>
  );
}
