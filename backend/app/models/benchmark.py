from datetime import date
from decimal import Decimal
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Numeric, Date, Boolean, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.hospital import Hospital


class Benchmark(Base, TimestampMixin):
    __tablename__ = "benchmarks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    normalized_item_name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    service_code: Mapped[Optional[str]] = mapped_column(String(100), index=True, nullable=True)
    hospital_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("hospitals.id", ondelete="SET NULL"), nullable=True, index=True)
    applicable_region: Mapped[str] = mapped_column(String(100), default="National", nullable=False)
    benchmark_type: Mapped[str] = mapped_column(String(100), nullable=False)  # price_ceiling, cghs_rate, hospital_tariff, market_median
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(10), default="INR", nullable=False)
    source_name: Mapped[str] = mapped_column(String(255), nullable=False)
    source_reference: Mapped[str] = mapped_column(String(255), nullable=False)
    source_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    effective_from: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    effective_until: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    applicability_conditions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON-encoded conditions
    verification_status: Mapped[str] = mapped_column(String(50), default="verified", nullable=False)
    is_synthetic: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    hospital: Mapped[Optional["Hospital"]] = relationship("Hospital", back_populates="benchmarks")
