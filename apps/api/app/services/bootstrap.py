from __future__ import annotations

from pathlib import Path
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import ChunkORM, PracticeQuestionORM, SourceORM
from app.models.schemas import SourceRecord
from app.services.ingestion.pipeline import ingest_pdf
from app.services.repository import (
    list_topics,
    list_sources,
    sanitize_ingested_content,
    upsert_flashcards,
    upsert_practice_questions,
    upsert_progress,
    upsert_source,
)
from app.services.seed_data import seeded_flashcards, seeded_practice_questions, seeded_progress


def infer_seed_source_identity(path: Path) -> tuple[str, str, str]:
    lowered = path.name.lower()
    if "elia" in lowered or "kacapyr" in lowered:
        return (
            "source-kacapyr",
            "AP Microeconomics Review Packet by Elia Kacapyr",
            "Kacapyr",
        )
    if "krugman" in lowered:
        return (
            "source-krugman",
            "Krugman's Economics for AP",
            "Krugman AP",
        )
    if "course" in lowered or "exam" in lowered:
        return (
            "source-ced",
            "AP Microeconomics Course and Exam Description",
            "College Board CED",
        )
    return (f"source-{path.stem[:18].replace(' ', '-').lower()}", path.stem.replace("_", " ").title(), path.stem[:24])


def bootstrap_sources(session: Session) -> list[SourceRecord]:
    existing_paths = {Path(record.path).resolve() for record in list_sources(session)}

    for path in settings.configured_source_paths:
        if not path.exists():
            continue
        resolved = path.resolve()
        if resolved in existing_paths:
            continue

        lowered = path.name.lower()
        record_type = "course-guide" if "course" in lowered or "exam" in lowered else "textbook"
        if "elia" in lowered or "packet" in lowered:
            record_type = "packet"
        source_id, title, short_title = infer_seed_source_identity(path)

        upsert_source(
            session,
            SourceRecord(
                id=source_id,
                title=title,
                short_title=short_title,
                path=str(path),
                type=record_type,
                summary="Bootstrapped from the configured local PDF catalog.",
                tags=["bootstrap", "local-pdf"],
            ),
        )
    session.commit()
    return list_sources(session)


def bootstrap_study_data(session: Session) -> None:
    session.query(PracticeQuestionORM).delete()
    upsert_practice_questions(session, seeded_practice_questions(list_topics(session)))
    upsert_flashcards(session, seeded_flashcards())
    upsert_progress(session, seeded_progress())
    session.commit()


def bootstrap_pdf_ingestion(session: Session) -> None:
    existing_chunk_count = session.query(ChunkORM).count()
    if existing_chunk_count > 0:
        return

    for record in session.scalars(select(SourceORM)).all():
        path = Path(record.path)
        if path.exists():
            ingest_pdf(session, path)
    session.commit()


def bootstrap_database(session: Session) -> None:
    bootstrap_sources(session)
    bootstrap_pdf_ingestion(session)
    sanitize_ingested_content(session)
    bootstrap_study_data(session)
