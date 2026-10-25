"use client";

import { ErrorFallback } from "@/components/shared/error-fallback";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function MatchError({ error, reset }: ErrorProps) {
  return <ErrorFallback error={error} reset={reset} context="MatchPage" />;
}
