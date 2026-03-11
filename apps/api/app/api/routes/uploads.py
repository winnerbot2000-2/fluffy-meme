from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db_session
from app.models.schemas import UploadResponse
from app.services.ingestion.pipeline import ingest_pdf

router = APIRouter(prefix="/api/uploads", tags=["uploads"])


@router.post("/pdf", response_model=UploadResponse)
async def upload_pdf(
    files: list[UploadFile] = File(...),
    session: Session = Depends(get_db_session),
) -> UploadResponse:
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    source_ids: list[str] = []
    total_bundles = 0

    for upload in files:
        destination = settings.upload_dir / upload.filename
        payload = await upload.read()
        destination.write_bytes(payload)
        source, bundle_count = ingest_pdf(session, Path(destination))
        source_ids.append(source.id)
        total_bundles += bundle_count

    return UploadResponse(message="Upload complete", source_ids=source_ids, processed_count=total_bundles)
