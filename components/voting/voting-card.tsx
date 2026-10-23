"use client";

import { useState, useEffect, useReducer, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scale, CheckCircle2, AlertCircle, Lock } from "lucide-react";
import { toast } from "sonner";

import { GlowCard } from "@/components/shared/glow-card";
import { TeamBadge } from "@/components/shared/team-badge";
import { CountdownTimer } from "@/components/shared/countdown-timer";
import { GamingButton } from "@/components/shared/gaming-button";
import { AchievementToast } from "@/components/shared/achievement-toast";

import { VoteTally } from "./vote-tally";
import { EvidenceSection } from "./evidence-section";

import { type Poll, type Match } from "@/lib/mock-data";
import { useVoting, type VoteDecision } from "@/hooks/use-voting";
import { useWallet } from "@/hooks/use-wallet";
import { cn, categoryLabel } from "@/lib/utils";
import { getTeamColor } from "@/lib/team-colors";
import { getVotingDeadlineISO, isVotingOpen } from "@/lib/calculations";

interface VotingCardProps {
    poll: Poll;
    match: Match;
}

type CardState = "idle" | "confirming" | "processing" | "voted";

// Component to render vote tally with actual vote counts
function VoteTallyComponent({ poll }: { poll: Poll }) {
    const { getTally } = useVoting();
    const tally = getTally(poll.id);
    
    return (
        <div className="mb-6 p-4 rounded-lg bg-background/50 border border-border">
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-bold">Community Tally</h4>
            <VoteTally 
                yesVotes={tally.yes} 
                noVotes={tally.no} 
                unclearVotes={tally.unclear} 
                animated 
            />
        </div>
    );
}

export function VotingCard({ poll, match }: VotingCardProps) {
    const [cardState, setCardState] = useState<CardState>("idle");
    const [selectedDecision, setSelectedDecision] = useState<VoteDecision | null>(null);
    const focusedBeforeOpenRef = useRef<HTMLElement | null>(null);

    // Save focused element when card mounts
    useEffect(() => {
      focusedBeforeOpenRef.current = document.activeElement as HTMLElement | null;
    }, []);

    const { castVote, getVoteReward, getUnclearVotes } = useVoting();
    const { isConnected, connect, isConnecting } = useWallet();

    const rewardAmount = getVoteReward(poll.id);

    const homeTeam = {
        id: `home-${match.id}`,
        name: match.homeTeam,
        primaryColor: getTeamColor(match.homeTeam),
    };
    const awayTeam = {
        id: `away-${match.id}`,
        name: match.awayTeam,
        primaryColor: getTeamColor(match.awayTeam),
    };

    const handleSelectVote = async (decision: VoteDecision) => {
        if (!votingOpen) return;
        if (!isConnected) {
            try {
                await connect();
            } catch {
                // connect() already surfaces errors via toast; swallow here to avoid
                // double-reporting or an unhandled rejection at the call site.
            }
            return;
        }
        setSelectedDecision(decision);
        setCardState("confirming");
    };

    const handleConfirm = async () => {
        if (!selectedDecision) return;
        setCardState("processing");

        try {
            await castVote(poll.id, selectedDecision);
            setCardState("voted");

            // Show Achievement Toast
            toast.custom(
                (t) => (
                    <AchievementToast
                        title="Vote Cast"
                        description={`$${rewardAmount.toFixed(2)} earned`}
                        icon={<Scale className="w-6 h-6" />}
                        xp={25}
                        onClose={() => toast.dismiss(t)}
                    />
                ),
                { duration: 4000 }
            );
        } catch (error) {
            // Revert on error
            setCardState("idle");
            setSelectedDecision(null);
            // `castVote` throws when the voting window closed during
            // confirmation, so surface the reason rather than silently
            // returning to the buttons — otherwise the card looks broken
            // rather than out of time.
            toast.error("Vote not recorded", {
                description:
                    error instanceof Error
                        ? error.message
                        : "Vote failed. Please try again.",
            });
        }
    };

    const handleCancel = () => {
        setCardState("idle");
        setSelectedDecision(null);
      };

      // ── Restore focus on close/vote ────────────────────────────────────────
      useEffect(() => {
        if (cardState === "voted") {
          const element = focusedBeforeOpenRef.current;
          if (element && element instanceof HTMLElement) {
            element.focus({ preventScroll: true });
          }
          focusedBeforeOpenRef.current = null;
        }
      }, [cardState]);

      /**
     * Voting deadline, derived from the poll's own lock time.
     *
     * The previous version hardcoded `2 * 60 * 60 * 1000` onto raw kickoff,
     * ignoring `poll.lockTime` — so a `"halftime"` poll was treated as having
     * locked at kickoff and its voting window closed two minutes too early.
     */
    const deadlineTime = getVotingDeadlineISO(poll, match);

    /**
     * Live open/closed state. `CountdownTimer` already supports an `onExpire`
     * callback but it was never wired, so the timer could read `00:00:00` while
     * the buttons beside it stayed fully enabled. A one-second tick derives it
     * from the shared helper instead, so the countdown and the gate cannot
     * disagree.
     */
    const [, tick] = useReducer((n: number) => n + 1, 0);
    useEffect(() => {
        const id = setInterval(tick, 1_000);
        return () => clearInterval(id);
    }, []);
    const votingOpen = isVotingOpen(poll, match);

    const getCategoryColor = (cat: string) => {
        switch (cat) {
            case "score_prediction": return "text-purple-400 bg-purple-400/10 border-purple-400/20";
            case "player_event": return "text-blue-400 bg-blue-400/10 border-blue-400/20";
            case "team_event": return "text-green-400 bg-green-400/10 border-green-400/20";
            default: return "text-orange-400 bg-orange-400/10 border-orange-400/20";
        }
    };

    return (
        <GlowCard variant="default" className={cn("transition-opacity", cardState === "voted" ? "opacity-60" : "")}>
            {/* Match Context Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 px-6 border-b border-border/50 bg-background/30 -mx-6 -mt-6 rounded-t-[10px] mb-6">
                <div className="flex items-center gap-4">
                    <TeamBadge team={homeTeam} size="sm" />
                    <div className="text-center px-4">
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Final Score</div>
                        <div className="font-display font-black text-xl">
                            {match.score?.home ?? 0} <span className="text-muted-foreground font-normal mx-1">—</span> {match.score?.away ?? 0}
                        </div>
                    </div>
                    <TeamBadge team={awayTeam} size="sm" />
                </div>
                <div className="flex items-center gap-4 md:flex-col md:items-end justify-between md:gap-1">
                    {cardState === "voted" ? (
                        <div className="flex items-center gap-2 text-success px-3 py-1 bg-success/10 rounded-full border border-success/30 font-bold text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            Voted ✅
                        </div>
                    ) : (
                        <CountdownTimer targetTime={deadlineTime} compact className="text-primary text-sm font-mono" />
                    )}
                    <span className="text-xs text-muted-foreground">Voting closes 2h after the poll locks ({poll.lockTime})</span>
                </div>
            </div>

            {/* Poll Details */}
            <div className="mb-6 space-y-3">
                <div className="flex items-center gap-2">
                    <span className={cn("px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border", getCategoryColor(poll.category))}>
                        {categoryLabel(poll.category)}
                    </span>
                    <span className="text-xs text-muted-foreground font-mono">#{poll.id}</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-display font-black text-foreground">
                    {poll.question}
                </h3>

                <div className="text-sm font-bold text-gold flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    Vote to earn ${rewardAmount.toFixed(2)}
                </div>
            </div>

            {/* Evidence Section */}
            <EvidenceSection matchId={match.id} className="mb-8" />

            {/* Vote Tally */}
            <div className="mb-6 p-4 rounded-lg bg-background/50 border border-border">
                <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 font-bold">Community Tally</h4>
                <VoteTallyComponent poll={poll} />
            </div>

            {/* Interaction Area */}
            <div className="relative min-h-[140px] flex flex-col justify-end">
                <AnimatePresence mode="wait">
                    {cardState === "idle" && !votingOpen && (
                        <motion.div
                            key="voting-closed"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex items-center justify-center gap-3 h-14 rounded clip-corner bg-surface border border-border text-muted-foreground font-bold uppercase tracking-wider text-sm"
                            data-testid="voting-closed"
                        >
                            <Lock className="w-4 h-4" />
                            Voting Closed
                        </motion.div>
                    )}
                    {cardState === "idle" && votingOpen && (
                        <motion.div
                            key="voting-options"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="grid grid-cols-1 md:grid-cols-3 gap-3"
                        >
                            <GamingButton variant="primary" onClick={() => handleSelectVote("yes")} disabled={isConnecting} className="h-14 text-sm tracking-wider">
                                <span className="text-xl mr-2">✓</span> YES
                            </GamingButton>
                            <GamingButton variant="danger" onClick={() => handleSelectVote("no")} disabled={isConnecting} className="h-14 text-sm tracking-wider">
                                <span className="text-xl mr-2">✗</span> NO
                            </GamingButton>
                            <button
                                type="button"
                                onClick={() => handleSelectVote("unclear")}
                                disabled={isConnecting}
                                className="h-14 rounded clip-corner bg-surface border border-border hover:border-muted-foreground hover:bg-surface/80 transition-colors font-bold uppercase tracking-wider text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                UNCLEAR / DISPUTE
                            </button>
                        </motion.div>
                    )}

                    {cardState === "confirming" && selectedDecision && (
                        <motion.div
                            key="confirming-flow"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="p-4 md:p-6 bg-surface border border-primary/50 rounded-lg clip-corner-lg shadow-[0_0_30px_rgba(0,217,255,0.1)]"
                        >
                            <div className="flex items-start gap-3 mb-6">
                                <AlertCircle className="w-6 h-6 text-primary shrink-0" />
                                <div>
                                    <h4 className="font-display font-bold uppercase text-foreground">Confirm Your Vote</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        You are voting <span className={cn("font-bold uppercase", selectedDecision === "yes" ? "text-primary" : selectedDecision === "no" ? "text-danger" : "text-foreground")}>{selectedDecision}</span>. This action cannot be undone and commits your oracle answer.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <GamingButton variant={selectedDecision === "yes" ? "primary" : selectedDecision === "no" ? "danger" : "ghost"} onClick={handleConfirm} className="flex-1">
                                    Confirm Vote
                                </GamingButton>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-6 py-3 font-bold uppercase text-xs tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {cardState === "processing" && (
                        <motion.div
                            key="processing-flow"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center p-6 bg-surface border border-border/50 rounded-lg"
                        >
                            <div className="w-12 h-12 mb-4 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                            <div className="text-primary font-mono font-bold uppercase tracking-widest animate-pulse">
                                Recording Vote to Ledger...
                            </div>
                        </motion.div>
                    )}

                    {cardState === "voted" && (
                        <motion.div
                            role="alert"
                            aria-live="polite"
                            key="voted-success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center p-6 bg-success/10 border border-success/30 rounded-lg"
                        >
                            <Scale className="w-8 h-8 text-success mb-3" />
                            <h4 className="font-display font-black text-xl uppercase text-success">
                                Thank You For Judging!
                            </h4>
                            <p className="text-sm text-success/80 font-bold mt-1">
                                You earned ${rewardAmount.toFixed(2)}
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </GlowCard>
    );
}
