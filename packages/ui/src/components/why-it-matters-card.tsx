import { GlassPanel } from "./glass-panel";

export function WhyItMattersCard({ message }: { message: string }) {
  return (
    <GlassPanel className="h-full">
      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Why this matters</p>
      <p className="mt-3 text-sm leading-6 text-zinc-100">{message}</p>
    </GlassPanel>
  );
}
