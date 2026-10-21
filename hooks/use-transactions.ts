"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  MOCK_TRANSACTIONS,
  STORAGE_KEYS,
  type Transaction,
} from "@/lib/mock-data";

interface TransactionsState {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, "hash" | "ledger" | "fee">) => void;
}

function generateHash(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 256)
      .toString(16)
      .padStart(2, "0"),
  ).join("");
}

export const useTransactions = create<TransactionsState>()(
  persist(
    (set) => ({
      transactions: MOCK_TRANSACTIONS,

      addTransaction: (tx) =>
        set((s) => ({
          transactions: [
            {
              ...tx,
              hash: generateHash(),
              ledger: 50_000_000 + Math.floor(Math.random() * 1_000_000),
              fee: "100 stroops (0.0000100 XLM)",
            },
            ...s.transactions,
          ],
        })),
    }),
    {
      name: STORAGE_KEYS.transactions,
      partialize: (state) => ({
        ...state,
        transactions: state.transactions.filter(
          (tx) => !MOCK_TRANSACTIONS.some((seed) => seed.hash === tx.hash),
        ),
      }),
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...(persistedState as Partial<TransactionsState> | undefined),
        transactions: [
          ...MOCK_TRANSACTIONS,
          ...((persistedState as Partial<TransactionsState> | undefined)?.transactions ?? []).filter(
            (tx) => !MOCK_TRANSACTIONS.some((seed) => seed.hash === tx.hash),
          ),
        ],
      }),
    },
  ),
);
