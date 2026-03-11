from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import dashboard, graph_analyzer, notes, practice, progress, search, sources, topics, tutor, uploads
from app.core.config import settings
from app.db.init_db import initialize_database
from app.db.session import SessionLocal
from app.services.bootstrap import bootstrap_database

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    settings.storage_dir.mkdir(parents=True, exist_ok=True)
    initialize_database()
    with SessionLocal() as session:
        bootstrap_database(session)


@app.get("/api/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(uploads.router)
app.include_router(sources.router)
app.include_router(topics.router)
app.include_router(search.router)
app.include_router(dashboard.router)
app.include_router(practice.router)
app.include_router(notes.router)
app.include_router(tutor.router)
app.include_router(progress.router)
app.include_router(graph_analyzer.router)
