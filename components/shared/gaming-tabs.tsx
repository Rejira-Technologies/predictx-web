"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Tab {
  key: string;
  label: string;
  count?: number;
}

interface GamingTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
  className?: string;
  /** Accessible name for the filter group, e.g. "Filter polls by category". */
  ariaLabel?: string;
}

export function GamingTabs({
  tabs,
  activeTab,
  onChange,
  className,
  ariaLabel = "Filter",
}: GamingTabsProps) {
  const shouldReduceMotion = useReducedMotion();
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    const activeTabElement = tabRefs.current.get(activeTab);
    if (activeTabElement) {
      setIndicatorStyle({
        left: activeTabElement.offsetLeft,
        width: activeTabElement.offsetWidth,
      });
    }
  }, [activeTab]);

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        "relative flex items-center gap-1 p-1",
        "bg-[#1a1f3a]/50 rounded-lg",
        className
      )}
      style={{
        clipPath:
          "polygon(6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px), 0 6px)",
      }}
    >
      {/* Sliding indicator */}
      <motion.div
        className="absolute bottom-1 h-0.5 bg-[var(--accent-cyan)] rounded-full"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          boxShadow: "0 0 10px rgba(0, 217, 255, 0.8), 0 0 20px rgba(0, 217, 255, 0.4)",
        }}
        layoutId={shouldReduceMotion ? undefined : "gaming-tab-indicator"}
        transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 35 }}
      />

      {/* Preview glow indicator for hovered tab */}
      {hoveredTab && hoveredTab !== activeTab && !shouldReduceMotion && (
        <motion.div
          className="absolute bottom-1 h-0.5 bg-[var(--accent-cyan)]/30 rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            left: tabRefs.current.get(hoveredTab)?.offsetLeft || 0,
            width: tabRefs.current.get(hoveredTab)?.offsetWidth || 0,
          }}
        />
      )}

      {/* Filter toggle buttons (aria-pressed inside role="group"; results are
          rendered as a plain list by the caller, so this is not a tab widget) */}
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          aria-pressed={activeTab === tab.key}
          ref={(el) => {
            if (el) {
              tabRefs.current.set(tab.key, el);
            }
          }}
          onClick={() => onChange(tab.key)}
          onMouseEnter={() => setHoveredTab(tab.key)}
          onMouseLeave={() => setHoveredTab(null)}
          className={cn(
            "relative px-4 py-2 text-sm font-medium transition-colors duration-200",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cyan)]/50 rounded-md",
            activeTab === tab.key
              ? "text-[var(--accent-cyan)]"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )}
        >
          {/* Hover glow effect */}
          {hoveredTab === tab.key && activeTab !== tab.key && (
            <motion.div
              className="absolute inset-0 bg-[var(--accent-cyan)]/10 rounded-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                boxShadow: "inset 0 0 10px rgba(0, 217, 255, 0.1)",
              }}
            />
          )}

          <span className="relative z-10 flex items-center gap-2">
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className={cn(
                  "px-1.5 py-0.5 text-xs rounded-full",
                  activeTab === tab.key
                    ? "bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)]"
                    : "bg-[var(--muted)]/20 text-[var(--muted-foreground)]"
                )}
                style={{
                  boxShadow:
                    activeTab === tab.key
                      ? "0 0 5px rgba(0, 217, 255, 0.3)"
                      : "none",
                }}
              >
                {tab.count}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
