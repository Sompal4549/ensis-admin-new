import { api } from "./api";

export interface IntegrationTestResult {
  ok: boolean;
  configured: boolean;
  message: string;
}

export interface IntegrationSettingsView {
  ga4PropertyId: string;
  searchConsoleSiteUrl: string;
  serviceAccountConfigured: boolean;
  serviceAccountEmail: string;
  pagespeedKeyConfigured: boolean;
  pagespeedKeySource: "settings" | "env" | null;
  encryptionConfigured: boolean;
  lastTest: {
    testedAt: string;
    results: {
      analytics: IntegrationTestResult;
      searchConsole: IntegrationTestResult;
      pageSpeed: IntegrationTestResult;
    };
  } | null;
  updatedAt: string | null;
  updatedBy: string;
}

export interface UpdateIntegrationSettingsInput {
  ga4PropertyId?: string;
  searchConsoleSiteUrl?: string;
  serviceAccountJson?: string;
  pagespeedApiKey?: string;
  clearServiceAccount?: boolean;
  clearPagespeedApiKey?: boolean;
}

export interface IntegrationTestResponse {
  testedAt: string;
  results: {
    analytics: IntegrationTestResult;
    searchConsole: IntegrationTestResult;
    pageSpeed: IntegrationTestResult;
  };
}

export const integrationsApi = {
  get: () => api.get<IntegrationSettingsView>("/settings/integrations"),
  update: (payload: UpdateIntegrationSettingsInput) =>
    api.put<IntegrationSettingsView>("/settings/integrations", payload),
  test: () => api.post<IntegrationTestResponse>("/settings/integrations/test"),
};

