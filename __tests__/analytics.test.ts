/**
 * __tests__/analytics.test.ts
 *
 * Unit tests for lib/analytics.ts
 * Verifies event name/property shape, opt-out behaviour, and no-addr policy.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── Use vi.hoisted so mockTrack is available when vi.mock factory runs ────────
const { mockTrack } = vi.hoisted(() => ({ mockTrack: vi.fn() }));

// ── Mock @vercel/analytics so we never actually call the SDK ──────────────────
vi.mock("@vercel/analytics", () => ({
  track: mockTrack,
}));

// ── Import AFTER the mock is registered ───────────────────────────────────────
import {
  trackEvent,
  isAnalyticsEnabled,
  saveSettings,
  type AnalyticsEvent,
} from "@/lib/analytics";

// ── Helpers ───────────────────────────────────────────────────────────────────

/** localStorage stub — jsdom provides it but we want a clean slate each test */
function clearStorage() {
  localStorage.clear();
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("analytics emitter", () => {
  beforeEach(() => {
    clearStorage();
    mockTrack.mockClear();
  });

  afterEach(() => {
    clearStorage();
  });

  // ── Event shape ────────────────────────────────────────────────────────────

  it("wallet_connect fires with correct event name and no extra props", () => {
    trackEvent({ name: "wallet_connect" });

    expect(mockTrack).toHaveBeenCalledOnce();
    const [name, props] = mockTrack.mock.calls[0];
    expect(name).toBe("wallet_connect");
    // Must not leak addresses or seeds
    expect(props).not.toHaveProperty("address");
    expect(props).not.toHaveProperty("publicKey");
    expect(props).not.toHaveProperty("seed");
  });

  it("poll_create fires with pollCategory and matchId", () => {
    const event: AnalyticsEvent = {
      name: "poll_create",
      pollCategory: "player-event",
      matchId: "match-001",
    };
    trackEvent(event);

    expect(mockTrack).toHaveBeenCalledOnce();
    const [name, props] = mockTrack.mock.calls[0];
    expect(name).toBe("poll_create");
    expect(props).toMatchObject({ pollCategory: "player-event", matchId: "match-001" });
    expect(props).not.toHaveProperty("address");
  });

  it("stake_placed fires with pollCategory, matchId, side, amountUSD", () => {
    const event: AnalyticsEvent = {
      name: "stake_placed",
      pollCategory: "team-event",
      matchId: "match-002",
      side: "yes",
      amountUSD: 50,
    };
    trackEvent(event);

    expect(mockTrack).toHaveBeenCalledOnce();
    const [name, props] = mockTrack.mock.calls[0];
    expect(name).toBe("stake_placed");
    expect(props).toMatchObject({
      pollCategory: "team-event",
      matchId: "match-002",
      side: "yes",
      amountUSD: 50,
    });
    // Must NOT include wallet address
    expect(props).not.toHaveProperty("address");
    expect(props).not.toHaveProperty("publicKey");
  });

  it("vote_cast fires with pollCategory, matchId, decision", () => {
    const event: AnalyticsEvent = {
      name: "vote_cast",
      pollCategory: "score-prediction",
      matchId: "match-003",
      decision: "no",
    };
    trackEvent(event);

    const [name, props] = mockTrack.mock.calls[0];
    expect(name).toBe("vote_cast");
    expect(props).toMatchObject({
      pollCategory: "score-prediction",
      matchId: "match-003",
      decision: "no",
    });
  });

  it("winnings_claimed fires with pollId and amountUSD", () => {
    const event: AnalyticsEvent = {
      name: "winnings_claimed",
      pollId: "poll-abc",
      amountUSD: 120,
    };
    trackEvent(event);

    const [name, props] = mockTrack.mock.calls[0];
    expect(name).toBe("winnings_claimed");
    expect(props).toMatchObject({ pollId: "poll-abc", amountUSD: 120 });
    expect(props).not.toHaveProperty("address");
  });

  // ── Opt-out ────────────────────────────────────────────────────────────────

  it("does NOT call vercel track when analytics is disabled", () => {
    saveSettings({ analyticsEnabled: false });

    trackEvent({ name: "wallet_connect" });

    expect(mockTrack).not.toHaveBeenCalled();
  });

  it("resumes tracking after re-enabling analytics", () => {
    saveSettings({ analyticsEnabled: false });
    trackEvent({ name: "wallet_connect" });
    expect(mockTrack).not.toHaveBeenCalled();

    saveSettings({ analyticsEnabled: true });
    trackEvent({ name: "wallet_connect" });
    expect(mockTrack).toHaveBeenCalledOnce();
  });

  it("isAnalyticsEnabled returns true by default", () => {
    expect(isAnalyticsEnabled()).toBe(true);
  });

  it("isAnalyticsEnabled returns false after opt-out", () => {
    saveSettings({ analyticsEnabled: false });
    expect(isAnalyticsEnabled()).toBe(false);
  });
});
