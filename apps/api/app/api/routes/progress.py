from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models.schemas import ProgressRecord, ReviewItemRecord
from app.services.repository import complete_review_item, list_due_reviews, list_progress

router = APIRouter(prefix="/api/progress", tags=["progress"])


@router.get("", response_model=list[ProgressRecord])
def get_progress(session: Session = Depends(get_db_session)) -> list[ProgressRecord]:
    return list_progress(session)


@router.get("/review-queue", response_model=list[ReviewItemRecord])
def get_review_queue(session: Session = Depends(get_db_session)) -> list[ReviewItemRecord]:
    return list_due_reviews(session)


@router.post("/review-queue/{review_id}/complete", response_model=ReviewItemRecord)
def mark_review_complete(review_id: str, session: Session = Depends(get_db_session)) -> ReviewItemRecord:
    try:
        item = complete_review_item(session, review_id)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    session.commit()
    return item
