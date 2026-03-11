from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class SourceRecord(BaseModel):
    id: str
    title: str
    short_title: str
    path: str
    type: Literal["textbook", "course-guide", "packet", "notes"]
    summary: str
    tags: list[str] = Field(default_factory=list)
    page_count: int | None = None
    uploaded_at: datetime = Field(default_factory=datetime.utcnow)
    last_processed_at: datetime | None = None


class SectionBlock(BaseModel):
    heading: str
    page: int
    text: str


class DocumentChunk(BaseModel):
    id: str
    source_id: str
    page_start: int
    page_end: int
    heading: str
    text: str
    estimated_tokens: int
    topic_candidates: list[str] = Field(default_factory=list)
    graph_mentions: list[str] = Field(default_factory=list)
    formula_mentions: list[str] = Field(default_factory=list)


class TopicBundle(BaseModel):
    id: str
    unit_id: str | None = None
    topic_slug: str
    title: str
    summary: str
    source_ids: list[str] = Field(default_factory=list)
    chunk_ids: list[str] = Field(default_factory=list)
    explanation_variants: list[str] = Field(default_factory=list)
    graph_mentions: list[str] = Field(default_factory=list)
    formula_mentions: list[str] = Field(default_factory=list)


class UploadResponse(BaseModel):
    message: str
    source_ids: list[str]
    processed_count: int


class SearchHit(BaseModel):
    id: str
    kind: Literal["topic", "chunk", "source"]
    title: str
    summary: str
    score: float
    source_ids: list[str] = Field(default_factory=list)


class PracticeQuestionRecord(BaseModel):
    id: str
    topic_id: str
    unit_id: str | None = None
    type: Literal["mcq", "frq", "graph", "formula"]
    origin: Literal["official", "ap-like"] = "ap-like"
    stem: str
    prompt: str | None = None
    choices: list[str] | None = None
    answer: str
    explanation: str
    trap: str | None = None
    difficulty: Literal["easy", "medium", "hard"]
    source_ids: list[str] = Field(default_factory=list)
    rubric: list[str] = Field(default_factory=list)
    graph_interaction: dict | None = None


class FlashcardRecord(BaseModel):
    id: str
    topic_id: str
    front: str
    back: str
    difficulty: Literal["easy", "medium", "hard"]
    tags: list[str] = Field(default_factory=list)
    due_at: datetime | None = None
    interval_days: int = 1
    ease_factor: float = 2.5
    review_count: int = 0
    last_reviewed_at: datetime | None = None


class NoteRecord(BaseModel):
    id: str
    topic_id: str
    title: str
    body: str
    pinned_graph_id: str | None = None
    bookmarked: bool = False
    created_at: datetime
    updated_at: datetime


class NoteUpsert(BaseModel):
    title: str
    body: str
    pinned_graph_id: str | None = None
    bookmarked: bool = False


class TutorMessageRecord(BaseModel):
    id: str
    role: Literal["user", "assistant", "system"]
    content: str
    graph_context: dict | None = None
    created_at: datetime


class TutorSessionRecord(BaseModel):
    id: str
    topic_id: str | None = None
    graph_id: str | None = None
    mode: str
    graph_state: dict | None = None
    created_at: datetime
    updated_at: datetime
    messages: list[TutorMessageRecord] = Field(default_factory=list)


class TutorSessionCreate(BaseModel):
    topic_id: str | None = None
    graph_id: str | None = None
    mode: str = "tutor"
    graph_state: dict | None = None


class TutorMessageCreate(BaseModel):
    content: str
    role: Literal["user"] = "user"
    graph_context: dict | None = None


class ProgressRecord(BaseModel):
    id: str
    topic_id: str
    confidence: int
    mastery: int
    last_studied_at: datetime | None = None
    streak_days: int = 0
    weak_spots: list[str] = Field(default_factory=list)
    completed_question_ids: list[str] = Field(default_factory=list)


class PracticeAttemptCreate(BaseModel):
    question_id: str
    topic_id: str
    mode: str = "standard"
    answer: str
    confidence: int = 50
    duration_seconds: int | None = None


class PracticeAttemptRecord(BaseModel):
    id: str
    question_id: str
    topic_id: str
    mode: str
    answer: str
    correct: bool
    confidence: int
    duration_seconds: int | None = None
    created_at: datetime


class FlashcardReviewCreate(BaseModel):
    flashcard_id: str
    confidence: int = 70


class FlashcardImportRequest(BaseModel):
    topic_id: str | None = None
    raw_text: str
    source: Literal["quizlet", "manual"] = "quizlet"
    difficulty: Literal["easy", "medium", "hard"] = "medium"
    tags: list[str] = Field(default_factory=list)


class FlashcardImportResponse(BaseModel):
    imported_count: int
    flashcards: list[FlashcardRecord] = Field(default_factory=list)


class ReviewItemRecord(BaseModel):
    id: str
    item_type: str
    item_id: str
    topic_id: str
    due_at: datetime
    priority: int
    reason: str
    completed: bool = False


class DashboardOverview(BaseModel):
    focus_topic_id: str | None = None
    recommended_next_topic_id: str | None = None
    sources: list[SourceRecord] = Field(default_factory=list)
    progress: list[ProgressRecord] = Field(default_factory=list)
    due_reviews: list[ReviewItemRecord] = Field(default_factory=list)
    weak_topic_ids: list[str] = Field(default_factory=list)


class IngestionStats(BaseModel):
    source_count: int
    topic_count: int
    chunk_count: int
    latest_processed_at: datetime | None = None


class TopicReferenceRecord(BaseModel):
    id: str
    source_id: str
    source_title: str
    source_short_title: str
    page_number: int
    heading: str
    excerpt: str
    highlight_text: str | None = None


class SourcePageLine(BaseModel):
    index: int
    text: str
    highlighted: bool = False


class SourcePageRecord(BaseModel):
    source: SourceRecord
    page_number: int
    total_pages: int
    heading: str | None = None
    lines: list[SourcePageLine] = Field(default_factory=list)
    highlight_text: str | None = None


class SourceSelectionAssistRequest(BaseModel):
    text: str
    action: Literal["summarize", "explain-simple", "link-to-apmicro", "tutor-help"]
    source_id: str | None = None
    page_number: int | None = None
    topic_slug: str | None = None


class SourceSelectionAssistResponse(BaseModel):
    title: str
    response: str
    citations: list[TopicReferenceRecord] = Field(default_factory=list)


class GraphAnalyzerRequest(BaseModel):
    upload_id: str | None = None
    image_url: str | None = None
    expected_graph_type: str | None = None


class GraphAnalyzerResponse(BaseModel):
    graph_type: str
    confidence: float
    detected_axes: list[str]
    reconstructed_graph_id: str | None = None
    explanation: str
