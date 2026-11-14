"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import {
  integrationsApi,
  IntegrationSettingsView,
  IntegrationTestResponse,
} from "@/lib/integrationsApi";
import { ApiRequestError } from "@/lib/api";
import Swal from "sweetalert2";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Save,
  Activity,
  Layers,
  ArrowLeft,
} from "lucide-react";

export default function IntegrationsSettingsPage() {
  const [view, setView] = useState<IntegrationSettingsView | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // Form state
  const [ga4PropertyId, setGa4PropertyId] = useState("");
  const [searchConsoleSiteUrl, setSearchConsoleSiteUrl] = useState("");
  const [serviceAccountJson, setServiceAccountJson] = useState("");
  const [pagespeedApiKey, setPagespeedApiKey] = useState("");
  const [testResult, setTestResult] = useState<IntegrationTestResponse["results"] | null>(null);
  const [lastTestedAt, setLastTestedAt] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const data = await integrationsApi.get();
      setView(data);
      setGa4PropertyId(data.ga4PropertyId || "");
      setSearchConsoleSiteUrl(data.searchConsoleSiteUrl || "");
      if (data.lastTest) {
        setTestResult(data.lastTest.results);
        setLastTestedAt(data.lastTest.testedAt);
      }
    } catch (err) {
      console.error("Failed to load integrations settings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        ga4PropertyId,
        searchConsoleSiteUrl,
      };
      if (serviceAccountJson.trim()) {
        payload.serviceAccountJson = serviceAccountJson.trim();
      }
      if (pagespeedApiKey.trim()) {
        payload.pagespeedApiKey = pagespeedApiKey.trim();
      }

      const updated = await integrationsApi.update(payload);
      setView(updated);
      setServiceAccountJson("");
      setPagespeedApiKey("");
      Swal.fire({
        title: "Integrations Saved",
        text: "Google integration settings updated successfully.",
        icon: "success",
        confirmButtonColor: "#23471d",
        timer: 2000,
      });
    } catch (err) {
      const text = err instanceof ApiRequestError ? err.message : "Failed to save integrations.";
      Swal.fire({
        title: "Save Failed",
        text,
        icon: "error",
        confirmButtonColor: "#23471d",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    try {
      const res = await integrationsApi.test();
      setTestResult(res.results);
      setLastTestedAt(res.testedAt);

      const allOk = Object.values(res.results).every((r) => r.ok);
      const partialOk = Object.values(res.results).some((r) => r.ok);

      Swal.fire({
        title: allOk ? "All Integrations Connected" : partialOk ? "Partial Connection" : "Connection Test Failed",
        html: `
          <div style="text-align: left; font-size: 13px;">
            <p><strong>Google Analytics 4:</strong> ${res.results.analytics.ok ? "✅ Connected" : "❌ " + res.results.analytics.message}</p>
            <p><strong>Search Console:</strong> ${res.results.searchConsole.ok ? "✅ Connected" : "❌ " + res.results.searchConsole.message}</p>
            <p><strong>PageSpeed Insights:</strong> ${res.results.pageSpeed.ok ? "✅ Connected" : "❌ " + res.results.pageSpeed.message}</p>
          </div>
        `,
        icon: allOk ? "success" : partialOk ? "warning" : "error",
        confirmButtonColor: "#23471d",
      });
    } catch (err) {
      const text = err instanceof ApiRequestError ? err.message : "Connection test failed.";
      Swal.fire({
        title: "Test Error",
        text,
        icon: "error",
        confirmButtonColor: "#23471d",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleClearServiceAccount = async () => {
    const result = await Swal.fire({
      title: "Remove Service Account?",
      text: "This will remove the stored service account credentials. Search Console and GA4 will stop fetching live data.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, Remove",
    });

    if (result.isConfirmed) {
      try {
        const updated = await integrationsApi.update({ clearServiceAccount: true });
        setView(updated);
        Swal.fire({
          title: "Removed",
          text: "Service account credentials have been removed.",
          icon: "success",
          confirmButtonColor: "#23471d",
        });
      } catch (err) {
        const text = err instanceof ApiRequestError ? err.message : "Failed to remove service account.";
        Swal.fire({ title: "Error", text, icon: "error" });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-xs text-gray-500">
        <RefreshCw className="mr-2 h-4 w-4 animate-spin text-[#23471d]" />
        Loading integrations configuration...
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-100px)] w-full bg-white text-[#18233b]">
      <div className="flex min-h-full flex-col px-[18px] pb-[24px] pt-[14px]">
        {/* Navigation Tabs Header */}
        <div className="mb-[20px] flex shrink-0 items-center justify-between border-b-[2px] border-[#293681] pb-[8px]">
          <div>
            <div className="flex items-center gap-2">
              <Link
                href="/settings"
                className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-[#23471d]"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Settings
              </Link>
              <span className="text-gray-300">/</span>
              <h1
                className="text-[19px] font-bold leading-[1.15] tracking-[-0.018em]"
                style={{ color: "#23471d" }}
              >
                Google Integrations
              </h1>
            </div>
            <p className="mt-0.5 text-[9px] font-medium text-[#6c7587]">
              Configure Google Analytics 4 (GA4), Search Console (GSC), and PageSpeed Insights API.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="rounded border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              General Settings
            </Link>
            <span className="rounded bg-[#23471d] px-3 py-1.5 text-xs font-semibold text-white">
              Integrations
            </span>
          </div>
        </div>

        {/* Status Bar */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          {/* GA4 Status */}
          <div className="flex items-center justify-between rounded border border-gray-200 bg-gray-50 p-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">GA4 Analytics</p>
              <p className="text-xs font-bold text-gray-800">
                {view?.ga4PropertyId ? `Property: ${view.ga4PropertyId}` : "Not Configured"}
              </p>
            </div>
            {testResult?.analytics?.ok ? (
              <span className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">
                <CheckCircle2 className="h-3 w-3" /> Live
              </span>
            ) : view?.ga4PropertyId ? (
              <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                Ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                Missing
              </span>
            )}
          </div>

          {/* GSC Status */}
          <div className="flex items-center justify-between rounded border border-gray-200 bg-gray-50 p-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Search Console</p>
              <p className="text-xs font-bold text-gray-800 truncate max-w-[200px]">
                {view?.searchConsoleSiteUrl || "https://ensis.in/"}
              </p>
            </div>
            {testResult?.searchConsole?.ok ? (
              <span className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">
                <CheckCircle2 className="h-3 w-3" /> Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                Ready
              </span>
            )}
          </div>

          {/* Service Account Status */}
          <div className="flex items-center justify-between rounded border border-gray-200 bg-gray-50 p-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Service Account</p>
              <p className="text-xs font-bold text-gray-800 truncate max-w-[200px]">
                {view?.serviceAccountConfigured
                  ? view.serviceAccountEmail || "Configured in Settings"
                  : "Configured via Server Environment (.env)"}
              </p>
            </div>
            <span className="inline-flex items-center gap-1 rounded bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">
              <CheckCircle2 className="h-3 w-3" /> Active
            </span>
          </div>
        </div>

        {/* Main Settings Cards */}
        <div className="space-y-4">
          {/* Card 1: GA4 & GSC */}
          <Card>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#23471d]">
              Google Analytics 4 & Search Console
            </h2>
            <p className="mb-3 text-[11px] text-[#4B1426]">
              Real visitor counts, page views, bounce rate, top queries, and organic search impressions.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Google Analytics 4 Property ID"
                value={ga4PropertyId}
                onChange={(e) => setGa4PropertyId(e.target.value)}
                placeholder="e.g. 443255540"
                hint="Numeric Property ID from GA4 > Admin > Property Settings > Property details (NOT the G- measurement ID)."
              />
              <Input
                label="Search Console Property URL / Domain"
                value={searchConsoleSiteUrl}
                onChange={(e) => setSearchConsoleSiteUrl(e.target.value)}
                placeholder="https://ensis.in/ or sc-domain:ensis.in"
                hint="Domain property (sc-domain:ensis.in) or Exact URL prefix (https://ensis.in/)."
              />
            </div>
          </Card>

          {/* Card 2: Service Account Credentials */}
          <Card>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-[#23471d]">
                Google Cloud Service Account
              </h2>
              {view?.serviceAccountConfigured && (
                <button
                  type="button"
                  onClick={handleClearServiceAccount}
                  className="text-[11px] font-medium text-red-600 hover:underline"
                >
                  Clear Stored Service Account
                </button>
              )}
            </div>
            <p className="mb-3 text-[11px] text-[#4B1426]">
              Used to query Google Analytics Data API and Search Console API on behalf of your domain.
              Credentials stored here are encrypted with AES-256-GCM.
            </p>
            <div className="space-y-3">
              <div className="rounded bg-blue-50/60 border border-blue-100 p-2.5 text-xs text-blue-900">
                <p className="font-semibold mb-0.5">Active Service Account Email:</p>
                <code className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-blue-200">
                  {view?.serviceAccountEmail || "analytics-bot@ensis-panchkarma.iam.gserviceaccount.com"}
                </code>
                <p className="mt-1 text-[10px] text-blue-700">
                  Ensure this email address is added as a <strong>Viewer</strong> in both Google Analytics (Property Access Management) and Google Search Console (Users and Permissions).
                </p>
              </div>

              <Textarea
                label="Update Service Account Key JSON (Optional)"
                value={serviceAccountJson}
                onChange={(e) => setServiceAccountJson(e.target.value)}
                rows={3}
                placeholder="Paste new JSON key file contents here to replace current credentials (leave blank to keep existing key)..."
                hint="Only client_email and private_key will be extracted and securely encrypted."
              />
            </div>
          </Card>

          {/* Card 3: PageSpeed Insights */}
          <Card>
            <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#23471d]">
              PageSpeed Insights API Key
            </h2>
            <p className="mb-3 text-[11px] text-[#4B1426]">
              Powers Core Web Vitals, performance scores, and SEO audits across all public website pages.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="PageSpeed API Key"
                value={pagespeedApiKey}
                onChange={(e) => setPagespeedApiKey(e.target.value)}
                placeholder={
                  view?.pagespeedKeyConfigured
                    ? `Currently active (from ${view.pagespeedKeySource || "server"})`
                    : "Enter API Key"
                }
                hint="Obtain an API key from Google Cloud Console > APIs & Services > Credentials."
              />
              <div className="flex flex-col justify-center">
                <span className="text-[11px] font-semibold text-gray-600 mb-1">Key Status</span>
                <span className="text-xs text-gray-800">
                  {view?.pagespeedKeyConfigured ? (
                    <span className="inline-flex items-center gap-1 text-green-700 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Configured & Active ({view.pagespeedKeySource === "env" ? "Server Environment" : "Database"})
                    </span>
                  ) : (
                    <span className="text-gray-500">Not configured yet</span>
                  )}
                </span>
              </div>
            </div>
          </Card>

          {/* Card 4: Live Test Output */}
          {testResult && (
            <Card>
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-semibold uppercase tracking-wide text-[#23471d] flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5" />
                  Latest Connection Test Results
                </h2>
                {lastTestedAt && (
                  <span className="text-[10px] text-gray-500">
                    Tested: {new Date(lastTestedAt).toLocaleString()}
                  </span>
                )}
              </div>
              <div className="space-y-2 text-xs">
                <div
                  className={`flex items-start gap-2 rounded p-2.5 ${
                    testResult.analytics.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {testResult.analytics.ok ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 mt-0.5 text-red-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold">Google Analytics 4: </span>
                    <span>{testResult.analytics.message}</span>
                  </div>
                </div>

                <div
                  className={`flex items-start gap-2 rounded p-2.5 ${
                    testResult.searchConsole.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {testResult.searchConsole.ok ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 mt-0.5 text-red-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold">Search Console: </span>
                    <span>{testResult.searchConsole.message}</span>
                  </div>
                </div>

                <div
                  className={`flex items-start gap-2 rounded p-2.5 ${
                    testResult.pageSpeed.ok ? "bg-green-50 text-green-800 border border-green-200" : "bg-red-50 text-red-800 border border-red-200"
                  }`}
                >
                  {testResult.pageSpeed.ok ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 mt-0.5 text-red-600 shrink-0" />
                  )}
                  <div>
                    <span className="font-bold">PageSpeed Insights: </span>
                    <span>{testResult.pageSpeed.message}</span>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex h-[34px] items-center gap-1.5 px-[16px] text-[12px] font-semibold text-white transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
              style={{
                background: "#23471d",
                borderRadius: "4px",
                boxShadow: "rgba(0,0,0,0.02) 0px 1px 3px 0px, rgba(35,71,29,0.2) 0px 0px 0px 1px",
              }}
            >
              {saving ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save Changes
            </button>

            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing}
              className="inline-flex h-[34px] items-center gap-1.5 px-[16px] text-[12px] font-semibold text-[#23471d] bg-white border border-[#23471d] transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 active:scale-95"
              style={{
                borderRadius: "4px",
              }}
            >
              {testing ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Activity className="h-3.5 w-3.5" />
              )}
              Test Connection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

