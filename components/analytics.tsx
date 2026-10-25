"use client";

import { Analytics as VercelAnalytics } from "@vercel/analytics/next";
import { useAnalyticsPrefs } from "@/hooks/use-analytics-prefs";

export function Analytics() {
  const { analyticsEnabled } = useAnalyticsPrefs();

  if (!analyticsEnabled) {
    return null;
  }

  return <VercelAnalytics />;
}