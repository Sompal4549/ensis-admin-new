import { api } from "./api";

/** Statuses the backend accepts for an enquiry (models/enquiry.model.ts) */
export type ContactEnquiryStatus = "pending" | "contacted" | "qualified" | "resolved" | "closed";

/** Website form the enquiry came from; "other" for enquiries sent before this was recorded */
export type ContactEnquirySource = "enquiry" | "contact" | "products" | "chatbot" | "other";

/** An enquiry from the website's Enquiry, Contact and Products forms (GET /contact-enquiry) */
export interface ContactEnquiry {
  _id: string;
  name: string;
  email: string;
  phone: string;
  companyOrganization?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  zipcode?: string | null;
  projectType?: string | null;
  projectSize?: string | null;
  budgetRange?: string | null;
  servicesRequired?: string[];
  timeline?: string | null;
  preferredContact?: string | null;
  attachmentUrl?: string | null;
  agreeToContact?: boolean;
  source?: ContactEnquirySource;
  isRead?: boolean;
  message: string;
  status: ContactEnquiryStatus;
  notes?: string | null;
  alternatePhone?: string | null;
  subject?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ContactEnquiryListResponse {
  enquiries: ContactEnquiry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const contactEnquiryApi = {
  // A large limit keeps this in line with how the rest of the admin (e.g.
  // Job Postings) fetches once and filters/paginates client-side, instead of
  // round-tripping to the server on every keystroke.
  list: () => api.get<ContactEnquiryListResponse>(`/contact-enquiry?limit=1000&t=${Date.now()}`),
  update: (id: string, update: { status?: ContactEnquiryStatus; isRead?: boolean; notes?: string }) =>
    api.put<ContactEnquiry>(`/contact-enquiry/${id}`, update),
  updateStatus: (id: string, status: ContactEnquiryStatus) =>
    api.put<ContactEnquiry>(`/contact-enquiry/${id}`, { status }),
  remove: (id: string) => api.delete<{ message: string }>(`/contact-enquiry/${id}`),
};
