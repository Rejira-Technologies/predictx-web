"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useMockData } from "@/hooks/use-mock-data";
import { useStaking } from "@/hooks/use-staking";
import { useTransactions } from "@/hooks/use-transactions";
import { useVoting } from "@/hooks/use-voting";
import { useWallet } from "@/hooks/use-wallet";

const persistedStores = [
  useWallet,
  useStaking,
  useVoting,
  useTransactions,
  useMockData,
];

export function StoreHydrationProvider({ children }: { children: ReactNode }) {
  const [hasHydrated, setHasHydrated] = useState(() =>
    persistedStores.every((store) => store.persist.hasHydrated()),
  );

  useEffect(() => {
    let active = true;
    const unsubscribe = persistedStores.map((store) =>
      store.persist.onFinishHydration(() => {
        if (
          active &&
          persistedStores.every((persistedStore) =>
            persistedStore.persist.hasHydrated(),
          )
        ) {
          setHasHydrated(true);
        }
      }),
    );

    persistedStores.forEach((store) => {
      void store.persist.rehydrate();
    });

    return () => {
      active = false;
      unsubscribe.forEach((unsub) => unsub());
    };
  }, []);

  return hasHydrated ? children : null;
}