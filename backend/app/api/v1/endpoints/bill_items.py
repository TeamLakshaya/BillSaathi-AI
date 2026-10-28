from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.api.dependencies import get_db, get_current_user_optional, get_session_id
from app.api.v1.endpoints.bills import check_bill_ownership
from app.repositories.bill_repository import BillRepository
from app.schemas.bill_item import BillItemCreate, BillItemUpdate, BillItemResponse
from app.schemas.common import ApiResponse

router = APIRouter()


@router.get("/{bill_id}/items", response_model=ApiResponse[List[BillItemResponse]])
def get_bill_items(
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

    items = repo.get_items(bill_id)
    return ApiResponse(
        data=[BillItemResponse.model_validate(it) for it in items],
        message=f"Retrieved {len(items)} bill items",
    )


@router.post("/{bill_id}/items", response_model=ApiResponse[BillItemResponse], status_code=status.HTTP_201_CREATED)
def add_bill_item(
    bill_id: str,
    data: BillItemCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
    session_id: Optional[str] = Depends(get_session_id),
):
    repo = BillRepository(db)
    bill = repo.get_by_id(bill_id)
    if not bill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found")
    check_bill_ownership(bill, current_user, session_id=session_id)

    payload = [data.model_dump(exclude_unset=True)]
    if "data_source" not in payload[0]:
        payload[0]["data_source"] = "manual"
    payload[0]["user_confirmed"] = True

    created = repo.add_items(bill_id, payload)
    # Material change marks bill ready for re-audit
    repo.update(bill_id, processing_status="ready_for_audit")

    return ApiResponse(
        data=BillItemResponse.model_validate(created[0]),
        message="Item added to bill",
    )


@router.patch("/{bill_id}/items/{item_id}", response_model=ApiResponse[BillItemResponse])
def update_bill_item(
    bill_id: str,
    item_id: str,
    data: BillItemUpdate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
    session_id: Optional[str] = Depends(get_session_id),
):
    repo = BillRepository(db)
    bill = repo.get_by_id(bill_id)
    if not bill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found")
    check_bill_ownership(bill, current_user, session_id=session_id)

    item = repo.get_item_by_id(item_id)
    if not item or item.bill_id != bill_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill item not found")

    patch_data = data.model_dump(exclude_unset=True)
    patch_data["data_source"] = "user_corrected"
    patch_data["user_confirmed"] = True
    patch_data["is_uncertain"] = False
    patch_data["uncertainty_reason"] = None

    updated = repo.update_item(item_id, **patch_data)
    # Invalidate prior audit version and mark ready for audit
    repo.update(bill_id, processing_status="ready_for_audit")

    return ApiResponse(
        data=BillItemResponse.model_validate(updated),
        message="Bill item corrected successfully",
    )


@router.delete("/{bill_id}/items/{item_id}", response_model=ApiResponse[dict])
def delete_bill_item(
    bill_id: str,
    item_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user_optional),
    session_id: Optional[str] = Depends(get_session_id),
):
    repo = BillRepository(db)
    bill = repo.get_by_id(bill_id)
    if not bill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill not found")
    check_bill_ownership(bill, current_user, session_id=session_id)

    item = repo.get_item_by_id(item_id)
    if not item or item.bill_id != bill_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Bill item not found")

    repo.delete_item(item_id)
    repo.update(bill_id, processing_status="ready_for_audit")

    return ApiResponse(data={"deleted_item_id": item_id}, message="Bill item deleted successfully")

