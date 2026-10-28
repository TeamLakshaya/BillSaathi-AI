from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user_optional, get_session_id
from app.api.v1.endpoints.bills import check_bill_ownership
from app.repositories.bill_repository import BillRepository
from app.schemas.common import ApiResponse
from app.schemas.verification import BillVerificationSummary
from app.services.verification_service import VerificationService

router = APIRouter()


@router.post("/{bill_id}/verify", response_model=ApiResponse[BillVerificationSummary])
def run_verification(
    bill_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
    session_id: Optional[str] = Depends(get_session_id),
):
    repo = BillRepository(db)
    bill = repo.get_by_id(bill_id)
    if not bill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found")
    check_bill_ownership(bill, current_user, session_id=session_id)

    service = VerificationService(db)
    summary = service.verify_bill(bill_id)
    return ApiResponse(
        data=summary,
        message="Deterministic verification completed successfully",
    )


@router.get("/{bill_id}/verification", response_model=ApiResponse[BillVerificationSummary])
def get_verification_results(
    bill_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
    session_id: Optional[str] = Depends(get_session_id),
):
    repo = BillRepository(db)
    bill = repo.get_by_id(bill_id)
    if not bill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found")
    check_bill_ownership(bill, current_user, session_id=session_id)

    service = VerificationService(db)
    summary = service.get_verification_summary(bill_id)
    return ApiResponse(
        data=summary,
        message="Verification results retrieved",
    )
