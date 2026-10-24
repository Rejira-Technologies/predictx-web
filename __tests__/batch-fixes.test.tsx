import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { Progress } from "@/components/ui/progress";
import { AchievementToast } from "@/components/shared/achievement-toast";

// Configure react act environment for React 19 in jsdom
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe("Issue #322 - CSS cascade layers", () => {
  it("ensures responsive 44px touch targets are placed inside @layer base", () => {
    const cssPath = path.resolve(__dirname, "../app/globals.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    // Verify @layer base contains min-height: 44px;
    const baseLayerStart = cssContent.indexOf("@layer base {");
    expect(baseLayerStart).toBeGreaterThan(-1);

    const baseLayerEnd = cssContent.indexOf("@layer utilities {");
    expect(baseLayerEnd).toBeGreaterThan(baseLayerStart);

    const baseSection = cssContent.substring(baseLayerStart, baseLayerEnd);
    expect(baseSection).toContain("min-height: 44px;");
    expect(baseSection).toContain("button,");
    expect(baseSection).toContain("a,");
    expect(baseSection).toContain('[role="button"]');
  });

  it("ensures prefers-reduced-motion blanket backstop is defined in globals.css", () => {
    const cssPath = path.resolve(__dirname, "../app/globals.css");
    const cssContent = fs.readFileSync(cssPath, "utf-8");

    expect(cssContent).toContain("@media (prefers-reduced-motion: reduce)");
    expect(cssContent).toContain(".animate-pulse-glow,");
    expect(cssContent).toContain(".animate-shimmer,");
    expect(cssContent).toContain(".particle,");
    expect(cssContent).toContain(".typing-cursor::after");
  });
});

describe("Issue #318 - Progress component", () => {
  it("forwards value, max, and aria-label to Radix Root", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <Progress value={65} max={100} aria-label="Stake distribution: 65% YES" />
      );
    });

    const progressElement = container.querySelector('[data-slot="progress"]');
    expect(progressElement).not.toBeNull();
    expect(progressElement?.getAttribute("aria-valuenow")).toBe("65");
    expect(progressElement?.getAttribute("aria-valuemax")).toBe("100");
    expect(progressElement?.getAttribute("aria-label")).toBe("Stake distribution: 65% YES");
    expect(progressElement?.getAttribute("data-state")).toBe("loading");

    root.unmount();
    container.remove();
  });
});

describe("Issue #320 - AchievementToast", () => {
  it("only calls onClose once on manual dismissal and does not double-fire when auto-dismiss interval elapses", async () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(
        <AchievementToast
          title="Test Achievement"
          description="Great job!"
          icon={<span>🏆</span>}
          xp={50}
          onClose={onClose}
        />
      );
    });

    // Find and click the close button
    const closeButton = container.querySelector("button");
    expect(closeButton).not.toBeNull();

    await act(async () => {
      closeButton?.click();
    });

    // Advance 300ms for exit animation
    await act(async () => {
      vi.advanceTimersByTime(350);
    });

    expect(onClose).toHaveBeenCalledTimes(1);

    // Advance past the 3000ms auto-dismiss time
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });

    // Must still be called exactly once, not twice
    expect(onClose).toHaveBeenCalledTimes(1);

    root.unmount();
    container.remove();
    vi.useRealTimers();
  });
});
