import { api } from "./api";
import { Enquiry, EnquiryStatus } from "./types";

export const enquiriesApi = {
  list: async () => {
    const res = await api.get<any>("/enquiries/admin");
    return Array.isArray(res) ? (res as Enquiry[]) : ((res?.enquiries as Enquiry[]) ?? []);
  },
  create: (data: Record<string, unknown>) =>
    api.post<Enquiry>("/enquiries/admin", data),
  updateStatus: (id: string, status: EnquiryStatus) =>
    api.put<Enquiry>(`/enquiries/admin/${id}/status`, { status }),
};
