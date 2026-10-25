"use client";

import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * Standardised empty-list / empty-page state.
 * Accepts an icon slot, title, description, and an optional CTA.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-16 text-center",
        className,
      )}
    >
      {icon && (
        <div
          className="w-20 h-20 rounded-full bg-primary/5 border border-primary/20 flex items-center justify-center text-primary opacity-60"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <div className="space-y-2">
        <h3 className="font-display font-bold uppercase text-foreground text-xl">
          {title}
        </h3>
        {description && (
          <p className="text-muted-foreground text-sm max-w-sm">{description}</p>
        )}
      </div>

      {action && <div>{action}</div>}
    </div>
  );
}
