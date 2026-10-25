"use client";

import { useState, useCallback, useEffect } from "react";
import { isAnalyticsEnabled, saveSettings } from "@/lib/analytics";

/**
 * React hook for reading and toggling the analytics opt-out preference.
 * Reads from localStorage on mount; updates propagate immediately.
 */
export function useAnalyticsPrefs() {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    setAnalyticsEnabled(isAnalyticsEnabled());
  }, []);

  const toggle = useCallback((value: boolean) => {
    saveSettings({ analyticsEnabled: value });
    setAnalyticsEnabled(value);
  }, []);

  return { analyticsEnabled, toggle };
}
