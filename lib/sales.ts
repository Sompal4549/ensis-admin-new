/** Shared helpers for the Orders and Invoices admin pages */

export type Customer = {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  phoneCode?: string;
  companyName?: string;
};

export type OrderItem = {
  product?: { _id?: string; title?: string; slug?: string; images?: Array<string | { imageUrl?: string; url?: string }> } | string;
  name?: string;
  quantity: number;
  price: number;
  gstRate?: number;
  finish?: string;
  size?: string;
};

export type Order = {
  _id: string;
  user?: Customer | string | null;
  items: OrderItem[];
  totalAmount: number;
  discount?: number;
  couponDiscount?: number;
  shipping?: number;
  tax?: number;
  paymentStatus: "pending" | "paid" | "failed";
  orderStatus: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  shippingAddress?: {
    label?: string;
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
  };
  trackingNumber?: string;
  courierPartner?: string;
  dispatchedAt?: string;
  razorpayOrderId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const ORDER_STATUSES: Order["orderStatus"][] = ["pending", "confirmed", "shipped", "delivered", "cancelled"];
export const PAYMENT_STATUSES: Order["paymentStatus"][] = ["pending", "paid", "failed"];

export const orderStatusTone: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-violet-50 text-violet-700 border-violet-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-600 border-rose-200",
};

export const paymentStatusTone: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-rose-50 text-rose-600 border-rose-200",
};

export const capitalize = (value?: string) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : "");

export const formatINR = (amount?: number) =>
  `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

export const formatDate = (value?: string, withTime = false) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
      })
    : "—";

export const shortId = (id?: string) => (id ? `#${id.slice(-8).toUpperCase()}` : "—");

export const customerOf = (user: Order["user"]): Customer => (user && typeof user === "object" ? user : {});

export const customerName = (user: Order["user"]) => {
  const c = customerOf(user);
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || c.companyName || c.email || "Customer";
};

export const itemName = (item: OrderItem) =>
  (item.product && typeof item.product === "object" ? item.product.title : "") || item.name || "Product";

/** Product names may carry formatting tags from the product editor; list views show plain text */
export const plainText = (html?: string) => (html || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
