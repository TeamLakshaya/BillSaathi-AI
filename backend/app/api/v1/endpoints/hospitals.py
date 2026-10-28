from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_admin
from app.schemas.common import ApiResponse
from app.schemas.hospital import HospitalCreate, HospitalResponse
from app.services.hospital_service import HospitalService

router = APIRouter()


@router.get("", response_model=ApiResponse[List[HospitalResponse]])
def list_hospitals(
    q: Optional[str] = Query(None, description="Search hospital by name or city"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    service = HospitalService(db)
    hospitals = service.list_hospitals(query=q, skip=skip, limit=limit)
    return ApiResponse(data=hospitals, message=f"Retrieved {len(hospitals)} hospitals")


@router.post("", response_model=ApiResponse[HospitalResponse], status_code=status.HTTP_201_CREATED)
def create_hospital(
    data: HospitalCreate,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    service = HospitalService(db)
    hospital = service.create_hospital(data)
    return ApiResponse(data=hospital, message="Hospital created successfully")
