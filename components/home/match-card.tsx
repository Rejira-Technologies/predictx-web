"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Calendar, MapPin } from "lucide-react";

import { GlowCard } from "@/components/shared/glow-card";
import { TeamBadge } from "@/components/shared/team-badge";
import { CountdownTimer } from "@/components/shared/countdown-timer";
import type { Match } from "@/lib/mock-data";
import { getTeamColor } from "@/lib/team-colors";

interface MatchCardProps {
    match: Match;
    /** Polls that are still accepting stakes. */
    activePollsCount: number;
    /** Polls that are closed and waiting on an outcome. */
    awaitingResolutionCount: number;
    totalPool: number;
    index: number;
}

export function MatchCard({
    match,
    activePollsCount,
    awaitingResolutionCount,
    totalPool,
    index,
}: MatchCardProps) {
    const shouldReduceMotion = useReducedMotion();

    // Create minimal mock Team objects for TeamBadge
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

    const isLive = match.status === "live";
    const isCompleted = match.status === "completed";
    const isUpcoming = match.status === "upcoming";

    const hasActivePolls = activePollsCount > 0;
    const activePollsLabel = hasActivePolls
        ? `${activePollsCount} Active Poll${activePollsCount === 1 ? "" : "s"}`
        : "Staking Closed";
    const awaitingResolutionLabel = `${awaitingResolutionCount} poll${awaitingResolutionCount === 1 ? "" : "s"} awaiting resolution`;

    // Formatter for "Sat, Feb 21 • 15:00 GMT"
    const formattedDate = new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
    }).format(new Date(match.kickoff));

    const formattedTime = new Intl.DateTimeFormat("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        timeZoneName: "short",
        hour12: false,
    }).format(new Date(match.kickoff));

    const motionProps = shouldReduceMotion
        ? {}
        : {
            initial: { opacity: 0, y: 30 },
            whileInView: { opacity: 1, y: 0 },
            viewport: { once: true, margin: "-40px" },
            transition: {
                duration: 0.45,
                delay: (index % 3) * 0.1 + Math.floor(index / 3) * 0.1,
            },
            whileHover: { y: -4, transition: { duration: 0.2 } },
        };

    return (
        <Link href={`/match/${match.id}`} className="block h-full outline-none">
            <GlowCard
                variant={isLive ? "success" : "default"}
                className={`h-full flex flex-col transition-opacity duration-300 ${isCompleted ? "opacity-60 hover:opacity-100" : ""
                    }`}
            >
                {/* Header / Badges */}
                <div className="flex items-start justify-between mb-6">
                    <div className="flex flex-col gap-2">
                        <span className="text-xs font-bold text-gold uppercase tracking-widest bg-gold/10 px-2 py-1 rounded">
                            Premier League
                        </span>
                        {isLive && (
                            <div className="flex items-center gap-2 text-success font-bold text-xs uppercase tracking-widest">
                                <span className="w-2 h-2 rounded-full bg-success animate-pulse shrink-0 shadow-[0_0_8px_rgba(57,255,20,0.8)]" />
                                Live Now
                            </div>
                        )}
                        {isCompleted && (
                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-2 py-1 bg-white/5 rounded">
                                Completed
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                        #{match.id}
                    </div>
                </div>

                {/* Teams Layout */}
                <div className="flex items-center justify-between mb-6">
                    {/* Home */}
                    <div className="flex flex-1 flex-col items-center gap-3 text-center">
                        <TeamBadge team={homeTeam} size="md" />
                        <span className="font-display font-bold text-sm tracking-wide">
                            {match.homeTeam}
                        </span>
                        {(isLive || isCompleted) && match.score && (
                            <span className="text-3xl font-display font-black">
                                {match.score.home}
                            </span>
                        )}
                    </div>

                    {/* VS Divider */}
                    <div className="flex flex-col items-center justify-center px-4 shrink-0">
                        <motion.div
                            animate={{ rotate: isLive ? 360 : 0 }}
                            transition={{
                                duration: 20,
                                repeat: Infinity,
                                ease: "linear",
                            }}
                            className="text-2xl font-display font-black text-[var(--accent-cyan)] text-glow-cyan"
                        >
                            VS
                        </motion.div>
                        {isLive && (
                            <span className="text-success font-mono font-bold mt-2 text-sm text-glow-green">
                                67' {/* Mock live minute */}
                            </span>
                        )}
                    </div>

                    {/* Away */}
                    <div className="flex flex-1 flex-col items-center gap-3 text-center">
                        <TeamBadge team={awayTeam} size="md" />
                        <span className="font-display font-bold text-sm tracking-wide">
                            {match.awayTeam}
                        </span>
                        {(isLive || isCompleted) && match.score && (
                            <span className="text-3xl font-display font-black">
                                {match.score.away}
                            </span>
                        )}
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-4 py-4 border-t border-border mt-auto">
                    {isUpcoming ? (
                        <div className="col-span-2 mb-2 flex justify-center">
                            <CountdownTimer
                                targetTime={match.kickoff}
                                compact
                                className="text-primary font-mono text-lg"
                            />
                        </div>
                    ) : isCompleted ? (
                        <div className="col-span-2 mb-2 text-center text-amber-500 text-sm font-bold tracking-wide">
                            {awaitingResolutionCount > 0
                                ? awaitingResolutionLabel
                                : "All polls resolved"}
                        </div>
                    ) : null}

                    <div className="flex items-center gap-2 text-sm text-muted-foreground col-span-2 sm:col-span-1">
                        <Calendar className="w-4 h-4 shrink-0 text-primary" />
                        <span className="truncate">
                            {formattedDate} &bull;{" "}
                            <span className="font-mono">{formattedTime}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground col-span-2 sm:col-span-1 sm:justify-end">
                        <MapPin className="w-4 h-4 shrink-0 text-primary" />
                        <span className="truncate">{match.venue}</span>
                    </div>
                </div>

                {/* Footer Stats */}
                <div className="flex items-center justify-between pt-4 mt-2">
                    <div
                        className={`flex items-center gap-2 px-3 py-1.5 bg-background rounded-full border ${
                            hasActivePolls ? "border-primary/20" : "border-border"
                        }`}
                    >
                        <span
                            className={`w-1.5 h-1.5 rounded-full ${
                                hasActivePolls
                                    ? "bg-primary animate-pulse"
                                    : "bg-muted-foreground"
                            }`}
                        />
                        <span className="text-xs font-bold text-foreground tracking-wide">
                            {activePollsLabel}
                        </span>
                    </div>
                    <div className="font-mono font-bold text-gold text-glow-gold">
                        ${totalPool.toLocaleString()}
                    </div>
                </div>
            </GlowCard>
        </Link>
    );
}
