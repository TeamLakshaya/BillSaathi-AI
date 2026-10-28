from decimal import Decimal
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Numeric, Integer, Boolean, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.hospital import Hospital


class HospitalMedicine(Base, TimestampMixin):
    """
    Standardized medicine catalog and hospital-specific formulary records.
    Distinguishes printed MRP, NPPA regulated ceiling (where verified),
    hospital procurement cost, billed rate, and patient-payable rate.
    """
    __tablename__ = "hospital_medicines"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True)
    service_code: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    medicine_name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    generic_name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    brand_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    strength: Mapped[str] = mapped_column(String(100), nullable=False)  # e.g., 650mg, 1g, 500mg
    dosage_form: Mapped[str] = mapped_column(String(100), default="Tablet", nullable=False)  # Tablet, Injection, IV Fluid, Sachet
    pack_size: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    dispensing_unit: Mapped[str] = mapped_column(String(50), default="tablet", nullable=False)  # tablet, vial, ampoule, bottle
    manufacturer: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    mrp: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    regulated_ceiling_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    procurement_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    billed_rate_per_unit: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    patient_payable_rate: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    stock_status: Mapped[str] = mapped_column(String(50), default="in_stock", nullable=False)  # in_stock | low_stock | out_of_stock
    subsidy_category: Mapped[str] = mapped_column(String(50), default="non_subsidized", nullable=False)  # fully_subsidized_free | partially_subsidized | non_subsidized | patient_purchased_outside
    subsidy_reason: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    source_reference: Mapped[str] = mapped_column(String(255), default="Simulated Formulary 2026", nullable=False)
    is_synthetic: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    hospital: Mapped["Hospital"] = relationship("Hospital", back_populates="medicines")
