"use client";

import { useState, useEffect, useCallback, useMemo, useReducer, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Users,
  Wallet,
  TrendingUp,
  Info,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  Zap,
  Lock,
  Shield,
  ChevronRight,
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

import { cn, categoryLabel } from "@/lib/utils";
import {
  calculatePotentialWinnings,
  calculatePoolPercentages,
  formatCurrency,
  formatAddress,
  formatXLM,
  getLockTargetISO,
  isPollLocked as computePollLocked,
  msUntilLock,
} from "@/lib/calculations";
import {
  PLATFORM_FEE_PERCENTAGE,
  QUICK_STAKE_AMOUNTS,
  MIN_STAKE_AMOUNT,
  MAX_STAKE_MULTIPLIER,
  XLM_USD_RATE,
  MOCK_CONTRACT_ID,
  STELLAR_BASE_FEE,
} from "@/lib/constants";
import type { Poll, Match, Stake } from "@/lib/mock-data";
import { lockTimeLabel } from "@/lib/mock-data";

import { useWallet, type TransactionReceipt } from "@/hooks/use-wallet";
import { useStaking } from "@/hooks/use-staking";
import { useMockData } from "@/hooks/use-mock-data";
import { WalletConnectModal } from "@/components/wallet-connect-modal";
import { SIMULATION_MODE } from "@/lib/stellar";

import {
  GamingButton,
  GamingInput,
  GlowCard,
  AnimatedCounter,
  CountdownTimer,
} from "@/components/shared";

// ── Types ───────────────────────────────────────────────────────────────────

type TxStep = "idle" | "confirm" | "processing" | "success" | "failure";

/**
 * Render a remaining duration compactly: `2d 4h`, `3h 12m`, or `45s`.
 *
 * Deliberately local rather than reusing `CompactCountdown`, which renders an
 * SVG-free chip inside `PollCard` and is not exported. Both read from the same
 * `msUntilLock` helper, so the number shown here and the number the card locks
 * on cannot disagree.
 */
function formatCountdown(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return "0s";
  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

interface StakeModalProps {
  poll: Poll;
  matchName: string;
  matchId: string;
  initialSide?: "yes" | "no";
  open: boolean;
  onClose: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function generateMockLedger() {
  return 50_000_000 + Math.floor(Math.random() * 1_000_000);
}

// ── Sub-components ──────────────────────────────────────────────────────────

/** Wallet confirmation overlay imitating Stellar wallet prompts */
function WalletConfirmPopup({
  from,
  amount,
  onConfirm,
  onReject,
  confirming = false,
}: {
  from: string;
  amount: number;
  onConfirm: () => void | Promise<void>;
  onReject: () => void;
  /**
   * True once the confirmation has been submitted. Drives the button's
   * `loading` state so `GamingButton`'s own guard
   * (`if (disabled || loading) return`) stops the second click.
   */
  confirming?: boolean;
}) {
  const amountXLM = amount / XLM_USD_RATE;

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-sm mx-4"
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.85, y: 30 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <GlowCard variant="default" animated={false}>
          <div className="space-y-5">
            <div className="text-center">
              <Shield className="w-10 h-10 mx-auto text-[var(--accent-cyan)] mb-2" />
              <h3 className="font-display text-xl font-black uppercase tracking-wider text-[var(--accent-cyan)]">
                Confirm Transaction
              </h3>
            </div>

            <div className="space-y-3 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">From</span>
                <span className="text-foreground">{formatAddress(from)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">To</span>
                <span className="text-foreground">
                  {formatAddress(MOCK_CONTRACT_ID)}
                </span>
              </div>
              <div className="h-px bg-[var(--border)]" />
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">Amount</span>
                <span className="text-foreground">
                  {formatXLM(amountXLM)} (≈{formatCurrency(amount)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--muted-foreground)]">
                  Network Fee
                </span>
                <span className="text-foreground">
                  ~{STELLAR_BASE_FEE} stroops (0.00001 XLM)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <GamingButton variant="danger" size="md" onClick={onReject} disabled={confirming}>
                Reject
              </GamingButton>
              <GamingButton
                variant="success"
                size="md"
                onClick={onConfirm}
                loading={confirming}
              >
                {confirming ? "Confirming…" : "Confirm"}
              </GamingButton>
            </div>
          </div>
        </GlowCard>
      </motion.div>
    </motion.div>
  );
}

/** Processing state — rotating hexagon with energy bar */
function ProcessingOverlay() {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm gap-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Rotating hexagon */}
      <motion.div
        className="relative w-20 h-20"
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <div
          className="absolute inset-0"
          style={{
            clipPath:
              "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)",
            background:
              "linear-gradient(135deg, rgba(0,217,255,0.6), rgba(57,255,20,0.3))",
            boxShadow: "0 0 30px rgba(0,217,255,0.4)",
          }}
        />
        {/* Particle trail dots */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-[var(--accent-cyan)]"
            style={{ top: "50%", left: "50%" }}
            animate={{
              x: [0, 30 * Math.cos((i * Math.PI * 2) / 3), 0],
              y: [0, 30 * Math.sin((i * Math.PI * 2) / 3), 0],
              opacity: [1, 0.3, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.3,
            }}
          />
        ))}
      </motion.div>

      {/* Progress bar */}
      <div className="w-56 h-2 rounded-full overflow-hidden bg-black/50 border border-[var(--accent-cyan)]/30">
        <motion.div
          className="h-full rounded-full"
          style={{
            background:
              "linear-gradient(90deg, rgba(0,217,255,0.8), rgba(57,255,20,0.8))",
            boxShadow: "0 0 12px rgba(0,217,255,0.6)",
          }}
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      </div>

      {/* Text */}
      <p className="font-display text-sm uppercase tracking-widest text-[var(--accent-cyan)] text-glow-cyan animate-glitch">
        Processing transaction on Stellar...
      </p>
    </motion.div>
  );
}

/** Success overlay with particle burst */
function SuccessOverlay({
  receipt,
  stakeAmount,
  side,
  onClose,
}: {
  receipt: TransactionReceipt;
  stakeAmount: number;
  side: "yes" | "no";
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyHash = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Clipboard not available in this context");
      return;
    }
    try {
      await navigator.clipboard.writeText(receipt.hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy transaction hash");
    }
  };

  // Auto-close after 5s
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Flash overlay */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0.6 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        style={{
          background:
            side === "yes"
              ? "radial-gradient(circle, rgba(57,255,20,0.3) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(0,217,255,0.3) 0%, transparent 70%)",
        }}
      />

      {/* Particle burst */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const distance = 80 + Math.random() * 120;
        return (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full"
            style={{
              top: "50%",
              left: "50%",
              background:
                i % 2 === 0
                  ? "rgba(0,217,255,0.9)"
                  : "rgba(57,255,20,0.9)",
              boxShadow:
                i % 2 === 0
                  ? "0 0 6px rgba(0,217,255,0.8)"
                  : "0 0 6px rgba(57,255,20,0.8)",
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        );
      })}

      {/* Content card */}
      <motion.div
        className="relative bg-black/90 backdrop-blur-md rounded-lg border border-[var(--accent-green)]/40 p-8 mx-4 max-w-sm w-full text-center"
        initial={{ scale: 0.7, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 22, delay: 0.15 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, delay: 0.3 }}
        >
          <Check className="w-14 h-14 mx-auto text-[var(--accent-green)] mb-3" />
        </motion.div>

        <h3 className="font-display text-2xl font-black uppercase tracking-wider text-[var(--accent-green)] text-glow-green mb-5">
          Stake Placed!
        </h3>

        <div className="space-y-2 text-sm text-left font-mono">
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Tx Hash</span>
            <button
              onClick={copyHash}
              className="flex items-center gap-1.5 text-[var(--accent-cyan)] hover:underline"
            >
              {formatAddress(receipt.hash)}
              {copied ? (
                <Check className="w-3 h-3" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Ledger</span>
            <span className="text-foreground">#{receipt.ledger.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--muted-foreground)]">Fee</span>
            <span className="text-foreground">{receipt.fee}</span>
          </div>
        </div>

        <button
          className="mt-4 inline-flex items-center gap-1 text-xs text-[var(--accent-cyan)] hover:underline"
          onClick={() =>
            window.open(
              `https://stellar.expert/explorer/testnet/tx/${receipt.hash}`,
              "_blank",
            )
          }
        >
          View on StellarExpert <ExternalLink className="w-3 h-3" />
        </button>

        <div className="mt-5">
          <GamingButton variant="primary" size="sm" onClick={onClose} className="w-full">
            Close
          </GamingButton>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Failure overlay */
function FailureOverlay({
  errorMsg,
  onRetry,
  onClose,
}: {
  errorMsg: string;
  onRetry: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="max-w-sm w-full mx-4"
        initial={{ scale: 0.85 }}
        animate={{ scale: 1, x: [0, -8, 8, -4, 4, 0] }}
        transition={{ duration: 0.5 }}
      >
        <GlowCard variant="danger" animated={false}>
          <div className="text-center space-y-4">
            <AlertTriangle className="w-12 h-12 mx-auto text-[#ff006e]" />
            <h3 className="font-display text-xl font-black uppercase text-[#ff006e]">
              Transaction Failed
            </h3>
            <p className="text-sm text-[var(--muted-foreground)]">{errorMsg}</p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <GamingButton variant="ghost" size="md" onClick={onClose}>
                Cancel
              </GamingButton>
              <GamingButton variant="primary" size="md" onClick={onRetry}>
                Try Again
              </GamingButton>
            </div>
          </div>
        </GlowCard>
      </motion.div>
    </motion.div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────────

export function StakeModal({
  poll,
  matchName,
  matchId,
  initialSide = "yes",
  open,
  onClose,
}: StakeModalProps) {
  // ── State ──────────────────────────────────────────────────────────────

  const [side, setSide] = useState<"yes" | "no">(initialSide);
  const [amount, setAmount] = useState("");
  const [txStep, setTxStep] = useState<TxStep>("idle");
  const [receipt, setReceipt] = useState<TransactionReceipt | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [hasStaked, setHasStaked] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  /**
   * In-flight guard for the wallet-confirm step.
   *
   * The confirm popup lives inside `<AnimatePresence mode="wait">`, so it stays
   * mounted for the whole exit transition — long enough for a second click to
   * land while `sendTransaction` is still awaiting its 1-2s latency. Without
   * this, two clicks call `placeStake` twice: two balance debits, two
   * `updatePollPool` additions, two `Stake` rows from one confirmation.
   *
   * A ref rather than state on purpose: the button is also given `loading`,
   * but that state only lands on the next render, whereas two clicks within
   * the same frame would both observe `isSubmitting === false`. The ref is
   * synchronous, so the second call is rejected immediately.
   *
   * `confirming` state exists alongside it purely for rendering. The ref
   * guards, the state paints; they are set in the same two places and are not
   * redundant, because only one of them is readable before the next render.
   */
  const isSubmittingRef = useRef(false);
  const [confirming, setConfirming] = useState(false);

  // ── Hooks ──────────────────────────────────────────────────────────────

  const { isConnected, address, balance } = useWallet();
  const { placeStake, calculateWinnings, checkHasStaked } = useStaking();

  // ── Derived ────────────────────────────────────────────────────────────

  const stakeAmount = Number.parseFloat(amount) || 0;
  const balanceUSD = balance * XLM_USD_RATE;

  const winnings = useMemo(
    () =>
      stakeAmount > 0
        ? calculateWinnings(stakeAmount, side, poll.yesPool, poll.noPool)
        : null,
    [stakeAmount, side, poll.yesPool, poll.noPool, calculateWinnings],
  );

  const poolPct = useMemo(
    () => calculatePoolPercentages(poll.yesPool, poll.noPool),
    [poll.yesPool, poll.noPool],
  );

  // Pool preview (after user's stake is added)
  const previewYes = side === "yes" ? poll.yesPool + stakeAmount : poll.yesPool;
  const previewNo = side === "no" ? poll.noPool + stakeAmount : poll.noPool;
  const previewPct = useMemo(
    () => calculatePoolPercentages(previewYes, previewNo),
    [previewYes, previewNo],
  );

  const isOnMajoritySide =
    (side === "yes" && poolPct.yes >= 50) ||
    (side === "no" && poolPct.no >= 50);

  /**
   * The match this poll belongs to, resolved from `matchId`.
   *
   * The modal receives `matchId` and `matchName` as plain strings rather than
   * the match object, so the kickoff needed for a clock-based lock check has to
   * be looked up. Read imperatively rather than through a hook subscription:
   * the match's kickoff never changes at runtime, and subscribing would
   * re-render the whole modal on every unrelated mock-data write.
   */
  const match = useMockData.getState().getMatch(matchId);

  /**
   * Lock state, shared with `PollCard` via `computePollLocked`.
   *
   * Previously this was `poll.status !== "active"` alone. Because nothing ever
   * transitions `poll.status` when a lock time passes, a poll whose countdown
   * had expired could still be confirmed from an already-open modal — the
   * sticky footer checked `canSubmit`, which consulted this status-only value.
   * Now it also asks the clock.
   */
  const isPollLocked = computePollLocked(poll, match);

  /**
   * Ticks once a second so an open modal locks itself when the deadline passes
   * while the user is filling it in, instead of staying submittable until they
   * happen to re-render for another reason.
   */
  const [, forceTick] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    const id = setInterval(forceTick, 1_000);
    return () => clearInterval(id);
  }, []);

  /** Live countdown target, so the modal can show how long is left. */
  const lockTargetISO = match ? getLockTargetISO(match.kickoff, poll.lockTime) : null;
  const msRemaining = match ? msUntilLock(poll, match) : 0;

  // ── Validation ─────────────────────────────────────────────────────────

  const validationError = useMemo(() => {
    if (stakeAmount <= 0) return null; // no error when empty
    if (stakeAmount < MIN_STAKE_AMOUNT) return `Minimum stake is ${formatCurrency(MIN_STAKE_AMOUNT)}`;
    if (stakeAmount > balanceUSD) return "Insufficient balance";
    return null;
  }, [stakeAmount, balanceUSD]);

  const balanceWarning =
    stakeAmount > 0 && stakeAmount > balanceUSD * 0.5 && !validationError
      ? "This is more than half your balance"
      : null;

  const canSubmit =
    isConnected &&
    stakeAmount >= MIN_STAKE_AMOUNT &&
    stakeAmount <= balanceUSD &&
    !isPollLocked &&
    !hasStaked &&
    txStep === "idle";

  // ── Reset on open/close ────────────────────────────────────────────────

  useEffect(() => {
    if (open) {
      setSide(initialSide);
      setAmount("");
      setTxStep("idle");
      setReceipt(null);
      setErrorMsg("");
      setHasStaked(false);
    }
  }, [open, initialSide]);

  // ── Check double-stake when modal opens ───────────────────────────────

  useEffect(() => {
    if (!open || !isConnected) return;
    checkHasStaked(poll.id).then(setHasStaked).catch(() => setHasStaked(false));
  }, [open, isConnected, poll.id, checkHasStaked]);

  // ── Keyboard handlers ──────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (txStep === "confirm") {
          setTxStep("idle");
        } else if (txStep === "idle") {
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, txStep, onClose]);

  // ── Transaction flow ───────────────────────────────────────────────────

  const handleConfirmClick = useCallback(() => {
    if (!canSubmit) return;
    setTxStep("confirm");
  }, [canSubmit]);

  const handleWalletConfirm = useCallback(async () => {
    // Synchronous re-entrancy check. A state-based `disabled` prop cannot close
    // this window on its own, because React has not re-rendered between two
    // clicks in the same tick.
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setConfirming(true);

    setTxStep("processing");

    try {
      const result = await placeStake(
        poll.id,
        matchId,
        matchName,
        poll.question,
        side,
        stakeAmount,
      );

      setReceipt(result.receipt);
      setTxStep("success");

      toast.success(`Successfully staked ${formatCurrency(stakeAmount)} on "${poll.question}"`, {
        description: `Side: ${side.toUpperCase()} • Tx: ${formatAddress(result.receipt.hash)}`,
      });
    } catch (err: any) {
      setErrorMsg(err?.message ?? "Unknown error");
      setTxStep("failure");
      toast.error("Transaction failed", { description: err?.message });
    } finally {
      // Released on both paths: a failure puts the modal in the `failure` step
      // where Retry is offered, and that retry must not be swallowed by a
      // latch left set from the first attempt.
      isSubmittingRef.current = false;
      setConfirming(false);
    }
  }, [placeStake, poll, matchId, matchName, side, stakeAmount]);

  const handleWalletReject = useCallback(() => {
    setTxStep("idle");
    toast.info("Transaction cancelled");
  }, []);

  const handleRetry = useCallback(() => {
    setTxStep("confirm");
  }, []);

  const handleTxClose = useCallback(() => {
    setTxStep("idle");
    onClose();
  }, [onClose]);

  // ── Pie chart data ─────────────────────────────────────────────────────

  const pieData = useMemo(() => {
    if (stakeAmount <= 0) {
      return [
        { name: "Yes", value: poll.yesPool, fill: "#00d9ff" },
        { name: "No", value: poll.noPool, fill: "#ff006e" },
      ];
    }

    // Show user's contribution as lighter shard
    if (side === "yes") {
      return [
        { name: "Yes (existing)", value: poll.yesPool, fill: "#00d9ff" },
        { name: "Your stake", value: stakeAmount, fill: "#66e8ff" },
        { name: "No", value: poll.noPool, fill: "#ff006e" },
      ];
    }
    return [
      { name: "Yes", value: poll.yesPool, fill: "#00d9ff" },
      { name: "No (existing)", value: poll.noPool, fill: "#ff006e" },
      { name: "Your stake", value: stakeAmount, fill: "#ff5ea0" },
    ];
  }, [poll.yesPool, poll.noPool, stakeAmount, side]);

  // ── Render ─────────────────────────────────────────────────────────────

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 17.3v34.6L30 60 0 51.9V17.3z' fill='none' stroke='rgba(0,217,255,0.04)' stroke-width='1'/%3E%3C/svg%3E\")",
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => txStep === "idle" && onClose()}
          />

          {/* Slide-in panel */}
          <motion.div
            ref={panelRef}
            className={cn(
              "fixed z-50 top-0 right-0 h-full",
              "w-full md:w-[520px] lg:w-[560px]",
              "bg-[#0e1230]/95 backdrop-blur-lg",
              "border-l border-[var(--accent-cyan)]/20",
              "overflow-y-auto overscroll-contain",
              "flex flex-col",
            )}
            initial={{ x: "100%", filter: "blur(8px)" }}
            animate={{ x: 0, filter: "blur(0px)" }}
            exit={{ x: "100%", filter: "blur(8px)" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            {/* Animated border draw */}
            <motion.div
              className="absolute inset-0 pointer-events-none z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <svg className="absolute inset-0 w-full h-full">
                <motion.rect
                  x="0.5"
                  y="0.5"
                  width="calc(100% - 1px)"
                  height="calc(100% - 1px)"
                  fill="none"
                  stroke="rgba(0,217,255,0.25)"
                  strokeWidth="1"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.2, ease: "easeInOut" }}
                />
              </svg>
            </motion.div>

            {/* Corner decorations */}
            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[var(--accent-cyan)]/40 pointer-events-none z-30" />
            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[var(--accent-cyan)]/40 pointer-events-none z-30" />
            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[var(--accent-cyan)]/40 pointer-events-none z-30" />
            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[var(--accent-cyan)]/40 pointer-events-none z-30" />

            {/* Scanning line accent */}
            <motion.div
              className="absolute left-0 w-full h-px bg-gradient-to-r from-transparent via-[var(--accent-cyan)]/30 to-transparent pointer-events-none z-30"
              animate={{ top: ["0%", "100%"] }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
            />

            {/* ─── Content ─── */}
            <div className="relative z-20 flex flex-col h-full">
              {/* Close button */}
              <button
                onClick={() => txStep === "idle" && onClose()}
                className="absolute top-4 right-4 z-40 p-2 rounded hover:bg-white/5 transition-colors text-[var(--muted-foreground)] hover:text-foreground"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="p-6 md:p-8 space-y-6 flex-1">
                {/* ─── Section 1: Poll Header ─── */}
                <div className="space-y-3 pr-8">
                  {/* Simulation mode indicator */}
                  {SIMULATION_MODE && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                      <Shield className="w-3 h-3" />
                      Simulation Mode — no real funds
                    </div>
                  )}

                  <span className="inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-widest bg-[var(--accent-cyan)]/15 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/20">
                    {categoryLabel(poll.category)}
                  </span>

                  <h2 className="font-display text-2xl md:text-3xl font-black text-foreground leading-tight">
                    {poll.question}
                  </h2>

                  <p className="text-sm text-[var(--muted-foreground)]">
                    {matchName}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-[var(--muted-foreground)]">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {poll.participants} stakers
                    </span>
                    {isPollLocked ? (
                      <span className="flex items-center gap-1.5 text-[var(--muted-foreground)]">
                        <Lock className="w-3.5 h-3.5" />
                        Locked at {poll.lockTime}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[var(--accent-cyan)]">
                        <Zap className="w-3.5 h-3.5" />
                        Locks at {lockTimeLabel(poll.lockTime)}
                        {lockTargetISO && (
                          <span className="font-mono text-[var(--muted-foreground)]">
                            ({formatCountdown(msRemaining)} left)
                          </span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* ─── Section 2: Side Selection ─── */}
                <div className="space-y-3">
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                    Choose Your Side
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    {(["yes", "no"] as const).map((s) => {
                      const isSelected = side === s;
                      const pool =
                        s === "yes" ? poll.yesPool : poll.noPool;
                      const pct =
                        s === "yes" ? poolPct.yes : poolPct.no;
                      const color =
                        s === "yes"
                          ? {
                            bg: "rgba(0,217,255,0.15)",
                            border: "rgba(0,217,255,0.6)",
                            glow: "rgba(0,217,255,0.5)",
                            text: "#00d9ff",
                          }
                          : {
                            bg: "rgba(255,0,110,0.15)",
                            border: "rgba(255,0,110,0.6)",
                            glow: "rgba(255,0,110,0.5)",
                            text: "#ff006e",
                          };

                      return (
                        <motion.button
                          key={s}
                          type="button"
                          onClick={() => setSide(s)}
                          className={cn(
                            "relative flex flex-col items-center justify-center gap-1 py-5 rounded-sm font-display font-black uppercase tracking-wider transition-all overflow-hidden",
                            isSelected
                              ? "z-10"
                              : "opacity-60 hover:opacity-80",
                          )}
                          style={{
                            clipPath:
                              "polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)",
                            background: isSelected ? color.bg : "transparent",
                            border: `2px solid ${isSelected ? color.border : color.border + "40"}`,
                            boxShadow: isSelected
                              ? `0 0 25px ${color.glow}, inset 0 0 15px ${color.glow}30`
                              : "none",
                            color: color.text,
                          }}
                          whileTap={{ scale: 0.96 }}
                          animate={
                            isSelected
                              ? { scale: 1.03 }
                              : { scale: 1 }
                          }
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 25,
                          }}
                        >
                          {/* Electric arc flash on selection */}
                          <AnimatePresence>
                            {isSelected && (
                              <motion.div
                                className="absolute inset-0 pointer-events-none"
                                initial={{ opacity: 0.7 }}
                                animate={{ opacity: 0 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.4 }}
                                style={{
                                  background: `radial-gradient(circle at center, ${color.glow}40 0%, transparent 70%)`,
                                }}
                              />
                            )}
                          </AnimatePresence>

                          <span className="text-2xl">{s.toUpperCase()}</span>
                          <span className="text-xs font-mono font-normal opacity-70">
                            {formatCurrency(pool)} ({pct}%)
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  <p className="text-center text-xs text-[var(--muted-foreground)]">
                    <span className="text-[#00d9ff]">{poolPct.yes}% YES</span>
                    {" • "}
                    <span className="text-[#ff006e]">{poolPct.no}% NO</span>
                  </p>
                </div>

                {/* ─── Section 3: Stake Amount ─── */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                      Stake Amount
                    </label>
                    <span className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] font-mono">
                      <Wallet className="w-3.5 h-3.5" />
                      {formatXLM(balance)} (≈{formatCurrency(balanceUSD)})
                    </span>
                  </div>

                  <GamingInput
                    type="text"
                    prefix="$"
                    value={amount}
                    onChange={(v) => {
                      // Allow only valid numeric input
                      const str = String(v);
                      if (str === "" || /^\d*\.?\d{0,2}$/.test(str)) {
                        setAmount(str);
                      }
                    }}
                    placeholder="0.00"
                    error={validationError ?? undefined}
                    disabled={isPollLocked}
                  />

                  {/* Quick amount buttons */}
                  <div className="flex gap-2">
                    {QUICK_STAKE_AMOUNTS.map((v) => (
                      <GamingButton
                        key={v}
                        variant="ghost"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => setAmount(v.toString())}
                      >
                        ${v}
                      </GamingButton>
                    ))}
                    <GamingButton
                      variant="ghost"
                      size="sm"
                      className="flex-1 text-xs"
                      onClick={() =>
                        setAmount(
                          Math.floor(balanceUSD * 100) / 100 + ""
                        )
                      }
                    >
                      Max
                    </GamingButton>
                  </div>

                  {/* Balance warning */}
                  <AnimatePresence>
                    {balanceWarning && (
                      <motion.div
                        className="flex items-center gap-2 text-xs text-[#ffd700] px-3 py-2 rounded bg-[#ffd700]/10 border border-[#ffd700]/20"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        {balanceWarning}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ─── Section 4: Winnings Calculator ─── */}
                <AnimatePresence>
                  {winnings && stakeAmount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                    >
                      <GlowCard
                        variant={isOnMajoritySide ? "success" : "gold"}
                        animated
                      >
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-[#ffd700]" />
                              <span className="text-xs font-bold uppercase tracking-widest text-[#ffd700]">
                                Potential Outcome
                              </span>
                            </div>

                            {/* Risk indicator */}
                            <span
                              className={cn(
                                "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                                isOnMajoritySide
                                  ? "bg-[var(--accent-green)]/15 text-[var(--accent-green)] border border-[var(--accent-green)]/25"
                                  : "bg-[#ffd700]/15 text-[#ffd700] border border-[#ffd700]/25",
                              )}
                            >
                              {isOnMajoritySide
                                ? "Lower Risk"
                                : "Higher Reward"}
                            </span>
                          </div>

                          <div className="space-y-2 text-sm font-mono">
                            <div className="flex justify-between">
                              <span className="text-[var(--muted-foreground)]">
                                Your Stake
                              </span>
                              <span className="text-foreground font-bold">
                                {formatCurrency(stakeAmount)}
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-[var(--muted-foreground)]">
                                Current Pool Ratio
                              </span>
                              <span className="text-[var(--muted-foreground)]">
                                {poolPct.yes}% Yes / {poolPct.no}% No
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-[var(--accent-green)] font-bold text-base">
                                Estimated Winnings
                              </span>
                              <span className="text-[var(--accent-green)] font-bold text-lg" style={{ textShadow: "0 0 8px rgba(57,255,20,0.4)" }}>
                                <AnimatedCounter
                                  value={winnings.grossWinnings}
                                  prefix="$"
                                  format="currency"
                                />
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-[var(--muted-foreground)]">
                                Estimated ROI
                              </span>
                              <span
                                className={cn(
                                  "font-bold px-2 py-0.5 rounded text-xs",
                                  winnings.roi > 0
                                    ? "bg-[var(--accent-green)]/15 text-[var(--accent-green)]"
                                    : "bg-[#ff006e]/15 text-[#ff006e]",
                                )}
                              >
                                {winnings.roi > 0 ? "+" : ""}
                                {winnings.roi.toFixed(1)}%
                              </span>
                            </div>

                            <div className="flex justify-between">
                              <span className="text-[var(--muted-foreground)] text-xs">
                                Platform Fee (
                                {(PLATFORM_FEE_PERCENTAGE * 100).toFixed(0)}%)
                              </span>
                              <span className="text-[var(--muted-foreground)] text-xs">
                                -{formatCurrency(winnings.platformFee)}
                              </span>
                            </div>

                            <div className="h-px bg-[var(--border)] my-1" />

                            <div className="flex justify-between">
                              <span className="text-[#ffd700] font-bold">
                                Net Profit
                              </span>
                              <span
                                className="text-[#ffd700] font-bold"
                                style={{
                                  textShadow:
                                    "0 0 8px rgba(255,215,0,0.4)",
                                }}
                              >
                                <AnimatedCounter
                                  value={winnings.profit}
                                  prefix={winnings.profit >= 0 ? "+$" : "-$"}
                                  format="currency"
                                />
                              </span>
                            </div>
                          </div>

                          {/* Info tooltip */}
                          <div className="flex items-start gap-2 text-[10px] text-[var(--muted-foreground)] leading-relaxed mt-2">
                            <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                            Winners split the losing pool proportionally.
                            Platform takes a {(PLATFORM_FEE_PERCENTAGE * 100).toFixed(0)}%
                            fee from winnings only.
                          </div>
                        </div>
                      </GlowCard>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ─── Section 5: Pool Distribution Pie ─── */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted-foreground)]">
                    Pool Distribution{stakeAmount > 0 ? " (Preview)" : ""}
                  </label>

                  <div className="flex items-center gap-4">
                    <div className="w-32 h-32 flex-shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            dataKey="value"
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={55}
                            paddingAngle={2}
                            animationDuration={500}
                            animationBegin={0}
                          >
                            {pieData.map((entry, idx) => (
                              <Cell
                                key={idx}
                                fill={entry.fill}
                                stroke="transparent"
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            content={({ payload }) => {
                              if (!payload?.length) return null;
                              const d = payload[0];
                              return (
                                <div className="bg-[#0e1230] border border-[var(--border)] rounded px-3 py-2 text-xs font-mono">
                                  <span className="text-foreground">
                                    {d.name}: {formatCurrency(Number(d.value))}
                                  </span>
                                </div>
                              );
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="flex-1 space-y-2 text-xs font-mono">
                      {/* Legend rows show the base pool values so that
                          Yes + No + Your Stake = Total (no double-count). */}
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#00d9ff]" />
                        <span className="text-[var(--muted-foreground)]">
                          Yes Pool
                        </span>
                        <span className="ml-auto text-foreground">
                          {formatCurrency(poll.yesPool)} ({previewPct.yes}%)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-sm bg-[#ff006e]" />
                        <span className="text-[var(--muted-foreground)]">
                          No Pool
                        </span>
                        <span className="ml-auto text-foreground">
                          {formatCurrency(poll.noPool)} ({previewPct.no}%)
                        </span>
                      </div>
                      {stakeAmount > 0 && (
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-sm"
                            style={{
                              background:
                                side === "yes" ? "#66e8ff" : "#ff5ea0",
                            }}
                          />
                          <span className="text-[var(--muted-foreground)]">
                            Your Stake
                          </span>
                          <span className="ml-auto text-foreground">
                            {formatCurrency(stakeAmount)}
                          </span>
                        </div>
                      )}
                      <div className="h-px bg-[var(--border)]" />
                      <div className="flex justify-between font-bold">
                        <span className="text-[var(--muted-foreground)]">
                          Total
                        </span>
                        <span className="text-foreground">
                          {formatCurrency(previewYes + previewNo)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ─── Section 6: Fee Notice ─── */}
                <div className="flex items-start gap-2 text-xs text-[var(--muted-foreground)] px-3 py-2 rounded bg-white/[0.02] border border-[var(--border)]">
                  <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>
                    {(PLATFORM_FEE_PERCENTAGE * 100).toFixed(0)}% platform fee is
                    applied to winnings only. You only pay fees when you win. If
                    you lose, you pay nothing extra.
                  </span>
                </div>
              </div>

              {/* ─── Section 7: Sticky Confirm ─── */}
              <div className="sticky bottom-0 p-6 md:p-8 pt-4 bg-gradient-to-t from-[#0e1230] via-[#0e1230]/95 to-transparent">
                {hasStaked ? (
                  <div className="flex items-center gap-2 px-4 py-3 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    You have already staked on this poll. Only one stake per wallet is allowed.
                  </div>
                ) : isPollLocked ? (
                  <GamingButton
                    variant="ghost"
                    size="lg"
                    disabled
                    className="w-full"
                  >
                    Poll Locked
                  </GamingButton>
                ) : !isConnected ? (
                  <>
                    <GamingButton
                      variant="primary"
                      size="lg"
                      className="w-full"
                      onClick={() => {
                        toast.info("Please connect your wallet");
                        setShowWalletModal(true);
                      }}
                    >
                      <Wallet className="w-5 h-5 mr-2" /> Connect Wallet
                    </GamingButton>
                    <WalletConnectModal
                      open={showWalletModal}
                      onClose={() => setShowWalletModal(false)}
                    />
                  </>
                ) : (
                  <GamingButton
                    variant="primary"
                    size="lg"
                    disabled={!canSubmit}
                    className="w-full"
                    onClick={handleConfirmClick}
                  >
                    <span className="flex items-center gap-2">
                      Confirm Stake
                      {stakeAmount > 0 && (
                        <>
                          <span className="opacity-50">—</span>
                          {formatCurrency(stakeAmount)}
                        </>
                      )}
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </GamingButton>
                )}
              </div>
            </div>

            {/* ─── Transaction Overlays ─── */}
            <AnimatePresence mode="wait">
              {txStep === "confirm" && (
                <WalletConfirmPopup
                  key="confirm"
                  from={address}
                  amount={stakeAmount}
                  onConfirm={handleWalletConfirm}
                  onReject={handleWalletReject}
                  confirming={confirming}
                />
              )}
              {txStep === "processing" && (
                <ProcessingOverlay key="processing" />
              )}
              {txStep === "success" && receipt && (
                <SuccessOverlay
                  key="success"
                  receipt={receipt}
                  stakeAmount={stakeAmount}
                  side={side}
                  onClose={handleTxClose}
                />
              )}
              {txStep === "failure" && (
                <FailureOverlay
                  key="failure"
                  errorMsg={errorMsg}
                  onRetry={handleRetry}
                  onClose={handleTxClose}
                />
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
