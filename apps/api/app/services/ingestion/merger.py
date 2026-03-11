from __future__ import annotations

from app.models.schemas import DocumentChunk, TopicBundle
from app.services.ingestion.taxonomy import AP_TOPIC_TAXONOMY


def merge_chunks_into_topics(chunks: list[DocumentChunk]) -> list[TopicBundle]:
    grouped: dict[str, list[DocumentChunk]] = {}
    for chunk in chunks:
        if not chunk.topic_candidates:
            continue
        slug = chunk.topic_candidates[0]
        grouped.setdefault(slug, []).append(chunk)

    bundles: list[TopicBundle] = []
    for slug, grouped_chunks in grouped.items():
        taxonomy_info = AP_TOPIC_TAXONOMY.get(slug, {"title": slug.replace("-", " ").title(), "unit_id": None})
        combined_text = " ".join(chunk.text for chunk in grouped_chunks)
        bundles.append(
            TopicBundle(
                id=slug,
                unit_id=taxonomy_info.get("unit_id"),
                topic_slug=slug,
                title=taxonomy_info["title"],
                summary=combined_text[:240].strip(),
                source_ids=sorted({chunk.source_id for chunk in grouped_chunks}),
                chunk_ids=[chunk.id for chunk in grouped_chunks],
                explanation_variants=[chunk.text[:400].strip() for chunk in grouped_chunks[:4]],
                graph_mentions=sorted({item for chunk in grouped_chunks for item in chunk.graph_mentions}),
                formula_mentions=sorted({item for chunk in grouped_chunks for item in chunk.formula_mentions}),
            )
        )

    return bundles
