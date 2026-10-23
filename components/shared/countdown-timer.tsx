"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CountdownTimerProps {
  targetTime: string;
  label?: string;
  onExpire?: () => void;
  size?: "sm" | "md" | "lg";
  compact?: boolean;
  className?: string;
}

type UrgencyLevel = "safe" | "warning" | "urgent" | "critical" | "expired";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const urgencyColors: Record<UrgencyLevel, string> = {
  safe: "#00d9ff", // cyan
  warning: "#ffd700", // gold
  urgent: "#ff006e", // magenta
  critical: "#ff006e", // magenta with pulse
  expired: "#6b7280", // neutral gray
};

function getUrgencyLevel(totalMinutes: number): UrgencyLevel {
  if (totalMinutes < 5) return "critical";
  if (totalMinutes < 15) return "urgent";
  if (totalMinutes < 60) return "warning";
  return "safe";
}

function formatTimeLeftSentence(t: TimeLeft): string {
  const parts: string[] = [];
  if (t.days > 0) parts.push(`${t.days} day${t.days === 1 ? "" : "s"}`);
  if (t.hours > 0) parts.push(`${t.hours} hour${t.hours === 1 ? "" : "s"}`);
  parts.push(`${t.minutes} minute${t.minutes === 1 ? "" : "s"}`);
  parts.push(`${t.seconds} second${t.seconds === 1 ? "" : "s"}`);
  return parts.join(", ");
}

function calculateTimeLeft(targetDate: Date): TimeLeft {
  const now = new Date().getTime();
  const target = targetDate.getTime();
  const difference = target - now;

  if (difference <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / (1000 * 60)) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function TimeUnit({
  value,
  label,
  color,
  size,
  isTicking,
}: {
  value: number;
  label: string;
  color: string;
  size: string;
  isTicking: boolean;
}) {
  const sizeClasses = {
    sm: "text-2xl min-w-[2ch]",
    md: "text-4xl min-w-[2.5ch]",
    lg: "text-6xl min-w-[2ch]",
  };

  const labelClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="flex flex-col items-center">
      <motion.div
        key={value}
        initial={isTicking ? { scale: 0.8, opacity: 0 } : false}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          "font-mono font-bold tabular-nums",
          sizeClasses[size as keyof typeof sizeClasses]
        )}
        style={{
          color,
          textShadow: `0 0 10px ${color}80, 0 0 20px ${color}40`,
        }}
      >
        {value.toString().padStart(2, "0")}
      </motion.div>
      <span
        className={cn(
          "text-[var(--muted-foreground)] uppercase tracking-wider mt-1",
          labelClasses[size as keyof typeof labelClasses]
        )}
      >
        {label}
      </span>
    </div>
  );
}

export function CountdownTimer({
  targetTime,
  label,
  onExpire,
  size = "md",
  compact = false,
  className,
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [urgency, setUrgency] = useState<UrgencyLevel>("safe");
  const [isTicking, setIsTicking] = useState(false);
  const [hasExpired, setHasExpired] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateTimer = useCallback(() => {
    const target = new Date(targetTime);
    const difference = target.getTime() - Date.now();
    const remaining = calculateTimeLeft(target);
    const totalMinutes =
      remaining.days * 24 * 60 +
      remaining.hours * 60 +
      remaining.minutes +
      remaining.seconds / 60;

    setTimeLeft(remaining);

    if (difference <= 0) {
      setUrgency("expired");
      if (!hasExpired) {
        setHasExpired(true);
        onExpire?.();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setUrgency(getUrgencyLevel(totalMinutes));
    setIsTicking(true);
    setTimeout(() => setIsTicking(false), 200);
  }, [targetTime, onExpire, hasExpired]);

  useEffect(() => {
    updateTimer();
    intervalRef.current = setInterval(updateTimer, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [updateTimer]);

  const color = urgencyColors[urgency];
  const isCritical = urgency === "critical";
  const isExpired = urgency === "expired";

  if (compact) {
    return (
      <div
        className={cn("flex items-center gap-2", className)}
        role="timer"
        aria-label={
          isExpired
            ? `${label ? `${label}: ` : ""}expired`
            : `${label ? `${label}: ` : ""}${formatTimeLeftSentence(timeLeft)} remaining`
        }
      >
        {isCritical && !isExpired && (
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            role="alert"
            aria-label="Less than 5 minutes remaining"
          >
            <AlertTriangle className="w-5 h-5 text-[#ff006e]" aria-hidden="true" />
          </motion.div>
        )}
        <div
          className="font-mono font-bold tabular-nums"
          aria-hidden="true"
          style={{
            color,
            textShadow: `0 0 10px ${color}80`,
          }}
        >
          {timeLeft.hours > 0 &&
            `${timeLeft.hours.toString().padStart(2, "0")}:`}
          {timeLeft.minutes.toString().padStart(2, "0")}:
          {timeLeft.seconds.toString().padStart(2, "0")}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn("flex flex-col items-center", className)}
      role="timer"
      aria-label={
        label
          ? isExpired
            ? `${label}: expired`
            : `${label}: ${formatTimeLeftSentence(timeLeft)} remaining`
          : undefined
      }
    >
      {label && (
        <span className="text-[var(--muted-foreground)] text-sm mb-3 uppercase tracking-wider">
          {label}
        </span>
      )}

      <div className="flex items-center gap-2 sm:gap-4">
        {!isExpired && (
          <>
            {timeLeft.days > 0 && (
              <>
                <TimeUnit
                  value={timeLeft.days}
                  label="Days"
                  color={color}
                  size={size}
                  isTicking={isTicking}
                />
                <span
                  className={cn(
                    "font-mono",
                    size === "sm"
                      ? "text-xl"
                      : size === "md"
                      ? "text-3xl"
                      : "text-5xl"
                  )}
                  style={{ color: `${color}50` }}
                >
                  :
                </span>
              </>
            )}

            <TimeUnit
              value={timeLeft.hours}
              label="Hours"
              color={color}
              size={size}
              isTicking={isTicking}
            />

            <span
              className={cn(
                "font-mono",
                size === "sm"
                  ? "text-xl"
                  : size === "md"
                  ? "text-3xl"
                  : "text-5xl"
              )}
              style={{ color: `${color}50` }}
            >
              :
            </span>

            <TimeUnit
              value={timeLeft.minutes}
              label="Mins"
              color={color}
              size={size}
              isTicking={isTicking}
            />

            <span
              className={cn(
                "font-mono",
                size === "sm"
                  ? "text-xl"
                  : size === "md"
                  ? "text-3xl"
                  : "text-5xl"
              )}
              style={{ color: `${color}50` }}
            >
              :
            </span>

            <TimeUnit
              value={timeLeft.seconds}
              label="Secs"
              color={color}
              size={size}
              isTicking={isTicking}
            />
          </>
        )}

        {isCritical && !isExpired && (
          <motion.div
            className="ml-2"
            animate={{ opacity: [1, 0.3, 1], scale: [1, 1.1, 1] }}
            transition={{ duration: 0.5, repeat: Infinity }}
            role="alert"
            aria-label="Less than 5 minutes remaining"
          >
            <AlertTriangle className="w-6 h-6 text-[#ff006e]" aria-hidden="true" />
          </motion.div>
        )}
        {isExpired && (
          <span className="text-[var(--muted-foreground)] font-mono font-bold uppercase tracking-wider ">
            {" "}
            Expired{" "}
          </span>
        )}
      </div>
    </div>
  );
}
