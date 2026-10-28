from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.bill_item import BillItemResponse


class VerificationResultResponse(BaseModel):
    id: str
    bill_id: str
    bill_item_id: Optional[str] = None
    benchmark_id: Optional[str] = None
    billed_amount: Decimal
    benchmark_amount: Optional[Decimal] = None
    difference_amount: Optional[Decimal] = None
    status: str  # verified_discrepancy, needs_review, insufficient_evidence, no_discrepancy_detected
    reason: str
    evidence: Optional[str] = None  # JSON string or details
    confidence: Decimal
    rule_version: str = "v1.0.0"
    bill_version: int = 1
    is_demo: bool
    created_at: datetime
    bill_item: Optional[BillItemResponse] = None

    model_config = ConfigDict(from_attributes=True)


class BillVerificationSummary(BaseModel):
    bill_id: str
    bill_date: Optional[str] = None
    hospital_name: Optional[str] = None
    total_billed: Decimal
    subtotal: Optional[Decimal] = None
    tax_amount: Optional[Decimal] = None
    discount_amount: Optional[Decimal] = None
    calculated_items_total: Decimal
    arithmetic_valid: bool
    total_verified_discrepancies: Decimal
    total_review_items: int
    overall_status: str
    bill_version: int = 1
    audit_version: int = 1
    is_outdated: bool = False
    is_demo: bool
    results: List[VerificationResultResponse] = []

    model_config = ConfigDict(from_attributes=True)

