"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

interface BackgroundEffectsProps {
  className?: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
}

export function BackgroundEffects({ className }: BackgroundEffectsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framerReducedMotion = useReducedMotion();
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const isReducedMotion = prefersReducedMotion || !!framerReducedMotion;
  const particlesRef = useRef<Particle[]>([]);
  const animationRef = useRef<number | null>(null);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Initialize particles
  useEffect(() => {
    if (isReducedMotion) return;

    const colors = [
      "rgba(0, 217, 255, ",
      "rgba(57, 255, 20, ",
      "rgba(255, 0, 110, ",
      "rgba(255, 215, 0, ",
    ];

    // Create initial particles
    const particleCount = 50;
    particlesRef.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
    }));
  }, [prefersReducedMotion]);

  // Animation loop
  useEffect(() => {
    if (prefersReducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    let frameCount = 0;
    const animate = () => {
      frameCount++;
      // Render every 2nd frame for performance (30fps instead of 60)
      if (frameCount % 2 === 0) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        particlesRef.current.forEach((particle) => {
          // Update position
          particle.x += particle.vx;
          particle.y += particle.vy;

          // Wrap around screen
          if (particle.x < 0) particle.x = canvas.width;
          if (particle.x > canvas.width) particle.x = 0;
          if (particle.y < 0) particle.y = canvas.height;
          if (particle.y > canvas.height) particle.y = 0;

          // Draw particle
          ctx.beginPath();
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
          ctx.fillStyle = `${particle.color}${particle.opacity})`;
          ctx.fill();

          // Glow effect
          ctx.shadowBlur = 10;
          ctx.shadowColor = `${particle.color}0.5)`;
        });

        // Reset shadow for performance
        ctx.shadowBlur = 0;

        // Draw connecting lines between close particles
        particlesRef.current.forEach((p1, i) => {
          particlesRef.current.slice(i + 1).forEach((p2) => {
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = `rgba(0, 217, 255, ${0.1 * (1 - distance / 100)})`;
              ctx.stroke();
            }
          });
        });
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [prefersReducedMotion]);

  if (prefersReducedMotion) {
    return (
      <div
        className={cn(
          "fixed inset-0 pointer-events-none z-[-1]",
          className
        )}
        style={{
          background: "radial-gradient(ellipse at center, #0a0e27 0%, #050714 100%)",
        }}
      />
    );
  }

  return (
    <div
      className={cn("fixed inset-0 pointer-events-none z-[-1]", className)}
      style={{
        background: "radial-gradient(ellipse at center, #0a0e27 0%, #050714 100%)",
      }}
    >
      {/* Canvas for particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ opacity: 0.6 }}
      />

      {/* CSS-based floating hexagons */}
      {!isReducedMotion && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                background: `linear-gradient(135deg, rgba(0, 217, 255, 0.05), transparent)`,
                border: "1px solid rgba(0, 217, 255, 0.1)",
                width: 100 + i * 50,
                height: 100 + i * 50,
                left: `${10 + i * 15}%`,
                top: `${20 + (i % 3) * 20}%`,
              }}
              animate={{
                y: [0, -30, 0],
                rotate: [0, 5, 0],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 8 + i * 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
            />
          ))}
        </div>
      )}

      {/* Neon grid lines - football field pattern */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(0deg, rgba(0, 217, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 217, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: "100px 100px",
          maskImage: "radial-gradient(ellipse at center, black 30%, transparent 70%)",
        }}
      />

      {/* Gradient mesh overlay */}
      <motion.div
        className="absolute inset-0"
        animate={
          isReducedMotion
            ? {}
            : {
                background: [
                  "radial-gradient(circle at 20% 80%, rgba(0, 217, 255, 0.05) 0%, transparent 50%)",
                  "radial-gradient(circle at 80% 20%, rgba(255, 0, 110, 0.05) 0%, transparent 50%)",
                  "radial-gradient(circle at 50% 50%, rgba(255, 215, 0, 0.05) 0%, transparent 50%)",
                  "radial-gradient(circle at 20% 80%, rgba(0, 217, 255, 0.05) 0%, transparent 50%)",
                ],
              }
        }
        transition={
          isReducedMotion
            ? { duration: 0 }
            : {
                duration: 20,
                repeat: Infinity,
                ease: "linear",
              }
        }
      />

      {/* Vignette effect */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 0%, rgba(5, 7, 20, 0.8) 100%)",
        }}
      />
    </div>
  );
}
