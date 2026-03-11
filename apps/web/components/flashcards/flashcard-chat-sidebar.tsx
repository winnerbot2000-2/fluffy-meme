"use client";

import type { Flashcard, TutorSession } from "@apmicro/shared-types";
import { GlassPanel } from "@apmicro/ui";
import { Bot, LoaderCircle, SendHorizonal } from "lucide-react";
import { useEffect, useState } from "react";

import { createTutorSession, fetchTutorSessions, sendTutorMessage } from "@/lib/api";

function flashcardGraphId(flashcardId: string) {
  return `flashcard:${flashcardId}`;
}

export function FlashcardChatSidebar({
  flashcard,
}: {
  flashcard: Flashcard | null;
}) {
  const [sessions, setSessions] = useState<TutorSession[]>([]);
  const [activeSession, setActiveSession] = useState<TutorSession | null>(null);
  const [prompt, setPrompt] = useState("Quiz me on this card.");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!flashcard) {
      setSessions([]);
      setActiveSession(null);
      return;
    }

    const nextGraphId = flashcardGraphId(flashcard.id);
    fetchTutorSessions(flashcard.topicId, nextGraphId)
      .then((records) => {
        setSessions(records);
        setActiveSession(records[0] ?? null);
      })
      .catch(() => {
        setSessions([]);
        setActiveSession(null);
      });
  }, [flashcard]);

  async function ensureSession() {
    if (!flashcard) {
      return null;
    }

    if (activeSession) {
      return activeSession;
    }

    const created = await createTutorSession({
      topicId: flashcard.topicId,
      graphId: flashcardGraphId(flashcard.id),
      mode: "tutor",
      graphState: {
        kind: "flashcard",
        flashcardId: flashcard.id,
        front: flashcard.front,
        back: flashcard.back,
      },
    });
    const records = await fetchTutorSessions(flashcard.topicId, flashcardGraphId(flashcard.id));
    setSessions(records);
    setActiveSession(created);
    return created;
  }

  async function handleSend(nextPrompt?: string) {
    if (!flashcard) {
      return;
    }

    const content = (nextPrompt ?? prompt).trim();
    if (!content) {
      return;
    }

    setSending(true);
    try {
      const session = await ensureSession();
      if (!session) {
        return;
      }

      const updated = await sendTutorMessage(session.id, {
        content,
        graphContext: {
          flashcard: {
            id: flashcard.id,
            topicId: flashcard.topicId,
            front: flashcard.front,
            back: flashcard.back,
            tags: flashcard.tags,
          },
        },
      });
      const records = await fetchTutorSessions(flashcard.topicId, flashcardGraphId(flashcard.id));
      setSessions(records);
      setActiveSession(updated);
    } finally {
      setSending(false);
    }
  }

  if (!flashcard) {
    return (
      <GlassPanel className="h-full">
        <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Flashcard tutor</p>
        <div className="mt-4 rounded-[28px] border border-dashed border-white/10 bg-black/20 p-5 text-sm leading-6 text-zinc-500">
          Pick a flashcard to open a card-specific tutor thread.
        </div>
      </GlassPanel>
    );
  }

  return (
    <GlassPanel className="h-full space-y-4">
      <div className="flex items-center gap-2 text-zinc-400">
        <Bot className="h-4 w-4" />
        <p className="text-xs uppercase tracking-[0.22em]">Flashcard tutor</p>
      </div>

      <div className="rounded-[28px] border border-cyan-300/15 bg-cyan-300/8 p-4">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/80">Current card</p>
        <p className="mt-3 text-sm font-medium text-white">{flashcard.front}</p>
        <p className="mt-2 text-xs leading-5 text-zinc-300">{flashcard.back}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {["Quiz me on this card.", "Give me a memory trick.", "Explain this like I'm 12.", "Use AP exam wording."].map((item) => (
          <button
            suppressHydrationWarning
            key={item}
            type="button"
            onClick={() => void handleSend(item)}
            className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs text-zinc-100"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="max-h-[48vh] space-y-3 overflow-y-auto rounded-[28px] border border-white/10 bg-black/20 p-4">
        {(activeSession?.messages ?? []).map((message) => (
          <div key={message.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">{message.role}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-200">{message.content}</p>
          </div>
        ))}

        {!sessions.length ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-black/10 p-4 text-sm leading-6 text-zinc-500">
            No tutor thread yet for this card. Ask for a quiz, a memory trick, or AP phrasing.
          </div>
        ) : null}
      </div>

      <div className="space-y-3">
        <textarea
          suppressHydrationWarning
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={4}
          className="w-full rounded-[28px] border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 outline-none"
          placeholder="Ask the tutor to quiz you, simplify the card, or connect it to an AP graph."
        />
        <button
          suppressHydrationWarning
          type="button"
          onClick={() => void handleSend()}
          disabled={sending || !prompt.trim()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-sm text-cyan-50 disabled:opacity-60"
        >
          {sending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <SendHorizonal className="h-4 w-4" />}
          Ask about this flashcard
        </button>
      </div>
    </GlassPanel>
  );
}
