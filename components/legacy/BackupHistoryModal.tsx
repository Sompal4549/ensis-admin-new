"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  History,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { productBackupApi, type ProductBackup } from "@/lib/legacy/productsApi";
import ConfirmDialog from "./ConfirmDialog";

type BackupHistoryModalProps = {
  isOpen: boolean;
  productId?: string;
  productTitle?: string;
  onClose: () => void;
  onRestored?: () => void;
};

type ConfirmState = {
  kind: "create" | "restore" | "delete" | "deleteAll";
  backupId?: string;
  when?: string;
};

const noteTone = (note?: string) => {
  if (note?.startsWith("manual")) return "bg-sky-50 text-sky-700 border-sky-200";
  if (note?.startsWith("pre-restore")) return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-slate-100 text-slate-600 border-slate-200";
};

const formatWhen = (iso?: string) => {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const asText = (value: unknown): string =>
  value === undefined || value === null ? "" : String(value);

export default function BackupHistoryModal({
  isOpen,
  productId,
  productTitle,
  onClose,
  onRestored,
}: BackupHistoryModalProps) {
  const [backups, setBackups] = useState<ProductBackup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [snapshots, setSnapshots] = useState<Record<string, Record<string, unknown>>>({});
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const load = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError("");
    try {
      const list = await productBackupApi.list(productId);
      setBackups(Array.isArray(list) ? list : []);
    } catch (err) {
      setBackups([]);
      setError((err as Error).message || "Could not load backups");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (isOpen) {
      setExpandedId(null);
      setSnapshots({});
      void load();
    }
  }, [isOpen, load]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const toggleExpand = async (backup: ProductBackup) => {
    const id = backup._id;
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (snapshots[id]) return;
    try {
      const full = await productBackupApi.get(id);
      setSnapshots((prev) => ({ ...prev, [id]: (full.snapshot ?? {}) as Record<string, unknown> }));
    } catch (err) {
      toast.error((err as Error).message || "Could not load snapshot");
      setExpandedId(null);
    }
  };

  const runConfirm = async () => {
    if (!confirm || !productId) return;
    try {
      if (confirm.kind === "create") {
        await productBackupApi.create(productId, "manual");
        toast.success("Backup created");
      } else if (confirm.kind === "restore" && confirm.backupId) {
        await productBackupApi.restore(confirm.backupId);
        toast.success("Product restored from backup");
        onRestored?.();
      } else if (confirm.kind === "delete" && confirm.backupId) {
        await productBackupApi.remove(confirm.backupId);
        toast.success("Backup deleted");
      } else if (confirm.kind === "deleteAll") {
        await productBackupApi.removeAll(productId);
        toast.success("All backups deleted");
      }
      await load();
    } catch (err) {
      toast.error((err as Error).message || "Action failed");
    }
  };

  const confirmProps = (() => {
    if (!confirm) return null;
    const backupWhen = confirm.when ? ` from ${confirm.when}` : "";
    switch (confirm.kind) {
      case "create":
        return {
          title: "Create Backup",
          message: "Save the current state of this product as a restore point?",
          confirmText: "Create",
          confirmClassName: "bg-slate-900 hover:bg-slate-800",
        };
      case "restore":
        return {
          title: "Restore Product",
          message: `Restore this product to its state${backupWhen}? Current values will be replaced. A pre-restore backup is saved automatically first.`,
          confirmText: "Restore",
          confirmClassName: "bg-amber-600 hover:bg-amber-700",
        };
      case "delete":
        return {
          title: "Delete Backup",
          message: `Delete this backup${backupWhen}? This cannot be undone.`,
          confirmText: "Delete",
          confirmClassName: "bg-red-600 hover:bg-red-700",
        };
      default:
        return {
          title: "Delete All Backups",
          message: `Delete all ${backups.length} backups for this product? This cannot be undone.`,
          confirmText: "Delete all",
          confirmClassName: "bg-red-600 hover:bg-red-700",
        };
    }
  })();

  if (!isOpen || !productId) return null;

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div className="min-w-0">
            <h3 className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <History size={14} /> Backup History
            </h3>
            <p className="mt-0.5 truncate text-[11px] text-slate-400">{productTitle || productId}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirm({ kind: "create" })}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <Plus size={12} /> Backup now
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
              title="Close"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-10 text-[11px] text-slate-400">
              <Loader2 size={14} className="animate-spin" /> Loading backups…
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-3 py-3 text-[11px] text-rose-600">
              <p className="font-semibold">{error}</p>
              <button
                type="button"
                onClick={() => void load()}
                className="mt-2 inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-2 py-1 text-[10px] font-bold hover:bg-rose-100 cursor-pointer"
              >
                <RefreshCw size={10} /> Retry
              </button>
            </div>
          )}

          {!loading && !error && backups.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
              <History size={18} className="mx-auto text-slate-300" />
              <p className="mt-2 text-[11px] font-bold text-slate-500">No backups yet</p>
              <p className="mt-1 text-[10px] text-slate-400">
                A backup is saved automatically before every product update — or create one manually.
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            backups.map((backup) => {
              const snapshot = snapshots[backup._id];
              const isExpanded = expandedId === backup._id;
              return (
                <div key={backup._id} className="rounded-xl border border-slate-100 bg-white">
                  <div className="flex items-center justify-between gap-2 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => void toggleExpand(backup)}
                      className="flex min-w-0 items-center gap-2 text-left cursor-pointer"
                      title={isExpanded ? "Hide snapshot" : "View snapshot"}
                    >
                      {isExpanded ? <ChevronDown size={12} className="text-slate-400" /> : <ChevronRight size={12} className="text-slate-400" />}
                      <span className="truncate text-[11px] font-bold text-slate-700">
                        {formatWhen(backup.backedUpAt)}
                      </span>
                      <span
                        className={`shrink-0 rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${noteTone(backup.note)}`}
                      >
                        {backup.note || "auto"}
                      </span>
                    </button>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setConfirm({ kind: "restore", backupId: backup._id, when: formatWhen(backup.backedUpAt) })}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-bold text-slate-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-colors cursor-pointer"
                        title="Restore product to this state"
                      >
                        <RotateCcw size={10} /> Restore
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirm({ kind: "delete", backupId: backup._id, when: formatWhen(backup.backedUpAt) })}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-rose-500 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete this backup"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/60 px-3 py-2.5">
                      {!snapshot ? (
                        <div className="flex items-center gap-2 py-3 text-[10px] text-slate-400">
                          <Loader2 size={12} className="animate-spin" /> Loading snapshot…
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <dl className="grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-2">
                            {(
                              [
                                ["Title", asText(snapshot.title)],
                                ["Code", asText(snapshot.code)],
                                [
                                  "Price",
                                  typeof snapshot.price === "number"
                                    ? `Rs. ${snapshot.price.toLocaleString("en-IN")}`
                                    : "",
                                ],
                                ["Stock", asText(snapshot.stock)],
                                ["Slug", asText(snapshot.slug)],
                                ["Category", asText(snapshot.category)],
                                ["Short description", asText(snapshot.shortDescription)],
                                ["Material", asText(snapshot.material)],
                              ] as [string, string][]
                            )
                              .filter(([, value]) => value !== "")
                              .map(([label, value]) => (
                                <div key={label} className="flex min-w-0 gap-1.5 text-[10px]">
                                  <dt className="shrink-0 font-bold text-slate-400">{label}:</dt>
                                  <dd className="truncate font-semibold text-slate-700" title={value}>
                                    {value}
                                  </dd>
                                </div>
                              ))}
                          </dl>
                          <details>
                            <summary className="cursor-pointer text-[10px] font-bold text-slate-500 hover:text-slate-700">
                              Raw snapshot (JSON)
                            </summary>
                            <pre className="mt-1.5 max-h-44 overflow-auto rounded-lg bg-slate-900 p-2 text-[10px] leading-relaxed text-slate-100">
                              {JSON.stringify(snapshot, null, 2)}
                            </pre>
                          </details>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2.5">
          <span className="text-[10px] text-slate-400">
            {backups.length} backup{backups.length === 1 ? "" : "s"} · latest 20 kept per product
          </span>
          {backups.length > 0 && (
            <button
              type="button"
              onClick={() => setConfirm({ kind: "deleteAll" })}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
            >
              Delete all
            </button>
          )}
        </div>

        {confirmProps && (
          <ConfirmDialog
            isOpen={!!confirm}
            title={confirmProps.title}
            message={confirmProps.message}
            confirmText={confirmProps.confirmText}
            confirmClassName={confirmProps.confirmClassName}
            onConfirm={runConfirm}
            onClose={() => setConfirm(null)}
          />
        )}
      </div>
    </div>
  );
}
