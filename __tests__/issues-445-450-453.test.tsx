import { describe, it, expect, beforeAll } from "vitest";
import fs from "fs";
import path from "path";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { EvidenceSection } from "@/components/voting/evidence-section";

// Configure react act environment for React 19 in jsdom
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom does not implement window.scrollTo, which framer-motion invokes while
// animating the panel's height; stub it so the test output stays clean.
beforeAll(() => {
  window.scrollTo = (() => {}) as typeof window.scrollTo;
});

/* ------------------------------------------------------------------ *
 * Issue #453 — Evidence accordion hardcoded panel id
 * ------------------------------------------------------------------ *
 * The trigger's `aria-controls` and the panel's `id` were the literal
 * `evidence-section-panel`, so two voting cards on one page shared a
 * single id and every trigger resolved to the first card's panel. The
 * fix derives a unique id per instance via `useId()`.
 * ------------------------------------------------------------------ */
describe("Issue #453 - EvidenceSection per-instance ids", () => {
  it("derives a unique panel id per instance and links aria-controls <-> id", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <div>
          <EvidenceSection matchId="match-alpha" />
          <EvidenceSection matchId="match-beta" />
        </div>
      );
    });

    // Each card renders a trigger button with aria-expanded + aria-controls.
    const triggers = Array.from(
      container.querySelectorAll<HTMLElement>("[aria-expanded][aria-controls]"),
    );
    expect(triggers).toHaveLength(2);

    const panelIds = triggers.map((t) => t.getAttribute("aria-controls"));
    // No leftover hardcoded literal id.
    expect(panelIds.every((id) => id !== "evidence-section-panel")).toBe(true);
    // Unique per instance — the bug was both resolving to "evidence-section-panel".
    expect(panelIds.every((id) => id && id.length > 0)).toBe(true);
    expect(new Set(panelIds).size).toBe(2);

    // The tooltip's aria-describedby is unique per instance too (same bug class,
    // same component — previously the literal "evidence-tooltip").
    const infoSpans = Array.from(
      container.querySelectorAll<HTMLElement>("[aria-describedby]"),
    );
    expect(infoSpans).toHaveLength(2);
    const tooltipIds = infoSpans.map((s) => s.getAttribute("aria-describedby"));
    expect(tooltipIds.every((id) => id !== "evidence-tooltip")).toBe(true);
    expect(new Set(tooltipIds).size).toBe(2);
    // Panel and tooltip ids must not collide with each other either.
    expect(new Set([...panelIds, ...tooltipIds]).size).toBe(4);

    // Expand both cards so the panels mount, then confirm each aria-controls
    // resolves to exactly one element with that id (no duplicate-id collision).
    await act(async () => {
      triggers.forEach((t) => t.click());
    });
    // Let framer-motion flush its pending animation measurements inside act
    // so the jsdom render step does not fire a state update outside it.
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    const idCounts = new Map<string, number>();
    container.querySelectorAll<HTMLElement>("[id]").forEach((el) => {
      const idv = el.getAttribute("id")!;
      idCounts.set(idv, (idCounts.get(idv) ?? 0) + 1);
    });
    for (const id of panelIds) {
      expect(id).toBeTruthy();
      expect(idCounts.get(id as string)).toBe(1);
    }

    await act(async () => {
      root.unmount();
    });
    container.remove();
  });
});

/* ------------------------------------------------------------------ *
 * Issue #450 — Create-poll Retry only clears, never retries
 * ------------------------------------------------------------------ *
 * The "Retry" button ran `setSubmitError("")`, dismissing the banner
 * without re-invoking the transaction. The fix clears the banner then
 * re-runs `handleSubmit()`.
 * ------------------------------------------------------------------ */
describe("Issue #450 - Create-poll Retry retries the transaction", () => {
  const src = fs.readFileSync(
    path.resolve(__dirname, "../components/poll/create-poll-modal.tsx"),
    "utf-8",
  );

  it("no longer dismisses the error with a single setSubmitError clear", () => {
    // The buggy one-liner handler is gone.
    expect(src).not.toContain('onClick={() => setSubmitError("")}');
  });

  it("re-invokes handleSubmit from the Retry button after clearing the error", () => {
    expect(src).toContain("void handleSubmit();");

    // Anchor on the unique retry call, then walk back to its <button> to prove
    // the Retry button (not just any handler) re-runs the submission.
    const handleSubmitIdx = src.indexOf("void handleSubmit();");
    expect(handleSubmitIdx).toBeGreaterThan(-1);
    const buttonStart = src.lastIndexOf("<button", handleSubmitIdx);
    expect(buttonStart).toBeGreaterThan(-1);
    const buttonBlock = src.slice(buttonStart, handleSubmitIdx + "void handleSubmit();".length);
    expect(buttonBlock).toContain("void handleSubmit();");
    expect(buttonBlock).toContain('setSubmitError("")');
    // And that button is labelled Retry.
    const after = src.slice(handleSubmitIdx, handleSubmitIdx + 500);
    expect(after).toContain("Retry");
  });
});

/* ------------------------------------------------------------------ *
 * Issue #445 — Stake modal close/backdrop/Escape frozen during a tx
 * ------------------------------------------------------------------ *
 * The close button and backdrop used `txStep === "idle" && onClose()`
 * and Escape had no `processing` path, so dismissal looked live but
 * did nothing mid-transaction. The fix gates all three affordances on
 * `isTxActive`, gives the close button `aria-disabled` + a tooltip, and
 * makes Escape mirror the locked state (only closes from `idle`).
 * ------------------------------------------------------------------ */
describe("Issue #445 - Stake modal dismiss affordances locked during tx", () => {
  const src = fs.readFileSync(
    path.resolve(__dirname, "../components/staking/stake-modal.tsx"),
    "utf-8",
  );

  it("derives isTxActive and gates the close button + backdrop with it", () => {
    expect(src).toContain('const isTxActive = txStep !== "idle";');
    // Backdrop and close button no longer use the old silent guard.
    expect(src).not.toContain('txStep === "idle" && onClose()');
    // Both now branch on !isTxActive.
    const gated = src.match(/if \(!isTxActive\) onClose\(\)/g) ?? [];
    expect(gated.length).toBeGreaterThanOrEqual(2);
  });

  it("marks the close button aria-disabled with an explanatory tooltip while a tx is active", () => {
    expect(src).toMatch(/aria-disabled=\{isTxActive/);
    expect(src).toContain(
      'aria-label={isTxActive ? "Close (disabled while a transaction is in progress)" : "Close"}',
    );
    expect(src).toContain('role="tooltip"');
    expect(src).toContain(
      "Closing is disabled while a transaction is in progress",
    );
  });

  it("Escape only closes from idle and no longer silently does nothing during processing", () => {
    // The old confirm -> idle special-case branch is removed.
    expect(src).not.toContain(
      'if (txStep === "confirm") {\n          setTxStep("idle");\n        } else if (txStep === "idle") {',
    );
    // Escape now closes only from idle.
    expect(src).toContain(
      'if (txStep === "idle") {\n          onClose();\n        }',
    );
  });

  it("no longer carries the duplicated `return (` that broke ProcessingOverlay", () => {
    expect(src).not.toMatch(/return \(\nreturn \(/);
  });
});
