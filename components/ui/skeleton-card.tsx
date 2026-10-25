"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Skeleton placeholder for a MatchCard on home / match listings.
 * 3 placeholder cards per row matching issue #19 specification.
 */
export function MatchCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-border/40 bg-surface/50 p-6 space-y-5 overflow-hidden",
        className,
      )}
    >
      {/* Top row: venue and date */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Center: Teams and VS */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-6 w-8 rounded-md" />
        <div className="flex items-center gap-3 flex-row-reverse">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>

      {/* Countdown or status pill */}
      <Skeleton className="h-8 w-full rounded-md" />

      {/* Footer stats and CTA */}
      <div className="flex items-center justify-between pt-2 border-t border-border/20">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Skeleton placeholder for a PollCard.
 * Includes pulsing glow and animated gradient sweep matching issue #19 specification.
 */
export function PollCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative rounded-xl border border-border/40 bg-surface/50 p-6 space-y-4 overflow-hidden",
        className,
      )}
    >
      {/* Header: category badge and countdown */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-20 rounded" />
      </div>

      {/* Question lines */}
      <div className="space-y-2 py-1">
        <Skeleton className="h-6 w-5/6 rounded" />
        <Skeleton className="h-6 w-3/5 rounded" />
      </div>

      {/* Pool bar and labels */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-4 w-full rounded-full" />
      </div>

      {/* Footer: stakers, pool total, button */}
      <div className="flex items-center justify-between pt-2">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>
    </div>
  );
}
