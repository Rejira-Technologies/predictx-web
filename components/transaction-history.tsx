"use client";

import { ExternalLink, ArrowUpRight, ArrowDownLeft, Vote, Plus, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { EmptyState } from "./shared/empty-state";
import { useTransactions } from "@/hooks/use-transactions";
import type { Transaction } from "@/lib/mock-data";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function shortenHash(hash: string): string {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

const TYPE_META: Record<
  Transaction["type"],
  { label: string; icon: React.ElementType; color: string; amountPrefix: string }
> = {
  stake: {
    label: "Stake",
    icon: ArrowUpRight,
    color: "text-accent",
    amountPrefix: "−",
  },
  claim: {
    label: "Claim",
    icon: ArrowDownLeft,
    color: "text-success",
    amountPrefix: "+",
  },
  vote_reward: {
    label: "Vote Reward",
    icon: Vote,
    color: "text-primary",
    amountPrefix: "+",
  },
  poll_creation: {
    label: "Poll Created",
    icon: Plus,
    color: "text-gold",
    amountPrefix: "−",
  },
};

// ── Row ───────────────────────────────────────────────────────────────────────

function TransactionRow({ tx, index }: { tx: Transaction; index: number }) {
  const meta = TYPE_META[tx.type];
  const Icon = meta.icon;
  const isPositive = meta.amountPrefix === "+";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-surface border border-border clip-corner p-4 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: icon + description */}
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`mt-0.5 flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-background border border-border`}
          >
            <Icon className={`h-4 w-4 ${meta.color}`} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-xs font-bold uppercase tracking-wider ${meta.color}`}>
                {meta.label}
              </span>
              <span
                className={`text-xs px-1.5 py-0.5 rounded font-semibold ${
                  tx.status === "confirmed"
                    ? "bg-success/10 text-success"
                    : "bg-accent/10 text-accent"
                }`}
              >
                {tx.status === "confirmed" ? "Confirmed" : "Failed"}
              </span>
            </div>

            <p className="text-sm text-foreground font-medium mt-0.5 truncate">
              {tx.description}
            </p>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-muted-foreground">
              <span>{formatDate(tx.timestamp)}</span>
              <span className="font-mono">
                Hash:{" "}
                <a
                  href={`https://stellar.expert/explorer/testnet/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-0.5"
                  aria-label={`View transaction ${tx.hash} on Stellar Expert`}
                >
                  {shortenHash(tx.hash)}
                  <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </span>
              <span>Ledger #{tx.ledger.toLocaleString()}</span>
              <span>{tx.fee}</span>
            </div>
          </div>
        </div>

        {/* Right: amount */}
        <div className="text-right flex-shrink-0">
          <div
            className={`font-display text-lg font-black ${
              isPositive ? "text-success" : "text-foreground"
            }`}
          >
            {meta.amountPrefix}${tx.amount.toFixed(2)}
          </div>
          <div className="text-xs text-muted-foreground font-mono mt-0.5">
            {isPositive ? "+" : "−"}
            {tx.amountXLM.toFixed(4)} XLM
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── Summary bar ───────────────────────────────────────────────────────────────

function TransactionSummary({ transactions }: { transactions: Transaction[] }) {
  const confirmed = transactions.filter((t) => t.status === "confirmed");
  const totalIn = confirmed
    .filter((t) => t.type === "claim" || t.type === "vote_reward")
    .reduce((s, t) => s + t.amount, 0);
  const totalOut = confirmed
    .filter((t) => t.type === "stake" || t.type === "poll_creation")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <div className="bg-surface border border-border clip-corner p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Total In
        </div>
        <div className="font-display text-2xl font-black text-success">
          +${totalIn.toFixed(2)}
        </div>
      </div>
      <div className="bg-surface border border-border clip-corner p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Total Out
        </div>
        <div className="font-display text-2xl font-black text-foreground">
          −${totalOut.toFixed(2)}
        </div>
      </div>
      <div className="bg-surface border border-border clip-corner p-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Transactions
        </div>
        <div className="font-display text-2xl font-black text-primary">
          {transactions.length}
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function TransactionHistory() {
  const transactions = useTransactions((s) => s.transactions);

  if (transactions.length === 0) {
    return (
      <EmptyState
        icon={<AlertCircle className="w-10 h-10" />}
        title="No Transactions Yet"
        description="Your stakes, claims, and vote rewards will appear here once you start participating."
      />
    );
  }

  return (
    <div className="space-y-6">
      <TransactionSummary transactions={transactions} />

      <div className="space-y-3">
        {transactions.map((tx, i) => (
          <TransactionRow key={tx.hash} tx={tx} index={i} />
        ))}
      </div>
    </div>
  );
}
