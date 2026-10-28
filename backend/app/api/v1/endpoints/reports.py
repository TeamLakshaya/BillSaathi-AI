from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user_optional, get_session_id
from app.api.v1.endpoints.bills import check_bill_ownership
from app.repositories.bill_repository import BillRepository
from app.schemas.common import ApiResponse
from app.schemas.report import ReportGenerateRequest, ReportResponse
from app.services.report_service import ReportService

router = APIRouter()


@router.post("/bills/{bill_id}/report", response_model=ApiResponse[ReportResponse], status_code=status.HTTP_201_CREATED)
def generate_report(
    bill_id: str,
    payload: ReportGenerateRequest = ReportGenerateRequest(),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
    session_id: Optional[str] = Depends(get_session_id),
):
    repo = BillRepository(db)
    bill = repo.get_by_id(bill_id)
    if not bill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found")
    check_bill_ownership(bill, current_user, session_id=session_id)

    service = ReportService(db)
    report = service.generate_report(bill_id, report_type=payload.report_type)
    return ApiResponse(data=report, message="Report generated successfully")


@router.get("/bills/{bill_id}/report", response_model=ApiResponse[ReportResponse])
def get_bill_report(
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

    service = ReportService(db)
    report = service.get_report_by_bill_id(bill_id)
    if not report:
        # Generate automatically if not exists
        report = service.generate_report(bill_id)

    return ApiResponse(data=report, message="Report retrieved")


@router.get("/reports/{report_id}/download")
def download_report(
    report_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
    session_id: Optional[str] = Depends(get_session_id),
):
    service = ReportService(db)
    try:
        report_meta = service.get_report_by_id(report_id)
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report not found")

    # Check ownership of underlying bill
    bill_repo = BillRepository(db)
    bill = bill_repo.get_by_id(report_meta.bill_id)
    if bill:
        check_bill_ownership(bill, current_user, session_id=session_id)

    pdf_bytes, filename = service.get_report_bytes(report_id)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

