"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";
import { GlowCard } from "@/components/shared/glow-card";
import { GamingButton } from "@/components/shared/gaming-button";
import { reportError } from "@/lib/error-reporter";

interface ErrorFallbackProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Route/component context to attach to the error report */
  context?: string;
}

export function ErrorFallback({ error, reset, context }: ErrorFallbackProps) {
  useEffect(() => {
    reportError(error, {
      route: typeof window !== "undefined" ? window.location.pathname : undefined,
      component: context,
    });
  }, [error, context]);

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4">
      <GlowCard variant="danger" className="max-w-md w-full text-center">
        <div className="relative z-20 p-8 space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            <AlertTriangle className="h-12 w-12 text-accent" />
          </div>

          {/* Title */}
          <h1 className="font-display text-2xl font-black uppercase text-foreground">
            Something went wrong
          </h1>

          <p className="text-sm text-muted-foreground">
            An unexpected error occurred. Our team has been notified.
          </p>

          {error.digest && (
            <p className="text-xs font-mono text-primary/70">
              Error ID: {error.digest}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <GamingButton variant="primary" size="md" onClick={reset}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </GamingButton>

            <Link href="/">
              <GamingButton variant="ghost" size="md">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </GamingButton>
            </Link>
          </div>
        </div>
      </GlowCard>
    </main>
  );
}
