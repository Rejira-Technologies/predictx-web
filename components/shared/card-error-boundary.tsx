"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { reportError } from "@/lib/error-reporter";

interface CardErrorBoundaryProps {
  children: React.ReactNode;
  /** Displayed in the fallback and attached to the error report */
  componentName?: string;
  /** Custom fallback element; omit to use the default compact fallback */
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Granular error boundary for card / list-item components.
 * A thrown error inside one card won't kill the surrounding grid.
 */
export class CardErrorBoundary extends React.Component<
  CardErrorBoundaryProps,
  State
> {
  constructor(props: CardErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    reportError(error, {
      component: this.props.componentName ?? "CardErrorBoundary",
      extra: { componentStack: info.componentStack ?? undefined },
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    // Default compact fallback — fits inside a card grid cell
    return (
      <div
        className="flex flex-col items-center justify-center gap-2 p-4 rounded"
        style={{
          minHeight: 120,
          background: "rgba(255, 0, 110, 0.05)",
          border: "1px solid rgba(255, 0, 110, 0.2)",
          clipPath:
            "polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)",
        }}
      >
        <AlertTriangle className="h-6 w-6 text-accent opacity-70" />
        <p className="text-xs text-muted-foreground text-center">
          {this.props.componentName
            ? `${this.props.componentName} failed to render`
            : "This item failed to render"}
        </p>
        <button
          onClick={this.handleReset}
          className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          <RefreshCw className="h-3 w-3" />
          Retry
        </button>
      </div>
    );
  }
}
