from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models.schemas import SearchHit
from app.services.repository import search_content

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("", response_model=list[SearchHit])
def search(query: str = Query(..., min_length=1), session: Session = Depends(get_db_session)) -> list[SearchHit]:
    return search_content(session, query)
