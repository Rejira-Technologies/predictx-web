"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Trophy,
  Shield,
  Zap,
  Target,
  TrendingDown,
  Award,
  Star,
  Flame,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Variant, VARIANT_THEME_MAP, getVariantRgba } from "./variants";

export type { Variant };

export interface BadgeComponentProps {
  type: "achievement" | "rank" | "streak" | "win" | "loss";
  label: string;
  icon?: ReactNode;
  variant: Variant;
  locked?: boolean;
  className?: string;
}

const variantColors: Record<
  Variant,
  {
    border: string;
    glow: string;
    bg: string;
    text: string;
  }
> = {
  success: {
    border: getVariantRgba("success", 0.5),
    glow: getVariantRgba("success", 0.4),
    bg: getVariantRgba("success", 0.1),
    text: VARIANT_THEME_MAP.success.var,
  },
  danger: {
    border: getVariantRgba("danger", 0.5),
    glow: getVariantRgba("danger", 0.4),
    bg: getVariantRgba("danger", 0.1),
    text: VARIANT_THEME_MAP.danger.var,
  },
  neutral: {
    border: getVariantRgba("neutral", 0.5),
    glow: getVariantRgba("neutral", 0.4),
    bg: getVariantRgba("neutral", 0.1),
    text: VARIANT_THEME_MAP.neutral.var,
  },
  primary: {
    border: getVariantRgba("primary", 0.5),
    glow: getVariantRgba("primary", 0.4),
    bg: getVariantRgba("primary", 0.1),
    text: VARIANT_THEME_MAP.primary.var,
  },
  default: {
    border: getVariantRgba("default", 0.5),
    glow: getVariantRgba("default", 0.4),
    bg: getVariantRgba("default", 0.1),
    text: VARIANT_THEME_MAP.default.var,
  },
  gold: {
    border: getVariantRgba("gold", 0.5),
    glow: getVariantRgba("gold", 0.4),
    bg: getVariantRgba("gold", 0.1),
    text: VARIANT_THEME_MAP.gold.var,
  },
  ghost: {
    border: getVariantRgba("ghost", 0.5),
    glow: getVariantRgba("ghost", 0.4),
    bg: getVariantRgba("ghost", 0.1),
    text: VARIANT_THEME_MAP.ghost.var,
  },
};

const defaultIcons: Record<string, ReactNode> = {
  achievement: <Trophy className="w-4 h-4" />,
  rank: <Star className="w-4 h-4" />,
  streak: <Flame className="w-4 h-4" />,
  win: <Target className="w-4 h-4" />,
  loss: <TrendingDown className="w-4 h-4" />,
};

export function BadgeComponent({
  type,
  label,
  icon,
  variant = "neutral",
  locked = false,
  className,
}: BadgeComponentProps) {
  const colors = variantColors[variant] ?? variantColors.neutral;
  const Icon = icon || (locked ? <Lock className="w-4 h-4 text-muted-foreground" /> : defaultIcons[type]);

  if (locked) {
    return (
      <div
        className={cn(
          "relative inline-flex items-center gap-2 px-3 py-1.5 opacity-40 grayscale",
          className
        )}
        style={{
          clipPath:
            "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
        }}
        aria-label={`${label} — locked`}
      >
        <span className="text-muted-foreground">{Icon}</span>
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      className={cn("relative inline-flex items-center gap-2 px-3 py-1.5", className)}
      style={{
        clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
        background: colors.bg,
        border: `1px solid ${colors.border}`,
        boxShadow: `0 0 15px ${colors.glow}, inset 0 0 10px ${colors.glow.replace(/[\d.]+\)$/, "0.15)")}`,
      }}
      whileHover={{ scale: 1.05 }}
      animate={{
        boxShadow: [
          `0 0 10px ${colors.glow.replace(/[\d.]+\)$/, "0.2)")}`,
          `0 0 20px ${colors.glow}`,
          `0 0 10px ${colors.glow.replace(/[\d.]+\)$/, "0.2)")}`,
        ],
      }}
      transition={{
        boxShadow: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
    >
      {/* Holographic shine on hover */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        style={{
          background: `linear-gradient(
            135deg,
            transparent 30%,
            rgba(255, 255, 255, 0.1) 50%,
            transparent 70%
          )`,
        }}
      />

      {/* Icon */}
      <span style={{ color: colors.text }}>{Icon}</span>

      {/* Label */}
      <span
        className="text-xs font-medium uppercase tracking-wider"
        style={{ color: colors.text }}
      >
        {label}
      </span>
    </motion.div>
  );
}
