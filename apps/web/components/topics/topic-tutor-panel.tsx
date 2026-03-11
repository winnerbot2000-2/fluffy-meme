"use client";

import type { TutorSession } from "@apmicro/shared-types";
import { GlassPanel } from "@apmicro/ui";
import { useEffect, useState } from "react";

import { createTutorSession, fetchTutorSessions, sendTutorMessage } from "@/lib/api";

export function TopicTutorPanel({
  topicId,
  graphId,
}: {
  topicId: string;
  graphId?: string;
}) {
  const [sessions, setSessions] = useState<TutorSession[]>([]);
  const [activeSession, setActiveSession] = useState<TutorSession | null>(null);
  const [prompt, setPrompt] = useState("Give me a hint-first explanation for this topic.");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchTutorSessions(topicId).then((records) => {
      setSessions(records);
      setActiveSession(records[0] ?? null);
    });
  }, [topicId]);

  async function ensureSession() {
    if (activeSession) {
      return activeSession;
    }
    const created = await createTutorSession({ topicId, graphId, mode: "tutor" });
    const records = await fetchTutorSessions(topicId);
    setSessions(records);
    setActiveSession(created);
    return created;
  }

  async function handleSend() {
    setSending(true);
    try {
      const session = await ensureSession();
      const updated = await sendTutorMessage(session.id, {
        content: prompt,
        graphContext: graphId ? { graphId } : undefined,
      });
      const records = await fetchTutorSessions(topicId);
      setSessions(records);
      setActiveSession(updated);
    } finally {
      setSending(false);
    }
  }

  return (
    <GlassPanel className="h-full">
      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Tutor mode</p>
      <div className="mt-4 space-y-3">
        <textarea
          suppressHydrationWarning
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={4}
          className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 outline-none"
          placeholder="Ask for hints, exam wording, graph help, or a simpler explanation."
        />
        <button
          suppressHydrationWarning
          type="button"
          onClick={handleSend}
          disabled={sending || !prompt.trim()}
          className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-zinc-100 disabled:opacity-60"
        >
          {sending ? "Sending..." : "Ask tutor"}
        </button>
      </div>
      <div className="mt-5 space-y-3">
        {(activeSession?.messages ?? []).map((message) => (
          <div key={message.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{message.role}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-200">{message.content}</p>
          </div>
        ))}
        {!activeSession ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
            No tutor session for this topic yet.
          </div>
        ) : null}
      </div>
    </GlassPanel>
  );
}
