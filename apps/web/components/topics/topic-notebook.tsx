"use client";

import type { Note } from "@apmicro/shared-types";
import { GlassPanel } from "@apmicro/ui";
import { useEffect, useState } from "react";

import { fetchNotes, saveNote } from "@/lib/api";

export function TopicNotebook({
  topicId,
  graphId,
}: {
  topicId: string;
  graphId?: string;
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("New note");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotes(topicId).then(setNotes).catch(() => undefined);
  }, [topicId]);

  async function handleSave() {
    setSaving(true);
    try {
      await saveNote(topicId, { title, body, pinnedGraphId: graphId, bookmarked: true });
      setNotes(await fetchNotes(topicId));
      setBody("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <GlassPanel className="h-full">
      <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Notebook</p>
      <div className="mt-4 space-y-3">
        <input
          suppressHydrationWarning
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 outline-none"
          placeholder="Note title"
        />
        <textarea
          suppressHydrationWarning
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={5}
          className="w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-zinc-100 outline-none"
          placeholder="Capture your own AP wording, graph logic, or a trap you want to remember."
        />
        <button
          suppressHydrationWarning
          type="button"
          onClick={handleSave}
          disabled={saving || !body.trim()}
          className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-50 disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save note"}
        </button>
      </div>

      <div className="mt-5 space-y-3">
        {notes.map((note) => (
          <div key={note.id} className="rounded-3xl border border-white/10 bg-black/20 p-4">
            <p className="text-sm font-medium text-white">{note.title}</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{note.body}</p>
          </div>
        ))}
        {notes.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/10 bg-black/20 p-4 text-sm text-zinc-500">
            No saved notes yet for this topic.
          </div>
        ) : null}
      </div>
    </GlassPanel>
  );
}
