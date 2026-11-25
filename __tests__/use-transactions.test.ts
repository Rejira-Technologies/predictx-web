/**
 * __tests__/use-transactions.test.ts
 *
 * Transaction history must never present invented hashes or ledgers as real
 * Stellar identifiers.
 *
 * Closes #513
 */

import { describe, it, expect, beforeEach } from "vitest";
import { buildTransaction, useTransactions } from "@/hooks/use-transactions";
import { MOCK_TRANSACTIONS } from "@/lib/mock-data";

const base = {
  type: "claim" as const,
  amount: 10,
  amountXLM: 100,
  description: "Claimed winnings",
  timestamp: "2026-01-01T00:00:00.000Z",
  status: "confirmed" as const,
};

describe("buildTransaction", () => {
  it("marks entries without a receipt hash as simulated with no ledger", () => {
    const tx = buildTransaction(base);
    expect(tx.simulated).toBe(true);
    expect(tx.ledger).toBeNull();
    expect(tx.hash).toMatch(/^sim-/);
    expect(tx.hash).not.toMatch(/^[0-9a-f]{64}$/);
  });

  it("gives every simulated entry a unique id", () => {
    const ids = new Set(
      Array.from({ length: 50 }, () => buildTransaction(base).hash),
    );
    expect(ids.size).toBe(50);
  });

  it("keeps the hash and ledger from a real receipt", () => {
    const hash = "ab".repeat(32);
    const tx = buildTransaction({ ...base, hash, ledger: 123 });
    expect(tx.hash).toBe(hash);
    expect(tx.ledger).toBe(123);
    expect(tx.simulated).toBeUndefined();
  });
});

describe("useTransactions.addTransaction", () => {
  beforeEach(() => {
    useTransactions.setState({ transactions: [] });
  });

  it("prepends a simulated entry when no receipt is supplied", () => {
    useTransactions.getState().addTransaction(base);
    const [tx] = useTransactions.getState().transactions;
    expect(tx.simulated).toBe(true);
    expect(tx.ledger).toBeNull();
  });
});

describe("MOCK_TRANSACTIONS", () => {
  it("flags all seed entries as demo data", () => {
    expect(MOCK_TRANSACTIONS.length).toBeGreaterThan(0);
    expect(MOCK_TRANSACTIONS.every((tx) => tx.simulated === true)).toBe(true);
  });
});
