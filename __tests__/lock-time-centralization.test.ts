/**
 * Tests that pin the lock-time derivation to LOCK_OFFSET_MINUTES values.
 *
 * These confirm that getLockTimestamp / getLockTargetISO (used by every
 * countdown widget and the create-poll-modal preview) produce the same
 * instant for a given kickoff + lockTime combination, and that the offsets
 * match the documented minutes.
 */

import { LOCK_OFFSET_MINUTES, getLockTimestamp, getLockTargetISO } from "../lib/calculations";

const KICKOFF_ISO = "2026-10-01T15:00:00.000Z";
const KICKOFF_MS = new Date(KICKOFF_ISO).getTime();

describe("LOCK_OFFSET_MINUTES constants", () => {
  test("kickoff offset is 0 minutes", () => {
    expect(LOCK_OFFSET_MINUTES.kickoff).toBe(0);
  });

  test("halftime offset is 52 minutes", () => {
    expect(LOCK_OFFSET_MINUTES.halftime).toBe(52);
  });

  test("60min offset is 65 minutes", () => {
    expect(LOCK_OFFSET_MINUTES["60min"]).toBe(65);
  });
});

describe("getLockTimestamp", () => {
  test("kickoff lock equals kickoff time exactly", () => {
    expect(getLockTimestamp(KICKOFF_ISO, "kickoff")).toBe(KICKOFF_MS);
  });

  test("halftime lock equals kickoff + 52 minutes", () => {
    const expected = KICKOFF_MS + 52 * 60_000;
    expect(getLockTimestamp(KICKOFF_ISO, "halftime")).toBe(expected);
  });

  test("60min lock equals kickoff + 65 minutes", () => {
    const expected = KICKOFF_MS + 65 * 60_000;
    expect(getLockTimestamp(KICKOFF_ISO, "60min")).toBe(expected);
  });

  test("returns NaN for unparseable kickoff", () => {
    expect(getLockTimestamp("not-a-date", "halftime")).toBeNaN();
  });
});

describe("getLockTargetISO", () => {
  test("halftime ISO round-trips via Date", () => {
    const iso = getLockTargetISO(KICKOFF_ISO, "halftime");
    const ms = new Date(iso).getTime();
    expect(ms).toBe(KICKOFF_MS + 52 * 60_000);
  });

  test("60min ISO round-trips via Date", () => {
    const iso = getLockTargetISO(KICKOFF_ISO, "60min");
    const ms = new Date(iso).getTime();
    expect(ms).toBe(KICKOFF_MS + 65 * 60_000);
  });

  test("fallback to kickoff ISO when kickoff is invalid", () => {
    const iso = getLockTargetISO("bad-date", "halftime");
    // When kickoff is unparseable, function returns the kickoff string as-is
    expect(iso).toBe("bad-date");
  });
});
