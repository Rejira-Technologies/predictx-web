"use client"

import { ArrowRight, Zap } from "lucide-react"
import { Button } from "./ui/button"
import Link from "next/link"
import { motion, useReducedMotion } from "framer-motion"
import { AnimatedCounter, GamingButton } from "@/components/shared"

const WORDS = [
  { text: "Predict.", className: "text-glow-cyan text-primary" },
  { text: "Stake.", className: "text-glow-green text-success" },
  { text: "Win.", className: "text-glow-gold text-gold" },
]

const STATS = [
  { value: 234, label: "Active Polls", className: "text-primary text-glow-cyan", format: "number" as const },
  { value: 847000, label: "Total Locked", prefix: "$", className: "text-success text-glow-green", format: "compact" as const },
  { value: 12800, label: "Community", className: "text-gold text-glow-gold", format: "compact" as const },
]

export function Hero() {
  const shouldReduce = useReducedMotion()

  const fadeUp = (delay = 0) =>
    shouldReduce
      ? {}
      : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number], delay },
      }

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-background via-background-secondary to-background">
      {/* Animated grid background */}
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="particle particle-1" />
        <div className="particle particle-2" />
        <div className="particle particle-3" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24 sm:py-32 lg:px-8">
        <div className="text-center">
          {/* Energy badge */}
          <motion.div
            className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-primary/30 bg-surface/50 backdrop-blur-sm animate-pulse-glow"
            {...(shouldReduce ? {} : {
              initial: { opacity: 0, scale: 0.9 },
              animate: { opacity: 1, scale: 1 },
              transition: { duration: 0.4, delay: 0.1 },
            })}
          >
            <motion.div
              animate={shouldReduce ? {} : { y: [0, -3, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Zap className="h-4 w-4 text-gold fill-gold" />
            </motion.div>
            <span className="text-sm font-bold text-gold uppercase tracking-wider">Live Prediction Markets</span>
          </motion.div>

          {/* Staggered title */}
          <h1 className="font-display text-5xl sm:text-7xl lg:text-8xl font-black uppercase tracking-tight mb-6 overflow-hidden">
            {WORDS.map((word, i) => (
              <motion.span
                key={word.text}
                className={word.className}
                {...(shouldReduce ? {} : {
                  initial: { opacity: 0, y: 40 },
                  animate: { opacity: 1, y: 0 },
                  transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number], delay: 0.25 + i * 0.13 },
                })}
                style={{ display: "inline-block", marginRight: "0.25em" }}
              >
                {word.text}
              </motion.span>
            ))}
          </h1>

          {/* Subtitle */}
          <motion.p
            className="mx-auto max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed mb-10"
            {...fadeUp(0.62)}
          >
            The community-driven football prediction market on Stellar. Create polls, stake crypto on match events, vote on outcomes,
            and earn proportional rewards from the pool.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            {...fadeUp(0.75)}
          >
            <GamingButton
              variant="primary"
              size="lg"
              href="#matches"
              className="glow-cyan uppercase tracking-wider font-bold h-14 px-8"
            >
              <span className="flex items-center gap-2">
                Explore Matches
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </span>
            </GamingButton>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="border-2 border-primary/50 hover:border-primary hover:bg-surface font-bold uppercase tracking-wider h-14 px-8 bg-transparent"
            >
              <Link href="/how-it-works">How It Works</Link>
            </Button>
          </motion.div>

          {/* Live stats — count up whileInView */}
          <motion.div
            className="mt-16 flex flex-wrap justify-center gap-8 text-center"
            {...(shouldReduce ? {} : {
              initial: { opacity: 0 },
              whileInView: { opacity: 1 },
              viewport: { once: true, margin: "-60px" },
              transition: { duration: 0.5, delay: 0.1 },
            })}
          >
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.label}
                className="px-4"
                {...(shouldReduce ? {} : {
                  initial: { opacity: 0, y: 20 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true },
                  transition: { duration: 0.45, delay: 0.15 + i * 0.1 },
                })}
              >
                <div className={`text-3xl font-display font-black ${stat.className}`}>
                  <AnimatedCounter
                    value={stat.value}
                    prefix={stat.prefix}
                    format={stat.format}
                    className="text-3xl font-display font-black"
                    duration={1.2}
                  />
                </div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

