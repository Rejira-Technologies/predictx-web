"use client";

import { useEffect, useState, useRef, ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AchievementToastProps {
  title: string;
  description?: string;
  icon: ReactNode;
  xp?: number;
  onClose?: () => void;
  className?: string;
}

export function AchievementToast({
  title,
  description,
  icon,
  xp = 0,
  onClose,
  className,
}: AchievementToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const shouldReduceMotion = useReducedMotion();
  const dismissTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-dismiss after 3 seconds
  useEffect(() => {
    dismissTimerRef.current = setTimeout(() => {
      setIsVisible(false);
      exitTimerRef.current = setTimeout(() => {
        onClose?.();
      }, 300); // Wait for exit animation
    }, 3000);

    return () => {
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, [onClose]);

  const handleClose = () => {
    if (dismissTimerRef.current) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    setIsVisible(false);
    exitTimerRef.current = setTimeout(() => {
      onClose?.();
    }, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { x: "100%", opacity: 0 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { x: 0, opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { x: "100%", opacity: 0 }}
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 400, damping: 30 }
          }
          className={cn(
            "relative w-80 overflow-hidden",
            "bg-[#1a1f3a]/90 backdrop-blur-md",
            className
          )}
          style={{
            clipPath:
              "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
            boxShadow: "0 0 30px rgba(0, 217, 255, 0.3), inset 0 0 20px rgba(0, 217, 255, 0.1)",
            border: "1px solid rgba(0, 217, 255, 0.3)",
          }}
        >
          {/* Animated trail effect on enter */}
          {!shouldReduceMotion && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              initial={{ x: "-100%", opacity: 0.5 }}
              animate={{ x: "100%", opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                background: `linear-gradient(
                  90deg,
                  transparent,
                  rgba(0, 217, 255, 0.2),
                  transparent
                )`,
              }}
            />
          )}

          {/* Glow border animation */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={
              shouldReduceMotion
                ? {}
                : {
                    boxShadow: [
                      "inset 0 0 20px rgba(0, 217, 255, 0.1)",
                      "inset 0 0 30px rgba(0, 217, 255, 0.2)",
                      "inset 0 0 20px rgba(0, 217, 255, 0.1)",
                    ],
                  }
            }
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 2, repeat: Infinity }}
          />

          {/* Content */}
          <div className="relative p-4 flex items-start gap-3">
            {/* Icon */}
            <motion.div
              className="relative flex-shrink-0 w-12 h-12 flex items-center justify-center"
              style={{
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                background: "rgba(0, 217, 255, 0.2)",
                border: "1px solid rgba(0, 217, 255, 0.5)",
              }}
              animate={
                shouldReduceMotion
                  ? {}
                  : {
                      boxShadow: [
                        "0 0 10px rgba(0, 217, 255, 0.3)",
                        "0 0 20px rgba(0, 217, 255, 0.6)",
                        "0 0 10px rgba(0, 217, 255, 0.3)",
                      ],
                    }
              }
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 1.5, repeat: Infinity }}
            >
              <span className="text-[var(--accent-cyan)]">{icon}</span>
            </motion.div>

            {/* Text content */}
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-[var(--foreground)] uppercase tracking-wider text-sm">
                {title}
              </h4>
              {description && (
                <p className="text-[var(--muted-foreground)] text-xs mt-0.5">
                  {description}
                </p>
              )}

              {/* XP display */}
              {xp > 0 && (
                <div className="flex items-center gap-1 mt-1.5">
                  <Sparkles className="w-3 h-3 text-[var(--accent-gold)]" />
                  <span className="text-[var(--accent-gold)] text-xs font-bold">
                    +{xp} XP
                  </span>
                </div>
              )}
            </div>

            {/* Close button */}
            <button
              onClick={handleClose}
              className="flex-shrink-0 p-1 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Bottom progress bar for auto-dismiss */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--background)]">
            <motion.div
              className="h-full bg-[var(--accent-cyan)]"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={shouldReduceMotion ? { duration: 0 } : { duration: 3, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
