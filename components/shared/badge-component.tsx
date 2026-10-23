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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BadgeComponentProps {
  type: "achievement" | "rank" | "streak" | "win" | "loss";
  label: string;
  icon?: ReactNode;
  variant: "success" | "danger" | "neutral" | "gold";
  className?: string;
}

const variantColors = {
  success: {
    border: "rgba(57, 255, 20, 0.5)",
    glow: "rgba(57, 255, 20, 0.4)",
    bg: "rgba(57, 255, 20, 0.1)",
    text: "#39ff14",
  },
  danger: {
    border: "rgba(255, 0, 110, 0.5)",
    glow: "rgba(255, 0, 110, 0.4)",
    bg: "rgba(255, 0, 110, 0.1)",
    text: "#ff006e",
  },
  neutral: {
    border: "rgba(0, 217, 255, 0.5)",
    glow: "rgba(0, 217, 255, 0.4)",
    bg: "rgba(0, 217, 255, 0.1)",
    text: "#00d9ff",
  },
  gold: {
    border: "rgba(255, 215, 0, 0.5)",
    glow: "rgba(255, 215, 0, 0.4)",
    bg: "rgba(255, 215, 0, 0.1)",
    text: "#ffd700",
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
  variant,
  className,
}: BadgeComponentProps) {
  const colors = variantColors[variant];
  const Icon = icon || defaultIcons[type];

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
