from datetime import datetime
from decimal import Decimal
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Numeric, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.admission import Admission
    from app.models.hospital import Hospital
    from app.models.bill_item import BillItem


class ClinicalOrder(Base, TimestampMixin):
    __tablename__ = "clinical_orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    admission_id: Mapped[str] = mapped_column(String(36), ForeignKey("admissions.id", ondelete="CASCADE"), nullable=False, index=True)
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True)
    service_code: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    order_type: Mapped[str] = mapped_column(String(50), nullable=False)  # diagnostic | medicine | procedure | room_stay | consultation
    order_description: Mapped[str] = mapped_column(String(255), nullable=False)
    ordered_quantity: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=Decimal("1.00"), nullable=False)
    dispensed_quantity: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    administered_quantity: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    order_status: Mapped[str] = mapped_column(String(50), default="completed", nullable=False)  # ordered | sample_collected | dispensed | completed | cancelled
    order_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completion_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    ordering_clinician: Mapped[str] = mapped_column(String(255), nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    admission: Mapped["Admission"] = relationship("Admission", back_populates="clinical_orders")
    hospital: Mapped["Hospital"] = relationship("Hospital")
    bill_items: Mapped[List["BillItem"]] = relationship("BillItem", back_populates="clinical_order")
