"use client";

import { useAnalyticsPrefs } from "@/hooks/use-analytics-prefs";
import { BarChart2, ShieldOff } from "lucide-react";

/**
 * AnalyticsPrefsCard
 *
 * Renders the analytics opt-out toggle. Uses useAnalyticsPrefs() which reads
 * from localStorage on mount and persists changes immediately.
 *
 * Deliberately kept as a leaf component (no routing, no layout) so it can be
 * embedded in any settings surface without restructuring the page.
 */
export function AnalyticsPrefsCard() {
  const { analyticsEnabled, toggle } = useAnalyticsPrefs();

  return (
    <div className="rounded-xl border border-primary/20 bg-background/60 backdrop-blur-sm p-6">
      {/* Header */}
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <BarChart2 className="w-5 h-5 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-display text-lg font-bold uppercase text-foreground tracking-wide">
            Analytics
          </h2>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            Help us improve PredictX by sharing anonymous usage data — which
            pages you visit and which features you use. No wallet addresses,
            stake amounts, or personal information are ever sent.
          </p>
        </div>
      </div>

      {/* Toggle row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          {analyticsEnabled ? (
            <BarChart2 className="w-4 h-4 text-primary" aria-hidden="true" />
          ) : (
            <ShieldOff className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
          )}
          <span className={analyticsEnabled ? "text-foreground" : "text-muted-foreground"}>
            {analyticsEnabled ? "Analytics enabled" : "Analytics disabled"}
          </span>
        </div>

        {/* Accessible toggle switch */}
        <button
          type="button"
          role="switch"
          aria-checked={analyticsEnabled}
          aria-label="Toggle analytics"
          onClick={() => toggle(!analyticsEnabled)}
          className={`
            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full
            border-2 transition-colors duration-200 ease-in-out
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
            ${analyticsEnabled
              ? "bg-primary border-primary"
              : "bg-muted border-border"
            }
          `}
        >
          <span className="sr-only">
            {analyticsEnabled ? "Disable analytics" : "Enable analytics"}
          </span>
          <span
            aria-hidden="true"
            className={`
              pointer-events-none inline-block h-4 w-4 mt-0.5
              rounded-full bg-background shadow-sm
              transform transition-transform duration-200 ease-in-out
              ${analyticsEnabled ? "translate-x-5" : "translate-x-0.5"}
            `}
          />
        </button>
      </div>

      {/* Explanatory footnote */}
      <p className="mt-4 text-xs text-muted-foreground border-t border-border/50 pt-4">
        This preference is stored in your browser&apos;s local storage under the key{" "}
        <code className="font-mono text-primary/80">predictx_settings</code>. Clearing
        your browser data will reset it to enabled.
      </p>
    </div>
  );
}
