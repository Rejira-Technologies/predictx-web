"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getTeamAbbreviation } from "@/lib/team-colors";

// Team type definition aligned with domain contract
export interface Team {
  id: string;
  name: string;
  primaryColor: string;
  shortName?: string;
  logo?: string;
  // Backward compatibility aliases
  abbreviation?: string;
  logoUrl?: string;
}

interface TeamBadgeProps {
  team: Team;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: {
    container: "w-10 h-11",
    text: "text-xs",
    glow: "0 0 10px",
  },
  md: {
    container: "w-14 h-16",
    text: "text-sm",
    glow: "0 0 15px",
  },
  lg: {
    container: "w-20 h-[5.5rem]",
    text: "text-base",
    glow: "0 0 20px",
  },
};

export function TeamBadge({ team, size = "md", className }: TeamBadgeProps) {
  const sizes = sizeClasses[size];

  return (
    <motion.div
      className={cn("relative", sizes.container, className)}
      whileHover={{ scale: 1.05, rotate: 2 }}
      animate={{
        filter: [
          `drop-shadow(${sizes.glow} ${team.primaryColor}40)`,
          `drop-shadow(${sizes.glow} ${team.primaryColor}80)`,
          `drop-shadow(${sizes.glow} ${team.primaryColor}40)`,
        ],
      }}
      transition={{
        filter: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        },
      }}
    >
      {/* Hexagon background */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
          background: `${team.primaryColor}20`,
          border: `2px solid ${team.primaryColor}`,
        }}
      >
        {/* Holographic shine effect */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            background: `linear-gradient(
              135deg,
              transparent 40%,
              rgba(255, 255, 255, 0.2) 50%,
              transparent 60%
            )`,
          }}
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Team content */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          {team.logo || team.logoUrl ? (
            <img
              src={team.logo || team.logoUrl}
              alt={team.name}
              className="w-2/3 h-2/3 object-contain"
            />
          ) : (
            <span
              className={cn(
                "font-bold font-mono tracking-tighter",
                sizes.text
              )}
              style={{ color: team.primaryColor }}
            >
              {team.shortName || team.abbreviation || getTeamAbbreviation(team.name)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}
