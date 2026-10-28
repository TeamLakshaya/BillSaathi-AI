from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import AppException
from app.core.logging import logger
from app.db.base import Base
from app.db.session import engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure storage directories exist
    upload_path = Path(settings.UPLOAD_DIR)
    report_path = Path(settings.REPORT_DIR)
    upload_path.mkdir(parents=True, exist_ok=True)
    report_path.mkdir(parents=True, exist_ok=True)

    # Validate essential configurations safely
    if len(settings.SECRET_KEY) < 32:
        logger.warning("SECURITY WARNING: SECRET_KEY is shorter than 32 characters. Consider updating it.")
    if settings.ENVIRONMENT == "production" and "dev-secret-key" in settings.SECRET_KEY:
        logger.error("SECURITY CRITICAL: Default development SECRET_KEY detected in production environment!")

    db_scheme = settings.DATABASE_URL.split("://")[0] if "://" in settings.DATABASE_URL else "unknown"
    logger.info(
        f"Starting {settings.PROJECT_NAME} v{settings.VERSION} "
        f"[Env: {settings.ENVIRONMENT}, DemoMode: {settings.DEMO_MODE}, DB: {db_scheme}, "
        f"Gemini: {'configured' if settings.GEMINI_API_KEY else 'unconfigured'}]"
    )

    # Initialize tables if needed
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database schemas verified and connected successfully.")
    except Exception as e:
        logger.error(f"Database initialization warning: {e}")

    yield
    logger.info("Application shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Factual, Evidence-Based Medical Bill Verification API for Indian Healthcare",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan,
)

# CORS Middleware
origins = [origin.strip() for origin in settings.CORS_ORIGINS if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception Handlers
@app.exception_handler(AppException)
async def handle_app_exception(request: Request, exc: AppException):
    logger.warning(f"AppException: [{exc.error_code}] {exc.message}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "data": None,
            "message": exc.message,
            "error_code": exc.error_code,
        },
    )


@app.exception_handler(RequestValidationError)
async def handle_validation_error(request: Request, exc: RequestValidationError):
    error_messages = [f"{err.get('loc', ['field'])[-1]}: {err.get('msg')}" for err in exc.errors()]
    combined_msg = "; ".join(error_messages)
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "data": exc.errors(),
            "message": f"Validation Error: {combined_msg}",
            "error_code": "VALIDATION_ERROR",
        },
    )


@app.exception_handler(Exception)
async def handle_generic_exception(request: Request, exc: Exception):
    logger.error(f"Unhandled Server Error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "data": None,
            "message": "An unexpected internal server error occurred. Please contact support.",
            "error_code": "INTERNAL_SERVER_ERROR",
        },
    )


# Register API v1 router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "app": settings.PROJECT_NAME,
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "demo_mode": settings.DEMO_MODE,
    }
