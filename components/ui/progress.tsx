"use client"

import type * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

function Progress({ className, value, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root>) {
  const max = props.max && props.max > 0 ? props.max : 100
  const numericValue = typeof value === "number" ? value : 0
  const percentage = Math.min(Math.max((numericValue / max) * 100, 0), 100)

  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      value={value}
      max={max}
      aria-label={props["aria-label"] ?? "Progress"}
      className={cn("bg-background-secondary relative h-2 w-full overflow-hidden rounded-full", className)}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className="h-full w-full flex-1 transition-all bg-gradient-to-r from-success to-success/80 glow-green"
        style={{ transform: `translateX(-${100 - percentage}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}

export { Progress }
