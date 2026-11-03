import { api } from "./api";
import { StaffMember, StaffStatus } from "./types";

export interface InviteStaffInput {
  name: string;
  email: string;
  phone: string;
  employeeId: string;
  roleId: string;
  avatarUrl?: string;
}

export interface InviteStaffResult {
  user: StaffMember;
  temporaryPassword: string;
}

export const staffApi = {
  list: () => api.get<StaffMember[]>("/users/admin/staff"),
  invite: (input: InviteStaffInput) => api.post<InviteStaffResult>("/users/admin/staff", input),
  update: (id: string, input: InviteStaffInput) => api.patch<StaffMember>(`/users/admin/staff/${id}`, input),
  updateStatus: (id: string, status: StaffStatus) => api.patch<StaffMember>(`/users/admin/staff/${id}/status`, { status }),
  updateRole: (id: string, roleId: string) => api.patch<StaffMember>(`/users/admin/staff/${id}/role`, { roleId }),
  setPassword: (id: string, password: string) =>
    api.post<{ _id: string; hasPassword: boolean }>(`/users/admin/staff/${id}/set-password`, { password }),
  resetPassword: async (id: string): Promise<{ temporaryPassword: string }> => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%";
    const tmp = Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    await api.post<{ _id: string; hasPassword: boolean }>(`/users/admin/staff/${id}/set-password`, { password: tmp });
    return { temporaryPassword: tmp };
  },
  delete: (id: string) => api.delete<{ deleted: boolean }>(`/users/admin/staff/${id}`),
};
