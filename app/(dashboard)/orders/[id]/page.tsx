"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Swal from "sweetalert2";
import { FileText, Mail, MapPin, MessageCircle, Package, Save, Truck, User } from "lucide-react";
import { HeaderButton, OrganicPage, PageHeader, Pill, inputClass, labelClass, primaryButtonClass } from "@/components/organic/OrganicUI";
import { api } from "@/lib/api";
import { useApiGet } from "@/lib/useApiGet";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  capitalize,
  customerName,
  customerOf,
  formatDate,
  formatINR,
  itemName,
  orderStatusTone,
  paymentStatusTone,
  plainText,
  shortId,
  type Order,
  type OrderItem,
} from "@/lib/sales";

const COURIERS = ["Delhivery", "Blue Dart", "DTDC", "India Post", "Ecom Express", "Xpressbees", "Shiprocket", "Own Transport"];

// Organic admin card: grey title bar on top of a white body
const cardClass = "overflow-hidden rounded-[7px] border border-[#e1e5ec] bg-white p-[12px] shadow-[rgba(0,0,0,0.02)_0px_1px_3px_0px,rgba(27,31,35,0.15)_0px_0px_0px_1px]";

function CardTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <h2 className="-mx-[12px] -mt-[12px] mb-[12px] flex h-[34px] items-center gap-[6px] border-b border-slate-200/80 bg-[#f0f3f6] px-3 text-[11.5px] font-semibold tracking-[-0.01em] text-[#0f172a]">
      <span className="text-[#293681]">{icon}</span>
      {children}
    </h2>
  );
}

const imageOf = (item: OrderItem) => {
  const images = item.product && typeof item.product === "object" ? item.product.images : undefined;
  const first = images?.[0];
  return typeof first === "string" ? first : first?.imageUrl || first?.url || "";
};

type Draft = {
  key: string;
  orderStatus: Order["orderStatus"];
  paymentStatus: Order["paymentStatus"];
  trackingNumber: string;
  courierPartner: string;
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, loading, error, reload: load } = useApiGet<Order>(`/orders/${id}`);
  const [busy, setBusy] = useState<string | null>(null);

  // The form starts from the saved order and resets whenever the order changes on the server
  const [draft, setDraft] = useState<Draft | null>(null);
  const savedKey = order ? `${order._id}:${order.updatedAt}:${order.orderStatus}:${order.trackingNumber || ""}` : "";
  const form: Draft | null =
    draft && draft.key === savedKey
      ? draft
      : order
        ? {
            key: savedKey,
            orderStatus: order.orderStatus,
            paymentStatus: order.paymentStatus,
            trackingNumber: order.trackingNumber || "",
            courierPartner: order.courierPartner || "",
          }
        : null;
  const setField = (patch: Partial<Draft>) => form && setDraft({ ...form, ...patch });
  const orderStatus = form?.orderStatus ?? "pending";
  const paymentStatus = form?.paymentStatus ?? "pending";
  const trackingNumber = form?.trackingNumber ?? "";
  const courierPartner = form?.courierPartner ?? "";
  const setOrderStatus = (value: Order["orderStatus"]) => setField({ orderStatus: value });
  const setPaymentStatus = (value: Order["paymentStatus"]) => setField({ paymentStatus: value });
  const setTrackingNumber = (value: string) => setField({ trackingNumber: value });
  const setCourierPartner = (value: string) => setField({ courierPartner: value });

  useEffect(() => {
    if (error) Swal.fire({ title: "Could not load this order", text: error instanceof Error ? error.message : "", icon: "error" });
  }, [error]);

  const run = async (key: string, task: () => Promise<void>) => {
    setBusy(key);
    try {
      await task();
    } catch (err) {
      Swal.fire({ title: "Action failed", text: err instanceof Error ? err.message : "", icon: "error" });
    } finally {
      setBusy(null);
    }
  };

  const saveStatus = () =>
    run("status", async () => {
      if (!order) return;
      if (orderStatus === "cancelled" && order.orderStatus !== "cancelled") {
        const { isConfirmed } = await Swal.fire({
          title: "Cancel this order?",
          text: "Reserved stock is released and this cannot be undone.",
          icon: "warning",
          showCancelButton: true,
          confirmButtonText: "Cancel order",
          confirmButtonColor: "#dc2626",
        });
        if (!isConfirmed) return;
      }
      const payload: Record<string, string> = {};
      if (orderStatus !== order.orderStatus) payload.orderStatus = orderStatus;
      if (paymentStatus !== order.paymentStatus) payload.paymentStatus = paymentStatus;
      if (!Object.keys(payload).length) return;
      await api.put(`/orders/${order._id}`, payload);
      load();
      Swal.fire({ title: "Order updated", icon: "success", timer: 1200, showConfirmButton: false });
    });

  const dispatch = () =>
    run("dispatch", async () => {
      if (!order) return;
      if (!trackingNumber.trim() || !courierPartner.trim()) {
        Swal.fire({ title: "Tracking number and courier are required", icon: "warning" });
        return;
      }
      await api.patch<Order>(`/orders/${order._id}/dispatch`, {
        trackingNumber: trackingNumber.trim(),
        courierPartner: courierPartner.trim(),
      });
      load();
      Swal.fire({ title: "Order marked as shipped", icon: "success", timer: 1300, showConfirmButton: false });
    });

  const notify = (channel: "email" | "whatsapp") =>
    run(channel, async () => {
      if (!order) return;
      await api.post(`/orders/${order._id}/send-${channel}`);
      Swal.fire({ title: channel === "email" ? "Order email sent" : "WhatsApp message sent", icon: "success", timer: 1300, showConfirmButton: false });
    });

  // Creates the tax invoice the first time, then always opens the same one
  const openInvoice = () =>
    run("invoice", async () => {
      if (!order) return;
      const invoice = await api.post<{ _id: string }>(`/invoices/from-order/${order._id}`);
      const html = await api.getHtml(`/invoices/${invoice._id}/html`);
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(html);
        win.document.close();
      }
    });

  if (loading && !order) {
    return <main className="p-[24px] text-[12px] font-semibold text-[#68758d]">Loading order…</main>;
  }
  if (!order) {
    return (
      <main className="p-[24px]">
        <Link href="/orders" className="text-[12px] font-semibold text-[#075b33]">← Back to orders</Link>
        <p className="mt-[12px] text-[12px] font-semibold text-[#68758d]">Order not found.</p>
      </main>
    );
  }

  const customer = customerOf(order.user);
  const subtotal = order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = (order.discount || 0) + (order.couponDiscount || 0);
  const isClosed = order.orderStatus === "cancelled" || order.orderStatus === "delivered";

  return (
    <OrganicPage>
      <PageHeader
        back={{ href: "/orders", label: "All orders" }}
        title={
          <>
            Order {shortId(order._id)}
            <Pill className={orderStatusTone[order.orderStatus]}>{capitalize(order.orderStatus)}</Pill>
            <Pill className={paymentStatusTone[order.paymentStatus]}>Payment: {capitalize(order.paymentStatus)}</Pill>
          </>
        }
        subtitle={`Placed ${formatDate(order.createdAt, true)} · Full ID ${order._id}${order.razorpayOrderId ? ` · Razorpay ${order.razorpayOrderId}` : ""}`}
        actions={
          <>
            <HeaderButton icon={Mail} disabled={!!busy} onClick={() => notify("email")}>{busy === "email" ? "Sending…" : "Email Customer"}</HeaderButton>
            <HeaderButton icon={MessageCircle} disabled={!!busy} onClick={() => notify("whatsapp")}>{busy === "whatsapp" ? "Sending…" : "WhatsApp"}</HeaderButton>
            <HeaderButton icon={FileText} disabled={!!busy} onClick={openInvoice} primary>{busy === "invoice" ? "Opening…" : "Tax Invoice"}</HeaderButton>
          </>
        }
      />

      <section className="mt-[22px] grid items-start gap-[16px] xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex min-w-0 flex-col gap-[14px]">
          <div className={cardClass}>
            <CardTitle icon={<Package className="h-[15px] w-[15px]" />}>Items ({order.items.length})</CardTitle>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#eef0f2] text-[9px] font-semibold uppercase tracking-[0.04em] text-[#44516a]">
                    <th className="pb-[8px]">Product</th>
                    <th className="pb-[8px] text-center">Qty</th>
                    <th className="pb-[8px] text-right">Price</th>
                    <th className="pb-[8px] text-right">GST</th>
                    <th className="pb-[8px] text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, index) => {
                    const image = imageOf(item);
                    const slug = item.product && typeof item.product === "object" ? item.product.slug : undefined;
                    return (
                      <tr key={index} className="border-b border-[#f3f4f6] last:border-0">
                        <td className="py-[10px]">
                          <div className="flex items-center gap-[10px]">
                            <div className="h-[44px] w-[44px] shrink-0 overflow-hidden rounded-[6px] border border-[#eef0f2] bg-[#f8fafc]">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              {image && <img src={image} alt="" className="h-full w-full object-cover" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-[11px] font-semibold text-[#19274a]">{plainText(itemName(item))}</p>
                              <p className="text-[9.5px] font-semibold text-[#68758d]">
                                {[item.size && `Size: ${item.size}`, item.finish && `Finish: ${item.finish}`].filter(Boolean).join(" · ") ||
                                  (slug ? `/${slug}` : "")}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-[10px] text-center text-[11px] font-semibold tabular-nums">{item.quantity}</td>
                        <td className="py-[10px] text-right text-[11px] font-semibold tabular-nums">{formatINR(item.price)}</td>
                        <td className="py-[10px] text-right text-[10.5px] font-semibold text-[#68758d]">{item.gstRate ?? 5}%</td>
                        <td className="py-[10px] text-right text-[11px] font-bold tabular-nums text-[#10204a]">{formatINR(item.price * item.quantity)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <dl className="ml-auto mt-[12px] w-full max-w-[280px] space-y-[6px] text-[11px] font-semibold text-[#44516a]">
              <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{formatINR(subtotal)}</dd></div>
              {discount > 0 && <div className="flex justify-between text-emerald-700"><dt>Discount</dt><dd className="tabular-nums">−{formatINR(discount)}</dd></div>}
              {(order.tax || 0) > 0 && <div className="flex justify-between"><dt>Tax</dt><dd className="tabular-nums">{formatINR(order.tax)}</dd></div>}
              <div className="flex justify-between"><dt>Shipping</dt><dd className="tabular-nums">{order.shipping ? formatINR(order.shipping) : "Free"}</dd></div>
              <div className="flex justify-between border-t border-[#eef0f2] pt-[8px] text-[13px] font-bold text-[#10204a]"><dt>Order Total</dt><dd className="tabular-nums">{formatINR(order.totalAmount)}</dd></div>
            </dl>
          </div>

          <div className={cardClass}>
            <CardTitle icon={<Truck className="h-[15px] w-[15px]" />}>Dispatch & Tracking</CardTitle>
            {order.trackingNumber ? (
              <p className="mb-[12px] rounded-[6px] border border-violet-200 bg-violet-50 px-[10px] py-[8px] text-[10.5px] font-semibold text-violet-800">
                Shipped via {order.courierPartner} · Tracking {order.trackingNumber} · {formatDate(order.dispatchedAt, true)}
              </p>
            ) : (
              <p className="mb-[12px] text-[10.5px] font-semibold text-[#68758d]">Add the courier details to mark this order as shipped. The customer sees the tracking number on their order page.</p>
            )}
            <div className="grid gap-[10px] md:grid-cols-[1fr_1fr_auto] md:items-end">
              <div>
                <label className={labelClass}>Courier Partner</label>
                <input list="courier-list" value={courierPartner} onChange={(e) => setCourierPartner(e.target.value)} placeholder="e.g. Delhivery" className={inputClass} />
                <datalist id="courier-list">{COURIERS.map((c) => <option key={c} value={c} />)}</datalist>
              </div>
              <div>
                <label className={labelClass}>Tracking Number</label>
                <input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="AWB / tracking number" className={inputClass} />
              </div>
              <button
                type="button"
                disabled={!!busy || order.orderStatus === "cancelled"}
                onClick={dispatch}
                className={`${primaryButtonClass} justify-center`}
              >
                <Truck className="h-[14px] w-[14px]" />
                {busy === "dispatch" ? "Saving…" : order.trackingNumber ? "Update Tracking" : "Mark as Shipped"}
              </button>
            </div>
          </div>
        </div>

        <aside className="flex flex-col gap-[14px]">
          <div className={cardClass}>
            <CardTitle icon={<Save className="h-[15px] w-[15px]" />}>Update Status</CardTitle>
            <div className="space-y-[10px]">
              <div>
                <label className={labelClass}>Order Status</label>
                <select value={orderStatus} disabled={order.orderStatus === "cancelled"} onChange={(e) => setOrderStatus(e.target.value as Order["orderStatus"])} className={inputClass}>
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{capitalize(s)}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Payment Status</label>
                <select value={paymentStatus} disabled={order.orderStatus === "cancelled"} onChange={(e) => setPaymentStatus(e.target.value as Order["paymentStatus"])} className={inputClass}>
                  {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{capitalize(s)}</option>)}
                </select>
              </div>
              <button
                type="button"
                disabled={!!busy || (orderStatus === order.orderStatus && paymentStatus === order.paymentStatus)}
                onClick={saveStatus}
                className={`${primaryButtonClass} w-full justify-center`}
              >
                <Save className="h-[14px] w-[14px]" /> {busy === "status" ? "Saving…" : "Save Status"}
              </button>
              {order.orderStatus === "cancelled" && (
                <p className="text-[10px] font-semibold text-rose-600">This order is cancelled and can no longer be changed.</p>
              )}
              {!isClosed && (
                <p className="text-[9.5px] font-semibold text-[#68758d]">Cancelling releases the reserved stock back to the product.</p>
              )}
            </div>
          </div>

          <div className={cardClass}>
            <CardTitle icon={<User className="h-[15px] w-[15px]" />}>Customer</CardTitle>
            <p className="text-[12px] font-semibold text-[#19274a]">{customerName(order.user)}</p>
            {customer.companyName && <p className="text-[10.5px] font-semibold text-[#68758d]">{customer.companyName}</p>}
            <div className="mt-[8px] space-y-[4px] text-[10.5px] font-semibold text-[#2f3d58]">
              {customer.email && <a href={`mailto:${customer.email}`} className="block hover:underline">{customer.email}</a>}
              {customer.phone && <a href={`tel:${customer.phoneCode || ""}${customer.phone}`} className="block hover:underline">{customer.phoneCode} {customer.phone}</a>}
            </div>
          </div>

          <div className={cardClass}>
            <CardTitle icon={<MapPin className="h-[15px] w-[15px]" />}>Shipping Address</CardTitle>
            {order.shippingAddress ? (
              <address className="not-italic text-[10.5px] font-semibold leading-[1.6] text-[#2f3d58]">
                <span className="block text-[11px] text-[#19274a]">{order.shippingAddress.label}</span>
                {order.shippingAddress.street}
                <br />
                {[order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.postalCode].filter(Boolean).join(", ")}
                <br />
                {order.shippingAddress.country}
                {order.shippingAddress.phone && <span className="mt-[4px] block">Phone: {order.shippingAddress.phone}</span>}
              </address>
            ) : (
              <p className="text-[10.5px] font-semibold text-[#68758d]">No shipping address.</p>
            )}
          </div>
        </aside>
      </section>
    </OrganicPage>
  );
}
