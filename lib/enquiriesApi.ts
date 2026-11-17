import { api } from "./api";
import { Enquiry, EnquiryStatus } from "./types";

export const enquiriesApi = {
  list: async (source?: string) => {
    const url = source
      ? `/enquiries/admin?source=${encodeURIComponent(source)}&limit=1000&t=${Date.now()}`
      : `/enquiries/admin?limit=1000&t=${Date.now()}`;
    const res = await api.get<any>(url);
    return Array.isArray(res) ? (res as Enquiry[]) : ((res?.enquiries as Enquiry[]) ?? []);
  },
  create: (data: Record<string, unknown>) =>
    api.post<Enquiry>("/enquiries/admin", data),
  updateStatus: (id: string, status: EnquiryStatus) =>
    api.put<Enquiry>(`/enquiries/admin/${id}/status`, { status }),
};
