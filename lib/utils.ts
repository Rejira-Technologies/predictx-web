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

/**
 * Shortens a public address (such as a Stellar public key) for compact display.
 *
 * Returns the original value unchanged when empty or shorter than `prefixLength + suffixLength`
 * to avoid malformed output or overlapping slices.
 */
export function shortenAddress(
  address: string,
  prefixLength = 6,
  suffixLength = 4,
): string {
  if (!address || address.length < prefixLength + suffixLength) {
    return address;
  }

  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
}