from datetime import date
from decimal import Decimal
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Numeric, Date, Boolean, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.hospital import Hospital


class HospitalServiceCatalog(Base, TimestampMixin):
    __tablename__ = "hospital_service_catalogs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True)
    service_code: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    service_name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    applicable_service_type: Mapped[str] = mapped_column(String(50), default="other", nullable=False)  # room_stay | diagnostic | procedure | medicine | consumable | consultation | package | other
    unit: Mapped[str] = mapped_column(String(50), default="unit", nullable=False)
    rate: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    room_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    service_inclusions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON-encoded array of included services
    package_inclusions_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    effective_from: Mapped[date] = mapped_column(Date, nullable=False)
    effective_until: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    data_provenance: Mapped[str] = mapped_column(String(255), default="Simulated Hospital Tariff 2026", nullable=False)

    hospital: Mapped["Hospital"] = relationship("Hospital", back_populates="service_catalog")
