from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Integer, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.bill import Bill
    from app.models.benchmark import Benchmark
    from app.models.service_catalog import HospitalServiceCatalog
    from app.models.admission import Admission
    from app.models.medicine import HospitalMedicine


class Hospital(Base, TimestampMixin):
    __tablename__ = "hospitals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    code: Mapped[Optional[str]] = mapped_column(String(50), unique=True, index=True, nullable=True)  # HOSP-001, HOSP-002, HOSP-003
    name: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[str] = mapped_column(String(100), default="Lucknow", nullable=False)
    state: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    hospital_type: Mapped[str] = mapped_column(String(50), default="Private", nullable=False)  # Private | Government | Charitable
    hospital_category: Mapped[str] = mapped_column(String(100), default="Private", nullable=False)
    facility_category: Mapped[str] = mapped_column(String(100), default="Multispecialty", nullable=False)  # Multispecialty | Tertiary-care | District
    tier: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # budget | mid_range | premium_tertiary | government_subsidized
    tariff_profile: Mapped[str] = mapped_column(String(100), default="Standard", nullable=False)  # Budget Multispecialty | Premium Tertiary | Government Subsidized
    bed_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    nabh_status: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    facilities_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON-encoded capabilities and infrastructure
    specialties_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON-encoded array of clinical departments
    aliases_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON list of string aliases
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_simulated: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    bills: Mapped[List["Bill"]] = relationship("Bill", back_populates="hospital")
    benchmarks: Mapped[List["Benchmark"]] = relationship("Benchmark", back_populates="hospital")
    service_catalog: Mapped[List["HospitalServiceCatalog"]] = relationship("HospitalServiceCatalog", back_populates="hospital", cascade="all, delete-orphan")
    admissions: Mapped[List["Admission"]] = relationship("Admission", back_populates="hospital", cascade="all, delete-orphan")
    medicines: Mapped[List["HospitalMedicine"]] = relationship("HospitalMedicine", back_populates="hospital", cascade="all, delete-orphan")

