/**
 * lib/analytics.ts
 *
 * Typed analytics emitter wrapping @vercel/analytics track().
 *
 * Funnel events:
 *   wallet_connect        – user connects their Stellar wallet
 *   poll_create           – a new poll is submitted
 *   stake_placed          – user stakes on a poll outcome
 *   vote_cast             – user casts a resolution vote
 *   winnings_claimed      – user claims winnings from a resolved poll
 *
 * Design decisions:
 *   • No wallet addresses / seeds — only category, match, side
 *   • Opt-out via useAnalyticsPrefs().analyticsEnabled = false
 *     (stored in localStorage under "predictx_settings")
 *   • Safe to call server-side — guard prevents any execution outside browser
 */

import { track as vercelTrack } from "@vercel/analytics";

// ─── Event catalogue ──────────────────────────────────────────────────────────

export type AnalyticsEvent =
  | { name: "wallet_connect" }
  | { name: "wallet_disconnect" }
  | { name: "poll_create"; pollCategory: string; matchId: string }
  | {
      name: "stake_placed";
      pollCategory: string;
      matchId: string;
      side: "yes" | "no";
      amountUSD: number;
    }
  | {
      name: "vote_cast";
      pollCategory: string;
      matchId: string;
      decision: "yes" | "no" | "unclear";
    }
  | { name: "winnings_claimed"; pollId: string; amountUSD: number };

// ─── Opt-out preference ───────────────────────────────────────────────────────

const SETTINGS_KEY = "predictx_settings";

interface Settings {
  analyticsEnabled: boolean;
  /** Future settings can live here */
}

function loadSettings(): Settings {
  if (typeof window === "undefined") return { analyticsEnabled: true };
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { analyticsEnabled: true };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      analyticsEnabled: parsed.analyticsEnabled !== false,
    };
  } catch {
    return { analyticsEnabled: true };
  }
}

export function saveSettings(settings: Partial<Settings>): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadSettings();
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ ...current, ...settings }),
    );
  } catch {
    // Swallow storage errors
  }
}

/** Returns true if the user has analytics enabled (default: true). */
export function isAnalyticsEnabled(): boolean {
  return loadSettings().analyticsEnabled;
}

// ─── Core emitter ─────────────────────────────────────────────────────────────

/**
 * Track an analytics event.
 * Silently no-ops when:
 *   - running server-side
 *   - the user has opted out
 */
export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === "undefined") return;
  if (!isAnalyticsEnabled()) return;

  const { name, ...properties } = event;
  try {
    vercelTrack(name, properties as Record<string, string | number | boolean | null>);
  } catch {
    // Never let analytics crash the app
  }
}
