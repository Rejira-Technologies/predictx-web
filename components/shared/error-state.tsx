"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Standardised full-bleed error state for pages and sections.
 * Shows an icon, a title, a message, and an optional retry button.
 */
export function ErrorState({
  title = "Something went wrong",
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 p-8 text-center",
        className,
      )}
      role="alert"
      aria-live="assertive"
    >
      <div className="w-16 h-16 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-destructive" aria-hidden="true" />
      </div>

      <div className="space-y-1">
        <h3 className="font-display font-bold uppercase text-foreground text-lg">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm max-w-sm">{message}</p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2 border border-primary/50 rounded text-primary text-sm font-bold uppercase tracking-wider hover:bg-primary/10 transition-colors min-h-[44px]"
        >
          Try Again
        </button>
      )}
    </div>
  );
}
