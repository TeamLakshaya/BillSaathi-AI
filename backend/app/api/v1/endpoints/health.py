from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.session import get_db
from app.schemas.common import ApiResponse

router = APIRouter()


@router.get("/health", response_model=ApiResponse[dict])
def check_health(db: Session = Depends(get_db)):
    """Health check reporting system status and database connectivity."""
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    health_info = {
        "status": "healthy" if db_status == "healthy" else "degraded",
        "app_name": settings.PROJECT_NAME,
        "database": db_status,
        "demo_mode": settings.DEMO_MODE,
        "version": "1.0.0",
    }
    return ApiResponse(
        success=(db_status == "healthy"),
        data=health_info,
        message="System operational",
    )
