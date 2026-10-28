from datetime import date
from decimal import Decimal
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Numeric, Date, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.bill import Bill


class BillPayment(Base, TimestampMixin):
    __tablename__ = "bill_payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    bill_id: Mapped[str] = mapped_column(String(36), ForeignKey("bills.id", ondelete="CASCADE"), nullable=False, index=True)
    payment_date: Mapped[date] = mapped_column(Date, nullable=False)
    payment_type: Mapped[str] = mapped_column(String(50), nullable=False)  # deposit | partial_payment | final_settlement | tpa_insurance_claim | refund
    payment_mode: Mapped[str] = mapped_column(String(50), default="UPI", nullable=False)  # UPI | Cash | Credit Card | Debit Card | NEFT/RTGS | TPA Direct
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    transaction_reference: Mapped[str] = mapped_column(String(100), nullable=False)
    insurance_claim_id: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tpa_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    claim_claimed_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    claim_approved_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    claim_deduction_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    claim_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # submitted | approved | rejected | settled
    reconciliation_status: Mapped[str] = mapped_column(String(50), default="reconciled", nullable=False)  # reconciled | pending_settlement | disputed | refund_pending
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    bill: Mapped["Bill"] = relationship("Bill", back_populates="payments")
