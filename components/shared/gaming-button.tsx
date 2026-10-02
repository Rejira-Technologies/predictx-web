"use client";

import { useState, useRef, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface GamingButtonProps {
  variant?: "primary" | "success" | "danger" | "gold" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  /** When provided the button renders as a Next.js <Link> pointing to this URL. */
  href?: string;
  children: ReactNode;
  className?: string;
  type?: "button" | "submit" | "reset";
}

/** RGB channel tuples used to build alpha-correct rgba() strings at use-site. */
const variantChannels = {
  primary: { r: 0,   g: 217, b: 255, text: "#00d9ff" },
  success: { r: 57,  g: 255, b: 20,  text: "#39ff14" },
  danger:  { r: 255, g: 0,   b: 110, text: "#ff006e" },
  gold:    { r: 255, g: 215, b: 0,   text: "#ffd700" },
  ghost:   { r: 0,   g: 217, b: 255, text: "#00d9ff" },
};

/** Build a valid rgba() string from channel tuple + alpha. */
function rgba(channels: { r: number; g: number; b: number }, alpha: number): string {
  return `rgba(${channels.r}, ${channels.g}, ${channels.b}, ${alpha})`;
}

const variantStyles = {
  primary: {
    bg: `linear-gradient(135deg, ${rgba(variantChannels.primary, 0.2)} 0%, ${rgba(variantChannels.primary, 0.05)} 100%)`,
    border: rgba(variantChannels.primary, 0.4),
    glow: rgba(variantChannels.primary, 0.5),
    glowChannels: variantChannels.primary,
    text: variantChannels.primary.text,
  },
  success: {
    bg: `linear-gradient(135deg, ${rgba(variantChannels.success, 0.2)} 0%, ${rgba(variantChannels.success, 0.05)} 100%)`,
    border: rgba(variantChannels.success, 0.4),
    glow: rgba(variantChannels.success, 0.5),
    glowChannels: variantChannels.success,
    text: variantChannels.success.text,
  },
  danger: {
    bg: `linear-gradient(135deg, ${rgba(variantChannels.danger, 0.2)} 0%, ${rgba(variantChannels.danger, 0.05)} 100%)`,
    border: rgba(variantChannels.danger, 0.4),
    glow: rgba(variantChannels.danger, 0.5),
    glowChannels: variantChannels.danger,
    text: variantChannels.danger.text,
  },
  gold: {
    bg: `linear-gradient(135deg, ${rgba(variantChannels.gold, 0.2)} 0%, ${rgba(variantChannels.gold, 0.05)} 100%)`,
    border: rgba(variantChannels.gold, 0.4),
    glow: rgba(variantChannels.gold, 0.5),
    glowChannels: variantChannels.gold,
    text: variantChannels.gold.text,
  },
  ghost: {
    bg: "transparent",
    border: rgba(variantChannels.ghost, 0.3),
    glow: rgba(variantChannels.ghost, 0.3),
    glowChannels: variantChannels.ghost,
    text: variantChannels.ghost.text,
  },
};

const sizeClasses = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
};

interface RippleState {
  x: number;
  y: number;
  id: number;
}

/** Shared visual shell used by both the button and link variants. */
function GamingButtonShell({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  onClick,
  children,
  className,
  type = "button",
  asLink = false,
}: GamingButtonProps & { asLink?: boolean }) {
  const [ripples, setRipples] = useState<RippleState[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleIdRef = useRef(0);

  const styles = variantStyles[variant];

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || loading) return;

    // Create ripple effect
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = rippleIdRef.current++;

      setRipples((prev) => [...prev, { x, y, id }]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    }

    onClick?.();
  };

  const isDisabled = disabled || loading;

  const sharedClassName = cn(
    "relative overflow-hidden font-medium tracking-wider uppercase",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:no-glow",
    sizeClasses[size],
    className,
  );

  const sharedStyle = {
    clipPath:
      "polygon(8px 0, calc(100% - 8px) 0, 100% 8px, 100% calc(100% - 8px), calc(100% - 8px) 100%, 8px 100%, 0 calc(100% - 8px), 0 8px)",
    background: styles.bg,
    border: `1px solid ${styles.border}`,
    boxShadow: isDisabled
      ? "none"
      : isHovered
        ? `0 0 30px ${styles.glow}, inset 0 0 20px ${rgba(styles.glowChannels, 0.19)}`
        : `0 0 15px ${rgba(styles.glowChannels, 0.31)}, inset 0 0 10px ${rgba(styles.glowChannels, 0.13)}`,
    color: styles.text,
    textShadow: isHovered
      ? `0 0 10px ${styles.glow}, 0 0 20px ${styles.glow}`
      : `0 0 5px ${styles.glow}`,
  };

  const sharedMotionProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => {
      setIsHovered(false);
      setIsPressed(false);
    },
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
    whileHover: !isDisabled ? { scale: 1.05, rotate: 1 } : {},
    whileTap: !isDisabled ? { scale: 0.95 } : {},
    transition: { type: "spring" as const, stiffness: 400, damping: 25 },
  };

  const innerContent = (
    <>
      {/* Animated background gradient sweep */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={
          !isDisabled
            ? { backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"] }
            : {}
        }
        transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        style={{
          background: `linear-gradient(
            90deg,
            transparent 0%,
            ${rgba(styles.glowChannels, 0.063)} 50%,
            transparent 100%
          )`,
          backgroundSize: "200% 100%",
        }}
      />

      {/* Shine sweep on hover */}
      <AnimatePresence>
        {isHovered && !isDisabled && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{
              background: `linear-gradient(
                90deg,
                transparent,
                rgba(255, 255, 255, 0.2),
                transparent
              )`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: 10,
            height: 10,
            marginLeft: -5,
            marginTop: -5,
            background: styles.glow,
          }}
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 20, opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      ))}

      {/* Loading spinner */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loader"
            className="flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Loader2 className="w-5 h-5" style={{ color: styles.text }} />
            </motion.div>
            <span className="opacity-80">Processing...</span>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            className="relative z-10 flex items-center justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );

  // When rendered as a link we use a motion.div wrapper around the Next Link
  // so we keep identical visual behaviour while delegating navigation to Link.
  if (asLink) {
    return (
      <motion.div
        className={sharedClassName}
        style={sharedStyle}
        {...sharedMotionProps}
      >
        {innerContent}
      </motion.div>
    );
  }

  return (
    <motion.button
      ref={buttonRef}
      type={type}
      disabled={isDisabled}
      className={sharedClassName}
      style={sharedStyle}
      onClick={handleClick}
      {...sharedMotionProps}
    >
      {innerContent}
    </motion.button>
  );
}

export function GamingButton({
  href,
  onClick,
  ...rest
}: GamingButtonProps) {
  if (href) {
    return (
      <Link href={href} tabIndex={-1} style={{ display: "inline-block" }}>
        <GamingButtonShell asLink {...rest}>
          {rest.children}
        </GamingButtonShell>
      </Link>
    );
  }

  return <GamingButtonShell onClick={onClick} {...rest} />;
}
