from datetime import date, datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.hospital import HospitalResponse
from app.schemas.bill_item import BillItemResponse


class ExtractedItemData(BaseModel):
    description: str
    normalized_name: str
    service_code: Optional[str] = None
    category: str = "General"
    quantity: Decimal = Field(default=Decimal("1.00"), ge=0)
    unit: str = "unit"
    unit_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    line_total: Decimal = Field(default=Decimal("0.00"), ge=0)
    confidence: Optional[Decimal] = Field(default=Decimal("0.90"), ge=0, le=1)
    data_source: str = "ocr_extracted"
    page_number: Optional[int] = None
    is_uncertain: bool = False
    uncertainty_reason: Optional[str] = None


class ExtractedBillData(BaseModel):
    hospital_name: Optional[str] = None
    hospital_location: Optional[str] = None
    bill_date: Optional[date] = None
    items: List[ExtractedItemData] = []
    subtotal: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    grand_total: Decimal = Field(default=Decimal("0.00"), ge=0)
    raw_text: Optional[str] = None


class BillUpdate(BaseModel):
    hospital_id: Optional[str] = None
    bill_date: Optional[date] = None
    subtotal: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    total_amount: Optional[Decimal] = None
    processing_status: Optional[str] = None


class BillResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    hospital_id: Optional[str] = None
    original_filename: str
    storage_path: str  # Safe sanitized path
    file_hash: Optional[str] = None
    bill_date: Optional[date] = None
    subtotal: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    total_amount: Decimal
    processing_status: str
    version: int = 1
    audit_version: int = 0
    is_audit_outdated: bool = False
    is_demo: bool
    created_at: datetime
    hospital: Optional[HospitalResponse] = None

    model_config = ConfigDict(from_attributes=True)

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        # Compute is_audit_outdated
        instance = super().model_validate(obj, *args, **kwargs)
        if getattr(obj, "version", 1) > getattr(obj, "audit_version", 0) and getattr(obj, "audit_version", 0) > 0:
            instance.is_audit_outdated = True
        # Sanitize storage_path to avoid exposing server filesystem
        if instance.storage_path:
            import os
            instance.storage_path = os.path.basename(instance.storage_path)
        return instance


class BillDetailResponse(BillResponse):
    items: List[BillItemResponse] = []
    extracted_text: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

