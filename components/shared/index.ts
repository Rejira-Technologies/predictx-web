/**
 * Shared Gaming UI Components
 * 
 * Cyberpunk 2077 × Apex Legends × Crypto Trading Platform aesthetic
 * All components support prefers-reduced-motion and accept className for extension
 */

// Foundational component - used by other components
export { GlowCard } from "./glow-card";

// Data display components
export { AnimatedCounter } from "./animated-counter";
export { CountdownTimer } from "./countdown-timer";
export { PoolProgressBar } from "./pool-progress-bar";

// Interactive components
export { GamingButton } from "./gaming-button";
export { GamingInput } from "./gaming-input";
export { GamingTabs } from "./gaming-tabs";

// Badge components
export { BadgeComponent } from "./badge-component";
export { TeamBadge } from "./team-badge";

// Ambient components
export { BackgroundEffects } from "./background-effects";
export { AchievementToast } from "./achievement-toast";

// Icon wrapper
export { GlowIcon } from "./glow-icon";

// Error boundaries
export { CardErrorBoundary } from "./card-error-boundary";
export { ErrorFallback } from "./error-fallback";
export { ErrorHandlerMount } from "./error-handler-mount";

// Re-export types where needed
export type { Team } from "./team-badge";
export * from "./variants";

// State components
export { LoadingSpinner } from "./loading-spinner";
export { ErrorState } from "./error-state";
export { EmptyState } from "./empty-state";
export { Skeleton } from "@/components/ui/skeleton";
export { MatchCardSkeleton, PollCardSkeleton } from "@/components/ui/skeleton-card";
