"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Calendar,
  Target,
  Coins,
  Eye,
  Scale,
  Trophy,
  Zap,
  Shield,
  History,
  Lock,
  ChevronDown,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Clock3,
  CircleDollarSign,
  Users,
  AlertTriangle,
} from "lucide-react";

import {
  GlowCard,
  GlowIcon,
  GamingButton,
  PoolProgressBar,
  AnimatedCounter,
} from "@/components/shared";

import { cn } from "@/lib/utils";
import { WalletConnectModal } from "@/components/wallet-connect-modal";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

type ColorVariant = "default" | "primary" | "neutral" | "success" | "danger" | "gold";

type IconComponent = typeof Calendar;

interface Step {
  title: string;
  description: string;
  icon: IconComponent;
  color: ColorVariant;
}

interface ResolutionStage {
  phase: string;
  trigger: string;
  description: string;
  duration: string;
  color: string;
  icon: IconComponent;
}

interface Concept {
  title: string;
  description: string;
  icon: IconComponent;
}

interface FAQItem {
  q: string;
  a: string;
}

/* -------------------------------------------------------------------------- */
/*                               Configuration                              */
/* -------------------------------------------------------------------------- */

const variantColors: Record<ColorVariant, string> = {
  default: "var(--accent-cyan, #00d9ff)",
  primary: "var(--accent-cyan, #00d9ff)",
  neutral: "var(--accent-neutral, var(--accent-cyan, #00d9ff))",
  success: "var(--accent-green, #39ff14)",
  danger: "var(--accent-magenta, #ff006e)",
  gold: "var(--accent-gold, #ffd700)",
};

const sectionReveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

/* -------------------------------------------------------------------------- */
/*                               How It Works                                */
/* -------------------------------------------------------------------------- */

const steps: Step[] = [
  {
    title: "Browse Matches",
    description:
      "Explore upcoming matches, discover available prediction markets, and find the questions you want to take a position on.",
    icon: Calendar,
    color: "default",
  },
  {
    title: "Pick a Prediction",
    description:
      'Choose a market such as "Will Palmer score?" and select the outcome you believe will happen: YES or NO.',
    icon: Target,
    color: "success",
  },
  {
    title: "Stake Your Crypto",
    description:
      "Choose your stake in XLM. Your potential payout depends on your share of the winning pool and the final pool distribution.",
    icon: Coins,
    color: "gold",
  },
  {
    title: "Watch the Match",
    description:
      "Follow the event. Once the prediction reaches its lock time, no more stakes or changes can be made.",
    icon: Eye,
    color: "default",
  },
  {
    title: "Community Verification",
    description:
      "Eligible community members review and vote on the outcome after the event. Participants in the market cannot vote on that market.",
    icon: Scale,
    color: "danger",
  },
  {
    title: "Collect Your Winnings",
    description:
      "Once the outcome is finalized and the dispute window closes, winning positions can receive their payout.",
    icon: Trophy,
    color: "success",
  },
];

/* -------------------------------------------------------------------------- */
/*                            Resolution Process                             */
/* -------------------------------------------------------------------------- */

const resolutionStages: ResolutionStage[] = [
  {
    phase: "Match Ends",
    trigger: "Event completion",
    description: "The market enters the outcome resolution process.",
    duration: "Automatic",
    color: "border-primary/40",
    icon: Clock3,
  },
  {
    phase: "Community Voting",
    trigger: "Voting begins",
    description: "Eligible non-participants submit their votes on the outcome.",
    duration: "2 hours",
    color: "border-primary/40",
    icon: Users,
  },
  {
    phase: "Auto Approval",
    trigger: "Above 85% consensus",
    description: "The outcome reaches the required consensus threshold for automatic approval.",
    duration: "Instant",
    color: "border-success/40",
    icon: CheckCircle2,
  },
  {
    phase: "Admin Review",
    trigger: "60–85% consensus",
    description: "Administrators review the outcome and supporting evidence.",
    duration: "~24 hours",
    color: "border-gold/40",
    icon: Eye,
  },
  {
    phase: "Multi-sig Review",
    trigger: "Below 60% consensus",
    description: "Multiple authorized administrators review and agree on the final outcome.",
    duration: "~48 hours",
    color: "border-danger/40",
    icon: Shield,
  },
  {
    phase: "Dispute Window",
    trigger: "After resolution",
    description: "Participants can challenge the result and submit relevant evidence.",
    duration: "24 hours",
    color: "border-primary/40",
    icon: AlertTriangle,
  },
  {
    phase: "Payout",
    trigger: "Dispute window closes",
    description: "Finalized winning positions become eligible for payout distribution.",
    duration: "Automatic",
    color: "border-success/40",
    icon: CircleDollarSign,
  },
];

/* -------------------------------------------------------------------------- */
/*                               Key Concepts                                */
/* -------------------------------------------------------------------------- */

const concepts: Concept[] = [
  {
    title: "Time Locks",
    description:
      "Every market has a defined lock time. Once locked, new stakes and position changes are no longer permitted.",
    icon: Lock,
  },
  {
    title: "Proportional Winnings",
    description:
      "Payouts are based on your contribution to the winning pool relative to the total winning stake.",
    icon: History,
  },
  {
    title: "Platform Fee",
    description:
      "A 5% platform fee is applied to the distributable pool according to the platform's fee rules.",
    icon: Zap,
  },
  {
    title: "Voter Rewards",
    description:
      "Eligible non-participants who help verify outcomes may receive rewards according to the voting reward mechanism.",
    icon: Scale,
  },
  {
    title: "Dispute Mechanism",
    description:
      "A defined challenge period allows contested results to be reviewed before payouts are finalized.",
    icon: Shield,
  },
  {
    title: "Stellar Network",
    description:
      "Transactions use Stellar blockchain infrastructure, enabling transparent and efficient on-chain settlement.",
    icon: Zap,
  },
];

/* -------------------------------------------------------------------------- */
/*                                   FAQs                                     */
/* -------------------------------------------------------------------------- */

const faqs: FAQItem[] = [
  {
    q: "What happens if I lose my prediction?",
    a: "Your stake in the losing pool is lost. You do not pay an additional losing-position fee beyond the applicable market rules.",
  },
  {
    q: "How are winnings calculated?",
    a: "Winning positions share the distributable pool proportionally to their stake. Applicable platform fees and voter rewards are deducted according to the market rules before the final distribution.",
  },
  {
    q: "Can I cancel my stake?",
    a: "No. Once your transaction is confirmed on-chain, your stake is final. Always review your prediction and amount before confirming.",
  },
  {
    q: "How do I earn from voting?",
    a: "Eligible users can participate in outcome verification for markets they did not stake in. Accurate voting may qualify for rewards based on the protocol's reward rules.",
  },
  {
    q: "What wallet do I need?",
    a: "You need a Stellar-compatible wallet. Supported wallets may include Freighter, Lobstr, and xBull, depending on the wallet integrations enabled on the platform.",
  },
  {
    q: "What token is used?",
    a: "XLM (Stellar Lumens), the native asset of the Stellar network, is used for staking and settlement where supported.",
  },
  {
    q: "Is the platform safe?",
    a: "Transactions are handled through blockchain-based infrastructure and smart contracts. However, blockchain transactions are irreversible, and smart-contract risk, wallet security, and market risk still apply.",
  },
  {
    q: "When do I receive my payout?",
    a: "Payouts become available after the outcome is finalized and the dispute window has closed, subject to smart-contract settlement.",
  },
  {
    q: "Can I vote on a market where I have staked?",
    a: "No. Market participants are excluded from voting on the outcome of their own market to help protect the integrity of the verification process.",
  },
];

/* -------------------------------------------------------------------------- */
/*                         Shared Section Heading                            */
/* -------------------------------------------------------------------------- */

function SectionHeading({
  eyebrow,
  title,
  description,
  color = "primary",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  color?: "primary" | "success" | "gold";
}) {
  const colorClasses = {
    primary: "text-primary text-glow-cyan",
    success: "text-success text-glow-success",
    gold: "text-gold text-glow-gold",
  };

  return (
    <div className="mx-auto mb-12 md:mb-16 max-w-3xl text-center space-y-3">
      {eyebrow && (
        <span className="text-xs md:text-sm font-bold uppercase tracking-[0.25em] text-muted-foreground">
          {eyebrow}
        </span>
      )}

      <h2
        className={cn(
          "font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight",
          colorClasses[color]
        )}
      >
        {title}
      </h2>

      {description && (
        <p className="text-muted-foreground text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
          {description}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                            Main Component                                */
/* -------------------------------------------------------------------------- */

export function HowItWorksContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  const motionTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.55, ease: "easeOut" as const };

  return (
    <div className="relative isolate space-y-20 sm:space-y-24 lg:space-y-32 overflow-hidden">
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute top-[30%] right-0 w-80 h-80 rounded-full bg-success/5 blur-[120px]" />
        <div className="absolute bottom-[10%] left-0 w-72 h-72 rounded-full bg-gold/5 blur-[120px]" />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* 1. Steps                                                            */}
      {/* ------------------------------------------------------------------ */}

      <section aria-labelledby="how-it-works-heading" className="relative">
        <SectionHeading
          eyebrow="Your journey"
          title="How It Works"
          description="From discovering a prediction market to receiving your payout, follow these simple steps."
        />

        <div className="relative max-w-6xl mx-auto">
          {/* Timeline connector */}
          <div
            aria-hidden="true"
            className="absolute left-5 md:left-1/2 top-4 bottom-4 w-px -translate-x-1/2 bg-gradient-to-b from-primary/10 via-primary/60 to-primary/10"
          />

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            className="relative space-y-6 md:space-y-10"
          >
            {steps.map((step, index) => {
              const isLeft = index % 2 === 0;

              return (
                <motion.div
                  key={step.title}
                  variants={sectionReveal}
                  transition={motionTransition}
                  className={cn(
                    "relative grid grid-cols-[40px_minmax(0,1fr)] md:grid-cols-[1fr_64px_1fr] items-center gap-4 md:gap-6",
                    !isLeft && "md:[&>div:first-child]:order-3"
                  )}
                >
                  {/* Timeline marker */}
                  <div
                    className={cn(
                      "relative z-10 col-start-1 row-start-1 md:col-start-2 md:row-start-1",
                      "flex items-center justify-center",
                      "w-10 h-10 md:w-12 md:h-12 rounded-full",
                      "border border-primary/50 bg-background",
                      "shadow-[0_0_20px_rgba(0,217,255,0.15)]"
                    )}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse" />
                  </div>

                  {/* Step card */}
                  <div
                    className={cn(
                      "col-start-2 row-start-1 min-w-0 md:col-start-1",
                      !isLeft && "md:col-start-3"
                    )}
                  >
                    <GlowCard
                      variant={step.color as any}
                      className="h-full group transition-transform duration-300 hover:-translate-y-1"
                    >
                      <div className="flex items-start gap-3 sm:gap-5">
                        <div className="shrink-0">
                          <GlowIcon
                            icon={step.icon}
                            color={variantColors[step.color]}
                            size={24}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-xs font-mono font-bold tracking-widest text-primary/70">
                              STEP {String(index + 1).padStart(2, "0")}
                            </span>
                          </div>

                          <h3 className="font-display text-lg sm:text-xl md:text-2xl font-bold uppercase tracking-tight mb-2">
                            {step.title}
                          </h3>

                          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </GlowCard>
                  </div>

                  {/* Empty opposite side */}
                  <div className="hidden md:block" />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 2. Pool Mechanics                                                   */}
      {/* ------------------------------------------------------------------ */}

      <section aria-labelledby="pool-mechanics-heading">
        <SectionHeading
          eyebrow="Understand the numbers"
          title="How the Pool System Works"
          color="success"
          description="See how stakes are combined, fees are deducted, and payouts are distributed to winning positions."
        />

        <GlowCard className="max-w-5xl mx-auto overflow-hidden backdrop-blur-md bg-surface/40">
          <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            {/* Market header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                  Example market
                </span>
                <h3 className="font-display text-xl sm:text-2xl font-black mt-1">
                  Will Palmer score a goal?
                </h3>
              </div>

              <div className="inline-flex items-center gap-2 self-start rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                SAMPLE MARKET
              </div>
            </div>

            {/* Pool distribution */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-success/20 bg-success/5 p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display text-sm font-bold uppercase text-success">
                    YES Pool
                  </span>
                  <span className="text-xs text-muted-foreground">70% of total</span>
                </div>

                <div className="font-mono text-2xl sm:text-3xl font-black text-success">
                  $7,000
                </div>

                <div className="h-2 rounded-full overflow-hidden bg-background/80">
                  <div className="h-full w-[70%] bg-success rounded-full shadow-[0_0_12px_rgba(57,255,20,0.3)]" />
                </div>
              </div>

              <div className="rounded-xl border border-danger/20 bg-danger/5 p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-display text-sm font-bold uppercase text-danger">
                    NO Pool
                  </span>
                  <span className="text-xs text-muted-foreground">30% of total</span>
                </div>

                <div className="font-mono text-2xl sm:text-3xl font-black text-danger">
                  $3,000
                </div>

                <div className="h-2 rounded-full overflow-hidden bg-background/80">
                  <div className="h-full w-[30%] bg-danger rounded-full shadow-[0_0_12px_rgba(255,0,110,0.3)]" />
                </div>
              </div>
            </div>

            {/* Total pool */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/5 p-5 sm:p-6">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-bold">
                  Combined Pool
                </p>
                <p className="font-display text-lg font-bold mt-1">
                  Total stakes across all positions
                </p>
              </div>

              <div className="text-primary text-glow-cyan font-mono text-3xl sm:text-4xl font-black">
                $<AnimatedCounter value={10000} format="number" />
              </div>
            </div>

            {/* Outcome */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Result */}
              <div className="rounded-xl border border-success/30 bg-success/5 p-5 sm:p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/10 border border-success/20">
                    <Trophy className="h-6 w-6 text-success" />
                  </div>

                  <div>
                    <p className="font-display font-bold text-success text-lg">
                      Palmer scores!
                    </p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      YES is the winning outcome
                    </p>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground leading-relaxed">
                  The YES pool wins. The NO pool loses its stakes, and the winning
                  pool receives the distributable amount according to the market rules.
                </div>
              </div>

              {/* Fee breakdown */}
              <div className="rounded-xl border border-border/60 bg-background-secondary/50 p-5 sm:p-6 space-y-4">
                <h4 className="font-display font-bold uppercase tracking-wider text-sm">
                  Distribution Breakdown
                </h4>

                <div className="flex justify-between items-center gap-4 text-sm">
                  <span className="text-muted-foreground">Total Pool</span>
                  <span className="font-mono font-bold">$10,000</span>
                </div>

                <div className="flex justify-between items-center gap-4 text-sm">
                  <span className="text-muted-foreground">Platform Fee (5%)</span>
                  <span className="text-gold font-mono font-bold">-$500</span>
                </div>

                <div className="flex justify-between items-center gap-4 text-sm border-t border-border/50 pt-4">
                  <span className="font-bold">Distributable Pool</span>
                  <span className="text-success font-mono font-black text-lg">
                    $9,500
                  </span>
                </div>
              </div>
            </div>

            {/* Calculation */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 sm:p-6 space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  Example Payout
                </span>
                <h4 className="font-display text-xl font-black mt-1">
                  Your stake earns a share of the winning pool
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Your YES stake</p>
                  <p className="font-mono font-bold text-lg">$700</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Winning YES pool</p>
                  <p className="font-mono font-bold text-lg">$7,000</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Your pool share</p>
                  <p className="font-mono font-bold text-lg text-primary">10%</p>
                </div>
              </div>

              <div className="rounded-lg bg-background/70 border border-border/50 p-4 space-y-3">
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                  Formula
                </p>

                <div className="font-mono text-xs sm:text-sm leading-relaxed break-words">
                  <p>
                    Payout = (Your Stake ÷ Winning Pool) × Distributable Pool
                  </p>
                  <p className="text-primary mt-2">
                    ($700 ÷ $7,000) × $9,500 = $950
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-lg border border-success/20 bg-success/5 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Total payout</p>
                  <p className="text-success font-mono font-black text-2xl">
                    $<AnimatedCounter value={950} format="number" />
                  </p>
                </div>

                <div className="rounded-lg border border-success/20 bg-success/5 p-4">
                  <p className="text-xs text-muted-foreground mb-1">Net profit</p>
                  <p className="text-success font-mono font-black text-2xl">
                    +$250
                  </p>
                  <p className="text-xs text-success/80 mt-1">35.71% ROI</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                This is a simplified illustration. Actual payouts may differ depending
                on voter rewards, rounding, fees, smart-contract rules, and the final
                pool balance.
              </p>
            </div>
          </div>
        </GlowCard>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 3. Outcome Resolution                                               */}
      {/* ------------------------------------------------------------------ */}

      <section aria-labelledby="resolution-heading">
        <SectionHeading
          eyebrow="Trust & transparency"
          title="How Outcomes Are Verified"
          color="gold"
          description="Every market follows a defined resolution process designed to promote fairness, transparency, and accountability."
        />

        {/* Mobile & tablet timeline */}
        <div className="md:hidden relative max-w-2xl mx-auto">
          <div className="absolute left-5 top-5 bottom-5 w-px bg-gradient-to-b from-primary/40 via-gold/40 to-success/40" />

          <div className="space-y-4">
            {resolutionStages.map((stage, index) => {
              const StageIcon = stage.icon;

              return (
                <div key={stage.phase} className="relative pl-12">
                  <div className="absolute left-0 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-background">
                    <StageIcon className="h-4 w-4 text-primary" />
                  </div>

                  <GlowCard className={cn("border", stage.color)}>
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs uppercase tracking-widest font-bold text-primary">
                          Stage {index + 1}
                        </span>
                        <span className="text-xs font-mono text-muted-foreground">
                          {stage.duration}
                        </span>
                      </div>

                      <h3 className="font-display font-black text-base uppercase">
                        {stage.phase}
                      </h3>

                      <p className="text-xs font-bold text-muted-foreground">
                        {stage.trigger}
                      </p>

                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {stage.description}
                      </p>
                    </div>
                  </GlowCard>
                </div>
              );
            })}
          </div>
        </div>

        {/* Desktop resolution flow */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4">
          {resolutionStages.map((stage, index) => {
            const StageIcon = stage.icon;

            return (
              <motion.div
                key={stage.phase}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.4,
                  delay: prefersReducedMotion ? 0 : index * 0.05,
                }}
                className="relative"
              >
                <GlowCard className={cn("h-full border", stage.color)}>
                  <div className="flex flex-col h-full gap-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs uppercase tracking-widest font-bold text-primary">
                        Stage {String(index + 1).padStart(2, "0")}
                      </span>

                      <StageIcon className="h-5 w-5 text-primary" />
                    </div>

                    <h3 className="font-display font-black text-lg uppercase leading-tight">
                      {stage.phase}
                    </h3>

                    <p className="text-xs font-bold text-muted-foreground">
                      {stage.trigger}
                    </p>

                    <p className="text-sm text-muted-foreground leading-relaxed flex-1">
                      {stage.description}
                    </p>

                    <div className="pt-3 border-t border-border/50 flex items-center gap-2">
                      <Clock3 className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-mono font-bold text-primary">
                        {stage.duration}
                      </span>
                    </div>
                  </div>
                </GlowCard>
              </motion.div>
            );
          })}
        </div>

        {/* Resolution disclaimer */}
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-gold/20 bg-gold/5 p-4 max-w-5xl mx-auto">
          <Shield className="h-5 w-5 text-gold shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Outcome verification rules, consensus thresholds, voting eligibility,
            dispute handling, and payout timing are governed by the specific market
            and protocol implementation. The process shown here is illustrative.
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 4. Key Concepts                                                      */}
      {/* ------------------------------------------------------------------ */}

      <section aria-labelledby="concepts-heading">
        <SectionHeading
          eyebrow="The fundamentals"
          title="Key Concepts"
          description="Everything you need to understand before participating in a prediction market."
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
        >
          {concepts.map((concept, index) => (
            <motion.div
              key={concept.title}
              variants={sectionReveal}
              transition={motionTransition}
            >
              <GlowCard className="h-full group transition-all duration-300 hover:border-primary/50 hover:-translate-y-1">
                <div className="flex flex-col h-full gap-4">
                  <div className="flex items-center justify-between">
                    <GlowIcon
                      icon={concept.icon}
                      size={26}
                      color={variantColors.default}
                    />
                    <span className="font-mono text-xs text-primary/40">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="font-display text-lg sm:text-xl font-bold uppercase tracking-tight">
                    {concept.title}
                  </h3>

                  <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                    {concept.description}
                  </p>
                </div>
              </GlowCard>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 5. FAQ                                                               */}
      {/* ------------------------------------------------------------------ */}

      <section aria-labelledby="faq-heading" className="max-w-3xl mx-auto w-full">
        <SectionHeading
          eyebrow="Got questions?"
          title="Frequently Asked Questions"
          description="Quick answers to common questions about participating in prediction markets."
        />

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            const panelId = `faq-panel-${index}`;
            const buttonId = `faq-button-${index}`;

            return (
              <div
                key={faq.q}
                className={cn(
                  "relative border transition-all duration-300 rounded-lg overflow-hidden",
                  isOpen
                    ? "border-primary/50 bg-primary/[0.03] shadow-[0_0_20px_rgba(0,217,255,0.05)]"
                    : "border-border/60 hover:border-primary/30 bg-background/40"
                )}
              >
                <button
                  id={buttonId}
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="w-full flex items-center gap-4 justify-between p-4 sm:p-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
                >
                  <span className="flex items-start gap-3 min-w-0">
                    <span className="font-mono text-xs text-primary/50 mt-1 shrink-0">
                      {String(index + 1).padStart(2, "02")}
                    </span>

                    <span className="font-display font-bold text-sm sm:text-base md:text-lg">
                      {faq.q}
                    </span>
                  </span>

                  <motion.span
                    animate={{
                      rotate: isOpen ? 180 : 0,
                    }}
                    transition={{
                      duration: prefersReducedMotion ? 0 : 0.2,
                    }}
                    className="shrink-0"
                  >
                    <ChevronDown
                      className={cn(
                        "h-5 w-5",
                        isOpen ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                  </motion.span>
                </button>

                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={false}
                  animate={{
                    height: isOpen ? "auto" : 0,
                    opacity: isOpen ? 1 : 0,
                  }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.25,
                  }}
                  className="overflow-hidden"
                  aria-hidden={!isOpen}
                >
                  <div className="px-4 sm:px-5 pb-5 pl-11 sm:pl-12">
                    <div className="border-t border-border/40 pt-4">
                      <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* 6. Call To Action                                                    */}
      {/* ------------------------------------------------------------------ */}

      <section className="relative isolate py-12 sm:py-16 lg:py-20">
        {/* Background */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/10 bg-gradient-to-br from-primary/[0.07] via-background/50 to-success/[0.04]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,217,255,0.07),transparent_70%)]" />
          <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-primary/10 blur-[100px]" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-success/10 blur-[100px]" />
        </div>

        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={motionTransition}
          className="relative text-center px-4 sm:px-8 space-y-6 sm:space-y-8"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
              Ready to get started?
span>
          </div>

          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-tight max-w-4xl mx-auto">
            Make Your{" "}
            <span className="text-primary text-glow-cyan">First Prediction</span>
          </h2>

          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Explore the markets, connect your wallet, and join the community.
            Always understand the risks before staking.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-2">
            <GamingButton
              variant="primary"
              size="lg"
              className="w-full sm:w-auto min-w-[12rem]"
              href="/#matches"
            >
              Explore Matches
              <ArrowRight className="ml-2 h-4 w-4" />
            </GamingButton>

            <GamingButton
              variant="ghost"
              size="lg"
              className="w-full sm:w-auto min-w-[12rem] gap-2"
              onClick={() => setShowWalletModal(true)}
            >
              <Wallet className="h-5 w-5" />
              Connect Wallet
            </GamingButton>
          </div>

          <p className="text-xs text-muted-foreground/70 max-w-lg mx-auto">
            Blockchain transactions may be irreversible. Stake responsibly.
          </p>
        </motion.div>
      </section>

      {/* Wallet modal */}
      <WalletConnectModal
        open={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </div>
  );
}