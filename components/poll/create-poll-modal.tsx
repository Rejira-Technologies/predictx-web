"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    User,
    Shield,
    Hash,
    Star,
    Clock,
    MapPin,
    Calendar,
    Zap,
    AlertCircle,
    Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { MATCHES, type Poll, type PollCategory, type LockTime } from "@/lib/mock-data";
import { POLL_QUESTION_MIN_LENGTH, POLL_QUESTION_MAX_LENGTH } from "@/lib/constants";
import { LOCK_OFFSET_MINUTES } from "@/lib/calculations";
import { useMockData } from "@/hooks/use-mock-data";
import { useWallet } from "@/hooks/use-wallet";
import { WalletConnectModal } from "@/components/wallet-connect-modal";
import { GamingButton } from "@/components/shared/gaming-button";
import { cn } from "@/lib/utils";
import { CREATE_POLL_FEE_XLM } from "@/lib/constants";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreatePollModalProps {
    open: boolean;
    onClose: () => void;
    preselectedMatchId?: string;
}

interface FormState {
    matchId: string;
    category: PollCategory | "";
    question: string;
    lockTime: LockTime | "custom" | "";
    customLockTime: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STEPS = ["Match", "Category", "Question", "Lock Time"] as const;

const CATEGORY_OPTIONS: Array<{
    value: PollCategory;
    label: string;
    icon: React.ReactNode;
    description: string;
    examples: string[];
}> = [
        {
            value: "player_event",
            label: "Player Event",
            icon: <User className="h-5 w-5" />,
            description: "Will a specific player do something?",
            examples: ["Score a goal", "Get a yellow card", "Get subbed before 70'"],
        },
        {
            value: "team_event",
            label: "Team Event",
            icon: <Shield className="h-5 w-5" />,
            description: "Will a team achieve something?",
            examples: ["Win the match", "Keep a clean sheet", "Score first"],
        },
        {
            value: "score_prediction",
            label: "Score Prediction",
            icon: <Hash className="h-5 w-5" />,
            description: "Predict goals or the score",
            examples: ["Over 2.5 goals", "Both teams score", "Win by 2+"],
        },
        {
            value: "other",
            label: "Other",
            icon: <Star className="h-5 w-5" />,
            description: "Any other match prediction",
            examples: ["VAR review", "Red card shown", "Extra time needed"],
        },
    ];

const QUESTION_TEMPLATES: Record<PollCategory, string[]> = {
    player_event: [
        "Will [Player] score a goal?",
        "Will [Player] get a yellow card?",
        "Will [Player] be subbed before 70 minutes?",
        "Will [Player] get an assist?",
    ],
    team_event: [
        "Will [Team] win the match?",
        "Will [Team] keep a clean sheet?",
        "Will [Team] score in the first half?",
        "Will there be a penalty in this match?",
    ],
    score_prediction: [
        "Will total goals be over 2.5?",
        "Will both teams score?",
        "Will the match end as a draw?",
        "Will the winning margin be 2+ goals?",
    ],
    other: [
        "Will there be a VAR review?",
        "Will a red card be shown?",
        "Will the match go to extra time?",
        "Will there be a hat-trick scored?",
    ],
};

const LOCK_OPTIONS: Array<{
    value: LockTime | "custom";
    label: string;
    description: string;
    badge?: string;
}> = [
        { value: "kickoff", label: "At Kickoff", description: "Staking stops at match start", badge: "Recommended" },
        { value: "halftime", label: "At Halftime", description: "Staking open during first half" },
        { value: "60min", label: "At 60th Minute", description: "Extended staking window" },
        { value: "custom", label: "Custom Time", description: "Choose a specific date & time" },
    ];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatKickoff(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) +
        " · " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

function getLockDisplay(lockTime: LockTime | "custom" | "", customLockTime: string, kickoff: string) {
    if (!lockTime) return "—";
    const kick = new Date(kickoff);
    if (lockTime === "kickoff") return `Locks at kickoff — ${formatKickoff(kickoff)}`;
    if (lockTime === "halftime") {
        kick.setMinutes(kick.getMinutes() + LOCK_OFFSET_MINUTES.halftime);
        return `Locks at halftime — ${formatKickoff(kick.toISOString())}`;
    }
    if (lockTime === "60min") {
        kick.setMinutes(kick.getMinutes() + LOCK_OFFSET_MINUTES["60min"]);
        return `Locks at 60' — ${formatKickoff(kick.toISOString())}`;
    }
    if (lockTime === "custom" && customLockTime)
        return `Locks at ${formatKickoff(new Date(customLockTime).toISOString())}`;
    return "Choose date & time below";
}

function generatePollId() {
    return `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Step progress indicator */
function StepIndicator({ step }: { step: number }) {
    return (
        <div className="flex items-center gap-0 w-full px-1">
            {STEPS.map((label, i) => {
                const idx = i + 1;
                const done = idx < step;
                const active = idx === step;
                return (
                    <div key={label} className="flex items-center flex-1">
                        <div className="flex flex-col items-center gap-1 flex-shrink-0">
                            <div
                                className={cn(
                                    "w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all",
                                    done && "border-primary bg-primary text-background",
                                    active && "border-primary text-primary shadow-[0_0_12px_rgba(0,217,255,0.6)]",
                                    !done && !active && "border-border text-muted-foreground"
                                )}
                            >
                                {done ? <CheckCircle2 className="h-4 w-4" /> : idx}
                            </div>
                            <span
                                className={cn(
                                    "text-[9px] uppercase tracking-wider font-bold whitespace-nowrap",
                                    active ? "text-primary" : done ? "text-primary/70" : "text-muted-foreground"
                                )}
                            >
                                {label}
                            </span>
                        </div>
                        {i < STEPS.length - 1 && (
                            <div className={cn("h-[2px] flex-1 mx-1 transition-all", done ? "bg-primary" : "bg-border")} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/** Inline mini poll preview rendered in step 3 & 4 */
function PollPreview({ form, matchLabel }: { form: FormState; matchLabel: string }) {
    const catLabel = CATEGORY_OPTIONS.find((c) => c.value === form.category)?.label ?? "Category";
    const hasQuestion = form.question.length >= 1;

    return (
        <div className="rounded-lg border border-primary/30 bg-[#0d1025]/80 p-4 space-y-3 text-sm relative overflow-hidden">
            {/* your poll badge */}
            <div className="absolute top-2 right-2 px-2 py-0.5 bg-gold/20 text-gold text-[10px] font-bold uppercase tracking-wider rounded">
                Your Poll
            </div>

            {/* category */}
            <div className="inline-block px-2 py-0.5 bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider rounded">
                {catLabel}
            </div>

            {/* question */}
            <p className={cn("font-bold text-base leading-snug", !hasQuestion && "text-muted-foreground italic")}>
                {hasQuestion ? form.question : "Your question will appear here..."}
            </p>

            {/* match */}
            <p className="text-muted-foreground text-xs">{matchLabel}</p>

            {/* pool bars */}
            <div className="space-y-1">
                <div className="flex justify-between text-xs">
                    <span className="text-[#39ff14] font-bold">YES · $0</span>
                    <span className="text-[#ff006e] font-bold">NO · $0</span>
                </div>
                <div className="relative h-3 bg-background rounded-full overflow-hidden flex">
                    <div className="h-full bg-gradient-to-r from-[#39ff14] to-[#39ff14]/80 w-1/2" />
                    <div className="h-full bg-gradient-to-l from-[#ff006e] to-[#ff006e]/80 w-1/2" />
                </div>
            </div>

            {/* lock time */}
            {form.lockTime && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{LOCK_OPTIONS.find((l) => l.value === form.lockTime)?.label ?? "—"}</span>
                </div>
            )}
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CreatePollModal({ open, onClose, preselectedMatchId }: CreatePollModalProps) {
    const { addPoll } = useMockData();
    const { isConnected, sendTransaction, address } = useWallet();

    const [step, setStep] = useState<number>(1);
    const [form, setForm] = useState<FormState>({
        matchId: preselectedMatchId ?? "",
        category: "",
        question: "",
        lockTime: "",
        customLockTime: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState("");
    const [success, setSuccess] = useState(false);
    const [showWalletModal, setShowWalletModal] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Track the success auto-close timer so we can cancel it on unmount
    const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Clear the timer when the modal unmounts to prevent state updates on
    // an unmounted component (e.g. parent destroys modal from outside)
    useEffect(() => {
        return () => {
            if (successTimerRef.current) clearTimeout(successTimerRef.current);
        };
    }, []);

    const upcomingMatches = MATCHES.filter((m) => m.status === "upcoming");
    const selectedMatch = MATCHES.find((m) => m.id === form.matchId);
    // If a preselected match is not upcoming (live/completed), ignore it so
    // the wizard never receives a matchId that bypasses the upcoming-only filter.
    const effectiveMatchId =
        selectedMatch && selectedMatch.status !== "upcoming" ? "" : form.matchId;
    const resolvedMatch = effectiveMatchId
        ? MATCHES.find((m) => m.id === effectiveMatchId)
        : undefined;
    const matchLabel = resolvedMatch
        ? `${resolvedMatch.homeTeam} vs ${resolvedMatch.awayTeam}`
        : "";

    // ── Validation ─────────────────────────────────────────────────────────────

    const canGoNext = useCallback(() => {
        if (step === 1) return !!form.matchId;
        if (step === 2) return !!form.category;
        if (step === 3) return form.question.length >= POLL_QUESTION_MIN_LENGTH && form.question.length <= POLL_QUESTION_MAX_LENGTH;
        if (step === 4) return !!form.lockTime && (form.lockTime !== "custom" || !!form.customLockTime);
        return false;
    }, [step, form]);

    const nextStep = () => { if (canGoNext()) setStep((s) => s + 1 as 1 | 2 | 3 | 4); };
    const prevStep = () => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4);

    const updateForm = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

    // ── Submit ─────────────────────────────────────────────────────────────────

    const handleSubmit = async () => {
        if (!isConnected) {
            setShowWalletModal(true);
            return;
        }
        if (!resolvedMatch || !form.category || !form.lockTime) return;

        setSubmitting(true);
        setSubmitError("");

        try {
            await sendTransaction(CREATE_POLL_FEE_XLM, `Create poll: ${form.question}`);

            const newPoll: Poll = {
                id: generatePollId(),
                matchId: form.matchId,
                question: form.question,
                category: form.category as PollCategory,
                yesPool: 0,
                noPool: 0,
                participants: 0,
                stakeCount: 0,
                stakers: [],
                status: "active",
                lockTime: (form.lockTime === "custom" ? "kickoff" : form.lockTime) as LockTime,
                recentActivity: "Just created",
            };

            addPoll(newPoll);
            setSuccess(true);

            toast.success("POLL CREATED! 🎉", {
                description: "Your prediction has been created!",
            });

            successTimerRef.current = setTimeout(() => {
                successTimerRef.current = null;
                setSuccess(false);
                handleClose();
            }, 2000);
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "Transaction failed";
            setSubmitError(msg);
            toast.error("Transaction failed", { description: msg });
        } finally {
            setSubmitting(false);
        }
    };

    // ── Close / reset ──────────────────────────────────────────────────────────

    const handleClose = () => {
        // Block close while a transaction is in flight — prevents unmounting
        // the modal mid-transaction and the duplicate-submission bug it causes.
        if (submitting) return;
        if (successTimerRef.current) {
            clearTimeout(successTimerRef.current);
            successTimerRef.current = null;
        }
        setStep(1);
        setForm({ matchId: preselectedMatchId ?? "", category: "", question: "", lockTime: "", customLockTime: "" });
        setSubmitting(false);
        setSubmitError("");
        setSuccess(false);
        onClose();
    };

    if (!open) return null;

    // ── Render ────────────────────────────────────────────────────────────────

    const charCount = form.question.length;
    const charColor = charCount > 100 ? "text-[#ff006e]" : charCount >= POLL_QUESTION_MIN_LENGTH ? "text-primary" : "text-muted-foreground";
    const lockDisplay = selectedMatch ? getLockDisplay(form.lockTime, form.customLockTime, selectedMatch.kickoff) : "—";
    const showLivePreview = step >= 3;

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
                onClick={handleClose}
                style={{
                    backgroundImage: "radial-gradient(circle at 50% 50%, rgba(0,217,255,0.03) 0%, transparent 70%)",
                    cursor: submitting ? "not-allowed" : "default",
                }}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: 32 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: 32 }}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    className={cn(
                        "pointer-events-auto bg-[#0d1025] border border-primary/30 shadow-[0_0_60px_rgba(0,217,255,0.12)]",
                        "w-full flex flex-col",
                        "h-[100dvh] sm:h-auto sm:max-h-[90vh] sm:overflow-hidden",
                        "sm:rounded-xl rounded-none",
                        // Desktop with preview: wider
                        showLivePreview ? "sm:max-w-4xl" : "sm:max-w-xl"
                    )}
                    style={{
                        clipPath: "polygon(12px 0, calc(100% - 12px) 0, 100% 12px, 100% calc(100% - 12px), calc(100% - 12px) 100%, 12px 100%, 0 calc(100% - 12px), 0 12px)",
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20 flex-shrink-0">
                        <div className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" />
                            <span className="font-display text-primary uppercase tracking-widest text-sm font-bold">
                                Create Prediction
                            </span>
                        </div>
                        <button
                            onClick={handleClose}
                            disabled={submitting}
                            className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-sm hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Step indicator */}
                    <div className="px-6 pt-4 pb-3 flex-shrink-0">
                        <StepIndicator step={step} />
                    </div>

                    {/* Content area: form + optional preview */}
                    <div className="flex flex-1 min-h-0">
                        {/* Form column */}
                        <div className="flex-1 flex flex-col min-h-0 overflow-auto">
                            <div className="flex-1 px-6 pb-4">
                                <AnimatePresence mode="wait">
                                    {step === 1 && (
                                        <motion.div
                                            key="step1"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-4"
                                        >
                                            <div>
                                                <h2 className="font-display text-xl font-bold uppercase tracking-wider text-foreground mb-1">
                                                    Select a Match
                                                </h2>
                                                <p className="text-muted-foreground text-sm">Choose an upcoming match for your prediction</p>
                                            </div>

                                            <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                                                {upcomingMatches.map((match) => {
                                                    const selected = form.matchId === match.id;
                                                    return (
                                                        <button
                                                            key={match.id}
                                                            onClick={() => updateForm({ matchId: match.id })}
                                                            className={cn(
                                                                "w-full text-left p-3 rounded-lg border-2 transition-all",
                                                                selected
                                                                    ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(0,217,255,0.2)]"
                                                                    : "border-border hover:border-primary/50 bg-[#1a1f3a]/60 hover:bg-[#1a1f3a]/90"
                                                            )}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex-1">
                                                                    <div className="font-bold text-sm text-foreground">
                                                                        {match.homeTeam} <span className="text-muted-foreground font-normal">vs</span> {match.awayTeam}
                                                                    </div>
                                                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                                        <span className="flex items-center gap-1">
                                                                            <Calendar className="h-3 w-3" />
                                                                            {formatKickoff(match.kickoff)}
                                                                        </span>
                                                                        <span className="flex items-center gap-1">
                                                                            <MapPin className="h-3 w-3" />
                                                                            {match.venue}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {selected && <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0 ml-2" />}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 2 && (
                                        <motion.div
                                            key="step2"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-4"
                                        >
                                            <div>
                                                <h2 className="font-display text-xl font-bold uppercase tracking-wider text-foreground mb-1">
                                                    Choose Category
                                                </h2>
                                                <p className="text-muted-foreground text-sm">What type of prediction is this?</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                {CATEGORY_OPTIONS.map((cat) => {
                                                    const selected = form.category === cat.value;
                                                    return (
                                                        <button
                                                            key={cat.value}
                                                            onClick={() => updateForm({ category: cat.value })}
                                                            className={cn(
                                                                "relative text-left p-4 rounded-lg border-2 transition-all group",
                                                                selected
                                                                    ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(0,217,255,0.2)]"
                                                                    : "border-border hover:border-primary/50 bg-[#1a1f3a]/60 hover:bg-[#1a1f3a]/90"
                                                            )}
                                                        >
                                                            {selected && (
                                                                <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary" />
                                                            )}
                                                            <div className={cn("mb-2", selected ? "text-primary" : "text-muted-foreground group-hover:text-primary/70 transition-colors")}>
                                                                {cat.icon}
                                                            </div>
                                                            <div className="font-bold text-sm text-foreground mb-1">{cat.label}</div>
                                                            <div className="text-xs text-muted-foreground mb-2 leading-relaxed">{cat.description}</div>
                                                            <div className="space-y-0.5">
                                                                {cat.examples.map((ex) => (
                                                                    <div key={ex} className="text-[10px] text-muted-foreground/70">• {ex}</div>
                                                                ))}
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 3 && (
                                        <motion.div
                                            key="step3"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-4"
                                        >
                                            <div>
                                                <h2 className="font-display text-xl font-bold uppercase tracking-wider text-foreground mb-1">
                                                    Write Your Question
                                                </h2>
                                                <p className="text-muted-foreground text-sm">Ask a clear Yes/No question about a specific match event</p>
                                            </div>

                                            {/* Textarea */}
                                            <div className="relative">
                                                <textarea
                                                    value={form.question}
                                                    onChange={(e) => updateForm({ question: e.target.value.slice(0, POLL_QUESTION_MAX_LENGTH) })}
                                                    placeholder="e.g., Will Palmer score a goal?"
                                                    rows={3}
                                                    className={cn(
                                                        "w-full bg-[#1a1f3a]/80 text-foreground placeholder:text-muted-foreground",
                                                        "p-4 rounded-lg border-2 resize-none outline-none transition-all font-medium",
                                                        "focus:border-primary focus:shadow-[0_0_20px_rgba(0,217,255,0.3)]",
                                                        charCount > POLL_QUESTION_MAX_LENGTH ? "border-[#ff006e]" : "border-border"
                                                    )}
                                                    style={{ caretColor: "#00d9ff" }}
                                                />
                                                <span className={cn("absolute bottom-3 right-3 text-xs font-mono", charColor)}>
                                                    {charCount}/{POLL_QUESTION_MAX_LENGTH}
                                                </span>
                                            </div>

                                            {charCount < POLL_QUESTION_MIN_LENGTH && charCount > 0 && (
                                                <p className="text-xs text-[#ff006e] flex items-center gap-1">
                                                    <AlertCircle className="h-3 w-3" /> Minimum {POLL_QUESTION_MIN_LENGTH} characters
                                                </p>
                                            )}

                                            {/* Template suggestions */}
                                            {form.category && (
                                                <div>
                                                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Quick Templates</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {QUESTION_TEMPLATES[form.category as PollCategory].map((tpl) => (
                                                            <button
                                                                key={tpl}
                                                                onClick={() => updateForm({ question: tpl })}
                                                                className="text-xs px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary hover:bg-primary/15 hover:border-primary transition-all"
                                                            >
                                                                {tpl}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Mobile preview toggle */}
                                            <div className="lg:hidden">
                                                <button
                                                    onClick={() => setShowPreview((v) => !v)}
                                                    className="text-xs text-primary underline underline-offset-2"
                                                >
                                                    {showPreview ? "Hide" : "Show"} preview
                                                </button>
                                                <AnimatePresence>
                                                    {showPreview && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="mt-2 overflow-hidden"
                                                        >
                                                            <PollPreview form={form} matchLabel={matchLabel} />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    )}

                                    {step === 4 && (
                                        <motion.div
                                            key="step4"
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            className="space-y-4"
                                        >
                                            <div>
                                                <h2 className="font-display text-xl font-bold uppercase tracking-wider text-foreground mb-1">
                                                    Set Lock Time
                                                </h2>
                                                <p className="text-muted-foreground text-sm">When should staking close for this poll?</p>
                                            </div>

                                            <div className="space-y-2">
                                                {LOCK_OPTIONS.map((opt) => {
                                                    const selected = form.lockTime === opt.value;
                                                    return (
                                                        <button
                                                            key={opt.value}
                                                            onClick={() => updateForm({ lockTime: opt.value })}
                                                            className={cn(
                                                                "w-full text-left p-3 rounded-lg border-2 transition-all flex items-center gap-3",
                                                                selected
                                                                    ? "border-primary bg-primary/10 shadow-[0_0_16px_rgba(0,217,255,0.2)]"
                                                                    : "border-border hover:border-primary/50 bg-[#1a1f3a]/60"
                                                            )}
                                                        >
                                                            <div className={cn("w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center", selected ? "border-primary" : "border-border")}>
                                                                {selected && <div className="w-2 h-2 rounded-full bg-primary" />}
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-sm">{opt.label}</span>
                                                                    {opt.badge && (
                                                                        <span className="text-[10px] px-2 py-0.5 bg-primary/20 text-primary font-bold uppercase rounded">
                                                                            {opt.badge}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground">{opt.description}</p>
                                                            </div>
                                                            {selected && <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />}
                                                        </button>
                                                    );
                                                })}
                                            </div>

                                            {/* Custom datetime picker */}
                                            <AnimatePresence>
                                                {form.lockTime === "custom" && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <input
                                                            type="datetime-local"
                                                            value={form.customLockTime}
                                                            onChange={(e) => updateForm({ customLockTime: e.target.value })}
                                                            max={resolvedMatch ? new Date(new Date(resolvedMatch.kickoff).getTime() + 105 * 60000).toISOString().slice(0, 16) : undefined}
                                                            className="w-full bg-[#1a1f3a]/80 text-foreground border-2 border-border rounded-lg p-3 outline-none focus:border-primary transition-all text-sm"
                                                        />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>

                                            {/* Lock time computed display */}
                                            <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                                                <Clock className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                                                <span>{lockDisplay}</span>
                                            </div>

                                            {/* Fee notice */}
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <AlertCircle className="h-3 w-3" />
                                                Creating a poll costs {CREATE_POLL_FEE_XLM} XLM in network fees
                                            </p>

                                            {/* Error */}
                                            {submitError && (
                                                <div className="flex items-center gap-2 p-3 rounded-lg bg-[#ff006e]/10 border border-[#ff006e]/30 text-sm text-[#ff006e]">
                                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                                    <span className="flex-1">{submitError}</span>
                                                    <button
                                                        onClick={() => setSubmitError("")}
                                                        className="text-[#ff006e]/70 hover:text-[#ff006e] text-xs underline"
                                                    >
                                                        Retry
                                                    </button>
                                                </div>
                                            )}

                                            {/* Mobile preview toggle */}
                                            <div className="lg:hidden">
                                                <button
                                                    onClick={() => setShowPreview((v) => !v)}
                                                    className="text-xs text-primary underline underline-offset-2"
                                                >
                                                    {showPreview ? "Hide" : "Show"} preview
                                                </button>
                                                <AnimatePresence>
                                                    {showPreview && (
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: "auto" }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="mt-2 overflow-hidden"
                                                        >
                                                            <PollPreview form={form} matchLabel={matchLabel} />
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Navigation */}
                            <div className="px-6 py-4 border-t border-border/50 flex items-center justify-between flex-shrink-0">
                                <GamingButton
                                    variant="ghost"
                                    size="sm"
                                    onClick={prevStep}
                                    disabled={step === 1}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    Back
                                </GamingButton>

                                {step < 4 ? (
                                    <GamingButton
                                        variant="primary"
                                        size="sm"
                                        onClick={nextStep}
                                        disabled={!canGoNext()}
                                    >
                                        Next
                                        <ChevronRight className="h-4 w-4" />
                                    </GamingButton>
                                ) : (
                                    <GamingButton
                                        variant="gold"
                                        size="sm"
                                        loading={submitting}
                                        disabled={!canGoNext() || submitting}
                                        onClick={handleSubmit}
                                    >
                                        {!isConnected ? (
                                            <>Connect Wallet</>
                                        ) : (
                                            <>
                                                <Sparkles className="h-4 w-4" />
                                                Create Poll
                                            </>
                                        )}
                                    </GamingButton>
                                )}
                            </div>
                        </div>

                        {/* Live preview column — desktop only, steps 3 & 4 */}
                        <AnimatePresence>
                            {showLivePreview && (
                                <motion.div
                                    initial={{ opacity: 0, width: 0 }}
                                    animate={{ opacity: 1, width: "auto" }}
                                    exit={{ opacity: 0, width: 0 }}
                                    className="hidden lg:block border-l border-border/50 overflow-hidden"
                                >
                                    <div className="w-72 p-5 h-full flex flex-col justify-start gap-3">
                                        <p className="text-xs uppercase tracking-widest text-muted-foreground font-bold">Live Preview</p>
                                        <PollPreview form={form} matchLabel={matchLabel} />
                                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                                            This is how your poll will appear to other users on the match page.
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Success overlay */}
                    <AnimatePresence>
                        {success && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 z-10 bg-[#0d1025]/95 flex flex-col items-center justify-center gap-4"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                    className="text-6xl"
                                >
                                    🎉
                                </motion.div>
                                <div className="text-center space-y-1">
                                    <p className="font-display text-2xl font-bold text-primary uppercase tracking-widest text-glow-cyan">
                                        Poll Created!
                                    </p>
                                    <p className="text-muted-foreground text-sm">Your prediction is now live</p>
                                </div>

                                {/* Particle-like dots */}
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-2 h-2 rounded-full bg-primary"
                                        initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                                        animate={{
                                            x: Math.cos((i / 8) * Math.PI * 2) * 80,
                                            y: Math.sin((i / 8) * Math.PI * 2) * 80,
                                            opacity: 0,
                                            scale: 0,
                                        }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>

            {/* Wallet connect modal (auto-triggered when wallet not connected) */}
            <WalletConnectModal
                open={showWalletModal}
                onClose={() => setShowWalletModal(false)}
            />
        </>
    );
}
