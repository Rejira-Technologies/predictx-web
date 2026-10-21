"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Gavel,
  Activity,
  Users,
  Copy,
  Wallet,
  Coins,
  Target,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { GlowCard } from "@/components/shared/glow-card";
import { GamingButton } from "@/components/shared/gaming-button";
import { GamingTabs } from "@/components/shared/gaming-tabs";
import { BadgeComponent } from "@/components/shared/badge-component";
import { CountdownTimer } from "@/components/shared/countdown-timer";
import { PoolProgressBar } from "@/components/shared/pool-progress-bar";
import { BadgesStrip } from "@/components/dashboard/badges-strip";
import { CompletedPredictions } from "@/components/completed-predictions";
import { useWallet } from "@/hooks/use-wallet";
import { useStaking } from "@/hooks/use-staking";
import { useVoting } from "@/hooks/use-voting";
import { useMockData } from "@/hooks/use-mock-data";
import { useUIStore } from "@/hooks/use-ui-store";
import { resetAllData } from "@/lib/mock-data";
import { XLM_USD_RATE } from "@/lib/constants";
import { getLockTargetISO, getVotingDeadlineISO } from "@/lib/calculations";

// ── Wallet gate ────────────────────────────────────────────────────────────────

function WalletGate() {
  const { openWalletConnect } = useUIStore();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-4 text-center">
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Wallet className="h-20 w-20 text-primary opacity-80" style={{ filter: "drop-shadow(0 0 20px rgba(0,217,255,0.6))" }} />
      </motion.div>
      <div className="space-y-3">
        <h2 className="font-display text-3xl font-black uppercase text-foreground text-glow-cyan">
          Connect Your Wallet
        </h2>
        <p className="text-muted-foreground text-lg max-w-md">
          Connect your Stellar wallet to view your predictions, claim winnings, and vote on match outcomes.
        </p>
      </div>
      <GamingButton variant="primary" size="lg" onClick={openWalletConnect}>
        <Wallet className="h-5 w-5 mr-2" />
        Connect Wallet
      </GamingButton>
    </div>
  );
}

// ── Dashboard Header ───────────────────────────────────────────────────────────

function DashboardHeader() {
  const { address, balance } = useWallet();
  const completedStakes = useStaking((s) => s.completedStakes());

  const totalProfit = completedStakes.reduce((sum, s) => sum + (s.profit ?? 0), 0);
  const wonCount = completedStakes.filter((s) => s.outcome === "won").length;
  const winRate = completedStakes.length > 0 ? (wonCount / completedStakes.length) * 100 : 0;
  const balanceUSD = balance * XLM_USD_RATE;

  const displayAddr = address
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : "—";

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address).then(() => toast.success("Address copied!"));
    }
  };

  return (
    <GlowCard variant="default" className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        {/* HUD corners */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-primary/60" />
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-primary/60" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-primary/60" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-primary/60" />

        {/* Left: Title + address */}
        <div className="flex-1 space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl font-black uppercase text-primary text-glow-cyan tracking-wider">
            Command Center
          </h1>
          <button
            onClick={copyAddress}
            className="flex items-center gap-2 text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Copy wallet address"
          >
            <span>{displayAddr}</span>
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Center: Balance */}
        <div className="text-center">
          <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Balance</div>
          <div className="text-3xl font-display font-black text-gold">
            {balance.toFixed(0)} XLM
          </div>
          <div className="text-sm text-muted-foreground font-mono">
            ≈ ${balanceUSD.toFixed(2)}
          </div>
        </div>

        {/* Right: Stats */}
        <div className="flex gap-4 flex-wrap">
          <div className="text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Win Rate</div>
            <div className="flex items-center gap-1 justify-center">
              <BadgeComponent
                type="win"
                label={`${winRate.toFixed(0)}% Win Rate`}
                variant="success"
              />
            </div>
          </div>
          <div className="text-center">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total P/L</div>
            <div className={`text-xl font-display font-black ${totalProfit >= 0 ? "text-success" : "text-accent"}`}>
              {totalProfit >= 0 ? "+" : ""}${totalProfit.toFixed(0)}
            </div>
          </div>
        </div>
      </div>
    </GlowCard>
  );
}

// ── Active Stakes Tab ──────────────────────────────────────────────────────────

function ActiveStakesTab() {
  const activeStakes = useStaking((s) => s.activeStakes());
  const { getMatch, getPoll } = useMockData();

  if (activeStakes.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <Target className="h-16 w-16 mx-auto text-muted-foreground opacity-40" />
        <h3 className="font-display text-xl font-bold text-muted-foreground uppercase">
          No Active Plays Yet
        </h3>
        <p className="text-muted-foreground">Jump Into The Action!</p>
        <GamingButton variant="primary" href="/">Explore Matches</GamingButton>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeStakes.map((stake) => {
        const match = getMatch(stake.matchId);
        const poll = getPoll(stake.pollId);
        const yesPool = poll?.yesPool ?? 0;
        const noPool = poll?.noPool ?? 0;
        const total = yesPool + noPool;
        const yesPercentage = total > 0 ? (yesPool / total) * 100 : 50;

        const lockISO = match && poll
          ? getLockTargetISO(match.kickoff, poll.lockTime, poll.lockTargetISO)
          : undefined;

        return (
          <motion.div
            key={stake.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border-2 border-primary/30 hover:border-primary clip-corner-lg p-5 transition-all"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  {stake.matchName}
                </div>
                <h3 className="font-bold text-foreground">{stake.question}</h3>
              </div>
              <div
                className={`px-3 py-1 rounded text-xs font-bold uppercase ${
                  stake.side === "yes" ? "bg-success/20 text-success" : "bg-accent/20 text-accent"
                }`}
              >
                {stake.side}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Your Stake</div>
                <div className="font-mono font-bold text-lg">${stake.amount}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Status</div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                  <span className="text-success text-sm font-bold">Active</span>
                </div>
              </div>
              {lockISO && (
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">Time to Lock</div>
                  <CountdownTimer targetTime={lockISO} size="sm" />
                </div>
              )}
            </div>

            {total > 0 && (
              <PoolProgressBar
                yesPercentage={yesPercentage}
                yesAmount={yesPool}
                noAmount={noPool}
                size="sm"
              />
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Pending Resolution Tab ─────────────────────────────────────────────────────

function PendingResolutionTab() {
  const pendingStakes = useStaking((s) => s.pendingStakes());

  const statusConfig = {
    voting_in_progress: {
      label: "Voting in Progress",
      color: "text-primary bg-primary/20 border-primary/40",
      icon: <Users className="h-3.5 w-3.5" />,
    },
    admin_review: {
      label: "Admin Review",
      color: "text-gold bg-gold/20 border-gold/40",
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
    },
    multi_sig: {
      label: "Multi-sig Review",
      color: "text-accent bg-accent/20 border-accent/40",
      icon: <CheckCircle className="h-3.5 w-3.5" />,
    },
  };

  const getStatusKey = (note?: string) => {
    if (!note) return "voting_in_progress";
    if (note.toLowerCase().includes("admin")) return "admin_review";
    if (note.toLowerCase().includes("multi")) return "multi_sig";
    return "voting_in_progress";
  };

  if (pendingStakes.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <CheckCircle className="h-16 w-16 mx-auto text-success opacity-60" />
        <h3 className="font-display text-xl font-bold text-success uppercase">
          Nothing Pending — All Clear!
        </h3>
        <p className="text-muted-foreground">Your predictions are up to date.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {pendingStakes.map((stake) => {
        const statusKey = getStatusKey(stake.resolutionNote);
        const status = statusConfig[statusKey as keyof typeof statusConfig];

        return (
          <motion.div
            key={stake.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface border-2 border-gold/20 hover:border-gold/40 clip-corner-lg p-5 transition-all"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  {stake.matchName}
                </div>
                <h3 className="font-bold text-foreground">{stake.question}</h3>
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-bold ${status.color}`}>
                {status.icon}
                {status.label}
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Your Side</div>
                <div
                  className={`px-3 py-1 rounded text-sm font-bold uppercase ${
                    stake.side === "yes" ? "bg-success/20 text-success" : "bg-accent/20 text-accent"
                  }`}
                >
                  {stake.side}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Your Stake</div>
                <div className="font-mono font-bold text-lg">${stake.amount}</div>
              </div>
              {stake.resolutionNote && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Status</div>
                  <div className="text-sm text-muted-foreground">{stake.resolutionNote}</div>
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Voting Opportunities Tab ───────────────────────────────────────────────────

function VotingOpportunitiesTab() {
  const availablePolls = useVoting((s) => s.availablePolls());
  const castVote = useVoting((s) => s.castVote);
  const getVoteReward = useVoting((s) => s.getVoteReward);
  const { getMatch } = useMockData();

  const [confirmVote, setConfirmVote] = useState<{
    pollId: string;
    decision: "yes" | "no" | "unclear";
    question: string;
    reward: number;
  } | null>(null);
  const [casting, setCasting] = useState(false);

  const handleVote = async () => {
    if (!confirmVote) return;
    setCasting(true);
    try {
      await castVote(confirmVote.pollId, confirmVote.decision);
      toast.success(`Vote cast! You earned $${confirmVote.reward.toFixed(2)} 🎉`, {
        description: `Your vote: ${confirmVote.decision.toUpperCase()} — ${confirmVote.question}`,
      });
      setConfirmVote(null);
    } catch (err) {
      toast.error("Vote failed", {
        description: err instanceof Error ? err.message : "Try again",
      });
    } finally {
      setCasting(false);
    }
  };

  if (availablePolls.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <Gavel className="h-16 w-16 mx-auto text-gold opacity-60" />
        <h3 className="font-display text-xl font-bold text-gold uppercase">
          Voting Arena Empty
        </h3>
        <p className="text-muted-foreground">Be The Judge! Check back when polls are in voting phase.</p>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {confirmVote && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          >
            <GlowCard variant="gold" className="w-full max-w-md">
              <div className="p-2 space-y-4">
                <h3 className="font-display text-xl font-black text-gold uppercase">Confirm Vote</h3>
                <p className="text-muted-foreground text-sm">
                  Are you sure? Vote:{" "}
                  <span
                    className={`font-bold ${
                      confirmVote.decision === "yes"
                        ? "text-success"
                        : confirmVote.decision === "no"
                          ? "text-accent"
                          : "text-muted-foreground"
                    }`}
                  >
                    {confirmVote.decision.toUpperCase()}
                  </span>
                </p>
                <p className="text-sm font-bold">{confirmVote.question}</p>
                <p className="text-gold font-mono text-sm">
                  Potential reward: ${confirmVote.reward.toFixed(2)}
                </p>
                <div className="flex gap-3 pt-2">
                  <GamingButton variant="ghost" size="sm" className="flex-1" onClick={() => setConfirmVote(null)} disabled={casting}>
                    Cancel
                  </GamingButton>
                  <GamingButton variant="gold" size="sm" className="flex-1" onClick={handleVote} loading={casting}>
                    Confirm Vote
                  </GamingButton>
                </div>
              </div>
            </GlowCard>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {availablePolls.map((poll) => {
          const match = getMatch(poll.matchId);
          const reward = getVoteReward(poll.id);
          const deadlineISO = match ? getVotingDeadlineISO(poll, match) : undefined;

          return (
            <motion.div
              key={poll.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border-2 border-gold/30 hover:border-gold/50 clip-corner-lg p-5 transition-all"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {match ? `${match.homeTeam} vs ${match.awayTeam}` : "—"}
                  </div>
                  <h3 className="font-bold text-foreground">{poll.question}</h3>
                </div>
                <div className="text-gold font-mono text-sm font-bold whitespace-nowrap">
                  +${reward.toFixed(2)}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 flex-wrap">
                {deadlineISO && (
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Voting closes</div>
                    <CountdownTimer targetTime={deadlineISO} size="sm" />
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {(["yes", "no"] as const).map((decision) => (
                    <GamingButton
                      key={decision}
                      variant={decision === "yes" ? "success" : "danger"}
                      size="sm"
                      onClick={() =>
                        setConfirmVote({
                          pollId: poll.id,
                          decision,
                          question: poll.question,
                          reward,
                        })
                      }
                    >
                      {decision.toUpperCase()}
                    </GamingButton>
                  ))}
                  <GamingButton
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setConfirmVote({
                        pollId: poll.id,
                        decision: "unclear",
                        question: poll.question,
                        reward: 0,
                      })
                    }
                  >
                    UNCLEAR
                  </GamingButton>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </>
  );
}

// ── Inner Dashboard (needs searchParams) ──────────────────────────────────────

const TAB_KEYS = ["active", "pending", "voting", "completed"] as const;
type TabKey = (typeof TAB_KEYS)[number];

function DashboardInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawTab = searchParams.get("tab") ?? "active";
  const activeTab: TabKey = TAB_KEYS.includes(rawTab as TabKey)
    ? (rawTab as TabKey)
    : "active";

  const { isConnected } = useWallet();
  const activeStakes = useStaking((s) => s.activeStakes());
  const pendingStakes = useStaking((s) => s.pendingStakes());
  const availablePolls = useVoting((s) => s.availablePolls());
  const completedStakes = useStaking((s) => s.completedStakes());

  if (!isConnected) {
    return <WalletGate />;
  }

  const tabs = [
    { key: "active", label: "Active Stakes", count: activeStakes.length },
    { key: "pending", label: "Pending", count: pendingStakes.length },
    { key: "voting", label: "Voting", count: availablePolls.length },
    { key: "completed", label: "Completed", count: completedStakes.length },
  ];

  const handleTabChange = (key: string) => {
    router.push(`/dashboard?tab=${key}`, { scroll: false });
  };

  const handleReset = () => {
    if (
      typeof window !== "undefined" &&
      window.confirm("Reset all demo data to initial state?")
    ) {
      resetAllData();
      window.location.reload();
    }
  };

  return (
    <main className="min-h-screen bg-background">
      {/* Page header */}
      <div className="bg-background-secondary border-b border-primary/20 py-8 sm:py-12">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-1 h-10 bg-primary glow-cyan" />
            <h1 className="font-display text-2xl sm:text-4xl font-black uppercase text-primary text-glow-cyan">
              My Predictions
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Track your active stakes, pending resolutions, and voting opportunities
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 lg:px-8">
        {/* Dashboard header card */}
        <DashboardHeader />

        {/* Badges */}
        <BadgesStrip />

        {/* Tabs */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <GamingTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={handleTabChange}
            className="w-full sm:w-auto"
          />
          <button
            onClick={handleReset}
            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border/40 rounded px-3 py-1.5 hover:border-border"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Demo
          </button>
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "active" && <ActiveStakesTab />}
            {activeTab === "pending" && <PendingResolutionTab />}
            {activeTab === "voting" && <VotingOpportunitiesTab />}
            {activeTab === "completed" && <CompletedPredictions />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

// ── Page export ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Activity className="h-8 w-8 text-primary animate-spin" />
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}
