from __future__ import annotations

from datetime import datetime
from pathlib import Path
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models.schemas import DocumentChunk, SourceRecord, TopicBundle
from app.services.ingestion.chunker import chunk_sections
from app.services.ingestion.classifier import classify_chunk
from app.services.ingestion.formula_mentions import detect_formula_mentions
from app.services.ingestion.graph_mentions import detect_graph_mentions
from app.services.ingestion.merger import merge_chunks_into_topics
from app.services.ingestion.pdf_parser import extract_sections
from app.services.repository import get_source_by_path, list_topics, replace_chunks_for_source, upsert_source, upsert_topics


def infer_source_type(path: Path) -> str:
    lowered = path.name.lower()
    if "course" in lowered or "exam" in lowered:
        return "course-guide"
    if "packet" in lowered or "elia" in lowered:
        return "packet"
    return "textbook"


def ingest_pdf(session: Session, file_path: Path) -> tuple[SourceRecord, int]:
    parsed = extract_sections(file_path)
    existing = get_source_by_path(session, str(file_path))
    resolved_title = parsed.title or (existing.title if existing else file_path.stem)
    source_record = SourceRecord(
        id=existing.id if existing else f"source-{uuid4().hex[:10]}",
        title=resolved_title,
        short_title=((parsed.title or file_path.stem)[:24] if not existing else existing.short_title),
        path=str(file_path),
        type=existing.type if existing else infer_source_type(file_path),
        summary=existing.summary if existing else "Ingested PDF source ready for merged topic retrieval.",
        tags=sorted({*(existing.tags if existing else []), "uploaded-pdf"}),
        uploaded_at=existing.uploaded_at if existing else datetime.utcnow(),
        last_processed_at=datetime.utcnow(),
    )
    source = upsert_source(session, source_record)
    session.flush()

    chunks = chunk_sections(parsed.sections, source.id)
    enriched_chunks: list[DocumentChunk] = []
    for chunk in chunks:
        chunk.topic_candidates = classify_chunk(chunk)
        chunk.graph_mentions = detect_graph_mentions(chunk.text)
        chunk.formula_mentions = detect_formula_mentions(chunk.text)
        enriched_chunks.append(chunk)

    replace_chunks_for_source(session, source.id, [chunk.model_dump(mode="python") for chunk in enriched_chunks])

    raw_bundles = merge_chunks_into_topics(enriched_chunks)
    existing_topics = {topic.id: topic for topic in list_topics(session)}
    merged_bundles: list[TopicBundle] = []
    for bundle in raw_bundles:
        existing_bundle = existing_topics.get(bundle.id)
        if existing_bundle is None:
            merged_bundles.append(bundle)
            continue
        merged_bundles.append(
            existing_bundle.model_copy(
                update={
                    "summary": (existing_bundle.summary + " " + bundle.summary).strip()[:240],
                    "source_ids": sorted({*existing_bundle.source_ids, *bundle.source_ids}),
                    "chunk_ids": sorted({*existing_bundle.chunk_ids, *bundle.chunk_ids}),
                    "explanation_variants": [*existing_bundle.explanation_variants, *bundle.explanation_variants][:8],
                    "graph_mentions": sorted({*existing_bundle.graph_mentions, *bundle.graph_mentions}),
                    "formula_mentions": sorted({*existing_bundle.formula_mentions, *bundle.formula_mentions}),
                }
            )
        )

    upsert_topics(session, merged_bundles)
    session.commit()
    return source_record, len(merged_bundles)
