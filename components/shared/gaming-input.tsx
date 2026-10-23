"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [isFocused, setIsFocused] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  // Trigger shake animation when error appears
  useEffect(() => {
    if (error) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleNumberChange = (newValue: number) => {
    if (type !== "number") return;

    let clampedValue = newValue;
    if (min !== undefined) clampedValue = Math.max(min, clampedValue);
    if (max !== undefined) clampedValue = Math.min(max, clampedValue);

    onChange(clampedValue);
  };

  const increment = () => {
    const current = typeof value === "number" ? value : 0;
    handleNumberChange(current + step);
  };

  const decrement = () => {
    const current = typeof value === "number" ? value : 0;
    handleNumberChange(current - step);
  };

  return (
    <div className={cn("relative", className)}>
      {/* Input container with angular styling */}
      <motion.div
        className={cn(
          "relative flex items-center overflow-hidden",
          "bg-[#1a1f3a]/80",
          isShaking && "animate-shake",
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
          value={value}
          onChange={(e) =>
            onChange(type === "number" ? parseFloat(e.target.value) || 0 : e.target.value)
          }
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
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
              whileTap={{ scale: 0.9 }}
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
              whileTap={{ scale: 0.9 }}
            >
              <Minus className="w-3 h-3 text-[var(--accent-cyan)]" aria-hidden="true" />
            </motion.button>
          </div>
        )}

        {/* Typing cursor animation overlay for placeholder */}
        <AnimatePresence>
          {isFocused && !value && placeholder && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute left-4 pointer-events-none text-[var(--accent-cyan)]"
              style={{
                animation: "typing-cursor 1s step-end infinite",
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
