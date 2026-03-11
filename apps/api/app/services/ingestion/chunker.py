from __future__ import annotations

from uuid import uuid4

from app.models.schemas import DocumentChunk, SectionBlock
from app.services.ingestion.text_cleaning import clean_text


def chunk_sections(sections: list[SectionBlock], source_id: str, max_chars: int = 1400) -> list[DocumentChunk]:
    chunks: list[DocumentChunk] = []

    for section in sections:
        paragraphs = [paragraph.strip() for paragraph in section.text.split("\n") if paragraph.strip()]
        buffer: list[str] = []
        buffer_chars = 0

        for paragraph in paragraphs:
            paragraph = clean_text(paragraph)
            if not paragraph:
                continue
            if buffer and buffer_chars + len(paragraph) > max_chars:
                text = "\n".join(buffer)
                chunks.append(
                    DocumentChunk(
                        id=f"chunk-{uuid4().hex[:10]}",
                        source_id=source_id,
                        page_start=section.page,
                        page_end=section.page,
                        heading=clean_text(section.heading),
                        text=text,
                        estimated_tokens=max(len(text) // 4, 1),
                    )
                )
                buffer = []
                buffer_chars = 0

            buffer.append(paragraph)
            buffer_chars += len(paragraph)

        if buffer:
            text = "\n".join(buffer)
            chunks.append(
                DocumentChunk(
                    id=f"chunk-{uuid4().hex[:10]}",
                    source_id=source_id,
                    page_start=section.page,
                    page_end=section.page,
                    heading=clean_text(section.heading),
                    text=text,
                    estimated_tokens=max(len(text) // 4, 1),
                )
            )

    return chunks
