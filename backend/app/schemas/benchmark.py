from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class BenchmarkCreate(BaseModel):
    normalized_item_name: str
    service_code: Optional[str] = None
    hospital_id: Optional[str] = None
    applicable_region: str = "National"
    benchmark_type: str = "price_ceiling"
    amount: Decimal = Field(..., ge=0)
    currency: str = "INR"
    source_name: str
    source_reference: str
    source_url: Optional[str] = None
    effective_from: Optional[date] = None
    effective_until: Optional[date] = None
    applicability_conditions: Optional[str] = None
    verification_status: str = "verified"
    is_synthetic: bool = False


class BenchmarkResponse(BaseModel):
    id: str
    normalized_item_name: str
    service_code: Optional[str] = None
    hospital_id: Optional[str] = None
    applicable_region: str
    benchmark_type: str
    amount: Decimal
    currency: str
    source_name: str
    source_reference: str
    source_url: Optional[str] = None
    effective_from: Optional[date] = None
    effective_until: Optional[date] = None
    applicability_conditions: Optional[str] = None
    verification_status: str
    is_synthetic: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
