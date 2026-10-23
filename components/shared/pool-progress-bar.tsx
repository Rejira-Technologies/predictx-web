"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface PoolProgressBarProps {
  yesPercentage: number;
  yesAmount: number;
  noAmount: number;
  animated?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: {
    height: "h-2",
    labelSize: "text-xs",
    amountSize: "text-xs",
  },
  md: {
    height: "h-4",
    labelSize: "text-sm",
    amountSize: "text-sm",
  },
  lg: {
    height: "h-6",
    labelSize: "text-base",
    amountSize: "text-base",
  },
};

export function PoolProgressBar({
  yesPercentage,
  yesAmount,
  noAmount,
  animated = true,
  size = "md",
  className,
}: PoolProgressBarProps) {
  // Clamp percentage between 0 and 100
  const clampedYes = Math.max(0, Math.min(100, yesPercentage));
  const noPercentage = 100 - clampedYes;

  const sizes = sizeClasses[size];
  const totalAmount = yesAmount + noAmount;

  return (
    <div className={cn("w-full", className)}>
      {/* Labels above bar */}
      <div className={cn("flex justify-between mb-2", sizes.labelSize)}>
        <div className="flex items-center gap-2">
          <span className="text-[#00d9ff] font-medium">YES</span>
          <span className="text-[var(--muted-foreground)]">
            {clampedYes.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[var(--muted-foreground)]">
            {noPercentage.toFixed(1)}%
          </span>
          <span className="text-[#ff006e] font-medium">NO</span>
        </div>
      </div>

      {/* Progress bar container */}
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clampedYes)}
        aria-valuetext={`YES ${clampedYes.toFixed(1)}%, NO ${noPercentage.toFixed(1)}%`}
        aria-label="Pool split between YES and NO"
        className={cn(
          "relative w-full rounded-full overflow-hidden",
          sizes.height
        )}
        style={{
          background: "rgba(0, 0, 0, 0.3)",
          boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Segment ticks at 25%, 50%, 75% */}
        <div className="absolute inset-0 flex justify-between px-[25%] pointer-events-none z-10">
          <div className="w-px h-full bg-[var(--background)]/50" />
          <div className="w-px h-full bg-[var(--background)]/50" />
          <div className="w-px h-full bg-[var(--background)]/50" />
        </div>

        {/* Yes side (left/cyan) */}
        <motion.div
          className="absolute left-0 top-0 h-full"
          initial={animated ? { width: 0 } : { width: `${clampedYes}%` }}
          animate={{ width: `${clampedYes}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          style={{
            background: `linear-gradient(
              90deg,
              rgba(0, 217, 255, 0.8) 0%,
              rgba(0, 217, 255, 0.6) 100%
            )`,
            boxShadow: `0 0 20px rgba(0, 217, 255, 0.5), inset 0 0 10px rgba(0, 217, 255, 0.3)`,
          }}
        >
          {/* Animated gradient flow */}
          {animated && (
            <motion.div
              className="absolute inset-0"
              animate={{
                backgroundPosition: ["0% 0%", "200% 0%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                background: `linear-gradient(
                  90deg,
                  transparent 0%,
                  rgba(255, 255, 255, 0.3) 50%,
                  transparent 100%
                )`,
                backgroundSize: "50% 100%",
              }}
            />
          )}
        </motion.div>

        {/* No side (right/magenta) */}
        <motion.div
          className="absolute right-0 top-0 h-full"
          initial={
            animated ? { width: 0 } : { width: `${noPercentage}%` }
          }
          animate={{ width: `${noPercentage}%` }}
          transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
          style={{
            background: `linear-gradient(
              90deg,
              rgba(255, 0, 110, 0.6) 0%,
              rgba(255, 0, 110, 0.8) 100%
            )`,
            boxShadow: `0 0 20px rgba(255, 0, 110, 0.5), inset 0 0 10px rgba(255, 0, 110, 0.3)`,
          }}
        >
          {/* Animated gradient flow */}
          {animated && (
            <motion.div
              className="absolute inset-0"
              animate={{
                backgroundPosition: ["200% 0%", "0% 0%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                background: `linear-gradient(
                  90deg,
                  transparent 0%,
                  rgba(255, 255, 255, 0.3) 50%,
                  transparent 100%
                )`,
                backgroundSize: "50% 100%",
              }}
            />
          )}
        </motion.div>

        {/* Spark effect at Yes edge */}
        <motion.div
          className="absolute top-0 h-full w-1 pointer-events-none"
          style={{
            left: `${clampedYes}%`,
            transform: "translateX(-50%)",
          }}
          animate={
            animated
              ? {
                  boxShadow: [
                    "0 0 5px rgba(255, 255, 255, 0.5)",
                    "0 0 15px rgba(255, 255, 255, 0.8)",
                    "0 0 5px rgba(255, 255, 255, 0.5)",
                  ],
                }
              : {}
          }
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* Center line marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-20"
          style={{ left: `${clampedYes}%`, transform: "translateX(-50%)" }}
        />
      </div>

      {/* Amounts below bar */}
      <div className={cn("flex justify-between mt-2", sizes.amountSize)}>
        <span className="text-[#00d9ff]">
          ${yesAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
        <span className="text-[#ff006e]">
          ${noAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>

      {/* Total pool indicator */}
      <div className="text-center mt-1" aria-live="polite">
        <span className="text-xs text-[var(--muted-foreground)]">
          Total Pool: ${" "}
          {totalAmount.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span>
      </div>
    </div>
  );
}
