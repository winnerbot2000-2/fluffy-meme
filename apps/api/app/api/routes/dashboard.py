from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db_session
from app.models.schemas import DashboardOverview
from app.services.repository import get_dashboard_overview

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/overview", response_model=DashboardOverview)
def overview(
    focus_topic_id: str | None = Query(default=None),
    session: Session = Depends(get_db_session),
) -> DashboardOverview:
    return get_dashboard_overview(session, focus_topic_id)
