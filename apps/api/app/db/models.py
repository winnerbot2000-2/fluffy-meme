from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import JSON

from app.db.base import Base


class SourceORM(Base):
    __tablename__ = "sources"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    title: Mapped[str] = mapped_column(String(255))
    short_title: Mapped[str] = mapped_column(String(80))
    path: Mapped[str] = mapped_column(String(1024), unique=True, index=True)
    type: Mapped[str] = mapped_column(String(40))
    summary: Mapped[str] = mapped_column(Text, default="")
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    last_processed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class ChunkORM(Base):
    __tablename__ = "chunks"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    source_id: Mapped[str] = mapped_column(ForeignKey("sources.id", ondelete="CASCADE"), index=True)
    page_start: Mapped[int] = mapped_column(Integer)
    page_end: Mapped[int] = mapped_column(Integer)
    heading: Mapped[str] = mapped_column(String(255))
    text: Mapped[str] = mapped_column(Text)
    estimated_tokens: Mapped[int] = mapped_column(Integer)
    topic_candidates: Mapped[list[str]] = mapped_column(JSON, default=list)
    graph_mentions: Mapped[list[str]] = mapped_column(JSON, default=list)
    formula_mentions: Mapped[list[str]] = mapped_column(JSON, default=list)


class TopicBundleORM(Base):
    __tablename__ = "topic_bundles"
    __table_args__ = (UniqueConstraint("topic_slug", name="uq_topic_slug"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    unit_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    topic_slug: Mapped[str] = mapped_column(String(128), index=True)
    title: Mapped[str] = mapped_column(String(255))
    summary: Mapped[str] = mapped_column(Text, default="")
    source_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    chunk_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    explanation_variants: Mapped[list[str]] = mapped_column(JSON, default=list)
    graph_mentions: Mapped[list[str]] = mapped_column(JSON, default=list)
    formula_mentions: Mapped[list[str]] = mapped_column(JSON, default=list)
    seeded: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class PracticeQuestionORM(Base):
    __tablename__ = "practice_questions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    topic_id: Mapped[str] = mapped_column(String(64), index=True)
    unit_id: Mapped[str | None] = mapped_column(String(32), nullable=True, index=True)
    type: Mapped[str] = mapped_column(String(32))
    origin: Mapped[str] = mapped_column(String(32), default="ap-like")
    stem: Mapped[str] = mapped_column(Text)
    prompt: Mapped[str | None] = mapped_column(Text, nullable=True)
    choices: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    answer: Mapped[str] = mapped_column(Text)
    explanation: Mapped[str] = mapped_column(Text)
    trap: Mapped[str | None] = mapped_column(Text, nullable=True)
    difficulty: Mapped[str] = mapped_column(String(16))
    source_ids: Mapped[list[str]] = mapped_column(JSON, default=list)
    rubric: Mapped[list[str]] = mapped_column(JSON, default=list)
    graph_interaction: Mapped[dict | None] = mapped_column(JSON, nullable=True)


class FlashcardORM(Base):
    __tablename__ = "flashcards"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    topic_id: Mapped[str] = mapped_column(String(64), index=True)
    front: Mapped[str] = mapped_column(Text)
    back: Mapped[str] = mapped_column(Text)
    difficulty: Mapped[str] = mapped_column(String(16))
    tags: Mapped[list[str]] = mapped_column(JSON, default=list)
    due_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    interval_days: Mapped[int] = mapped_column(Integer, default=1)
    ease_factor: Mapped[float] = mapped_column(Float, default=2.5)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    last_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class NoteORM(Base):
    __tablename__ = "notes"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    topic_id: Mapped[str] = mapped_column(String(64), index=True)
    title: Mapped[str] = mapped_column(String(255))
    body: Mapped[str] = mapped_column(Text, default="")
    pinned_graph_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    bookmarked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class TutorSessionORM(Base):
    __tablename__ = "tutor_sessions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    topic_id: Mapped[str | None] = mapped_column(String(64), nullable=True, index=True)
    graph_id: Mapped[str | None] = mapped_column(String(64), nullable=True)
    mode: Mapped[str] = mapped_column(String(32))
    graph_state: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    messages: Mapped[list["TutorMessageORM"]] = relationship(
        back_populates="session",
        cascade="all, delete-orphan",
        order_by="TutorMessageORM.created_at",
    )


class TutorMessageORM(Base):
    __tablename__ = "tutor_messages"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("tutor_sessions.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String(20))
    content: Mapped[str] = mapped_column(Text)
    graph_context: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    session: Mapped["TutorSessionORM"] = relationship(back_populates="messages")


class ProgressORM(Base):
    __tablename__ = "progress"
    __table_args__ = (UniqueConstraint("topic_id", name="uq_progress_topic_id"),)

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    topic_id: Mapped[str] = mapped_column(String(64), index=True)
    confidence: Mapped[int] = mapped_column(Integer, default=0)
    mastery: Mapped[int] = mapped_column(Integer, default=0)
    last_studied_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    streak_days: Mapped[int] = mapped_column(Integer, default=0)
    weak_spots: Mapped[list[str]] = mapped_column(JSON, default=list)
    completed_question_ids: Mapped[list[str]] = mapped_column(JSON, default=list)


class PracticeAttemptORM(Base):
    __tablename__ = "practice_attempts"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    question_id: Mapped[str] = mapped_column(String(64), index=True)
    topic_id: Mapped[str] = mapped_column(String(64), index=True)
    mode: Mapped[str] = mapped_column(String(32), default="standard")
    answer: Mapped[str] = mapped_column(Text)
    correct: Mapped[bool] = mapped_column(Boolean, default=False)
    confidence: Mapped[int] = mapped_column(Integer, default=50)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class ReviewItemORM(Base):
    __tablename__ = "review_items"

    id: Mapped[str] = mapped_column(String(64), primary_key=True)
    item_type: Mapped[str] = mapped_column(String(32))
    item_id: Mapped[str] = mapped_column(String(64), index=True)
    topic_id: Mapped[str] = mapped_column(String(64), index=True)
    due_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)
    priority: Mapped[int] = mapped_column(Integer, default=1)
    reason: Mapped[str] = mapped_column(String(255), default="scheduled-review")
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
