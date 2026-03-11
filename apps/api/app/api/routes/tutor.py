from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models.schemas import TutorMessageCreate, TutorSessionCreate, TutorSessionRecord
from app.services.repository import add_tutor_message, create_tutor_session, list_tutor_sessions
from app.services.tutor import build_tutor_reply

router = APIRouter(prefix="/api/tutor", tags=["tutor"])


@router.get("/sessions", response_model=list[TutorSessionRecord])
def get_sessions(
    topic_id: str | None = Query(default=None),
    graph_id: str | None = Query(default=None),
    session: Session = Depends(get_db_session),
) -> list[TutorSessionRecord]:
    return list_tutor_sessions(session, topic_id, graph_id)


@router.post("/sessions", response_model=TutorSessionRecord)
def start_session(payload: TutorSessionCreate, session: Session = Depends(get_db_session)) -> TutorSessionRecord:
    record = create_tutor_session(session, payload)
    session.commit()
    return record


@router.post("/sessions/{session_id}/messages", response_model=TutorSessionRecord)
def send_message(
    session_id: str,
    payload: TutorMessageCreate,
    session: Session = Depends(get_db_session),
) -> TutorSessionRecord:
    current = next((item for item in list_tutor_sessions(session) if item.id == session_id), None)
    if current is None:
        raise HTTPException(status_code=404, detail="Tutor session not found")
    reply = build_tutor_reply(current, payload)
    try:
        updated = add_tutor_message(session, session_id, payload, reply)
    except ValueError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    session.commit()
    return updated
