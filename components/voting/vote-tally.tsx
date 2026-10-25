"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle, ShieldAlert } from "lucide-react";
import { AUTO_APPROVE_THRESHOLD, ADMIN_REVIEW_THRESHOLD } from "@/lib/constants";

interface VoteTallyProps {
    yesVotes: number;
    noVotes: number;
    unclearVotes?: number;
    animated?: boolean;
    className?: string;
}

export function VoteTally({
    yesVotes,
    noVotes,
    unclearVotes = 0,
    animated = true,
    className,
}: VoteTallyProps) {
    const totalVotes = yesVotes + noVotes + unclearVotes;
    const hasVotes = totalVotes > 0;

    // Calculate percentages (handling 0 votes)
    const yesPct = hasVotes ? (yesVotes / totalVotes) * 100 : 0;
    const noPct = hasVotes ? (noVotes / totalVotes) * 100 : 0;
    const unclearPct = hasVotes ? (unclearVotes / totalVotes) * 100 : 0;

    // ── Consensus logic ────────────────────────────────────────────────────────
    // Resolution thresholds operate on valid (yes/no) votes only.
    // Unclear votes are NOT a resolvable outcome and must never surface as
    // "Strong consensus". When unclear votes dominate, we show "Unresolved".
    const validVotes = yesVotes + noVotes;
    const hasValidVotes = validVotes > 0;

    // Share of valid (yes/no) votes that the leading side holds
    const yesPctValid = hasValidVotes ? (yesVotes / validVotes) * 100 : 0;
    const noPctValid = hasValidVotes ? (noVotes / validVotes) * 100 : 0;
    const leadingValidPct = Math.max(yesPctValid, noPctValid) / 100; // decimal for threshold compare

    // Whether unclear votes are the plurality (more than yes OR no individually)
    const unclearIsMajority = hasVotes && unclearVotes > yesVotes && unclearVotes > noVotes;

    let consensusColor = "text-muted-foreground";
    let consensusText = "Waiting for votes...";
    let ConsensusIcon = null;

    if (hasVotes) {
if (unclearIsMajority) {
            // Unclear votes dominate — this is an unresolved / disputed outcome
            consensusColor = "text-danger text-glow-red";
            consensusText = "Unresolved — dispute likely";
            ConsensusIcon = <ShieldAlert className="w-4 h-4" />;
        } else if (!hasValidVotes) {
            // Edge case: only unclear votes exist
            consensusColor = "text-danger text-glow-red";
            consensusText = "Unresolved — no valid votes";
            ConsensusIcon = <ShieldAlert className="w-4 h-4" />;
        } else if (leadingValidPct >= AUTO_APPROVE_THRESHOLD) {
            // ≥ 85% of valid votes agree → auto-approved
            consensusColor = "text-success text-glow-green";
            consensusText = "Strong consensus";
            ConsensusIcon = <CheckCircle2 className="w-4 h-4" />;
        } else if (leadingValidPct >= ADMIN_REVIEW_THRESHOLD) {
            // ≥ 60% of valid votes agree → admin review
            consensusColor = "text-gold text-glow-gold";
            consensusText = "Moderate — admin review likely";
            ConsensusIcon = <AlertTriangle className="w-4 h-4" />;
        } else {
            // Below 60% → multi-sig review required
            consensusColor = "text-danger text-glow-red";
            consensusText = "Split — multi-sig review required";
            ConsensusIcon = <ShieldAlert className="w-4 h-4" />;
        }
    }

    return (
        <div className={cn("w-full space-y-3", className)}>
            {/* Labels above bar */}
            <div className="flex justify-between text-sm font-medium">
                <div className="flex items-center gap-2">
                    <span className="text-[#00d9ff] font-bold">YES</span>
                    <span className="text-muted-foreground text-xs">
                        {yesPct.toFixed(1)}% ({yesVotes})
                    </span>
                </div>

                {unclearVotes > 0 && (
                    <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
                        <span className="text-muted-foreground font-bold">UNCLEAR</span>
                        <span className="text-muted-foreground text-xs">
                            {unclearPct.toFixed(1)}% ({unclearVotes})
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                        ({noVotes}) {noPct.toFixed(1)}%
                    </span>
                    <span className="text-[#ff006e] font-bold">NO</span>
                </div>
            </div>

            {/* Progress bar container */}
            <div
                className="relative w-full h-3 rounded-full overflow-hidden flex bg-background/50"
                style={{
                    boxShadow: "inset 0 2px 10px rgba(0, 0, 0, 0.5)",
                }}
            >
                {!hasVotes && (
                    <div className="w-full h-full bg-border/20" />
                )}

                {hasVotes && (
                    <>
                        {/* YES segment */}
                        <motion.div
                            className="h-full z-10"
                            initial={animated ? { width: 0 } : { width: `${yesPct}%` }}
                            animate={{ width: `${yesPct}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            style={{
                                background: `linear-gradient(90deg, rgba(0, 217, 255, 0.8) 0%, rgba(0, 217, 255, 0.6) 100%)`,
                                boxShadow: `0 0 10px rgba(0, 217, 255, 0.4), inset 0 0 5px rgba(0, 217, 255, 0.3)`,
                            }}
                        />

                        {/* UNCLEAR segment (middle) */}
                        {unclearPct > 0 && (
                            <motion.div
                                className="h-full z-10"
                                initial={animated ? { width: 0 } : { width: `${unclearPct}%` }}
                                animate={{ width: `${unclearPct}%` }}
                                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                                style={{
                                    background: `linear-gradient(90deg, rgba(161, 161, 170, 0.6) 0%, rgba(161, 161, 170, 0.8) 100%)`,
                                }}
                            />
                        )}

                        {/* NO segment (right) */}
                        <motion.div
                            className="h-full z-10 ml-auto"
                            initial={animated ? { width: 0 } : { width: `${noPct}%` }}
                            animate={{ width: `${noPct}%` }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.1 }}
                            style={{
                                background: `linear-gradient(90deg, rgba(255, 0, 110, 0.6) 0%, rgba(255, 0, 110, 0.8) 100%)`,
                                boxShadow: `0 0 10px rgba(255, 0, 110, 0.4), inset 0 0 5px rgba(255, 0, 110, 0.3)`,
                            }}
                        />
                    </>
                )}
            </div>

            {/* Footer Info */}
            <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">
                    {totalVotes} {totalVotes === 1 ? "vote" : "votes"} so far
                </span>

                <div className={cn("flex items-center gap-1.5 font-bold", consensusColor)}>
                    {ConsensusIcon}
                    {consensusText}
                </div>
            </div>
        </div>
    );
}
