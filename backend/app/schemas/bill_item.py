from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class BillItemBase(BaseModel):
    description: str
    normalized_name: str
    service_code: Optional[str] = None
    category: str = "General"
    quantity: Decimal = Field(default=Decimal("1.00"), ge=0)
    unit: str = "unit"
    unit_price: Decimal = Field(default=Decimal("0.00"), ge=0)
    line_total: Decimal = Field(default=Decimal("0.00"), ge=0)


class BillItemCreate(BillItemBase):
    bill_id: Optional[str] = None
    extraction_confidence: Optional[Decimal] = None
    user_confirmed: bool = True
    data_source: str = "ocr_extracted"
    page_number: Optional[int] = None
    is_uncertain: bool = False
    uncertainty_reason: Optional[str] = None


class BillItemUpdate(BaseModel):
    description: Optional[str] = None
    normalized_name: Optional[str] = None
    service_code: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[Decimal] = Field(default=None, ge=0)
    unit: Optional[str] = None
    unit_price: Optional[Decimal] = Field(default=None, ge=0)
    line_total: Optional[Decimal] = Field(default=None, ge=0)
    user_confirmed: Optional[bool] = None
    data_source: Optional[str] = None
    page_number: Optional[int] = None
    is_uncertain: Optional[bool] = None
    uncertainty_reason: Optional[str] = None


class BillItemResponse(BillItemBase):
    id: str
    bill_id: str
    extraction_confidence: Optional[Decimal] = None
    user_confirmed: bool
    data_source: str = "ocr_extracted"
    page_number: Optional[int] = None
    is_uncertain: bool = False
    uncertainty_reason: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

