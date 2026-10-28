from datetime import date
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Date, Numeric, Text, Boolean, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.hospital import Hospital
    from app.models.bill_item import BillItem
    from app.models.verification import VerificationResult
    from app.models.report import Report
    from app.models.admission import Admission
    from app.models.payment import BillPayment


class Bill(Base, TimestampMixin):
    __tablename__ = "bills"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    session_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    hospital_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("hospitals.id", ondelete="SET NULL"), nullable=True, index=True)
    admission_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("admissions.id", ondelete="SET NULL"), nullable=True, index=True)
    invoice_number: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    invoice_type: Mapped[str] = mapped_column(String(50), default="final", nullable=False)  # estimate | interim | final
    patient_mrn: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    patient_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    room_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    admission_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    discharge_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)
    bill_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    subtotal: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    tax_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    discount_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    rounding_adjustment: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("0.00"), nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal("0.00"), nullable=False)
    net_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    extracted_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    processing_status: Mapped[str] = mapped_column(String(50), default="uploaded", nullable=False)
    audit_scenario: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # valid | arithmetic_error | duplicate_line | quantity_mismatch | unsupported_charge | inconsistent_room_days | medicine_qty_mismatch | payment_reconciliation_discrepancy
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    audit_version: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    user: Mapped[Optional["User"]] = relationship("User", back_populates="bills")
    hospital: Mapped[Optional["Hospital"]] = relationship("Hospital", back_populates="bills")
    admission: Mapped[Optional["Admission"]] = relationship("Admission", back_populates="bills")
    items: Mapped[List["BillItem"]] = relationship("BillItem", back_populates="bill", cascade="all, delete-orphan", order_by="BillItem.created_at")
    payments: Mapped[List["BillPayment"]] = relationship("BillPayment", back_populates="bill", cascade="all, delete-orphan", order_by="BillPayment.payment_date")
    verification_results: Mapped[List["VerificationResult"]] = relationship("VerificationResult", back_populates="bill", cascade="all, delete-orphan")
    reports: Mapped[List["Report"]] = relationship("Report", back_populates="bill", cascade="all, delete-orphan")

