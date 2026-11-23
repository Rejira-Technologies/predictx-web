"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Minus, Plus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface GamingInputProps {
  type?: "text" | "number";
  value: string | number;
  onChange: (value: string | number) => void;
  prefix?: string;
  suffix?: string;
  error?: string;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  disabled?: boolean;
  /** Forwarded to the underlying <input> element for label association. */
  id?: string;
  /** Accessible name when no visible <label> is associated via htmlFor/id. */
  "aria-label"?: string;
}

// Allows empty string, standalone minus/decimal/minus-decimal while mid-keystroke,
// and partial decimals like "10.", "0.0", ".5", "-0.25".
const INTERMEDIATE_NUMBER_REGEX = /^-?(?:\d+(?:\.\d*)?|\.\d*)$/;

function isIncompleteNumberToken(raw: string): boolean {
  return raw === "" || raw === "-" || raw === "." || raw === "-.";
}

function clampNumericValue(num: number, min?: number, max?: number): number {
  let clamped = num;
  if (min !== undefined) clamped = Math.max(min, clamped);
  if (max !== undefined) clamped = Math.min(max, clamped);
  return clamped;
}

function formatExternalNumber(val: string | number): string {
  if (val === "" || val === undefined || val === null) return "";
  return String(val);
}

export function GamingInput({
  type = "text",
  value,
  onChange,
  prefix,
  suffix,
  error,
  placeholder,
  min,
  max,
  step = 1,
  className,
  disabled = false,
  id,
  "aria-label": ariaLabel,
}: GamingInputProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isFocused, setIsFocused] = useState(false);
  const [isShaking, setIsShaking] = useState(false);
  const [draftValue, setDraftValue] = useState<string>(() =>
    type === "number" ? formatExternalNumber(value) : String(value ?? "")
  );

  // Track the last numeric value we emitted so parent re-renders of that same
  // value don't clobber an active draft like "10." or "0.0".
  const lastEmittedNumberRef = useRef<number | null>(null);

  // Trigger shake animation when error appears
  useEffect(() => {
    if (error) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Sync from external `value` prop when not actively editing or when parent sets
  // a genuinely new external value (e.g., reset, preset button, or initial mount).
  useEffect(() => {
    if (type !== "number") {
      setDraftValue(String(value ?? ""));
      return;
    }

    if (typeof value === "number" && Number.isFinite(value)) {
      if (isFocused && lastEmittedNumberRef.current === value) {
        return;
      }
      lastEmittedNumberRef.current = value;
      setDraftValue(String(value));
      return;
    }

    if (value === "") {
      if (!isFocused) {
        lastEmittedNumberRef.current = null;
        setDraftValue("");
      }
      return;
    }

    if (!isFocused) {
      setDraftValue(String(value));
    }
  }, [value, type, isFocused]);

  const handleNumberChange = (newValue: number) => {
    if (type !== "number") return;

    const clampedValue = clampNumericValue(newValue, min, max);
    lastEmittedNumberRef.current = clampedValue;
    setDraftValue(String(clampedValue));
    onChange(clampedValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    if (type !== "number") {
      onChange(raw);
      return;
    }

    if (!INTERMEDIATE_NUMBER_REGEX.test(raw)) {
      return;
    }

    setDraftValue(raw);

    if (isIncompleteNumberToken(raw)) {
      // Preserve empty string or trailing/leading decimal while typing;
      // emit 0 if cleared so numeric consumers don't see stale non-zero values,
      // without overwriting `draftValue`.
      if (raw === "") {
        lastEmittedNumberRef.current = 0;
        onChange(0);
      }
      return;
    }

    const parsed = Number(raw);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      lastEmittedNumberRef.current = parsed;
      onChange(parsed);
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (type === "number") {
      setDraftValue(formatExternalNumber(value));
    }
  };

  const handleBlur = () => {
    setIsFocused(false);

    if (type !== "number") return;

    const trimmed = draftValue.trim();

    if (isIncompleteNumberToken(trimmed)) {
      const fallback = min !== undefined ? clampNumericValue(0, min, max) : 0;
      lastEmittedNumberRef.current = fallback;
      setDraftValue("");
      onChange(fallback);
      return;
    }

    const parsed = Number(trimmed);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      const clamped = clampNumericValue(parsed, min, max);
      lastEmittedNumberRef.current = clamped;
      setDraftValue(String(clamped));
      onChange(clamped);
    }
  };

  const increment = () => {
    const current =
      typeof value === "number"
        ? value
        : parseFloat(draftValue) || 0;
    handleNumberChange(current + step);
  };

  const decrement = () => {
    const current =
      typeof value === "number"
        ? value
        : parseFloat(draftValue) || 0;
    handleNumberChange(current - step);
  };

  const displayedValue = type === "number" ? draftValue : value;
  const isEmptyForCursor =
    type === "number" ? draftValue === "" : !value;

  return (
    <div className={cn("relative", className)}>
      {/* Input container with angular styling */}
      <motion.div
        className={cn(
          "relative flex items-center overflow-hidden",
          "bg-[#1a1f3a]/80",
          isShaking && !shouldReduceMotion && "animate-shake",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        style={{
          clipPath:
            "polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)",
          boxShadow: isFocused
            ? error
              ? "0 0 20px rgba(255, 0, 110, 0.5), inset 0 0 10px rgba(255, 0, 110, 0.2)"
              : "0 0 20px rgba(0, 217, 255, 0.5), inset 0 0 10px rgba(0, 217, 255, 0.2)"
            : error
              ? "0 0 10px rgba(255, 0, 110, 0.3), inset 0 0 5px rgba(255, 0, 110, 0.1)"
              : "0 0 10px rgba(0, 217, 255, 0.2), inset 0 0 5px rgba(0, 217, 255, 0.1)",
          border: error
            ? "1px solid rgba(255, 0, 110, 0.5)"
            : "1px solid rgba(0, 217, 255, 0.3)",
        }}
        animate={{
          borderColor: isFocused
            ? error
              ? "rgba(255, 0, 110, 0.8)"
              : "rgba(0, 217, 255, 0.8)"
            : error
              ? "rgba(255, 0, 110, 0.5)"
              : "rgba(0, 217, 255, 0.3)",
        }}
        transition={{ duration: 0.2 }}
      >
        {/* Prefix */}
        {prefix && (
          <span className="pl-4 pr-2 text-[var(--accent-cyan)] font-medium">
            {prefix}
          </span>
        )}

        {/* Input field */}
        <input
          id={id}
          aria-label={ariaLabel}
          aria-describedby={error ? `${id ?? "gaming-input"}-error` : undefined}
          aria-invalid={error ? true : undefined}
          type={type === "number" ? "text" : type}
          inputMode={type === "number" ? "decimal" : undefined}
          value={displayedValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "flex-1 bg-transparent py-3 px-4 outline-none",
            "text-foreground placeholder:text-[var(--muted-foreground)]",
            "font-mono tabular-nums",
            type === "number" && "text-right"
          )}
          style={{
            caretColor: error ? "#ff006e" : "#00d9ff",
          }}
        />

        {/* Suffix */}
        {suffix && (
          <span className="pl-2 pr-4 text-[var(--muted-foreground)]">
            {suffix}
          </span>
        )}

        {/* Number stepper buttons */}
        {type === "number" && (
          <div className="flex flex-col border-l border-[var(--border)]">
            <motion.button
              type="button"
              aria-label="Increase value"
              onClick={increment}
              disabled={disabled || (max !== undefined && Number(value) >= max)}
              className="flex items-center justify-center p-2 hover:bg-[var(--accent-cyan)]/10 disabled:opacity-30 transition-colors"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
            >
              <Plus className="w-3 h-3 text-[var(--accent-cyan)]" aria-hidden="true" />
            </motion.button>
            <div className="h-px bg-[var(--border)]" />
            <motion.button
              type="button"
              aria-label="Decrease value"
              onClick={decrement}
              disabled={disabled || (min !== undefined && Number(value) <= min)}
              className="flex items-center justify-center p-2 hover:bg-[var(--accent-cyan)]/10 disabled:opacity-30 transition-colors"
              whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
            >
              <Minus className="w-3 h-3 text-[var(--accent-cyan)]" aria-hidden="true" />
            </motion.button>
          </div>
        )}

        {/* Typing cursor animation overlay for placeholder */}
        <AnimatePresence>
          {isFocused && isEmptyForCursor && placeholder && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute left-4 pointer-events-none text-[var(--accent-cyan)]"
              style={{
                animation: shouldReduceMotion ? "none" : "typing-cursor 1s step-end infinite",
              }}
            >
              |
            </motion.span>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            id={`${id ?? "gaming-input"}-error`}
            role="alert"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-1.5 mt-2 text-sm text-[#ff006e]"
          >
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}