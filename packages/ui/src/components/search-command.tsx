"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { SearchResult } from "@apmicro/shared-types";
import { Command, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

export function SearchCommand({
  results,
  open,
  onOpenChange,
}: {
  results: SearchResult[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) {
      return results;
    }

    const normalized = query.toLowerCase();
    return results.filter((result) => {
      return [result.title, result.summary, result.kind].some((field) => field.toLowerCase().includes(normalized));
    });
  }, [query, results]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md" />
        <Dialog.Content className="fixed left-1/2 top-[12vh] z-50 w-[min(720px,calc(100vw-2rem))] -translate-x-1/2 rounded-[28px] border border-white/10 bg-[#0a0e13]/95 p-4 shadow-2xl">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <Search className="h-4 w-4 text-zinc-400" />
            <input
              suppressHydrationWarning
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search graphs, formulas, topics, or AP traps"
              className="w-full bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
            />
            <div className="inline-flex items-center gap-1 rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.24em] text-zinc-500">
              <Command className="h-3 w-3" />
              K
            </div>
          </div>

          <div className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto pr-1">
            {filtered.map((result) => (
              <Link
                key={result.id}
                href={result.href}
                onClick={() => onOpenChange(false)}
                className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-3 transition hover:bg-white/8"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-zinc-50">{result.title}</p>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.22em] text-zinc-500">
                    {result.kind}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-zinc-400">{result.summary}</p>
              </Link>
            ))}

            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-zinc-500">
                No matching topic or graph yet. Try a unit name, a formula, or a graph type.
              </div>
            ) : null}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
