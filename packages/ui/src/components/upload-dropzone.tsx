"use client";

import { UploadCloud } from "lucide-react";
import type { DragEvent } from "react";
import { useRef } from "react";

import { cn } from "../lib/cn";

export function UploadDropzone({
  onFiles,
  className,
}: {
  onFiles: (files: FileList) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    if (event.dataTransfer.files.length > 0) {
      onFiles(event.dataTransfer.files);
    }
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(event) => event.preventDefault()}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "cursor-pointer rounded-[28px] border border-dashed border-cyan-300/25 bg-cyan-300/5 p-8 text-center transition hover:bg-cyan-300/8",
        className,
      )}
    >
      <input
        suppressHydrationWarning
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        onChange={(event) => {
          if (event.target.files) {
            onFiles(event.target.files);
          }
        }}
        className="hidden"
      />
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl border border-white/10 bg-white/10 text-cyan-100">
        <UploadCloud className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-white">Drop AP Micro PDFs here</h3>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        Upload multiple textbooks, packets, or notes. The ingestion pipeline will chunk, classify, and merge overlapping topics.
      </p>
    </div>
  );
}
