"use client";

import { sources } from "@apmicro/content-core";
import { GlassPanel, SourceBadge, TopBar, UploadDropzone } from "@apmicro/ui";
import { LoaderCircle, UploadCloud } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { fetchIngestionStats, fetchSources } from "@/lib/api";
import { useApiResource } from "@/lib/hooks/use-api-resource";

type UploadState = {
  name: string;
  status: "queued" | "uploading" | "done" | "error";
  message: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

export function LibraryPage() {
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const sourceState = useApiResource({
    loader: fetchSources,
    initialValue: sources,
  });
  const statsState = useApiResource({
    loader: fetchIngestionStats,
    initialValue: {
      sourceCount: sources.length,
      topicCount: 0,
      chunkCount: 0,
      latestProcessedAt: undefined,
    },
  });

  async function refreshLibrary() {
    sourceState.setData(await fetchSources());
    statsState.setData(await fetchIngestionStats());
  }

  async function handleFiles(fileList: FileList) {
    const files = Array.from(fileList);
    setUploads(files.map((file) => ({ name: file.name, status: "queued", message: "Waiting to upload" })));

    for (const file of files) {
      setUploads((current) =>
        current.map((item) =>
          item.name === file.name ? { ...item, status: "uploading", message: "Uploading and classifying" } : item,
        ),
      );

      try {
        const formData = new FormData();
        formData.append("files", file);
        const response = await fetch(`${API_BASE_URL}/api/uploads/pdf`, {
          method: "POST",
          body: formData,
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.detail ?? "Upload failed");
        }

        setUploads((current) =>
          current.map((item) =>
            item.name === file.name
              ? { ...item, status: "done", message: `Processed into ${payload.processedCount ?? 0} topic bundles` }
              : item,
          ),
        );
        await refreshLibrary();
      } catch (error) {
        setUploads((current) =>
          current.map((item) =>
            item.name === file.name
              ? {
                  ...item,
                  status: "error",
                  message: error instanceof Error ? error.message : "Upload failed",
                }
              : item,
          ),
        );
      }
    }
  }

  return (
    <div className="space-y-6">
      <TopBar
        title="Source Library and Ingestion"
        subtitle="Upload multiple PDFs, inspect source metadata, and monitor the merge pipeline that turns chapters and packets into topic-aware knowledge."
      />

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <UploadDropzone onFiles={handleFiles} />

        <GlassPanel className="space-y-4">
          <div className="flex items-center gap-2 text-zinc-400">
            <UploadCloud className="h-4 w-4" />
            <p className="text-xs uppercase tracking-[0.22em]">Ingestion pipeline</p>
          </div>
          <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/8 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-100/70">Live stats</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-2xl font-medium text-white">{statsState.data.sourceCount}</p>
                <p className="text-xs text-zinc-400">sources</p>
              </div>
              <div>
                <p className="text-2xl font-medium text-white">{statsState.data.topicCount}</p>
                <p className="text-xs text-zinc-400">topic bundles</p>
              </div>
              <div>
                <p className="text-2xl font-medium text-white">{statsState.data.chunkCount}</p>
                <p className="text-xs text-zinc-400">chunks</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {[
              "1. PDF parsing with heading and section extraction",
              "2. Chunking, graph mention detection, and formula mention detection",
              "3. Topic classification against AP Micro unit taxonomy",
              "4. Source-aware merge into unified topic bundles",
              "5. Storage for retrieval, practice generation, tutor sessions, and notebook state",
            ].map((step) => (
              <div key={step} className="rounded-3xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-200">
                {step}
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      {uploads.length > 0 ? (
        <GlassPanel className="space-y-4">
          <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Upload queue</p>
          <div className="grid gap-3">
            {uploads.map((upload) => (
              <div key={upload.name} className="flex items-center justify-between gap-4 rounded-3xl border border-white/10 bg-black/20 p-4">
                <div>
                  <p className="text-sm font-medium text-white">{upload.name}</p>
                  <p className="mt-1 text-xs text-zinc-400">{upload.message}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-zinc-300">
                  {upload.status === "uploading" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : null}
                  <span>{upload.status}</span>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        {sourceState.data.map((source) => (
          <Link key={source.id} href={`/library/source/${source.id}`} className="block">
            <GlassPanel className="h-full transition hover:bg-white/8">
              <div className="flex items-center justify-between gap-3">
                <SourceBadge source={source} />
                <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-zinc-500">{source.type}</span>
              </div>
              <h3 className="mt-4 text-lg font-medium text-white">{source.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{source.summary}</p>
              <div className="mt-4 rounded-3xl border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-zinc-500">Path</p>
                <p className="mt-2 break-all text-xs text-zinc-400">{source.path}</p>
              </div>
              <p className="mt-4 text-xs uppercase tracking-[0.2em] text-cyan-100/80">Open in source reader</p>
            </GlassPanel>
          </Link>
        ))}
      </div>
    </div>
  );
}
