import { Settings } from "./types";
import { api } from "./api";

const SETTINGS_KEY = "ensis_admin_settings_v3";

// Used until the backend answers (and offline)
const defaultMockSettings: Settings = {
  _id: "",
  siteName: "Ensis - Premium Panchkarma & Wellness Spaces",
  helplineNumber: "+91 9654900525",
  whatsappNumber: "+91 9654900525",
  supportEmail: "info@ensis.in",
  address: "12/29, Site-II, Loni Road, Industrial Area, Mohan Nagar - 201007, India, Uttar Pradesh, India",
  banners: [],
  socialLinks: [],
};

export const settingsApi = {
  get: async (): Promise<Settings> => {
    try {
      const res = await api.get<Partial<Settings> & { data?: Partial<Settings>; websiteName?: string }>("/settings?website=ensis");
      const backendData = (res?.data || res || {}) as Partial<Settings> & { websiteName?: string };
      if (backendData && Object.keys(backendData).length > 0) {
        const normalized: Settings = {
          ...defaultMockSettings,
          ...backendData,
          siteName: backendData.siteName || backendData.websiteName || defaultMockSettings.siteName,
          helplineNumber: backendData.helplineNumber || defaultMockSettings.helplineNumber,
          supportEmail: backendData.supportEmail || defaultMockSettings.supportEmail,
          whatsappNumber: backendData.whatsappNumber || defaultMockSettings.whatsappNumber,
          address: backendData.address || defaultMockSettings.address,
        };
        if (typeof window !== "undefined") {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(normalized));
        }
        return normalized;
      }
    } catch (e) {
      console.warn("Failed to fetch settings from backend API, using local storage:", e);
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Purge stale mock values if stored
          if (
            parsed.helplineNumber?.includes("9876543210") ||
            parsed.helplineNumber?.includes("4567 8900")
          ) {
            localStorage.removeItem(SETTINGS_KEY);
          } else {
            return { ...defaultMockSettings, ...parsed };
          }
        } catch {
          // ignore error
        }
      }
    }
    return defaultMockSettings;
  },
  // No separate alerts endpoint yet: the defaults (no systemAlerts set)
  getSystemAlerts: async (): Promise<Settings> => defaultMockSettings,
  // Pages & CMS "Published" toggle. Patches only data.<configKey>.status on the server.
  setPageStatus: async (
    configKey: string,
    status: "Published" | "Draft",
    updatedBy?: string,
  ): Promise<Record<string, unknown>> => {
    const res = await api.patch<{ data?: Record<string, unknown> }>("/settings/page-status?website=ensis", { configKey, status, updatedBy });
    const pageConfig = res?.data || {};
    // Keep the cached settings in sync: settingsApi.update() PUTs this whole object,
    // so a stale status here would silently revert the toggle on the next save elsewhere.
    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
        const { configKey: _key, ...fields } = pageConfig;
        stored[configKey] = { ...(stored[configKey] || {}), ...fields, status };
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(stored));
      } catch {
        // ignore
      }
    }
    return pageConfig;
  },
  update: async (payload: Partial<Settings>): Promise<Settings> => {
    let current = defaultMockSettings;
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(SETTINGS_KEY);
      if (stored) {
        try {
          current = { ...defaultMockSettings, ...JSON.parse(stored) };
        } catch {
          // ignore
        }
      }
    }
    const updated = { ...current, ...payload };

    const res = await api.put<Partial<Settings> & { data?: Partial<Settings> }>("/settings?website=ensis", updated);
    const saved = { ...updated, ...(res?.data || res || {}) };
    if (typeof window !== "undefined") {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(saved));
    }
    return saved;
  },
};
