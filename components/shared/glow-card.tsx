"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

import { Variant, VARIANT_THEME_MAP, getVariantRgba, rgba } from "./variants";

export type { Variant };

interface GlowCardProps {
  variant?: Variant;
  glowColor?: string;
  animated?: boolean;
  className?: string;
  children: ReactNode;
}

const variantStyles: Record<
  Variant,
  {
    border: string;
    glow: string;
    innerGlow: string;
    channels: { r: number; g: number; b: number };
  }
> = {
  default: {
    border: getVariantRgba("default", 0.3),
    glow: getVariantRgba("default", 0.4),
    innerGlow: getVariantRgba("default", 0.1),
    channels: VARIANT_THEME_MAP.default.channels,
  },
  primary: {
    border: getVariantRgba("primary", 0.3),
    glow: getVariantRgba("primary", 0.4),
    innerGlow: getVariantRgba("primary", 0.1),
    channels: VARIANT_THEME_MAP.primary.channels,
  },
  neutral: {
    border: getVariantRgba("neutral", 0.3),
    glow: getVariantRgba("neutral", 0.4),
    innerGlow: getVariantRgba("neutral", 0.1),
    channels: VARIANT_THEME_MAP.neutral.channels,
  },
  success: {
    border: getVariantRgba("success", 0.3),
    glow: getVariantRgba("success", 0.4),
    innerGlow: getVariantRgba("success", 0.1),
    channels: VARIANT_THEME_MAP.success.channels,
  },
  danger: {
    border: getVariantRgba("danger", 0.3),
    glow: getVariantRgba("danger", 0.4),
    innerGlow: getVariantRgba("danger", 0.1),
    channels: VARIANT_THEME_MAP.danger.channels,
  },
  gold: {
    border: getVariantRgba("gold", 0.3),
    glow: getVariantRgba("gold", 0.4),
    innerGlow: getVariantRgba("gold", 0.1),
    channels: VARIANT_THEME_MAP.gold.channels,
  },
  ghost: {
    border: getVariantRgba("ghost", 0.3),
    glow: getVariantRgba("ghost", 0.4),
    innerGlow: getVariantRgba("ghost", 0.1),
    channels: VARIANT_THEME_MAP.ghost.channels,
  },
};

export function GlowCard({
  variant = "default",
  glowColor,
  animated = true,
  className,
  children,
}: GlowCardProps) {
  const styles = variantStyles[variant as keyof typeof variantStyles] || variantStyles.default;
  // customGlow is used for full-opacity values; alpha variants are built from channels.
  const customGlow = glowColor || styles.glow;
  // When a custom glowColor string is provided we fall back to the variant channels
  // for alpha-correct variants (we cannot parse an arbitrary CSS color string).
  const glowCh = styles.channels;

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden",
        "bg-[#1a1f3a]/80 backdrop-blur-sm",
        className
      )}
      style={{
        clipPath:
          "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
      }}
      whileHover={animated ? { scale: 1.02 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {/* Outer border layer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${styles.border} 0%, transparent 50%, ${styles.border} 100%)`,
          clipPath:
            "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
        }}
      />

      {/* Inner border layer */}
      <div
        className="absolute inset-[1px] pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${rgba(glowCh, 0.25)} 0%, transparent 50%, ${rgba(glowCh, 0.25)} 100%)`,
          clipPath:
            "polygon(7px 0, calc(100% - 7px) 0, 100% 7px, 100% calc(100% - 7px), calc(100% - 7px) 100%, 7px 100%, 0 calc(100% - 7px), 0 7px)",
        }}
      />

      {/* Animated neon border glow */}
      {animated && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            boxShadow: [
              `inset 0 0 20px ${styles.innerGlow}, 0 0 20px ${rgba(glowCh, 0.19)}`,
              `inset 0 0 30px ${styles.innerGlow}, 0 0 40px ${rgba(glowCh, 0.31)}`,
              `inset 0 0 20px ${styles.innerGlow}, 0 0 20px ${rgba(glowCh, 0.19)}`,
            ],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Holographic gradient overlay */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-0"
        animate={
          animated
            ? {
              backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
            }
            : undefined
        }
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{
          background: `linear-gradient(
            135deg,
            transparent 0%,
            ${rgba(glowCh, 0.031)} 25%,
            ${rgba(glowCh, 0.02)} 50%,
            ${rgba(glowCh, 0.031)} 75%,
            transparent 100%
          )`,
          backgroundSize: "200% 200%",
        }}
      />

      {/* Tech grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `linear-gradient(${rgba(glowCh, 0.063)} 1px, transparent 1px),
            linear-gradient(90deg, ${rgba(glowCh, 0.063)} 1px, transparent 1px)`,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Horizontal scan-line overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            ${rgba(glowCh, 0.02)} 2px,
            ${rgba(glowCh, 0.02)} 4px
          )`,
        }}
      />

      {/* Inner shadow for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          boxShadow: "inset 0 2px 20px rgba(0, 0, 0, 0.5)",
        }}
      />

      {/* Content */}
      <div className="relative z-20 p-6">{children}</div>
    </motion.div>
  );
}
