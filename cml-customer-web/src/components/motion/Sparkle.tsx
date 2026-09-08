"use client";

import { motion, useReducedMotion } from "framer-motion";

export function Sparkle({
  className,
  size = 16,
  delay = 0,
  color = "var(--color-gold)",
}: {
  className?: string;
  size?: number;
  delay?: number;
  color?: string;
}) {
  const reduce = useReducedMotion();

  return (
    <motion.svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      aria-hidden
      animate={
        reduce
          ? undefined
          : {
              opacity: [0.35, 1, 0.35],
              scale: [0.85, 1, 0.85],
            }
      }
      transition={
        reduce
          ? undefined
          : {
              duration: 3,
              delay,
              repeat: Infinity,
              ease: "easeInOut",
            }
      }
      style={reduce ? { opacity: 0.7 } : undefined}
    >
      <path
        d="M12 0 L14 9 L24 12 L14 15 L12 24 L10 15 L0 12 L10 9 Z"
        fill={color}
      />
    </motion.svg>
  );
}
