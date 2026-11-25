"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  MOCK_TRANSACTIONS,
  STORAGE_KEYS,
  type Transaction,
} from "@/lib/mock-data";

/**
 * Maximum number of transactions kept in persisted storage.
 *
 * New transactions are prepended; once the array exceeds this limit the oldest
 * entries (at the end) are evicted.  The cap prevents unbounded localStorage
 * growth while retaining a meaningful recent history.
 */
const MAX_TRANSACTIONS = 200;

/**
 * Input for {@link TransactionsState.addTransaction}.
 *
 * `hash` and `ledger` must come from a real transaction receipt (Soroban RPC /
 * Horizon). When they are omitted the entry is recorded as simulated: it gets
 * a local id that cannot be mistaken for a Stellar hash, no ledger number, and
 * the `simulated` flag so the UI labels it as demo data instead of linking to
 * an explorer.
 */
export type NewTransaction = Omit<
  Transaction,
  "hash" | "ledger" | "fee" | "simulated"
> & {
  hash?: string;
  ledger?: number;
  fee?: string;
};

interface TransactionsState {
  transactions: Transaction[];
  addTransaction: (tx: NewTransaction) => void;
}

const DEFAULT_FEE = "100 stroops (0.0000100 XLM)";

let simulatedCounter = 0;

/** Local, clearly non-hash identifier for a simulated entry. */
function simulatedId(): string {
  simulatedCounter += 1;
  return `sim-${Date.now().toString(36)}-${simulatedCounter.toString(36)}`;
}

export function buildTransaction(tx: NewTransaction): Transaction {
  const { hash, ledger, fee, ...rest } = tx;
  if (hash) {
    return {
      ...rest,
      hash,
      ledger: ledger ?? null,
      fee: fee ?? DEFAULT_FEE,
    };
  }
  return {
    ...rest,
    hash: simulatedId(),
    ledger: null,
    fee: fee ?? DEFAULT_FEE,
    simulated: true,
  };
}

export const useTransactions = create<TransactionsState>()(
  persist(
    (set) => ({
      transactions: MOCK_TRANSACTIONS,

      addTransaction: (tx) =>
        set((s) => ({
          transactions: [
            buildTransaction(tx),
            ...s.transactions,
          ].slice(0, MAX_TRANSACTIONS),
        })),
    }),
    {
      name: STORAGE_KEYS.transactions,
      /**
       * Only persist the transactions array — no derived or transient state
       * needs to be serialised.
       */
      partialize: (state) => ({ transactions: state.transactions }),
      /**
       * Wrap every setItem call so a QuotaExceededError degrades to
       * memory-only instead of propagating through the action and leaving the
       * in-memory state inconsistent with storage.
       */
      storage: {
        getItem: (name) => {
          const value = localStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (err) {
            if (
              err instanceof DOMException &&
              (err.name === "QuotaExceededError" ||
                err.name === "NS_ERROR_DOM_QUOTA_REACHED")
            ) {
              // Storage is full — in-memory state is still correct, so swallow.
              if (process.env.NODE_ENV !== "production") {
                console.warn(
                  "[use-transactions] localStorage quota exceeded — transaction persisted in memory only.",
                );
              }
            } else {
              throw err;
            }
          }
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    },
  ),
);
