"use client";

import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
}

/**
 * Accessible loading spinner with optional label.
 * Uses the project's primary cyan colour by default.
 */
export function LoadingSpinner({
  size = "md",
  className,
  label,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-4",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div
      className={cn("flex flex-col items-center justify-center gap-3", className)}
    >
      <div
        className={cn(
          "rounded-full border-primary/30 border-t-primary animate-spin",
          sizeClasses[size],
        )}
        role="status"
        aria-label={label ?? "Loading..."}
      />
      {label && (
        <p className="text-sm text-muted-foreground font-mono uppercase tracking-widest animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
}
