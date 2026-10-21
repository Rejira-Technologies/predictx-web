"use client";

import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface PageTransitionProps {
    children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
    const pathname = usePathname();
    const shouldReduce = useReducedMotion();

    useEffect(() => {
        const main = document.getElementById("main");
        if (main) {
            main.focus();
        }
    }, [pathname]);

    const variants = shouldReduce
        ? {
            initial: { opacity: 0 },
            animate: { opacity: 1 },
            exit: { opacity: 0 },
        }
        : {
            initial: { opacity: 0, scale: 0.98 },
            animate: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 0.98 },
        };

    return (
        <AnimatePresence mode="wait" initial={false}>
            <motion.div
                key={pathname}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{
                    duration: shouldReduce ? 0.1 : 0.25,
                    ease: "easeOut",
                }}
                style={{ minHeight: "100%", width: "100%" }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
