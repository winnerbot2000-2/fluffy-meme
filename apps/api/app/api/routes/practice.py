from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models.schemas import (
    FlashcardImportRequest,
    FlashcardImportResponse,
    FlashcardRecord,
    FlashcardReviewCreate,
    PracticeAttemptCreate,
    PracticeAttemptRecord,
    PracticeQuestionRecord,
)
from app.services.repository import (
    import_flashcards,
    list_flashcards,
    list_practice_questions,
    record_practice_attempt,
    review_flashcard,
)

router = APIRouter(prefix="/api/practice", tags=["practice"])


@router.get("/questions", response_model=list[PracticeQuestionRecord])
def get_questions(
    topic_id: str | None = Query(default=None),
    unit_id: str | None = Query(default=None),
    question_type: str | None = Query(default=None),
    origin: str | None = Query(default=None),
    session: Session = Depends(get_db_session),
) -> list[PracticeQuestionRecord]:
    return list_practice_questions(session, topic_id=topic_id, unit_id=unit_id, question_type=question_type, origin=origin)


@router.post("/attempts", response_model=PracticeAttemptRecord)
def submit_attempt(
    payload: PracticeAttemptCreate,
    session: Session = Depends(get_db_session),
) -> PracticeAttemptRecord:
    question = next((item for item in list_practice_questions(session, topic_id=payload.topic_id) if item.id == payload.question_id), None)
    if question is None:
        raise HTTPException(status_code=404, detail="Question not found")
    attempt = record_practice_attempt(session, payload, question)
    session.commit()
    return attempt


@router.get("/flashcards", response_model=list[FlashcardRecord])
def get_flashcards(
    topic_id: str | None = Query(default=None),
    due_only: bool = Query(default=False),
    session: Session = Depends(get_db_session),
) -> list[FlashcardRecord]:
    return list_flashcards(session, topic_id, due_only)


@router.post("/flashcards/import", response_model=FlashcardImportResponse)
def import_flashcard_set(
    payload: FlashcardImportRequest,
    session: Session = Depends(get_db_session),
) -> FlashcardImportResponse:
    cards = import_flashcards(session, payload)
    session.commit()
    return FlashcardImportResponse(imported_count=len(cards), flashcards=cards)


@router.post("/flashcards/review", response_model=FlashcardRecord)
def mark_flashcard_reviewed(
    payload: FlashcardReviewCreate,
    session: Session = Depends(get_db_session),
) -> FlashcardRecord:
    try:
        card = review_flashcard(session, payload.flashcard_id, payload.confidence)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    session.commit()
    return card
