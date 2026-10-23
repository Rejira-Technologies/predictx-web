"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ExternalLink, Info, PlayCircle, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { MATCH_EVIDENCE } from "@/lib/mock-data";

interface EvidenceSectionProps {
    matchId: string;
    className?: string;
}

// Get evidence for a specific match
const getMockEvidence = (matchId: string) => {
    const evidence = MATCH_EVIDENCE[matchId];
    if (!evidence || !evidence.timeline || evidence.timeline.length === 0) {
        return null;
    }
    return evidence;
};

export function EvidenceSection({ matchId, className }: EvidenceSectionProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const evidenceData = getMockEvidence(matchId);
    const events = evidenceData?.timeline || [];

    const hasEvidence = events.length > 0;

    return (
        <div className={cn("bg-background/40 rounded-lg border border-border/50 overflow-hidden", className)}>
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
                aria-controls="evidence-section-panel"
                className="w-full flex items-center justify-between p-4 bg-surface/50 hover:bg-surface transition-colors focus:outline-none"
            >
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-primary/20 rounded-md">
                        <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <span className="font-display font-bold uppercase text-sm tracking-wider">
                        Match Evidence & Logs
                    </span>
                    <div className="group relative ml-2">
                        <Info className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors cursor-help" />
                        <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-background border border-border rounded text-xs text-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            Review the evidence before voting to earn maximum rewards
                        </div>
                    </div>
                </div>
                <motion.div animate={{ rotate: isExpanded ? 180 : 0 }}>
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </motion.div>
            </button>

            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        id="evidence-section-panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        <div className="p-4 border-t border-border/50 space-y-5">

                            {!hasEvidence && (
                                <div className="text-center py-6 px-4">
                                    <p className="text-muted-foreground text-sm font-medium">
                                        Evidence pending review
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        This poll does not have evidence data yet. Check back after the match concludes.
                                    </p>
                                </div>
                            )}

                            {hasEvidence && (
                                <>
                                    {/* External Links */}
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <a
                                            href={evidenceData?.highlightsUrl || "#"}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center gap-2 p-3 bg-background rounded border border-border hover:border-primary/50 transition-colors group"
                                        >
                                            <PlayCircle className="w-5 h-5 text-primary group-hover:text-glow-cyan" />
                                            <span className="text-sm font-medium">View Match Highlights</span>
                                            <ExternalLink className="w-3 h-3 ml-auto opacity-50 group-hover:opacity-100" />
                                        </a>
                                        <a
                                            href={evidenceData?.statsUrl || "#"}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 flex items-center gap-2 p-3 bg-background rounded border border-border hover:border-primary/50 transition-colors group"
                                        >
                                            <ExternalLink className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            <span className="text-sm font-medium">Official Premier League Stats</span>
                                            <ExternalLink className="w-3 h-3 ml-auto opacity-50 group-hover:opacity-100" />
                                        </a>
                                    </div>

                                    {/* Event Timeline */}
                                    <div>
                                        <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3 font-bold">
                                            Key Event Timeline
                                        </h4>
                                        <div className="space-y-3 bg-background/50 rounded p-4 font-mono text-sm">
                                            {events.map((evt, i) => (
                                                <div key={i} className="flex gap-4">
                                                    <span className="text-primary w-12 shrink-0">{evt.time}</span>
                                                    <span className="text-foreground/90">{evt.event}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
