"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlowCardProps {
  variant?: "default" | "success" | "danger" | "gold";
  glowColor?: string;
  animated?: boolean;
  className?: string;
  children: ReactNode;
}

/** RGB channel tuples used to build alpha-correct rgba() strings at use-site. */
const variantChannels = {
  default: { r: 0,   g: 217, b: 255 },
  success: { r: 57,  g: 255, b: 20  },
  danger:  { r: 255, g: 0,   b: 110 },
  gold:    { r: 255, g: 215, b: 0   },
  primary: { r: 0,   g: 217, b: 255 },
};

/** Build a valid rgba() string from a channel tuple + alpha. */
function rgba(ch: { r: number; g: number; b: number }, alpha: number): string {
  return `rgba(${ch.r}, ${ch.g}, ${ch.b}, ${alpha})`;
}

const variantStyles = {
  default: {
    border: rgba(variantChannels.default, 0.3),
    glow: rgba(variantChannels.default, 0.4),
    innerGlow: rgba(variantChannels.default, 0.1),
    channels: variantChannels.default,
  },
  success: {
    border: rgba(variantChannels.success, 0.3),
    glow: rgba(variantChannels.success, 0.4),
    innerGlow: rgba(variantChannels.success, 0.1),
    channels: variantChannels.success,
  },
  danger: {
    border: rgba(variantChannels.danger, 0.3),
    glow: rgba(variantChannels.danger, 0.4),
    innerGlow: rgba(variantChannels.danger, 0.1),
    channels: variantChannels.danger,
  },
  gold: {
    border: rgba(variantChannels.gold, 0.3),
    glow: rgba(variantChannels.gold, 0.4),
    innerGlow: rgba(variantChannels.gold, 0.1),
    channels: variantChannels.gold,
  },
  primary: {
    border: rgba(variantChannels.primary, 0.3),
    glow: rgba(variantChannels.primary, 0.4),
    innerGlow: rgba(variantChannels.primary, 0.1),
    channels: variantChannels.primary,
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
