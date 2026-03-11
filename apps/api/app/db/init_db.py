from sqlalchemy import inspect, text

from app.db.base import Base
from app.db.models import (
    ChunkORM,
    FlashcardORM,
    NoteORM,
    PracticeAttemptORM,
    PracticeQuestionORM,
    ProgressORM,
    ReviewItemORM,
    SourceORM,
    TopicBundleORM,
    TutorMessageORM,
    TutorSessionORM,
)
from app.db.session import engine


def _ensure_column(table_name: str, column_name: str, ddl: str) -> None:
    inspector = inspect(engine)
    columns = {column["name"] for column in inspector.get_columns(table_name)}
    if column_name in columns:
        return

    with engine.begin() as connection:
        connection.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {ddl}"))


def initialize_database() -> None:
    Base.metadata.create_all(bind=engine)
    _ensure_column("practice_questions", "unit_id", "unit_id VARCHAR(32)")
    _ensure_column("practice_questions", "origin", "origin VARCHAR(32) DEFAULT 'ap-like'")
    _ensure_column("practice_questions", "rubric", "rubric JSON")
    _ensure_column("practice_questions", "graph_interaction", "graph_interaction JSON")
