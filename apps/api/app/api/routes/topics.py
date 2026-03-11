from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models.schemas import TopicBundle, TopicReferenceRecord
from app.services.repository import get_topic_by_slug, list_topic_references, list_topics

router = APIRouter(prefix="/api/topics", tags=["topics"])


@router.get("", response_model=list[TopicBundle])
def get_topics(session: Session = Depends(get_db_session)) -> list[TopicBundle]:
    return list_topics(session)


@router.get("/{slug}/references", response_model=list[TopicReferenceRecord])
def get_topic_references(slug: str, session: Session = Depends(get_db_session)) -> list[TopicReferenceRecord]:
    topic = get_topic_by_slug(session, slug)
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return list_topic_references(session, slug)


@router.get("/{slug}", response_model=TopicBundle)
def get_topic(slug: str, session: Session = Depends(get_db_session)) -> TopicBundle:
    topic = get_topic_by_slug(session, slug)
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return topic
