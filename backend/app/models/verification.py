from decimal import Decimal
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Numeric, Text, Boolean, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.bill import Bill
    from app.models.bill_item import BillItem
    from app.models.benchmark import Benchmark


class VerificationResult(Base, TimestampMixin):
    __tablename__ = "verification_results"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    bill_id: Mapped[str] = mapped_column(String(36), ForeignKey("bills.id", ondelete="CASCADE"), nullable=False, index=True)
    bill_item_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("bill_items.id", ondelete="CASCADE"), nullable=True, index=True)
    benchmark_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("benchmarks.id", ondelete="SET NULL"), nullable=True, index=True)
    billed_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    benchmark_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    difference_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False)  # verified_discrepancy, needs_review, insufficient_evidence, no_discrepancy_detected
    finding_category: Mapped[str] = mapped_column(String(100), default="arithmetic_mismatch", nullable=False)  # arithmetic_mismatch | possible_duplicate | tariff_comparison_difference | missing_evidence | medicine_price_compliance | payment_reconciliation_mismatch | ocr_uncertainty
    severity: Mapped[str] = mapped_column(String(50), default="medium", nullable=False)  # informational | low | medium | high
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    recommendation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    evidence: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON-encoded evidence dictionary
    confidence: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("1.00"), nullable=False)
    reviewer_status: Mapped[str] = mapped_column(String(50), default="requires_review", nullable=False)  # confirmed | requires_review | resolved
    rule_version: Mapped[str] = mapped_column(String(50), default="v1.0.0", nullable=False)
    bill_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    bill: Mapped["Bill"] = relationship("Bill", back_populates="verification_results")
    bill_item: Mapped[Optional["BillItem"]] = relationship("BillItem", back_populates="verification_results")
    benchmark: Mapped[Optional["Benchmark"]] = relationship("Benchmark")

