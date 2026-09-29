"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { MatchCard } from "./match-card";
import { useMockData } from "@/hooks/use-mock-data";
import { countPollsByStatus } from "@/lib/poll-status";
import { GamingButton } from "@/components/shared/gaming-button";
import type { Match } from "@/lib/mock-data";

type FilterType = "all" | "live" | "today" | "week";

const FILTER_LABELS: { key: FilterType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "live", label: "Live" },
    { key: "today", label: "Today" },
    { key: "week", label: "This Week" },
];

function isSameCalendarDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function filterMatches(matches: Match[], filter: FilterType): Match[] {
    if (filter === "all") return matches;

    const now = new Date();

    if (filter === "live") {
        return matches.filter((m) => m.status === "live");
    }

    if (filter === "today") {
        return matches.filter((m) => isSameCalendarDay(new Date(m.kickoff), now));
    }

    if (filter === "week") {
        const sevenDaysFromNow = new Date(now);
        sevenDaysFromNow.setDate(now.getDate() + 7);
        return matches.filter((m) => {
            const kickoff = new Date(m.kickoff);
            return kickoff >= now && kickoff <= sevenDaysFromNow;
        });
    }

    return matches;
}

export function UpcomingMatches() {
    const shouldReduceMotion = useReducedMotion();
    const upcomingMatches = useMockData((state) => state.getUpcomingMatches());
    const polls = useMockData((state) => state.polls);

    const [activeFilter, setActiveFilter] = useState<FilterType>("all");

    const visibleMatches = filterMatches(upcomingMatches ?? [], activeFilter);

    if (!upcomingMatches || upcomingMatches.length === 0) {
        return (
            <div id="matches" className="bg-background-secondary py-16 border-t border-primary/20">
                <div className="mx-auto max-w-7xl px-4 lg:px-8 text-center flex flex-col items-center justify-center min-h-[400px]">
                    {/* Neon line art empty state */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="w-24 h-24 mb-6 rounded-full border-2 border-[var(--accent-cyan)] shadow-[0_0_20px_rgba(0,217,255,0.4)] flex items-center justify-center opacity-80"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 12l2.5-2.5" />
                            <path d="M12 12l-2.5-2.5" />
                            <path d="M12 12l2.5 2.5" />
                            <path d="M12 12l-2.5 2.5" />
                            <path d="M12 2l2.5 2.5" />
                            <path d="M12 22l-2.5-2.5" />
                            <path d="M22 12l-2.5-2.5" />
                            <path d="M2 12l2.5 2.5" />
                        </svg>
                    </motion.div>
                    <h3 className="text-2xl font-display font-black uppercase text-foreground mb-2 shadow-text">
                        No Upcoming Matches
                    </h3>
                    <p className="text-muted-foreground mb-8">
                        Check back soon! New prediction markets are added regularly.
                    </p>
                    <GamingButton variant="primary">
                        Browse All Markets
                    </GamingButton>
                </div>
            </div>
        );
    }

    return (
        <div id="matches" className="bg-background-secondary py-16 border-t border-primary/20">
            <div className="mx-auto max-w-7xl px-4 lg:px-8">

                {/* Section Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                    <motion.div
                        className="flex flex-col gap-2"
                        {...(shouldReduceMotion ? {} : {
                            initial: { opacity: 0, x: -20 },
                            whileInView: { opacity: 1, x: 0 },
                            viewport: { once: true },
                            transition: { duration: 0.4 },
                        })}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-1 h-8 bg-[var(--accent-cyan)] shadow-[0_0_10px_rgba(0,217,255,0.8)]" />
                            <h2 className="font-display text-3xl font-black uppercase text-[var(--accent-cyan)] text-glow-cyan">
                                Upcoming Matches
                            </h2>
                        </div>
                        <p className="text-muted-foreground text-sm pl-4">
                            Pick a match and start predicting
                        </p>
                    </motion.div>

                    {/* Filter Pills */}
                    <motion.div
                        className="flex gap-2 overflow-x-auto scrollbar-none pb-1 flex-nowrap"
                        {...(shouldReduceMotion ? {} : {
                            initial: { opacity: 0, x: 20 },
                            whileInView: { opacity: 1, x: 0 },
                            viewport: { once: true },
                            transition: { duration: 0.4, delay: 0.1 },
                        })}
                    >
                        {FILTER_LABELS.map(({ key, label }) => {
                            const isActive = activeFilter === key;
                            return (
                                <button
                                    key={key}
                                    aria-pressed={isActive}
                                    onClick={() => setActiveFilter(key)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors border ${
                                        isActive
                                            ? "bg-primary/20 border-primary text-primary"
                                            : "bg-surface border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </motion.div>
                </div>

                {/* Matches Grid or Empty State */}
                {visibleMatches.length === 0 ? (
                    <motion.div
                        initial={shouldReduceMotion ? {} : { opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex flex-col items-center justify-center py-24 text-center"
                    >
                        <div className="w-16 h-16 mb-4 rounded-full border-2 border-primary/30 flex items-center justify-center opacity-60">
                            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-display font-black uppercase text-foreground mb-2">
                            No matches found
                        </h3>
                        <p className="text-muted-foreground text-sm">
                            No matches match the <span className="text-primary font-semibold">{FILTER_LABELS.find(f => f.key === activeFilter)?.label}</span> filter.
                        </p>
                        <button
                            onClick={() => setActiveFilter("all")}
                            className="mt-4 text-xs font-bold uppercase tracking-wider text-primary hover:underline"
                        >
                            Show all matches
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {visibleMatches.map((match, index) => {
                            const matchPolls = polls.filter((p) => p.matchId === match.id);
                            const { active, awaitingResolution } = countPollsByStatus(matchPolls);
                            const totalPool = matchPolls.reduce((acc, p) => acc + p.yesPool + p.noPool, 0);

                            return (
                                <MatchCard
                                    key={match.id}
                                    match={match}
                                    activePollsCount={active}
                                    awaitingResolutionCount={awaitingResolution}
                                    totalPool={totalPool}
                                    index={index}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
