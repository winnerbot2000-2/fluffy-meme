from __future__ import annotations

import math
from datetime import datetime, timedelta
from uuid import uuid4

from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.db.models import (
    ChunkORM,
    FlashcardORM,
    NoteORM,
    PracticeAttemptORM,
    PracticeQuestionORM,
    ProgressORM,
    ReviewItemORM,
    SourceORM,
    TopicBundleORM,
    TutorMessageORM,
    TutorSessionORM,
)
from app.models.schemas import (
    DashboardOverview,
    FlashcardImportRequest,
    FlashcardRecord,
    IngestionStats,
    NoteRecord,
    NoteUpsert,
    PracticeAttemptCreate,
    PracticeAttemptRecord,
    PracticeQuestionRecord,
    ProgressRecord,
    ReviewItemRecord,
    SearchHit,
    SourceRecord,
    TopicReferenceRecord,
    TopicBundle,
    TutorMessageCreate,
    TutorMessageRecord,
    TutorSessionCreate,
    TutorSessionRecord,
)
from app.services.ingestion.text_cleaning import clean_text, compact_excerpt


def _source_record(source: SourceORM) -> SourceRecord:
    return SourceRecord(
        id=source.id,
        title=source.title,
        short_title=source.short_title,
        path=source.path,
        type=source.type,
        summary=clean_text(source.summary),
        tags=source.tags or [],
        uploaded_at=source.uploaded_at,
        last_processed_at=source.last_processed_at,
    )


def _topic_record(topic: TopicBundleORM) -> TopicBundle:
    return TopicBundle(
        id=topic.id,
        unit_id=topic.unit_id,
        topic_slug=topic.topic_slug,
        title=clean_text(topic.title),
        summary=clean_text(topic.summary),
        source_ids=topic.source_ids or [],
        chunk_ids=topic.chunk_ids or [],
        explanation_variants=[clean_text(item) for item in (topic.explanation_variants or []) if clean_text(item)],
        graph_mentions=[clean_text(item) for item in (topic.graph_mentions or []) if clean_text(item)],
        formula_mentions=[clean_text(item) for item in (topic.formula_mentions or []) if clean_text(item)],
    )


def _practice_record(question: PracticeQuestionORM) -> PracticeQuestionRecord:
    return PracticeQuestionRecord(
        id=question.id,
        topic_id=question.topic_id,
        unit_id=question.unit_id,
        type=question.type,
        origin=question.origin,
        stem=clean_text(question.stem),
        prompt=clean_text(question.prompt) if question.prompt else None,
        choices=[clean_text(choice) for choice in question.choices] if question.choices else None,
        answer=clean_text(question.answer),
        explanation=clean_text(question.explanation),
        trap=clean_text(question.trap) if question.trap else None,
        difficulty=question.difficulty,
        source_ids=question.source_ids or [],
        rubric=[clean_text(item) for item in (question.rubric or []) if clean_text(item)],
        graph_interaction=question.graph_interaction,
    )


def _flashcard_record(card: FlashcardORM) -> FlashcardRecord:
    return FlashcardRecord(
        id=card.id,
        topic_id=card.topic_id,
        front=card.front,
        back=card.back,
        difficulty=card.difficulty,
        tags=card.tags or [],
        due_at=card.due_at,
        interval_days=card.interval_days,
        ease_factor=card.ease_factor,
        review_count=card.review_count,
        last_reviewed_at=card.last_reviewed_at,
    )


def _note_record(note: NoteORM) -> NoteRecord:
    return NoteRecord(
        id=note.id,
        topic_id=note.topic_id,
        title=note.title,
        body=note.body,
        pinned_graph_id=note.pinned_graph_id,
        bookmarked=note.bookmarked,
        created_at=note.created_at,
        updated_at=note.updated_at,
    )


def _progress_record(progress: ProgressORM) -> ProgressRecord:
    return ProgressRecord(
        id=progress.id,
        topic_id=progress.topic_id,
        confidence=progress.confidence,
        mastery=progress.mastery,
        last_studied_at=progress.last_studied_at,
        streak_days=progress.streak_days,
        weak_spots=progress.weak_spots or [],
        completed_question_ids=progress.completed_question_ids or [],
    )


def _review_record(item: ReviewItemORM) -> ReviewItemRecord:
    return ReviewItemRecord(
        id=item.id,
        item_type=item.item_type,
        item_id=item.item_id,
        topic_id=item.topic_id,
        due_at=item.due_at,
        priority=item.priority,
        reason=item.reason,
        completed=item.completed,
    )


def _tutor_message_record(message: TutorMessageORM) -> TutorMessageRecord:
    return TutorMessageRecord(
        id=message.id,
        role=message.role,
        content=message.content,
        graph_context=message.graph_context,
        created_at=message.created_at,
    )


def _tutor_session_record(session: TutorSessionORM) -> TutorSessionRecord:
    return TutorSessionRecord(
        id=session.id,
        topic_id=session.topic_id,
        graph_id=session.graph_id,
        mode=session.mode,
        graph_state=session.graph_state,
        created_at=session.created_at,
        updated_at=session.updated_at,
        messages=[_tutor_message_record(message) for message in session.messages],
    )


def list_sources(session: Session) -> list[SourceRecord]:
    return [_source_record(item) for item in session.scalars(select(SourceORM).order_by(SourceORM.title)).all()]


def get_source_by_path(session: Session, path: str) -> SourceORM | None:
    return session.scalar(select(SourceORM).where(SourceORM.path == path))


def upsert_source(session: Session, record: SourceRecord) -> SourceORM:
    existing = session.get(SourceORM, record.id) or get_source_by_path(session, record.path)
    if existing:
        existing.title = record.title
        existing.short_title = record.short_title
        existing.path = record.path
        existing.type = record.type
        existing.summary = record.summary
        existing.tags = record.tags
        existing.uploaded_at = record.uploaded_at
        existing.last_processed_at = record.last_processed_at
        session.add(existing)
        return existing

    source = SourceORM(
        id=record.id,
        title=record.title,
        short_title=record.short_title,
        path=record.path,
        type=record.type,
        summary=record.summary,
        tags=record.tags,
        uploaded_at=record.uploaded_at,
        last_processed_at=record.last_processed_at,
    )
    session.add(source)
    return source


def replace_chunks_for_source(session: Session, source_id: str, chunks: list[dict]) -> None:
    session.query(ChunkORM).filter(ChunkORM.source_id == source_id).delete()
    for chunk in chunks:
        session.add(
            ChunkORM(
                id=chunk["id"],
                source_id=source_id,
                page_start=chunk["page_start"],
                page_end=chunk["page_end"],
                heading=chunk["heading"],
                text=chunk["text"],
                estimated_tokens=chunk["estimated_tokens"],
                topic_candidates=chunk["topic_candidates"],
                graph_mentions=chunk["graph_mentions"],
                formula_mentions=chunk["formula_mentions"],
            )
        )


def upsert_topics(session: Session, topics: list[TopicBundle]) -> None:
    for topic in topics:
        existing = session.scalar(select(TopicBundleORM).where(TopicBundleORM.id == topic.id))
        if existing:
            existing.unit_id = topic.unit_id
            existing.topic_slug = topic.topic_slug
            existing.title = topic.title
            existing.summary = topic.summary
            existing.source_ids = topic.source_ids
            existing.chunk_ids = topic.chunk_ids
            existing.explanation_variants = topic.explanation_variants
            existing.graph_mentions = topic.graph_mentions
            existing.formula_mentions = topic.formula_mentions
            existing.updated_at = datetime.utcnow()
            session.add(existing)
        else:
            session.add(
                TopicBundleORM(
                    id=topic.id,
                    unit_id=topic.unit_id,
                    topic_slug=topic.topic_slug,
                    title=topic.title,
                    summary=topic.summary,
                    source_ids=topic.source_ids,
                    chunk_ids=topic.chunk_ids,
                    explanation_variants=topic.explanation_variants,
                    graph_mentions=topic.graph_mentions,
                    formula_mentions=topic.formula_mentions,
                )
            )


def list_topics(session: Session) -> list[TopicBundle]:
    return [_topic_record(item) for item in session.scalars(select(TopicBundleORM).order_by(TopicBundleORM.title)).all()]


def get_topic_by_slug(session: Session, slug: str) -> TopicBundle | None:
    topic = session.scalar(select(TopicBundleORM).where(TopicBundleORM.topic_slug == slug))
    return _topic_record(topic) if topic else None


def list_topic_references(session: Session, slug: str, limit: int = 10) -> list[TopicReferenceRecord]:
    topic = session.scalar(select(TopicBundleORM).where(TopicBundleORM.topic_slug == slug))
    if topic is None:
        return []

    chunk_ids = topic.chunk_ids or []
    if not chunk_ids:
        return []

    chunks_by_id = {
        chunk.id: chunk
        for chunk in session.scalars(select(ChunkORM).where(ChunkORM.id.in_(chunk_ids))).all()
    }
    sources_by_id = {
        source.id: source
        for source in session.scalars(select(SourceORM).where(SourceORM.id.in_(topic.source_ids or []))).all()
    }

    references: list[TopicReferenceRecord] = []
    seen_pairs: set[tuple[str, int, str]] = set()
    for chunk_id in chunk_ids:
        chunk = chunks_by_id.get(chunk_id)
        if chunk is None:
            continue

        dedupe_key = (chunk.source_id, chunk.page_start, clean_text(chunk.heading))
        if dedupe_key in seen_pairs:
            continue
        seen_pairs.add(dedupe_key)

        source = sources_by_id.get(chunk.source_id)
        if source is None:
            continue

        excerpt = compact_excerpt(chunk.text)
        if not excerpt:
            continue

        references.append(
            TopicReferenceRecord(
                id=f"ref-{chunk.id}",
                source_id=chunk.source_id,
                source_title=clean_text(source.title),
                source_short_title=clean_text(source.short_title),
                page_number=chunk.page_start,
                heading=clean_text(chunk.heading),
                excerpt=excerpt,
                highlight_text=excerpt[:120],
            )
        )
        if len(references) >= limit:
            break

    return references


def list_practice_questions(
    session: Session,
    topic_id: str | None = None,
    unit_id: str | None = None,
    question_type: str | None = None,
    origin: str | None = None,
) -> list[PracticeQuestionRecord]:
    statement = select(PracticeQuestionORM).order_by(PracticeQuestionORM.topic_id, PracticeQuestionORM.id)
    if topic_id:
        statement = statement.where(PracticeQuestionORM.topic_id == topic_id)
    if unit_id:
        statement = statement.where(PracticeQuestionORM.unit_id == unit_id)
    if question_type:
        statement = statement.where(PracticeQuestionORM.type == question_type)
    if origin:
        statement = statement.where(PracticeQuestionORM.origin == origin)
    return [_practice_record(item) for item in session.scalars(statement).all()]


def upsert_practice_questions(session: Session, questions: list[PracticeQuestionRecord]) -> None:
    for question in questions:
        existing = session.get(PracticeQuestionORM, question.id)
        if existing:
            existing.topic_id = question.topic_id
            existing.unit_id = question.unit_id
            existing.type = question.type
            existing.origin = question.origin
            existing.stem = question.stem
            existing.prompt = question.prompt
            existing.choices = question.choices
            existing.answer = question.answer
            existing.explanation = question.explanation
            existing.trap = question.trap
            existing.difficulty = question.difficulty
            existing.source_ids = question.source_ids
            existing.rubric = question.rubric
            existing.graph_interaction = question.graph_interaction
            session.add(existing)
        else:
            session.add(PracticeQuestionORM(**question.model_dump()))


def list_flashcards(session: Session, topic_id: str | None = None, due_only: bool = False) -> list[FlashcardRecord]:
    statement = select(FlashcardORM).order_by(FlashcardORM.topic_id, FlashcardORM.id)
    if topic_id:
        statement = statement.where(FlashcardORM.topic_id == topic_id)
    if due_only:
        statement = statement.where((FlashcardORM.due_at.is_(None)) | (FlashcardORM.due_at <= datetime.utcnow()))
    return [_flashcard_record(item) for item in session.scalars(statement).all()]


def upsert_flashcards(session: Session, cards: list[FlashcardRecord]) -> None:
    for card in cards:
        existing = session.get(FlashcardORM, card.id)
        payload = card.model_dump()
        if existing:
            for key, value in payload.items():
                setattr(existing, key, value)
            session.add(existing)
        else:
            session.add(FlashcardORM(**payload))


def import_flashcards(session: Session, payload: FlashcardImportRequest) -> list[FlashcardRecord]:
    topic_id = payload.topic_id or "custom-review"
    tags = sorted(set(["imported", f"source:{payload.source}", *payload.tags]))
    created_cards: list[FlashcardRecord] = []

    for raw_line in payload.raw_text.splitlines():
        line = clean_text(raw_line)
        if not line:
            continue

        separator = next((candidate for candidate in ["\t", " :: ", " | ", " - "] if candidate in line), None)
        if separator is None:
            continue

        front_raw, back_raw = line.split(separator, 1)
        front = clean_text(front_raw)
        back = clean_text(back_raw)
        if not front or not back:
            continue

        existing = session.scalar(
            select(FlashcardORM).where(
                FlashcardORM.topic_id == topic_id,
                FlashcardORM.front == front,
                FlashcardORM.back == back,
            )
        )
        if existing:
            existing.tags = sorted(set((existing.tags or []) + tags))
            existing.difficulty = payload.difficulty
            session.add(existing)
            session.flush()
            created_cards.append(_flashcard_record(existing))
            continue

        card = FlashcardORM(
            id=f"flashcard-{uuid4().hex[:10]}",
            topic_id=topic_id,
            front=front,
            back=back,
            difficulty=payload.difficulty,
            tags=tags,
        )
        session.add(card)
        session.flush()
        created_cards.append(_flashcard_record(card))

    return created_cards


def list_notes(session: Session, topic_id: str | None = None) -> list[NoteRecord]:
    statement = select(NoteORM).order_by(desc(NoteORM.updated_at))
    if topic_id:
        statement = statement.where(NoteORM.topic_id == topic_id)
    return [_note_record(item) for item in session.scalars(statement).all()]


def save_note(session: Session, topic_id: str, payload: NoteUpsert, note_id: str | None = None) -> NoteRecord:
    note = session.get(NoteORM, note_id) if note_id else None
    if note is None:
        note = NoteORM(
            id=note_id or f"note-{uuid4().hex[:10]}",
            topic_id=topic_id,
            title=payload.title,
            body=payload.body,
            pinned_graph_id=payload.pinned_graph_id,
            bookmarked=payload.bookmarked,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )
    else:
        note.title = payload.title
        note.body = payload.body
        note.pinned_graph_id = payload.pinned_graph_id
        note.bookmarked = payload.bookmarked
        note.updated_at = datetime.utcnow()
    session.add(note)
    session.flush()
    return _note_record(note)


def list_tutor_sessions(session: Session, topic_id: str | None = None, graph_id: str | None = None) -> list[TutorSessionRecord]:
    statement = select(TutorSessionORM).order_by(desc(TutorSessionORM.updated_at))
    if topic_id:
        statement = statement.where(TutorSessionORM.topic_id == topic_id)
    if graph_id:
        statement = statement.where(TutorSessionORM.graph_id == graph_id)
    return [_tutor_session_record(item) for item in session.scalars(statement).unique().all()]


def create_tutor_session(session: Session, payload: TutorSessionCreate) -> TutorSessionRecord:
    tutor_session = TutorSessionORM(
        id=f"tutor-{uuid4().hex[:10]}",
        topic_id=payload.topic_id,
        graph_id=payload.graph_id,
        mode=payload.mode,
        graph_state=payload.graph_state,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    session.add(tutor_session)
    session.flush()
    return _tutor_session_record(tutor_session)


def add_tutor_message(session: Session, session_id: str, payload: TutorMessageCreate, assistant_reply: str) -> TutorSessionRecord:
    tutor_session = session.get(TutorSessionORM, session_id)
    if tutor_session is None:
        raise ValueError("Tutor session not found")

    user_message = TutorMessageORM(
        id=f"msg-{uuid4().hex[:10]}",
        session_id=session_id,
        role=payload.role,
        content=payload.content,
        graph_context=payload.graph_context,
        created_at=datetime.utcnow(),
    )
    assistant_message = TutorMessageORM(
        id=f"msg-{uuid4().hex[:10]}",
        session_id=session_id,
        role="assistant",
        content=assistant_reply,
        graph_context=payload.graph_context,
        created_at=datetime.utcnow(),
    )
    tutor_session.updated_at = datetime.utcnow()
    session.add_all([user_message, assistant_message, tutor_session])
    session.flush()
    session.refresh(tutor_session)
    return _tutor_session_record(tutor_session)


def list_progress(session: Session) -> list[ProgressRecord]:
    return [_progress_record(item) for item in session.scalars(select(ProgressORM).order_by(desc(ProgressORM.mastery))).all()]


def upsert_progress(session: Session, records: list[ProgressRecord]) -> None:
    for record in records:
        existing = session.scalar(select(ProgressORM).where(ProgressORM.topic_id == record.topic_id))
        payload = record.model_dump()
        if existing:
            for key, value in payload.items():
                setattr(existing, key, value)
            session.add(existing)
        else:
            session.add(ProgressORM(**payload))


def _normalize_answer(answer: str) -> str:
    return " ".join(answer.strip().lower().split())


def _evaluate_attempt(question: PracticeQuestionRecord, submitted_answer: str) -> bool:
    normalized_user = _normalize_answer(submitted_answer)
    normalized_expected = _normalize_answer(question.answer)
    if normalized_user == normalized_expected:
        return True

    if question.type == "mcq":
        return False

    if question.type == "graph":
        target_id = _normalize_answer((question.graph_interaction or {}).get("target_id", question.answer))
        return normalized_user == target_id

    if question.rubric:
        matched = sum(1 for item in question.rubric if _normalize_answer(item) in normalized_user)
        threshold = max(1, math.ceil(len(question.rubric) * 0.6))
        return matched >= threshold

    return False


def record_practice_attempt(session: Session, payload: PracticeAttemptCreate, question: PracticeQuestionRecord) -> PracticeAttemptRecord:
    is_correct = _evaluate_attempt(question, payload.answer)

    attempt = PracticeAttemptORM(
        id=f"attempt-{uuid4().hex[:10]}",
        question_id=payload.question_id,
        topic_id=payload.topic_id,
        mode=payload.mode,
        answer=payload.answer,
        correct=is_correct,
        confidence=payload.confidence,
        duration_seconds=payload.duration_seconds,
        created_at=datetime.utcnow(),
    )
    session.add(attempt)

    progress = session.scalar(select(ProgressORM).where(ProgressORM.topic_id == payload.topic_id))
    if progress is None:
        progress = ProgressORM(
            id=f"progress-{payload.topic_id}",
            topic_id=payload.topic_id,
            confidence=payload.confidence,
            mastery=100 if is_correct else 35,
            last_studied_at=datetime.utcnow(),
            streak_days=1,
            weak_spots=[] if is_correct else ([question.trap] if question.trap else ["recent incorrect attempt"]),
            completed_question_ids=[payload.question_id] if is_correct else [],
        )
    else:
        progress.last_studied_at = datetime.utcnow()
        progress.confidence = max(0, min(100, int((progress.confidence + payload.confidence) / 2)))
        progress.mastery = max(0, min(100, progress.mastery + (8 if is_correct else -6)))
        progress.streak_days = max(progress.streak_days, 1)
        completed = set(progress.completed_question_ids or [])
        if is_correct:
            completed.add(payload.question_id)
        progress.completed_question_ids = sorted(completed)
        weak_spots = set(progress.weak_spots or [])
        if not is_correct and question.trap:
            weak_spots.add(question.trap)
        progress.weak_spots = sorted(weak_spots)
    session.add(progress)

    review = ReviewItemORM(
        id=f"review-{uuid4().hex[:10]}",
        item_type="question",
        item_id=payload.question_id,
        topic_id=payload.topic_id,
        due_at=datetime.utcnow() + timedelta(days=0 if not is_correct else 2),
        priority=3 if not is_correct else 1,
        reason="missed-practice" if not is_correct else "successful-practice-spacing",
        completed=False,
    )
    session.add(review)
    session.flush()
    return PracticeAttemptRecord.model_validate(attempt, from_attributes=True)


def review_flashcard(session: Session, flashcard_id: str, confidence: int) -> FlashcardRecord:
    card = session.get(FlashcardORM, flashcard_id)
    if card is None:
        raise ValueError("Flashcard not found")

    now = datetime.utcnow()
    card.review_count += 1
    card.last_reviewed_at = now
    if confidence >= 80:
        card.interval_days = max(1, int(card.interval_days * card.ease_factor))
        card.ease_factor = min(3.0, card.ease_factor + 0.08)
    elif confidence >= 60:
        card.interval_days = max(1, card.interval_days + 1)
    else:
        card.interval_days = 1
        card.ease_factor = max(1.3, card.ease_factor - 0.2)
    card.due_at = now + timedelta(days=card.interval_days)
    session.add(card)

    session.add(
        ReviewItemORM(
            id=f"review-{uuid4().hex[:10]}",
            item_type="flashcard",
            item_id=card.id,
            topic_id=card.topic_id,
            due_at=card.due_at,
            priority=1 if confidence >= 80 else 2,
            reason="flashcard-spacing",
            completed=False,
        )
    )
    session.flush()
    return _flashcard_record(card)


def list_due_reviews(session: Session, limit: int = 20) -> list[ReviewItemRecord]:
    statement = (
        select(ReviewItemORM)
        .where((ReviewItemORM.completed.is_(False)) & (ReviewItemORM.due_at <= datetime.utcnow()))
        .order_by(desc(ReviewItemORM.priority), ReviewItemORM.due_at)
        .limit(limit)
    )
    return [_review_record(item) for item in session.scalars(statement).all()]


def complete_review_item(session: Session, review_id: str) -> ReviewItemRecord:
    item = session.get(ReviewItemORM, review_id)
    if item is None:
        raise ValueError("Review item not found")
    item.completed = True
    session.add(item)
    session.flush()
    return _review_record(item)


def search_content(session: Session, query: str) -> list[SearchHit]:
    normalized = query.lower().strip()
    if not normalized:
        return []

    hits: list[SearchHit] = []
    for topic in session.scalars(select(TopicBundleORM)).all():
        haystack = f"{topic.title} {topic.summary} {' '.join(topic.graph_mentions or [])} {' '.join(topic.formula_mentions or [])}".lower()
        score = haystack.count(normalized)
        if score:
            hits.append(SearchHit(id=topic.id, kind="topic", title=topic.title, summary=topic.summary, score=float(score), source_ids=topic.source_ids or []))

    for chunk in session.scalars(select(ChunkORM)).all():
        haystack = f"{chunk.heading} {chunk.text}".lower()
        score = haystack.count(normalized)
        if score:
            hits.append(SearchHit(id=chunk.id, kind="chunk", title=chunk.heading, summary=chunk.text[:180], score=float(score), source_ids=[chunk.source_id]))

    for source in session.scalars(select(SourceORM)).all():
        haystack = f"{source.title} {source.summary}".lower()
        score = haystack.count(normalized)
        if score:
            hits.append(SearchHit(id=source.id, kind="source", title=source.title, summary=source.summary, score=float(score), source_ids=[source.id]))
    return sorted(hits, key=lambda hit: hit.score, reverse=True)[:25]


def get_dashboard_overview(session: Session, focus_topic_id: str | None = None) -> DashboardOverview:
    progress = list_progress(session)
    due_reviews = list_due_reviews(session, limit=8)
    weak_topic_ids = [item.topic_id for item in sorted(progress, key=lambda value: value.mastery)[:3]]
    focus = focus_topic_id or (weak_topic_ids[0] if weak_topic_ids else (progress[0].topic_id if progress else None))
    recommended = weak_topic_ids[1] if len(weak_topic_ids) > 1 else focus
    return DashboardOverview(
        focus_topic_id=focus,
        recommended_next_topic_id=recommended,
        sources=list_sources(session),
        progress=progress,
        due_reviews=due_reviews,
        weak_topic_ids=weak_topic_ids,
    )


def sanitize_ingested_content(session: Session) -> None:
    for chunk in session.scalars(select(ChunkORM)).all():
        chunk.heading = clean_text(chunk.heading)
        chunk.text = clean_text(chunk.text)
        session.add(chunk)

    for topic in session.scalars(select(TopicBundleORM)).all():
        topic.title = clean_text(topic.title)
        topic.summary = clean_text(topic.summary)
        topic.explanation_variants = [clean_text(item) for item in (topic.explanation_variants or []) if clean_text(item)]
        session.add(topic)


def get_ingestion_stats(session: Session) -> IngestionStats:
    source_count = session.scalar(select(func.count()).select_from(SourceORM)) or 0
    topic_count = session.scalar(select(func.count()).select_from(TopicBundleORM)) or 0
    chunk_count = session.scalar(select(func.count()).select_from(ChunkORM)) or 0
    latest_processed_at = session.scalar(select(func.max(SourceORM.last_processed_at)))
    return IngestionStats(
        source_count=source_count,
        topic_count=topic_count,
        chunk_count=chunk_count,
        latest_processed_at=latest_processed_at,
    )
