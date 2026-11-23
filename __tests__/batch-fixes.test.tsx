import { describe, it, expect, vi } from "vitest";
import fs from "fs";
import path from "path";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { Progress } from "@/components/ui/progress";
import { AchievementToast } from "@/components/shared/achievement-toast";

declare global {
  // React 19 act() environment flag; `var` is required for global augmentation.
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

// Configure react act environment for React 19 in jsdom
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const GLOBALS_CSS_PATH = path.resolve(__dirname, "../app/globals.css");

interface EmulatedMedia {
  /** Emulate a ≤767px touch viewport: @media (max-width: 767px) etc. apply. */
  mobile: boolean;
  /** Emulate prefers-reduced-motion: reduce. */
  reducedMotion: boolean;
}

function findMatchingBrace(css: string, openIdx: number): number {
  let depth = 0;
  for (let i = openIdx; i < css.length; i++) {
    if (css[i] === "{") depth++;
    else if (css[i] === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function mediaApplies(prelude: string, opts: EmulatedMedia): boolean {
  if (/prefers-reduced-motion/.test(prelude)) return opts.reducedMotion;
  return opts.mobile;
}

/**
 * Rewrite globals.css into a stylesheet jsdom can parse and evaluate:
 * Tailwind-only directives are dropped, @layer wrappers are unwrapped, and
 * @media blocks are kept only when their condition matches the emulated
 * environment. Rule order and specificity are preserved, so a later or
 * higher-specificity override still wins in getComputedStyle — which is
 * exactly what the old substring checks could not detect.
 */
function emulatedStylesheet(css: string, opts: EmulatedMedia): string {
  const stripped = css
    .replace(/@import[^;]*;/g, "")
    .replace(/@custom-variant[^;]*;/g, "")
    .replace(/@apply[^;]*;/g, "");

  function process(input: string): string {
    let out = "";
    let i = 0;
    const atRule = /@(layer|media|theme)\b/;
    while (i < input.length) {
      const m = atRule.exec(input.slice(i));
      if (!m) {
        out += input.slice(i);
        break;
      }
      const start = i + m.index;
      out += input.slice(i, start);
      const braceIdx = input.indexOf("{", start);
      const semiIdx = input.indexOf(";", start);
      if (braceIdx === -1 || (semiIdx !== -1 && semiIdx < braceIdx)) {
        out += input.slice(start, semiIdx + 1);
        i = semiIdx + 1;
        continue;
      }
      const closeIdx = findMatchingBrace(input, braceIdx);
      const name = m[1];
      const prelude = input.slice(start + m[0].length, braceIdx).trim();
      const inner = input.slice(braceIdx + 1, closeIdx);
      if (name === "layer") out += process(inner);
      else if (name === "media" && mediaApplies(prelude, opts)) out += process(inner);
      // @theme and non-matching @media blocks are dropped entirely.
      i = closeIdx + 1;
    }
    return out;
  }

  return process(stripped);
}

function withEmulatedCss(
  opts: EmulatedMedia,
  assert: () => void,
): void {
  const css = emulatedStylesheet(
    fs.readFileSync(GLOBALS_CSS_PATH, "utf-8"),
    opts,
  );
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);
  try {
    assert();
  } finally {
    style.remove();
  }
}

describe("Issue #322 - CSS cascade layers", () => {
  it("applies the 44px touch target under a mobile viewport", () => {
    withEmulatedCss({ mobile: true, reducedMotion: true }, () => {
      const button = document.createElement("button");
      document.body.appendChild(button);
      try {
        expect(getComputedStyle(button).minHeight).toBe("44px");
      } finally {
        button.remove();
      }
    });
  });

  it("does not apply the 44px touch target on desktop", () => {
    withEmulatedCss({ mobile: false, reducedMotion: false }, () => {
      const button = document.createElement("button");
      document.body.appendChild(button);
      try {
        expect(getComputedStyle(button).minHeight).not.toBe("44px");
      } finally {
        button.remove();
      }
    });
  });

  it("disables animations under prefers-reduced-motion", () => {
    withEmulatedCss({ mobile: true, reducedMotion: true }, () => {
      const el = document.createElement("div");
      el.className = "animate-pulse-glow";
      document.body.appendChild(el);
      try {
        // jsdom does not expand the `animation` shorthand into longhands,
        // so assert on the shorthand itself.
        expect(getComputedStyle(el).animation).toBe("none");
      } finally {
        el.remove();
      }
    });
  });

  it("keeps animations running without prefers-reduced-motion", () => {
    withEmulatedCss({ mobile: false, reducedMotion: false }, () => {
      const el = document.createElement("div");
      el.className = "animate-pulse-glow";
      document.body.appendChild(el);
      try {
        expect(getComputedStyle(el).animation).toContain("pulse-glow");
      } finally {
        el.remove();
      }
    });
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
