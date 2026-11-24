import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import fs from "fs";
import path from "path";

import { PoolProgressBar } from "@/components/shared/pool-progress-bar";
import { GlowCard } from "@/components/shared/glow-card";
import { AnimatedCounter } from "@/components/shared/animated-counter";

describe("Batch #457 - #460 shared-component fixes", () => {
  describe("Issue #457: PoolProgressBar honours showTotal", () => {
    it("renders the Total Pool row exactly once when showTotal is true", () => {
      const html = renderToStaticMarkup(
        <PoolProgressBar
          yesPercentage={70}
          yesAmount={7000}
          noAmount={3000}
          showTotal
        />
      );
      // The unconditional duplicate block is gone; only the showTotal-gated row remains.
      expect((html.match(/Total Pool:/g) || []).length).toBe(1);
    });

    it("hides the Total Pool row entirely when showTotal is false", () => {
      const html = renderToStaticMarkup(
        <PoolProgressBar
          yesPercentage={50}
          yesAmount={100}
          noAmount={100}
          showTotal={false}
        />
      );
      expect(html).not.toContain("Total Pool:");
    });

    it("keeps the aria-live announcement on the showTotal-gated row", () => {
      const html = renderToStaticMarkup(
        <PoolProgressBar
          yesPercentage={70}
          yesAmount={7000}
          noAmount={3000}
          showTotal
        />
      );
      expect(html).toContain('aria-live="polite"');
      expect(html).toContain("Total Pool:");
    });
  });

  describe("Issue #458: GlowCard drops the dead glowColor prop", () => {
    it("does not declare a glowColor prop or customGlow variable", () => {
      const source = fs.readFileSync(
        path.resolve(__dirname, "../components/shared/glow-card.tsx"),
        "utf-8"
      );
      expect(source).not.toContain("glowColor");
      expect(source).not.toContain("customGlow");
    });

    it("renders a card without any glowColor prop", () => {
      const html = renderToStaticMarkup(
        <GlowCard variant="danger">
          <span>danger card</span>
        </GlowCard>
      );
      expect(html).toContain("danger card");
    });
  });

  describe("Issue #459: AnimatedCounter live region is separate and stable", () => {
    it("announces the settled value via a visually-hidden live region", () => {
      const html = renderToStaticMarkup(
        <AnimatedCounter value={1234.5} prefix="$" format="currency" />
      );
      // The live region carries the settled (prop) value, not the per-frame display value.
      expect(html).toContain("$1,234.50");
      expect(html).toContain("sr-only");
      expect(html).toContain('aria-live="polite"');
    });

    it("does not interpolate the animated display value into an aria-label", () => {
      const html = renderToStaticMarkup(
        <AnimatedCounter value={1234.5} prefix="$" format="currency" />
      );
      // Initial displayValue is 0, so the old per-frame aria-label would have read "$0.00".
      expect(html).not.toContain('aria-label="$0.00"');
    });
  });

  describe("Issue #460: CountdownTimer keeps its reduced-motion guard", () => {
    it("has no unguarded duplicate animate/transition attributes", () => {
      const source = fs.readFileSync(
        path.resolve(__dirname, "../components/shared/countdown-timer.tsx"),
        "utf-8"
      );
      // The unguarded duplicates that shadowed the reduced-motion guard are gone.
      expect(source).not.toContain("animate={{ opacity: [1, 0.3, 1] }}");
      expect(source).not.toContain("animate={{ opacity: [1, 0.3, 1], scale: [1, 1.1, 1] }}");
      expect(source).not.toContain("transition={{ duration: 0.5, repeat: Infinity }}");
      // The guarded ternary branches must remain intact.
      expect(source).toContain(
        "animate={shouldReduceMotion ? { opacity: 1 } : { opacity: [1, 0.3, 1] }}"
      );
      expect(source).toContain(
        "animate={shouldReduceMotion ? { opacity: 1, scale: 1 } : { opacity: [1, 0.3, 1], scale: [1, 1.1, 1] }}"
      );
    });
  });
});
