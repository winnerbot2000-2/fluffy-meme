import type { PropsWithChildren, ReactNode } from "react";

import { cn } from "../lib/cn";
import { GlassPanel } from "./glass-panel";

export function GraphCard({
  title,
  eyebrow,
  controls,
  children,
  className,
}: PropsWithChildren<{
  title: string;
  eyebrow: string;
  controls?: ReactNode;
  className?: string;
}>) {
  return (
    <GlassPanel className={cn("overflow-hidden", className)} glow>
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{eyebrow}</p>
          <h3 className="mt-2 font-display text-2xl text-zinc-50">{title}</h3>
        </div>
        {controls}
      </div>
      <div className="pt-5">{children}</div>
    </GlassPanel>
  );
}
