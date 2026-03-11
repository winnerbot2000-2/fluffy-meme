from pathlib import Path

import fitz
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models.schemas import (
    IngestionStats,
    SourcePageLine,
    SourcePageRecord,
    SourceRecord,
    SourceSelectionAssistRequest,
    SourceSelectionAssistResponse,
    TopicReferenceRecord,
)
from app.services.ingestion.text_cleaning import clean_text, compact_excerpt, tokenize_highlight
from app.services.repository import get_ingestion_stats, get_topic_by_slug, list_sources

router = APIRouter(prefix="/api/sources", tags=["sources"])


@router.get("", response_model=list[SourceRecord])
def get_sources(session: Session = Depends(get_db_session)) -> list[SourceRecord]:
    return list_sources(session)


@router.get("/stats", response_model=IngestionStats)
def get_source_stats(session: Session = Depends(get_db_session)) -> IngestionStats:
    return get_ingestion_stats(session)


def _get_source_or_404(session: Session, source_id: str) -> SourceRecord:
    source = next((item for item in list_sources(session) if item.id == source_id), None)
    if source is None:
        raise HTTPException(status_code=404, detail="Source not found")
    return source


@router.get("/{source_id}/pdf")
def stream_source_pdf(source_id: str, session: Session = Depends(get_db_session)) -> FileResponse:
    source = _get_source_or_404(session, source_id)
    path = Path(source.path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found on disk")
    return FileResponse(path, media_type="application/pdf", filename=path.name)


@router.get("/{source_id}/page/{page_number}", response_model=SourcePageRecord)
def get_source_page(source_id: str, page_number: int, highlight: str | None = None, session: Session = Depends(get_db_session)) -> SourcePageRecord:
    source = _get_source_or_404(session, source_id)
    path = Path(source.path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="PDF file not found on disk")

    with fitz.open(path) as document:
        if page_number < 1 or page_number > document.page_count:
            raise HTTPException(status_code=400, detail="Page number out of range")

        page = document.load_page(page_number - 1)
        page_text = clean_text(page.get_text("text"))
        highlight_tokens = tokenize_highlight(highlight or "")

        lines: list[SourcePageLine] = []
        for index, raw_line in enumerate(page_text.split("\n"), start=1):
            line = clean_text(raw_line)
            if not line:
                continue
            normalized_line = line.lower()
            highlighted = False
            if highlight_tokens:
                overlap = sum(1 for token in highlight_tokens if token in normalized_line)
                highlighted = overlap >= min(3, len(highlight_tokens))
            lines.append(SourcePageLine(index=index, text=line, highlighted=highlighted))

        heading = next((line.text for line in lines[:6] if len(line.text) < 120), None)
        source_with_page_count = source.model_copy(update={"page_count": document.page_count})
        return SourcePageRecord(
            source=source_with_page_count,
            page_number=page_number,
            total_pages=document.page_count,
            heading=heading,
            lines=lines,
            highlight_text=highlight,
        )


@router.post("/assist", response_model=SourceSelectionAssistResponse)
def assist_with_selection(
    payload: SourceSelectionAssistRequest,
    session: Session = Depends(get_db_session),
) -> SourceSelectionAssistResponse:
    text = clean_text(payload.text)
    if not text:
        raise HTTPException(status_code=400, detail="Selection text is empty")

    source = _get_source_or_404(session, payload.source_id) if payload.source_id else None
    topic = get_topic_by_slug(session, payload.topic_slug) if payload.topic_slug else None

    if payload.action == "summarize":
        first_sentence = text.split(". ")[0].strip().rstrip(".")
        response = f"{first_sentence}."
        title = "One-sentence summary"
    elif payload.action == "explain-simple":
        source_name = source.short_title if source else "the selected source"
        response = f"This section is saying that {text.split('. ')[0].lower().rstrip('.')}, and in plain AP Micro terms you should connect that idea to the graph, formula, or market rule the question is testing."
        title = f"Explain simply from {source_name}"
    elif payload.action == "tutor-help":
        topic_title = topic.title if topic else "this AP Micro idea"
        source_label = f" using {source.short_title}" if source else ""
        response = (
            f"Tutor help for {topic_title}{source_label}: start by rewriting the selection in your own words, "
            f"then connect it to the graph, formula, or decision rule being tested. In this case, focus on '{compact_excerpt(text, 90)}' "
            f"and explain what changes, what stays fixed, and what AP wording would sound like."
        )
        title = "AI tutor help"
    else:
        topic_title = topic.title if topic else "AP Microeconomics"
        source_label = f" in {source.short_title}" if source else ""
        response = f"This selection connects to {topic_title}{source_label}. The likely AP angle is to translate the wording into a graph move, a decision rule, or a welfare effect, then justify it with evidence from the source and the graph."
        title = "Link to AP Micro"

    citations: list[TopicReferenceRecord] = []
    if source and payload.page_number:
        citations.append(
            TopicReferenceRecord(
                id=f"assist-{source.id}-{payload.page_number}",
                source_id=source.id,
                source_title=source.title,
                source_short_title=source.short_title,
                page_number=payload.page_number,
                heading=topic.title if topic else source.title,
                excerpt=compact_excerpt(text),
                highlight_text=compact_excerpt(text, 120),
            )
        )

    return SourceSelectionAssistResponse(title=title, response=response, citations=citations)
