from pathlib import Path
from typing import List, Optional, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator

BASE_DIR = Path(__file__).resolve().parent.parent.parent


class Settings(BaseSettings):
    PROJECT_NAME: str = "Bill Saathi AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Environment & Demo Mode
    ENVIRONMENT: str = "development"
    DEMO_MODE: bool = True
    DEBUG: bool = True

    # Database
    DATABASE_URL: str = Field(
        default=f"sqlite:///{BASE_DIR / 'billsaathi.db'}",
        description="PostgreSQL or SQLite database connection URL",
    )

    # Security & Auth
    SECRET_KEY: str = "dev-secret-key-change-in-production-bill-saathi-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:8000",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v):
        if isinstance(v, str):
            v_stripped = v.strip()
            if v_stripped.startswith("[") and v_stripped.endswith("]"):
                import json
                try:
                    return json.loads(v_stripped)
                except Exception:
                    pass
            return [i.strip() for i in v_stripped.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return v

    # File Storage
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    REPORT_DIR: str = str(BASE_DIR / "reports")
    REPORTS_DIR: str = str(BASE_DIR / "reports")
    MAX_UPLOAD_SIZE_MB: int = 15
    MAX_FILE_SIZE_BYTES: int = 15 * 1024 * 1024  # 15 MB
    MAX_PDF_PAGES: int = 25
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "png", "jpg", "jpeg"]
    ALLOWED_MIME_TYPES: List[str] = [
        "application/pdf",
        "image/png",
        "image/jpeg",
        "image/jpg",
    ]

    # AI Provider
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # OCR Provider
    OCR_PROVIDER: str = "local"  # 'local', 'paddle', 'tesseract'

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()

# Ensure directories exist
Path(settings.UPLOAD_DIR).mkdir(parents=True, exist_ok=True)
Path(settings.REPORT_DIR).mkdir(parents=True, exist_ok=True)
