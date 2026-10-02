"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { Shield, Activity, Users, Trophy, type LucideIcon } from "lucide-react";
import { GlowCard } from "@/components/shared/glow-card";
import { GlowIcon } from "@/components/shared/glow-icon";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { useMockData } from "@/hooks/use-mock-data";

// ── Stat Card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  format?: "currency" | "number" | "compact";
  icon: LucideIcon;
  iconColor: string;
  variant?: "default" | "success" | "danger" | "gold";
  energyShield?: boolean;
  animate: boolean;
  delay?: number;
}

function StatCard({
  label,
  value,
  prefix,
  suffix,
  format = "number",
  icon: Icon,
  iconColor,
  variant = "default",
  energyShield = false,
  animate,
  delay = 0,
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={animate ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      <GlowCard
        variant={variant}
        className="h-full"
      >
        {/* Energy shield overlay for TVL card */}
        {energyShield && (
          <motion.div
            className="absolute inset-0 pointer-events-none rounded-sm z-0"
            animate={{
              background: [
                "radial-gradient(ellipse at 50% 100%, rgba(0,217,255,0.08) 0%, transparent 70%)",
                "radial-gradient(ellipse at 50% 100%, rgba(0,217,255,0.18) 0%, transparent 70%)",
                "radial-gradient(ellipse at 50% 100%, rgba(0,217,255,0.08) 0%, transparent 70%)",
              ],
            }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}

        <div className="relative z-10 flex flex-col gap-4">
          {/* Icon */}
          <div
            className="inline-flex w-12 h-12 items-center justify-center rounded-lg"
            style={{ background: `${iconColor}18`, border: `1px solid ${iconColor}40` }}
          >
            <GlowIcon
              icon={Icon}
              color={iconColor}
              size={22}
              animationType="pulse"
            />
          </div>

          {/* Value */}
          <div>
            <div
              className="text-4xl font-display font-black leading-none mb-2"
              style={{ color: iconColor }}
            >
              {animate ? (
                <AnimatedCounter
                  value={value}
                  prefix={prefix}
                  suffix={suffix}
                  format={format}
                  duration={1.5}
                  className="text-4xl font-display font-black"
                />
              ) : (
                <span className="font-mono">
                  {prefix}0{suffix}
                </span>
              )}
            </div>
            <p className="text-sm text-white/60 uppercase tracking-wider font-body">
              {label}
            </p>
          </div>
        </div>
      </GlowCard>
    </motion.div>
  );
}

// ── Section Header ─────────────────────────────────────────────────────────────

function SectionHeader({ animate }: { animate: boolean }) {
  return (
    <div className="text-center mb-12 space-y-3">
      <motion.h2
        className="font-display text-3xl md:text-4xl font-black uppercase tracking-wider text-foreground text-glow-cyan"
        initial={{ opacity: 0, y: -16 }}
        animate={animate ? { opacity: 1, y: 0 } : { opacity: 0, y: -16 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        By The Numbers
      </motion.h2>
      <motion.p
        className="text-muted-foreground text-sm uppercase tracking-widest font-body"
        initial={{ opacity: 0 }}
        animate={animate ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
      >
        Real-time platform activity
      </motion.p>
      <motion.div
        className="flex items-center justify-center gap-4 pt-1"
        initial={{ opacity: 0 }}
        animate={animate ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="h-px w-24 bg-gradient-to-r from-transparent to-primary/50" />
        <div className="w-2 h-2 rounded-full bg-primary glow-cyan" />
        <div className="h-px w-24 bg-gradient-to-l from-transparent to-primary/50" />
      </motion.div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function HomePlatformStats() {
  const sectionRef = useRef<HTMLDivElement>(null);
  // once: true ensures counters animate only the first time, not on every scroll
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });
  // Track whether we've already triggered (prevents re-animation if isInView
  // becomes false then true on some browsers)
  const [hasAnimated, setHasAnimated] = useState(false);
  if (isInView && !hasAnimated) setHasAnimated(true);

  const shouldAnimate = hasAnimated;

  const { platformStats } = useMockData();

  const stats = [
    {
      label: "Total Value Locked",
      value: platformStats.totalValueLocked,
      prefix: "$",
      format: "compact" as const,
      icon: Shield,
      iconColor: "#00d9ff",
      variant: "default" as const,
      energyShield: true,
    },
    {
      label: "Active Predictions",
      value: platformStats.activePredictions,
      format: "number" as const,
      icon: Activity,
      iconColor: "#39ff14",
      variant: "success" as const,
    },
    {
      label: "Community Members",
      value: platformStats.communityMembers,
      format: "number" as const,
      icon: Users,
      iconColor: "#00d9ff",
      variant: "default" as const,
    },
    {
      label: "Total Payouts",
      value: platformStats.totalPayouts,
      prefix: "$",
      format: "compact" as const,
      icon: Trophy,
      iconColor: "#ffd700",
      variant: "gold" as const,
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="bg-background-secondary border-y border-primary/20 py-16"
      aria-labelledby="platform-stats-heading"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-8">
        <SectionHeader animate={shouldAnimate} />

        {/* 4-column grid: 4 columns on desktop, 2×2 on mobile/tablet */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {stats.map((stat, index) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              prefix={stat.prefix}
              format={stat.format}
              icon={stat.icon}
              iconColor={stat.iconColor}
              variant={stat.variant}
              energyShield={stat.energyShield}
              animate={shouldAnimate}
              delay={0.1 * index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
