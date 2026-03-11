import type { Source } from "@apmicro/shared-types";

import { cn } from "../lib/cn";

export function SourceBadge({ source, className }: { source: Source; className?: string }) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100",
        className,
      )}
    >
      <span className="h-2 w-2 rounded-full bg-cyan-300" />
      <span>{source.shortTitle}</span>
    </div>
  );
}
