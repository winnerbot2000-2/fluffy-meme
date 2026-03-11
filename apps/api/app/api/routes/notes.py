from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models.schemas import NoteRecord, NoteUpsert
from app.services.repository import list_notes, save_note

router = APIRouter(prefix="/api/notes", tags=["notes"])


@router.get("", response_model=list[NoteRecord])
def get_notes(topic_id: str | None = None, session: Session = Depends(get_db_session)) -> list[NoteRecord]:
    return list_notes(session, topic_id)


@router.post("/{topic_id}", response_model=NoteRecord)
def upsert_note(
    topic_id: str,
    payload: NoteUpsert,
    note_id: str | None = None,
    session: Session = Depends(get_db_session),
) -> NoteRecord:
    note = save_note(session, topic_id, payload, note_id)
    session.commit()
    return note
