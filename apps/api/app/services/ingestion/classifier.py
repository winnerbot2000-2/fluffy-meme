from __future__ import annotations

from app.models.schemas import DocumentChunk
from app.services.ingestion.taxonomy import AP_TOPIC_TAXONOMY


def classify_chunk(chunk: DocumentChunk) -> list[str]:
    text = f"{chunk.heading}\n{chunk.text}".lower()
    scores: dict[str, int] = {}

    for slug, info in AP_TOPIC_TAXONOMY.items():
        score = sum(1 for keyword in info["keywords"] if keyword.lower() in text)
        if score:
            scores[slug] = score

    ranked = sorted(scores.items(), key=lambda item: item[1], reverse=True)
    return [slug for slug, _ in ranked[:3]]
