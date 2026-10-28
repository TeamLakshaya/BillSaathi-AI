from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Numeric, Text, Boolean, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.bill import Bill
    from app.models.verification import VerificationResult
    from app.models.clinical_order import ClinicalOrder


class BillItem(Base, TimestampMixin):
    __tablename__ = "bill_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    bill_id: Mapped[str] = mapped_column(String(36), ForeignKey("bills.id", ondelete="CASCADE"), nullable=False, index=True)
    order_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("clinical_orders.id", ondelete="SET NULL"), nullable=True, index=True)
    line_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    normalized_name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    service_code: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    category: Mapped[str] = mapped_column(String(100), default="General", nullable=False)
    quantity: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("1.00"), nullable=False)
    dispensed_quantity: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    administered_quantity: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    unit: Mapped[str] = mapped_column(String(50), default="unit", nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    is_package_inclusion: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    package_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    extraction_confidence: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    user_confirmed: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    data_source: Mapped[str] = mapped_column(String(50), default="ocr_extracted", nullable=False)  # ocr_extracted | user_corrected | ai_suggested | manual | synthetic_demo
    page_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    is_uncertain: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    uncertainty_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    is_synthetic: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    bill: Mapped["Bill"] = relationship("Bill", back_populates="items")
    clinical_order: Mapped[Optional["ClinicalOrder"]] = relationship("ClinicalOrder", back_populates="bill_items")
    verification_results: Mapped[List["VerificationResult"]] = relationship("VerificationResult", back_populates="bill_item", cascade="all, delete-orphan")

