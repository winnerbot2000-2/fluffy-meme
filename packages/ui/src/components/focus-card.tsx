import type { PropsWithChildren } from "react";

import { GlassPanel } from "./glass-panel";

export function FocusCard({
  title,
  caption,
  children,
}: PropsWithChildren<{ title: string; caption: string }>) {
  return (
    <GlassPanel className="h-full">
      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{caption}</p>
      <h3 className="mt-2 text-lg font-medium text-white">{title}</h3>
      <div className="mt-4 text-sm leading-6 text-zinc-300">{children}</div>
    </GlassPanel>
  );
}
