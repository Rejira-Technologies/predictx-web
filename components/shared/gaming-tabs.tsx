"use client";

import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
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
}

export function GamingTabs({
  tabs,
  activeTab,
  onChange,
  className,
}: GamingTabsProps) {
  const shouldReduceMotion = useReducedMotion();
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const [hoveredTab, setHoveredTab] = useState<{ key: string; left: number; width: number } | null>(null);
  const tabRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const tablistRef = useRef<HTMLDivElement>(null);

  const measureIndicator = useCallback(() => {
    const activeTabElement = tabRefs.current.get(activeTab);
    if (activeTabElement) {
      setIndicatorStyle({
        left: activeTabElement.offsetLeft,
        width: activeTabElement.offsetWidth,
      });
    }
  }, [activeTab]);

  useEffect(() => {
    measureIndicator();
  }, [measureIndicator]);

  // Re-measure when the tablist or window resizes (rotation, font load, etc.)
  useEffect(() => {
    const tablist = tablistRef.current;
    if (!tablist) return;

    window.addEventListener("resize", measureIndicator);
    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(measureIndicator)
        : null;
    observer?.observe(tablist);

    return () => {
      window.removeEventListener("resize", measureIndicator);
      observer?.disconnect();
    };
  }, [measureIndicator]);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    let nextIndex = -1;
    if (e.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % tabs.length;
    } else if (e.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
    } else if (e.key === "Home") {
      nextIndex = 0;
    } else if (e.key === "End") {
      nextIndex = tabs.length - 1;
    }

    if (nextIndex !== -1) {
      e.preventDefault();
      const nextKey = tabs[nextIndex].key;
      onChange(nextKey);
      tabRefs.current.get(nextKey)?.focus();
    }
  };

  return (
    <div
      ref={tablistRef}
      role="tablist"
      aria-orientation="horizontal"
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
      {hoveredTab && hoveredTab.key !== activeTab && !shouldReduceMotion && (
        <motion.div
          className="absolute bottom-1 h-0.5 bg-[var(--accent-cyan)]/30 rounded-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ left: hoveredTab.left, width: hoveredTab.width }}
        />
      )}

      {/* Tab buttons */}
      {tabs.map((tab, idx) => (
        <button
          key={tab.key}
          role="tab"
          aria-selected={activeTab === tab.key}
          tabIndex={activeTab === tab.key ? 0 : -1}
          ref={(el) => {
            if (el) {
              tabRefs.current.set(tab.key, el);
            }
          }}
          onClick={() => onChange(tab.key)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onMouseEnter={(e) => {
            const el = e.currentTarget;
            setHoveredTab({ key: tab.key, left: el.offsetLeft, width: el.offsetWidth });
          }}
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
          {hoveredTab?.key === tab.key && activeTab !== tab.key && (
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
