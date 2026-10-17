"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";

type State<T> = { key: string; data?: T; error?: unknown };

/**
 * GET `path` and keep the result. Changing `path` (or calling `reload`) fetches again;
 * the previous data stays visible while the new request is in flight. Pass null to skip.
 * State is only set from the request's callbacks, never synchronously inside the effect.
 */
export function useApiGet<T>(path: string | null) {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState<State<T>>({ key: "" });
  const key = path ? `${path}#${tick}` : "";

  useEffect(() => {
    if (!path) return;
    let cancelled = false;
    // Cache-busting so a reload never gets a stale browser response
    const url = `${path}${path.includes("?") ? "&" : "?"}_=${tick}-${Date.now()}`;
    api
      .get<T>(url)
      .then((data) => {
        if (!cancelled) setState({ key, data });
      })
      .catch((error) => {
        if (!cancelled) setState((prev) => ({ key, data: prev.data, error }));
      });
    return () => {
      cancelled = true;
    };
  }, [path, tick, key]);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  return {
    data: state.data,
    error: state.key === key ? state.error : undefined,
    loading: Boolean(path) && state.key !== key,
    reload,
  };
}
