"use client";

import { useState, useCallback } from "react";
import { isAnalyticsEnabled, saveSettings } from "@/lib/analytics";

/**
 * React hook for reading and toggling the analytics opt-out preference.
 * Reads from localStorage on mount; updates propagate immediately.
 */
export function useAnalyticsPrefs() {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(() =>
    typeof window === "undefined" ? true : isAnalyticsEnabled(),
  );

  const toggle = useCallback((value: boolean) => {
    saveSettings({ analyticsEnabled: value });
    setAnalyticsEnabled(value);
  }, []);

  return { analyticsEnabled, toggle };
}
