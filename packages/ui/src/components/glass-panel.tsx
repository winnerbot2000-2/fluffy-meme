"use client";

import { motion } from "framer-motion";
import type { PropsWithChildren } from "react";

import { cn } from "../lib/cn";

type GlassPanelProps = PropsWithChildren<{
  className?: string;
  glow?: boolean;
}>;

export function GlassPanel({ children, className, glow = false }: GlassPanelProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: "easeOut" }}
      className={cn(
        "relative rounded-[28px] border border-white/10 bg-white/6 p-5 backdrop-blur-xl",
        "shadow-[0_30px_120px_-48px_rgba(30,41,59,0.95)]",
        glow &&
          "before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(244,114,182,0.14),transparent_36%)]",
        className,
      )}
    >
      {children}
    </motion.section>
  );
}
