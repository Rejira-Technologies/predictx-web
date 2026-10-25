import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const shortenAddress = (address: string) =>
  `${address.slice(0, 6)}...${address.slice(-4)}`

/**
 * Converts a PollCategory enum value into a human-readable, title-cased label.
 * Handles both underscore-separated ("player_event") and hyphen-separated
 * ("player-event") variants, as well as multi-word values ("player_event_goal").
 *
 * @example
 *   categoryLabel("player_event")     // → "Player Event"
 *   categoryLabel("score-prediction") // → "Score Prediction"
 *   categoryLabel("other")            // → "Other"
 */
export function categoryLabel(category: string): string {
  return category
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}
