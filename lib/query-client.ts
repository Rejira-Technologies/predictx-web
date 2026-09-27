/**
 * lib/query-client.ts
 *
 * Lightweight hand-rolled SWR-style query client.
 *
 * Features:
 *  - Key-based in-memory cache with stale-while-revalidate semantics
 *  - Configurable polling intervals (setInterval-based)
 *  - Refetch-on-window-focus
 *  - Error/retry handling (exponential back-off, max 3 retries)
 *  - Cache invalidation by key (exact or prefix)
 *  - React hook: useQuery<T>(key, fetcher, options)
 *
 * Usage:
 *   const { data, error, isLoading, isRefetching, refetch } = useQuery(
 *     "pool:m1-p1",
 *     () => fetchPoolInfo("m1-p1"),
 *     { refreshInterval: 20_000 }
 *   );
 *
 * Invalidation (e.g. after a stake mutation):
 *   invalidateQueries("pool:m1-p1");      // exact
 *   invalidateQueries("pool:", true);     // all keys starting with "pool:"
 */

"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ── Cache store ────────────────────────────────────────────────────────────

interface CacheEntry<T> {
  data: T;
  fetchedAt: number;
  /** Deduplicated in-flight promise */
  promise?: Promise<T>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cache = new Map<string, CacheEntry<any>>();

/** Listeners notified when a cache entry is updated */
const listeners = new Map<string, Set<() => void>>();

function notify(key: string) {
  listeners.get(key)?.forEach((fn) => fn());
}

function subscribe(key: string, fn: () => void) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(fn);
  return () => listeners.get(key)?.delete(fn);
}

// ── Public invalidation API ────────────────────────────────────────────────

/**
 * Invalidate one or more cache entries, triggering a refetch in any
 * currently mounted hooks that hold the key.
 *
 * @param key     Cache key to invalidate (or prefix when `prefix=true`)
 * @param prefix  When true, invalidates all keys that start with `key`
 */
export function invalidateQueries(key: string, prefix = false) {
  if (prefix) {
    for (const k of cache.keys()) {
      if (k.startsWith(key)) {
        cache.delete(k);
        notify(k);
      }
    }
  } else {
    cache.delete(key);
    notify(key);
  }
}

// ── useQuery hook ──────────────────────────────────────────────────────────

export interface UseQueryOptions {
  /** Polling interval in ms. 0 = no polling (default). */
  refreshInterval?: number;
  /** Refetch when the window regains focus (default: true). */
  revalidateOnFocus?: boolean;
  /** Max retry attempts on error (default: 3). */
  maxRetries?: number;
  /** Whether to skip fetching entirely (default: false). */
  enabled?: boolean;
}

export interface UseQueryResult<T> {
  data: T | undefined;
  error: Error | null;
  isLoading: boolean;
  /** True when a background refetch is in progress (data is still available) */
  isRefetching: boolean;
  refetch: () => Promise<void>;
}

export function useQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseQueryOptions = {}
): UseQueryResult<T> {
  const {
    refreshInterval = 0,
    revalidateOnFocus = true,
    maxRetries = 3,
    enabled = true,
  } = options;

  const cachedEntry = cache.get(key) as CacheEntry<T> | undefined;

  const [data, setData] = useState<T | undefined>(cachedEntry?.data);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(!cachedEntry);
  const [isRefetching, setIsRefetching] = useState(false);

  const retriesRef = useRef(0);
  const mountedRef = useRef(true);

  // ── Core fetch ─────────────────────────────────────────────────────────

  const doFetch = useCallback(
    async (isBackground = false) => {
      if (!enabled) return;

      // Deduplicate concurrent calls for the same key
      const existing = cache.get(key);
      if (existing?.promise) {
        await existing.promise;
        if (mountedRef.current) {
          const fresh = cache.get(key) as CacheEntry<T> | undefined;
          if (fresh) {
            setData(fresh.data);
            setIsLoading(false);
            setIsRefetching(false);
          }
        }
        return;
      }

      if (isBackground) {
        setIsRefetching(true);
      } else {
        setIsLoading(true);
      }

      let attempt = 0;
      let lastErr: Error | null = null;

      while (attempt <= maxRetries) {
        try {
          const promise = fetcher();

          // Store promise for deduplication
          const prev = cache.get(key);
          cache.set(key, { data: undefined as unknown as T, fetchedAt: 0, ...(prev ?? {}), promise });

          const result = await promise;

          if (!mountedRef.current) return;

          const entry: CacheEntry<T> = { data: result, fetchedAt: Date.now() };
          cache.set(key, entry);
          notify(key);

          setData(result);
          setError(null);
          retriesRef.current = 0;
          return;
        } catch (err) {
          lastErr = err instanceof Error ? err : new Error(String(err));
          attempt++;
          if (attempt <= maxRetries) {
            // Exponential back-off: 500ms, 1s, 2s
            await new Promise((r) => setTimeout(r, 500 * Math.pow(2, attempt - 1)));
          }
        } finally {
          // Clear the in-flight promise dedup marker
          const entry = cache.get(key);
          if (entry) {
            cache.set(key, { ...entry, promise: undefined });
          }
        }
      }

      // All retries exhausted
      if (!mountedRef.current) return;
      setError(lastErr);
      // Return cached data on error (stale-while-revalidate)
      const stale = cache.get(key) as CacheEntry<T> | undefined;
      if (stale?.data !== undefined) setData(stale.data);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, enabled, maxRetries]
  );

  const refetch = useCallback(async () => {
    cache.delete(key); // force fresh
    await doFetch(false);
  }, [key, doFetch]);

  // ── Initial fetch & cache subscription ────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;

    // Subscribe to external invalidations
    const unsub = subscribe(key, () => {
      if (!mountedRef.current) return;
      const entry = cache.get(key) as CacheEntry<T> | undefined;
      if (entry) {
        setData(entry.data);
        setIsLoading(false);
        setIsRefetching(false);
      } else {
        // Entry was invalidated — refetch
        doFetch(!!data);
      }
    });

    // Fetch if no cached data
    if (!cache.has(key)) {
      doFetch(false).finally(() => {
        if (mountedRef.current) {
          setIsLoading(false);
          setIsRefetching(false);
        }
      });
    } else {
      setIsLoading(false);
    }

    return () => {
      mountedRef.current = false;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // ── Polling ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!refreshInterval || !enabled) return;
    const id = setInterval(() => doFetch(true), refreshInterval);
    return () => clearInterval(id);
  }, [refreshInterval, enabled, doFetch]);

  // ── Refetch on focus ───────────────────────────────────────────────────

  useEffect(() => {
    if (!revalidateOnFocus || !enabled) return;

    const onFocus = () => {
      const entry = cache.get(key) as CacheEntry<T> | undefined;
      if (!entry || Date.now() - entry.fetchedAt > 30_000) {
        doFetch(!!entry?.data);
      }
    };

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [key, revalidateOnFocus, enabled, doFetch]);

  return { data, error, isLoading, isRefetching, refetch };
}
