"use client";

import { motion } from "framer-motion";
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
  Plus,
  Minus,
  Wallet
} from "lucide-react";
import {
  GlowCard,
  GlowIcon,
  GamingButton,
  PoolProgressBar,
  AnimatedCounter
} from "@/components/shared";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { WalletConnectModal } from "@/components/wallet-connect-modal";

const variantColors = {
  default: "#00d9ff",
  primary: "#00d9ff",
  success: "#39ff14",
  danger: "#ff006e",
  gold: "#ffd700",
};

const steps = [
  {
    title: "Browse Matches",
    description: "Explore upcoming Premier League matches and see what predictions are available.",
    icon: Calendar,
    color: "default"
  },
  {
    title: "Pick a Prediction",
    description: "Choose a poll like 'Will Palmer score?' and decide if you think YES or NO.",
    icon: Target,
    color: "success"
  },
  {
    title: "Stake Your Crypto",
    description: "Enter your stake amount in XLM. The more you stake, the more you can win.",
    icon: Coins,
    color: "gold"
  },
  {
    title: "Watch the Match",
    description: "Sit back and watch. Your prediction locks at kickoff (or the set lock time).",
    icon: Eye,
    color: "default"
  },
  {
    title: "Community Votes",
    description: "After the match, non-participants vote on the outcome within a 2-hour window.",
    icon: Scale,
    color: "danger"
  },
  {
    title: "Collect Winnings",
    description: "If you predicted correctly, your share of the pool is paid out automatically!",
    icon: Trophy,
    color: "success"
  }
];

const resolutionStages = [
  {
    phase: "1. Match Ends",
    trigger: "Automatic",
    description: "Polls enter resolution phase",
    duration: "—",
    color: "border-primary"
  },
  {
    phase: "2. Community Voting",
    trigger: "2-hour window",
    description: "Non-participants vote on outcomes, earn 0.5–1% reward",
    duration: "2 hours",
    color: "border-primary"
  },
  {
    phase: "3a. Auto-Approve",
    trigger: ">85% consensus",
    description: "Result confirmed automatically",
    duration: "Instant",
    color: "border-success"
  },
  {
    phase: "3b. Admin Review",
    trigger: "60–85% consensus",
    description: "Admins verify with video evidence",
    duration: "~24 hours",
    color: "border-gold"
  },
  {
    phase: "3c. Multi-sig Review",
    trigger: "<60% consensus",
    description: "3 admins must agree",
    duration: "~48 hours",
    color: "border-danger"
  },
  {
    phase: "4. Dispute Window",
    trigger: "After resolution",
    description: "Anyone can challenge with evidence",
    duration: "24 hours",
    color: "border-primary"
  },
  {
    phase: "5. Payout",
    trigger: "After dispute window",
    description: "Winners receive pool share",
    duration: "Automatic",
    color: "border-success"
  }
];

const concepts = [
  {
    title: "Time Locks",
    description: "Polls lock at specific times to prevent staking after seeing lineups or events.",
    icon: Lock
  },
  {
    title: "Proportional Winnings",
    description: "Win more if you staked more. Your share = (your stake / winning pool) × total pool.",
    icon: History
  },
  {
    title: "Platform Fee",
    description: "5% fee on winnings only. You never pay fees on losses.",
    icon: Zap
  },
  {
    title: "Voter Rewards",
    description: "Vote on outcomes you didn't stake on and earn 0.5–1% of the pool.",
    icon: Scale
  },
  {
    title: "Dispute Mechanism",
    description: "24-hour window to challenge results with evidence.",
    icon: Shield
  },
  {
    title: "Stellar Network",
    description: "All transactions happen on the Stellar blockchain — fast, cheap, and transparent.",
    icon: Zap
  }
];

const faqs = [
  {
    q: "What happens if I lose?",
    a: "You lose your staked amount. No additional fees are charged on losses."
  },
  {
    q: "How are winnings calculated?",
    a: "Winners split the entire pool (minus 5% fee) proportionally to their stake."
  },
  {
    q: "Can I cancel a stake?",
    a: "No. Once confirmed on-chain, stakes are final and cannot be reversed."
  },
  {
    q: "How do I earn from voting?",
    a: "Vote on polls you didn't stake on. Earn 0.5–1% of the pool as a reward for accurate votes."
  },
  {
    q: "What wallet do I need?",
    a: "Any Stellar-compatible wallet: Freighter (recommended), Lobstr, or xBull."
  },
  {
    q: "What token is used?",
    a: "XLM (Stellar Lumens) — the native token of the Stellar network."
  },
  {
    q: "Is it safe?",
    a: "The pool mechanics run on Soroban smart contracts on Stellar, providing transparency and security."
  },
  {
    q: "When do I get paid?",
    a: "After the dispute window closes (24h after resolution), winnings are automatically paid to your wallet."
  }
];

export function HowItWorksContent() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);

  return (
    <div className="space-y-32">
      {/* Section 2: Step-by-Step Visual Guide */}
      <section className="relative">
        <h2 className="font-display text-3xl md:text-4xl font-black uppercase text-center mb-20 text-glow-cyan text-primary">
          HOW IT WORKS
        </h2>

        <div className="relative">
          {/* Central Line */}
          <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-[2px] bg-gradient-to-b from-primary/50 via-primary to-primary/50 -translate-x-1/2 hidden md:block" />

          <div className="space-y-12 relative">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -100 : 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                className={cn(
                  "flex flex-col md:flex-row items-center gap-8",
                  index % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                )}
              >
                <div className="flex-1 w-full">
                  <GlowCard variant={step.color as any} className="w-full">
                    <div className="flex items-start gap-6">
                      <div className="flex-shrink-0">
                        <GlowIcon
                          icon={step.icon}
                          color={variantColors[step.color as keyof typeof variantColors]}
                          size={32}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-display text-4xl font-black opacity-20">{index + 1}</span>
                          <h3 className="font-display text-2xl font-bold uppercase">{step.title}</h3>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </GlowCard>
                </div>
                <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-background border-2 border-primary z-10 glow-cyan">
                  <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />
                </div>
                <div className="flex-1 hidden md:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 3: Pool Mechanics Explained */}
      <section>
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl md:text-4xl font-black uppercase mb-4 text-glow-success text-success">
            How the Pool System Works
          </h2>
          <p className="text-muted-foreground text-xl capitalize">Visual walkthrough: "Will Palmer score a goal?"</p>
        </div>

        <GlowCard className="max-w-4xl mx-auto backdrop-blur-md bg-surface/40">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center p-4">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="font-display text-xl font-bold text-success">YES Pool</span>
                  <span className="font-mono text-2xl font-black text-success">$7,000</span>
                </div>
                <PoolProgressBar
                  yesPercentage={70}
                  yesAmount={7000}
                  noAmount={3000}
                  className="h-4"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <span className="font-display text-xl font-bold text-danger">NO Pool</span>
                  <span className="font-mono text-2xl font-black text-danger">$3,000</span>
                </div>
                <PoolProgressBar
                  yesPercentage={70}
                  yesAmount={7000}
                  noAmount={3000}
                  className="h-4"
                />
              </div>

              <div className="pt-6 border-t border-border/50">
                <div className="flex justify-between items-center text-2xl">
                  <span className="font-display font-black text-foreground">Total Pool</span>
                  <div className="text-primary text-glow-cyan font-mono font-black">
                    $<AnimatedCounter value={10000} format="number" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-background-secondary rounded-xl p-8 border border-white/5 space-y-6">
              <div className="flex items-center gap-4 p-4 bg-success/10 border border-success/30 rounded-lg">
                <Trophy className="text-success h-8 w-8" />
                <div>
                  <div className="font-bold text-success">Palmer scores!</div>
                  <div className="text-sm opacity-80 uppercase tracking-widest">YES wins the match</div>
                </div>
              </div>

              <div className="space-y-4 text-sm md:text-base">
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-muted-foreground">Platform Fee (5%)</span>
                  <span className="text-gold font-mono">-$500</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5 font-bold">
                  <span>Winnings Distributed</span>
                  <span className="text-success font-mono">$9,500</span>
                </div>

                <div className="mt-8 p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
                  <div className="text-xs uppercase font-bold text-primary tracking-widest mb-2">Example Calculation</div>
                  <div className="flex justify-between">
                    <span className="text-xs md:text-sm">You staked (10% of YES)</span>
                    <span className="font-mono">$700</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs md:text-sm">Your Payout</span>
                    <span className="text-success font-mono font-black">
                      $<AnimatedCounter value={950} format="number" />
                    </span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-white/10 font-black">
                    <span className="text-success">Net Profit</span>
                    <span className="text-success font-mono">+$250 (35.7% ROI)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GlowCard>
      </section>

      {/* Section 4: Resolution System Diagram */}
      <section>
        <h2 className="font-display text-3xl md:text-4xl font-black uppercase text-center mb-16 text-glow-gold text-gold">
          How Outcomes Are Verified
        </h2>

        <div className="overflow-x-auto pb-8 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="min-w-[800px] flex flex-col md:flex-row gap-4 items-stretch">
            {resolutionStages.map((stage, index) => (
              <div key={index} className="flex-1 flex flex-col relative group">
                <GlowCard className={cn("h-full border-2", stage.color)}>
                  <div className="space-y-4">
                    <div className="text-xs uppercase font-bold opacity-60 tracking-widest">{stage.trigger}</div>
                    <h3 className="font-display text-lg font-black">{stage.phase}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{stage.description}</p>
                    <div className="text-xs font-mono font-bold text-primary mt-auto">{stage.duration}</div>
                  </div>
                </GlowCard>
                {index < resolutionStages.length - 1 && (
                  <div className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-4 h-[2px] bg-border" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 5: Key Concepts */}
      <section>
        <h2 className="font-display text-3xl md:text-4xl font-black uppercase text-center mb-16 text-glow-cyan text-primary">
          Key Concepts
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {concepts.map((concept, index) => (
            <GlowCard key={index} className="hover:border-primary transition-all duration-300">
              <div className="space-y-4">
                <GlowIcon icon={concept.icon} size={32} color={variantColors.default} />
                <h3 className="font-display text-xl font-bold uppercase tracking-tight">{concept.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{concept.description}</p>
              </div>
            </GlowCard>
          ))}
        </div>
      </section>

      {/* Section 6: FAQ Accordion */}
      <section className="max-w-3xl mx-auto">
        <h2 className="font-display text-3xl md:text-4xl font-black uppercase text-center mb-16 text-glow-cyan text-primary">
          FAQ
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={cn(
                "group relative border-2 transition-all duration-300",
                openFaq === index ? "border-primary glow-cyan" : "border-border hover:border-primary/50"
              )}
              style={{
                clipPath: "polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px)"
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                aria-expanded={openFaq === index}
                aria-controls={`faq-panel-${index}`}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className="font-display font-bold text-lg md:text-xl">{faq.q}</span>
                <motion.div
                  animate={{ rotate: openFaq === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className={cn(
                    "w-6 h-6 transition-colors",
                    openFaq === index ? "text-primary" : "text-muted-foreground"
                  )} />
                </motion.div>
              </button>

              <motion.div
                id={`faq-panel-${index}`}
                initial={false}
                animate={{ height: openFaq === index ? "auto" : 0 }}
                className="overflow-hidden bg-background-secondary/50"
              >
                <div className="p-6 pt-0 text-muted-foreground leading-relaxed">
                  {faq.a}
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20">
        <div className="absolute inset-0 bg-primary/5 rounded-3xl -rotate-1 skew-x-1" />
        <div className="relative text-center space-y-10">
          <h2 className="font-display text-3xl md:text-5xl font-black uppercase tracking-tighter">
            Ready to Make Your <span className="text-primary text-glow-cyan">First Prediction?</span>
          </h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <GamingButton
              variant="primary"
              size="lg"
              className="min-w-[12rem]"
              href="/#matches"
            >
              Explore Matches
            </GamingButton>
            <GamingButton
              variant="ghost"
              size="lg"
              className="min-w-[12rem] gap-2"
              onClick={() => setShowWalletModal(true)}
            >
              <Wallet className="h-5 w-5" />
              Connect Wallet
            </GamingButton>
          </div>
        </div>
      </section>

      <WalletConnectModal
        open={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
    </div>
  );
}
