
"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";

import { cn } from "@/lib/utils";

type NumberFormat = "currency" | "number" | "compact" | "percentage";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  format?: NumberFormat;
  locale?: string;
  currency?: string;
  decimals?: number;
  className?: string;
  digitClassName?: string;
  prefixClassName?: string;
  suffixClassName?: string;
  animate?: boolean;
  animateOnMount?: boolean;
  enableGlow?: boolean;
  enableShake?: boolean;
  enablePulse?: boolean;
  threshold?: number;
  delay?: number;
  compactDecimals?: number;
  showSign?: boolean;
  respectReducedMotion?: boolean;
  onAnimationComplete?: () => void;
}

const DEFAULT_DURATION = 0.8;

function formatValue(
  value: number,
  options: {
    format: NumberFormat;
    locale: string;
    currency: string;
    decimals?: number;
    compactDecimals: number;
    showSign: boolean;
  },
): string {
  const {
    format,
    locale,
    currency,
    decimals,
    compactDecimals,
    showSign,
  } = options;

  if (!Number.isFinite(value)) {
    return "—";
  }

  const signDisplay = showSign ? "always" : "auto";

  switch (format) {
    case "currency":
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        minimumFractionDigits: decimals ?? 2,
        maximumFractionDigits: decimals ?? 2,
        signDisplay,
      }).format(value);

    case "compact":
      return new Intl.NumberFormat(locale, {
        notation: "compact",
        compactDisplay: "short",
        minimumFractionDigits: 0,
        maximumFractionDigits: compactDecimals,
        signDisplay,
      }).format(value);

    case "percentage":
      return new Intl.NumberFormat(locale, {
        style: "percent",
        minimumFractionDigits: decimals ?? 0,
        maximumFractionDigits: decimals ?? 2,
        signDisplay,
      }).format(value);

    default:
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: decimals ?? 0,
        maximumFractionDigits: decimals ?? 2,
        signDisplay,
      }).format(value);
  }
}

function easeOutCubic(progress: number): number {
  return 1 - Math.pow(1 - progress, 3);
}

export const AnimatedCounter = memo(function AnimatedCounter({
  value,
  prefix = "",
  suffix = "",
  duration = DEFAULT_DURATION,
  format = "number",
  locale = "en-US",
  currency = "USD",
  decimals,
  compactDecimals = 2,
  className,
  digitClassName,
  prefixClassName,
  suffixClassName,
  animate = true,
  animateOnMount = false,
  enableGlow = true,
  enableShake = false,
  enablePulse = true,
  threshold = 0.2,
  delay = 0,
  showSign = false,
  respectReducedMotion = true,
  onAnimationComplete,
}: AnimatedCounterProps) {
  const prefersReducedMotion = useReducedMotion();

  const reducedMotion =
    respectReducedMotion && Boolean(prefersReducedMotion);

  const [displayValue, setDisplayValue] = useState(
    animateOnMount ? 0 : value,
  );

  const [isAnimating, setIsAnimating] = useState(false);
  const [shouldShake, setShouldShake] = useState(false);

  const currentValueRef = useRef(displayValue);
  const animationFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);

  const previousValueRef = useRef(
    animateOnMount ? 0 : value,
  );

  const latestCallbackRef = useRef(onAnimationComplete);

  useEffect(() => {
    latestCallbackRef.current = onAnimationComplete;
  }, [onAnimationComplete]);

  const formattedValue = useMemo(
    () =>
      formatValue(displayValue, {
        format,
        locale,
        currency,
        decimals,
        compactDecimals,
        showSign,
      }),
    [
      displayValue,
      format,
      locale,
      currency,
      decimals,
      compactDecimals,
      showSign,
    ],
  );

  const targetFormattedValue = useMemo(
    () =>
      formatValue(value, {
        format,
        locale,
        currency,
        decimals,
        compactDecimals,
        showSign,
      }),
    [
      value,
      format,
      locale,
      currency,
      decimals,
      compactDecimals,
      showSign,
    ],
  );

  const clearAnimation = useCallback(() => {
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!Number.isFinite(value)) {
      clearAnimation();
      currentValueRef.current = value;
      previousValueRef.current = value;
      setDisplayValue(value);
      setIsAnimating(false);
      setShouldShake(false);
      return;
    }

    const initialMount = !mountedRef.current;

    mountedRef.current = true;

    if (initialMount && !animateOnMount) {
      currentValueRef.current = value;
      previousValueRef.current = value;
      setDisplayValue(value);
      return;
    }

    clearAnimation();

    if (!animate || reducedMotion || duration <= 0) {
      currentValueRef.current = value;
      previousValueRef.current = value;

      setDisplayValue(value);
      setIsAnimating(false);
      setShouldShake(false);

      return;
    }

    const startValue = currentValueRef.current;
    const targetValue = value;

    if (startValue === targetValue) {
      setDisplayValue(targetValue);
      setIsAnimating(false);
      return;
    }

    const difference = Math.abs(targetValue - startValue);

    const percentageChange =
      Math.abs(startValue) > 0
        ? difference / Math.abs(startValue)
        : difference > 0
          ? 1
          : 0;

    setIsAnimating(true);
    setShouldShake(
      enableShake && percentageChange >= threshold,
    );

    let startTime: number | null = null;

    const animationDuration = Math.max(0, duration * 1000);

    const animateFrame = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const progress = Math.min(
        elapsed / animationDuration,
        1,
      );

      const easedProgress = easeOutCubic(progress);

      const nextValue =
        startValue +
        (targetValue - startValue) * easedProgress;

      currentValueRef.current = nextValue;
      setDisplayValue(nextValue);

      if (progress < 1) {
        animationFrameRef.current =
          requestAnimationFrame(animateFrame);
      } else {
        currentValueRef.current = targetValue;
        previousValueRef.current = targetValue;

        setDisplayValue(targetValue);
        setIsAnimating(false);

        timeoutRef.current = setTimeout(() => {
          setShouldShake(false);
          timeoutRef.current = null;
        }, 500);

        latestCallbackRef.current?.();
      }
    };

    const startAnimation = () => {
      animationFrameRef.current =
        requestAnimationFrame(animateFrame);
    };

    if (delay > 0) {
      timeoutRef.current = setTimeout(() => {
        timeoutRef.current = null;
        startAnimation();
      }, delay * 1000);
    } else {
      startAnimation();
    }

    return clearAnimation;
  }, [
    value,
    duration,
    delay,
    animate,
    animateOnMount,
    reducedMotion,
    enableShake,
    threshold,
    clearAnimation,
  ]);

  useEffect(() => {
    return () => {
      clearAnimation();
    };
  }, [clearAnimation]);

  const digits = useMemo(
    () => formattedValue.split(""),
    [formattedValue],
  );

  return (
    <motion.div
      role="status"
      aria-live="off"
      aria-atomic="true"
      aria-label={`${prefix}${targetFormattedValue}${suffix}`}
      className={cn(
        "relative inline-flex items-baseline",
        "font-mono tabular-nums",
        "transition-colors duration-300",
        isAnimating && enableGlow && "glow-text-cyan",
        shouldShake && "animate-shake",
        className,
      )}
      animate={
        isAnimating && enableGlow && !reducedMotion
          ? {
              textShadow: [
                "0 0 6px rgba(0, 217, 255, 0.2)",
                "0 0 18px rgba(0, 217, 255, 0.55)",
                "0 0 6px rgba(0, 217, 255, 0.2)",
              ],
            }
          : {
              textShadow: "0 0 0px transparent",
            }
      }
      transition={{
        duration: reducedMotion ? 0 : 0.5,
      }}
    >
      {prefix && (
        <span
          aria-hidden="true"
          className={cn(
            "mr-1 shrink-0 text-[var(--accent-cyan)]",
            prefixClassName,
          )}
        >
          {prefix}
        </span>
      )}

      <span
        aria-hidden="true"
        className="relative inline-flex items-center overflow-hidden"
      >
        <AnimatePresence initial={false} mode="popLayout">
          {digits.map((digit, index) => {
            const isNumeric = /[0-9]/.test(digit);

            return (
              <motion.span
                key={`${index}-${digit}`}
                initial={
                  reducedMotion
                    ? false
                    : {
                        y: -12,
                        opacity: 0,
                      }
                }
                animate={{
                  y: 0,
                  opacity: 1,
                }}
                exit={
                  reducedMotion
                    ? undefined
                    : {
                        y: 12,
                        opacity: 0,
                      }
                }
                transition={{
                  duration: reducedMotion ? 0 : 0.25,
                  ease: "easeOut",
                  delay: reducedMotion ? 0 : index * 0.015,
                }}
                className={cn(
                  "inline-block whitespace-pre",
                  "tabular-nums",
                  isNumeric
                    ? "text-[var(--foreground)]"
                    : "text-[var(--muted-foreground)]",
                  digitClassName,
                )}
              >
                {digit}
              </motion.span>
            );
          })}
        </AnimatePresence>
      </span>

      {suffix && (
        <span
          aria-hidden="true"
          className={cn(
            "ml-1 shrink-0 text-[var(--muted-foreground)]",
            suffixClassName,
          )}
        >
          {suffix}
        </span>
      )}

      {enablePulse && (
        <AnimatePresence>
          {isAnimating && !reducedMotion && (
            <motion.span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-md"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0.25, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.6,
                ease: "easeOut",
              }}
              style={{
                background:
                  "radial-gradient(circle at center, rgba(0,217,255,0.22), transparent 75%)",
              }}
            />
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
});

AnimatedCounter.displayName = "AnimatedCounter";
