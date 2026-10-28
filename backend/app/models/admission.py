from datetime import date
from typing import Optional, List, TYPE_CHECKING
from sqlalchemy import String, Date, Boolean, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.hospital import Hospital
    from app.models.bill import Bill
    from app.models.clinical_order import ClinicalOrder


class Admission(Base, TimestampMixin):
    __tablename__ = "admissions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    hospital_id: Mapped[str] = mapped_column(String(36), ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True)
    patient_mrn: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    patient_name: Mapped[str] = mapped_column(String(255), nullable=False)
    admission_date: Mapped[date] = mapped_column(Date, nullable=False)
    discharge_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    admission_type: Mapped[str] = mapped_column(String(50), default="Planned/Elective", nullable=False)
    primary_diagnosis: Mapped[str] = mapped_column(String(255), nullable=False)
    attending_doctor: Mapped[str] = mapped_column(String(255), nullable=False)
    assigned_ward: Mapped[str] = mapped_column(String(100), nullable=False)
    room_category: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)  # General Ward | Semi-Private | Private | ICU
    length_of_stay_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    package_code: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    discharge_status: Mapped[str] = mapped_column(String(50), default="Discharged Stable", nullable=False)
    is_synthetic: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    hospital: Mapped["Hospital"] = relationship("Hospital", back_populates="admissions")
    bills: Mapped[List["Bill"]] = relationship("Bill", back_populates="admission")
    clinical_orders: Mapped[List["ClinicalOrder"]] = relationship("ClinicalOrder", back_populates="admission", cascade="all, delete-orphan")
