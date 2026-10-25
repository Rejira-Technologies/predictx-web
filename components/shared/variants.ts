/**
 * Shared Cyberpunk Gaming Variant Theme Tokens (#335)
 *
 * Consolidates the four neon hues (cyan, green, magenta, gold) and neutral/default
 * slots into a unified Variant union and CSS variable resolver.
 */

export type Variant =
  | "default"
  | "primary"
  | "neutral"
  | "success"
  | "danger"
  | "gold"
  | "ghost";

export interface VariantThemeColors {
  /** CSS variable reference for the core accent color */
  var: string;
  /** Primary hex fallback if CSS variables are unavailable */
  hex: string;
  /** RGB channel tuple for computing dynamic alpha rgba() values */
  channels: { r: number; g: number; b: number };
}

export const VARIANT_THEME_MAP: Record<Variant, VariantThemeColors> = {
  default: {
    var: "var(--accent-cyan)",
    hex: "#00d9ff",
    channels: { r: 0, g: 217, b: 255 },
  },
  primary: {
    var: "var(--accent-cyan)",
    hex: "#00d9ff",
    channels: { r: 0, g: 217, b: 255 },
  },
  neutral: {
    var: "var(--accent-neutral, var(--accent-cyan))",
    hex: "#00d9ff",
    channels: { r: 0, g: 217, b: 255 },
  },
  success: {
    var: "var(--accent-green)",
    hex: "#39ff14",
    channels: { r: 57, g: 255, b: 20 },
  },
  danger: {
    var: "var(--accent-magenta)",
    hex: "#ff006e",
    channels: { r: 255, g: 0, b: 110 },
  },
  gold: {
    var: "var(--accent-gold)",
    hex: "#ffd700",
    channels: { r: 255, g: 215, b: 0 },
  },
  ghost: {
    var: "var(--accent-cyan)",
    hex: "#00d9ff",
    channels: { r: 0, g: 217, b: 255 },
  },
};

/** Build a valid rgba string using the variant's RGB channels */
export function getVariantRgba(variant: Variant, alpha: number): string {
  const { channels } = VARIANT_THEME_MAP[variant] ?? VARIANT_THEME_MAP.default;
  return `rgba(${channels.r}, ${channels.g}, ${channels.b}, ${alpha})`;
}

/** Build a valid rgba() string from channel tuple + alpha. */
export function rgba(channels: { r: number; g: number; b: number }, alpha: number): string {
  return `rgba(${channels.r}, ${channels.g}, ${channels.b}, ${alpha})`;
}

/** Get the CSS variable string for a given variant */
export function getVariantVar(variant: Variant): string {
  return (VARIANT_THEME_MAP[variant] ?? VARIANT_THEME_MAP.default).var;
}

