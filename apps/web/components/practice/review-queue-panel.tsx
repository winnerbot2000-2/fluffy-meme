"use client";

import type { ReviewItem } from "@apmicro/shared-types";

import { completeReviewItem } from "@/lib/api";

export function ReviewQueuePanel({
  items,
  onCompleted,
}: {
  items: ReviewItem[];
  onCompleted: () => void;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-zinc-100">{item.topicId}</p>
              <p className="mt-1 text-xs text-zinc-400">{item.reason}</p>
            </div>
            <button
              suppressHydrationWarning
              type="button"
              onClick={async () => {
                await completeReviewItem(item.id);
                onCompleted();
              }}
              className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs text-zinc-100"
            >
              Complete
            </button>
          </div>
        </div>
      ))}
      {items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
          Nothing is due right now.
        </div>
      ) : null}
    </div>
  );
}
