from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "AP Microeconomics Ingestion API"
    environment: str = "development"
    upload_dir: Path = Path("apps/api/uploads")
    storage_dir: Path = Path("apps/api/.data")
    pdf_source_paths: str = ""
    database_url: str = "sqlite:///./apps/api/apmicro.db"
    vector_backend: str = "json"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def configured_source_paths(self) -> list[Path]:
        if not self.pdf_source_paths:
            return []
        return [Path(item.strip()) for item in self.pdf_source_paths.split(";") if item.strip()]

    @property
    def normalized_database_url(self) -> str:
        if self.database_url.startswith("sqlite+aiosqlite:///"):
            return self.database_url.replace("sqlite+aiosqlite:///", "sqlite:///")
        return self.database_url


settings = Settings()
