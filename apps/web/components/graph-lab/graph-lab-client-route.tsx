"use client";

import { useEffect, useState } from "react";

import { GraphLabPage } from "@/components/graph-lab/graph-lab-page";

export function GraphLabClientRoute() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="rounded-[32px] border border-white/10 bg-black/20 p-8">
          <div className="h-4 w-40 rounded-full bg-white/10" />
          <div className="mt-4 h-10 w-72 rounded-full bg-white/10" />
          <div className="mt-4 h-4 w-full max-w-3xl rounded-full bg-white/5" />
        </div>
        <div className="grid gap-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="rounded-[28px] border border-white/10 bg-white/5 p-4">
              <div className="h-4 w-24 rounded-full bg-white/10" />
              <div className="mt-3 h-3 w-full rounded-full bg-white/5" />
              <div className="mt-2 h-3 w-4/5 rounded-full bg-white/5" />
            </div>
          ))}
        </div>
        <div className="rounded-[32px] border border-white/10 bg-black/20 p-8">
          <div className="h-[480px] rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]" />
        </div>
      </div>
    );
  }

  return <GraphLabPage />;
}
