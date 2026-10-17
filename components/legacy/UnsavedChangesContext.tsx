"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Disc, Loader2, Save, Trash2, X } from "lucide-react";

type SaveCallback = () => Promise<boolean | void> | boolean | void;

interface UnsavedChangesContextType {
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  setOnSave: (fn: SaveCallback | null) => void;
  confirmIfDirty: (action: () => void) => void;
  showDialog: boolean;
  closeDialog: () => void;
}

const UnsavedChangesContext = createContext<UnsavedChangesContextType>({
  isDirty: false,
  setIsDirty: () => {},
  setOnSave: () => {},
  confirmIfDirty: (action) => action(),
  showDialog: false,
  closeDialog: () => {},
});

export function useUnsavedChanges() {
  return useContext(UnsavedChangesContext);
}

/**
 * Reusable hook to plug into any page or form.
 *
 * Example:
 *   const { confirmIfDirty } = useWarnIfUnsavedChanges({
 *     isDirty: formIsModified,
 *     onSave: handleSave,
 *   });
 */
export function useWarnIfUnsavedChanges({
  isDirty,
  onSave,
}: {
  isDirty: boolean;
  onSave?: SaveCallback;
}) {
  const { setIsDirty, setOnSave, confirmIfDirty } = useUnsavedChanges();

  useEffect(() => {
    setIsDirty(isDirty);
    return () => {
      setIsDirty(false);
    };
  }, [isDirty, setIsDirty]);

  useEffect(() => {
    if (onSave) {
      setOnSave(onSave);
      return () => {
        setOnSave(null);
      };
    }
  }, [onSave, setOnSave]);

  return { confirmIfDirty };
}

export function UnsavedChangesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isDirty, setIsDirtyState] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const onSaveRef = useRef<SaveCallback | null>(null);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const isDirtyRef = useRef(false);

  const setIsDirty = useCallback((dirty: boolean) => {
    isDirtyRef.current = dirty;
    setIsDirtyState(dirty);
  }, []);

  const setOnSave = useCallback((fn: SaveCallback | null) => {
    onSaveRef.current = fn;
  }, []);

  const confirmIfDirty = useCallback(
    (action: () => void) => {
      if (!isDirtyRef.current) {
        action();
        return;
      }
      pendingActionRef.current = action;
      setShowDialog(true);
    },
    []
  );

  const closeDialog = useCallback(() => {
    pendingActionRef.current = null;
    setShowDialog(false);
    setIsSaving(false);
  }, []);

  // 1. Intercept browser window/tab close or refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // 2. Intercept browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      if (isDirtyRef.current) {
        // Push state back to prevent immediate backward navigation
        window.history.pushState(null, "", window.location.href);
        pendingActionRef.current = () => {
          setIsDirty(false);
          window.history.back();
        };
        setShowDialog(true);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setIsDirty]);

  // 3. Intercept all internal Link / <a> clicks across the entire app
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (!isDirtyRef.current) return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;

      // Allow hash links, mailto, tel, javascript, or external new tab links
      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("javascript:") ||
        anchor.target === "_blank"
      ) {
        return;
      }

      // Check destination URL
      try {
        const dest = new URL(anchor.href, window.location.origin);
        const current = new URL(window.location.href);

        // If clicking link pointing to current path and query, ignore
        if (dest.pathname === current.pathname && dest.search === current.search) {
          return;
        }

        // Intercept navigation
        e.preventDefault();
        e.stopPropagation();

        pendingActionRef.current = () => {
          setIsDirty(false);
          router.push(href);
        };
        setShowDialog(true);
      } catch {
        // Fallback
      }
    };

    // Use capture phase to intercept before React router/Link handles click
    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [router, setIsDirty]);

  // Handle Save
  const handleSaveAndProceed = async () => {
    if (!onSaveRef.current) {
      // If no save function registered, just proceed
      setIsDirty(false);
      setShowDialog(false);
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      action?.();
      return;
    }

    setIsSaving(true);
    try {
      const res = await onSaveRef.current();
      // If save returned false explicitly, it means validation failed, so don't navigate away
      if (res === false) {
        setIsSaving(false);
        return;
      }

      setIsDirty(false);
      setShowDialog(false);
      setIsSaving(false);

      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      action?.();
    } catch (err) {
      console.error("Save failed:", err);
      setIsSaving(false);
    }
  };

  // Handle Discard
  const handleDiscardAndProceed = () => {
    setIsDirty(false);
    setShowDialog(false);
    setIsSaving(false);

    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    action?.();
  };

  return (
    <UnsavedChangesContext.Provider
      value={{
        isDirty,
        setIsDirty,
        setOnSave,
        confirmIfDirty,
        showDialog,
        closeDialog,
      }}
    >
      {children}

      {/* Global Unsaved Changes Modal Dialog */}
      {showDialog && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200"
          onClick={closeDialog}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden transform transition-all p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Unsaved Changes Detected
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    You have unsaved changes on this page.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDialog}
                disabled={isSaving}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-3 text-[11px] text-slate-600 leading-relaxed">
              Do you want to <strong className="text-slate-800">save</strong> your changes before leaving, or <strong className="text-rose-600">discard</strong> them?
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-1">
              {/* Keep Editing / Cancel */}
              <button
                type="button"
                onClick={closeDialog}
                disabled={isSaving}
                className="w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors disabled:opacity-50"
              >
                Keep Editing
              </button>

              {/* Discard Changes */}
              <button
                type="button"
                onClick={handleDiscardAndProceed}
                disabled={isSaving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors disabled:opacity-50"
              >
                <Trash2 size={13} />
                <span>Discard</span>
              </button>

              {/* Save & Continue */}
              <button
                type="button"
                onClick={handleSaveAndProceed}
                disabled={isSaving}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </UnsavedChangesContext.Provider>
  );
}
