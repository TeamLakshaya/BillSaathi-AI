import os
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, Response, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.api.dependencies import get_db, get_current_user_optional, get_session_id
from app.core.config import settings
from app.core.exceptions import FileValidationError
from app.models.user import User
from app.repositories.bill_repository import BillRepository
from app.schemas.bill import BillResponse, BillDetailResponse, BillUpdate
from app.schemas.common import ApiResponse
from app.services.bill_upload_service import BillUploadService

router = APIRouter()


def check_bill_ownership(bill, current_user: Optional[User], session_id: Optional[str] = None):
    """
    Enforces strict server-side ownership:
    - Demo bills are accessible for inspection.
    - Administrators have full access.
    - If user owns the bill via user_id, verifies current_user.id == bill.user_id.
    - If bill was uploaded without an account (session-scoped), requires matching X-Session-ID.
    - Rejects unauthorized access with 401 or 403.
    """
    if bill.is_demo:
        return
    if current_user and current_user.is_admin:
        return
    if bill.user_id:
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication credentials are required to access this private bill.",
            )
        if bill.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this bill.",
            )
        return
    # Guest / Session-scoped bill
    if bill.session_id:
        if not session_id or session_id.strip() != bill.session_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Session authorization failed: you do not have permission to access this bill.",
            )
        return
    # Legacy bill with neither user_id nor session_id: require authentication
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to access this unassigned bill.",
        )


@router.post("/upload", response_model=ApiResponse[BillDetailResponse], status_code=status.HTTP_201_CREATED)
async def upload_bill(
    response: Response,
    file: UploadFile = File(...),
    is_demo: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
    session_id: Optional[str] = Depends(get_session_id),
):
    try:
        content = await file.read()
        service = BillUploadService(db)
        user_id = current_user.id if current_user else None

        # Issue or retain session token for anonymous users
        effective_session_id = session_id or (uuid.uuid4().hex if not user_id else None)
        if effective_session_id:
            response.headers["X-Session-ID"] = effective_session_id

        detail = service.process_bill_upload(
            file_bytes=content,
            original_filename=file.filename or "uploaded_bill",
            content_type=file.content_type or "application/octet-stream",
            user_id=user_id,
            session_id=effective_session_id,
            is_demo=is_demo,
        )

        message = "Bill uploaded, parsed, and structured successfully."
        if detail.processing_status == "review_required":
            if not settings.GEMINI_API_KEY and not is_demo:
                message = "Bill uploaded. Live AI extraction requires GEMINI_API_KEY; document flagged for manual review."
            elif len(detail.items) == 0:
                message = "Bill uploaded. No line items could be extracted automatically; manual review is required."
            else:
                message = "Bill uploaded. Some items flagged for manual review due to low extraction confidence or ambiguous rates."
        elif is_demo:
            message = "Bill uploaded and parsed using demo extractor."

        return ApiResponse(
            data=detail,
            message=message,
        )
    except FileValidationError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Bill processing error: {str(e)}")


@router.get("", response_model=ApiResponse[List[BillResponse]])
def list_bills(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
    session_id: Optional[str] = Depends(get_session_id),
):
    repo = BillRepository(db)
    user_id = current_user.id if current_user else None
    bills = repo.list_by_user(user_id=user_id, session_id=session_id, include_demo=True, skip=skip, limit=limit)
    return ApiResponse(
        data=[BillResponse.model_validate(b) for b in bills],
        message=f"Retrieved {len(bills)} bills",
    )


@router.get("/{bill_id}", response_model=ApiResponse[BillDetailResponse])
def get_bill(
    bill_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
    session_id: Optional[str] = Depends(get_session_id),
):
    repo = BillRepository(db)
    bill = repo.get_by_id(bill_id)
    if not bill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found")

    check_bill_ownership(bill, current_user, session_id=session_id)
    return ApiResponse(
        data=BillDetailResponse.model_validate(bill),
        message="Bill retrieved successfully",
    )


@router.get("/{bill_id}/document")
def get_bill_document(
    bill_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
    session_id: Optional[str] = Depends(get_session_id),
):
    """Secure, authorized document streaming preventing path traversal."""
    repo = BillRepository(db)
    bill = repo.get_by_id(bill_id)
    if not bill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found")

    check_bill_ownership(bill, current_user, session_id=session_id)

    # Resolve safe path
    safe_filename = os.path.basename(bill.storage_path)
    full_path = Path(settings.UPLOAD_DIR) / safe_filename
    if not full_path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Original document file not found")

    ext = safe_filename.rsplit(".", 1)[-1].lower() if "." in safe_filename else "bin"
    if ext == "pdf":
        media_type = "application/pdf"
    elif ext in ("jpg", "jpeg"):
        media_type = "image/jpeg"
    elif ext == "png":
        media_type = "image/png"
    else:
        media_type = f"image/{ext}"

    return FileResponse(
        path=str(full_path),
        media_type=media_type,
        filename=bill.original_filename,
    )


@router.patch("/{bill_id}", response_model=ApiResponse[BillDetailResponse])
def update_bill(
    bill_id: str,
    data: BillUpdate,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
    session_id: Optional[str] = Depends(get_session_id),
):
    repo = BillRepository(db)
    bill = repo.get_by_id(bill_id)
    if not bill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found")

    check_bill_ownership(bill, current_user, session_id=session_id)
    updated = repo.update(bill_id, **data.model_dump(exclude_unset=True))
    return ApiResponse(
        data=BillDetailResponse.model_validate(updated),
        message="Bill updated successfully",
    )


@router.delete("/{bill_id}", response_model=ApiResponse[dict])
def delete_bill(
    bill_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
    session_id: Optional[str] = Depends(get_session_id),
):
    repo = BillRepository(db)
    bill = repo.get_by_id(bill_id)
    if not bill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found")

    check_bill_ownership(bill, current_user, session_id=session_id)

    # Clean up physical storage file
    try:
        safe_filename = os.path.basename(bill.storage_path)
        file_path = Path(settings.UPLOAD_DIR) / safe_filename
        if file_path.exists():
            file_path.unlink()
    except Exception:
        pass

    repo.delete(bill_id)
    return ApiResponse(data={"deleted_id": bill_id}, message="Bill deleted successfully")

