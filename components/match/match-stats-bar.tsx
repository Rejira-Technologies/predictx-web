"use client"

import { motion } from "framer-motion"
import { BarChart3, DollarSign, Users } from "lucide-react"
import { GlowCard, AnimatedCounter, GlowIcon } from "@/components/shared"

interface MatchStatsBarProps {
  totalPolls: number
  totalPool: number
  totalParticipants: number
}

export function MatchStatsBar({
  totalPolls,
  totalPool,
  totalParticipants,
}: MatchStatsBarProps) {
  const stats = [
    {
      icon: BarChart3,
      iconColor: "#00d9ff",
      label: "Active Polls",
      value: totalPolls,
      suffix: "polls",
      format: "number" as const,
      variant: "default" as const,
      textClass: "",
    },
    {
      icon: DollarSign,
      iconColor: "#ffd700",
      label: "Total at Stake",
      value: totalPool,
      prefix: "$",
      suffix: "at stake",
      format: "compact" as const,
      variant: "gold" as const,
      textClass: "text-gold text-glow-gold",
    },
    {
      icon: Users,
      iconColor: "#39ff14",
      label: "Participants",
      value: totalParticipants,
      suffix: "stakers",
      format: "number" as const,
      variant: "success" as const,
      textClass: "text-success",
    },
  ]

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.4 }}
    >
      {stats.map((s) => (
        <GlowCard key={s.label} variant={s.variant} className="p-4" animated>
          <div className="relative z-20 flex items-center gap-3">
            <GlowIcon
              icon={s.icon}
              color={s.iconColor}
              size={20}
              animated
              animationType="pulse"
            />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">
                {s.label}
              </p>
              <div className="flex items-baseline gap-1.5">
                <AnimatedCounter
                  value={s.value}
                  prefix={s.prefix}
                  format={s.format}
                  className={`text-xl font-bold ${s.textClass}`}
                />
                <span className="text-xs text-muted-foreground">{s.suffix}</span>
              </div>
            </div>
          </div>
        </GlowCard>
      ))}
    </motion.div>
  )
}
