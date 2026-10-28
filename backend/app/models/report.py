from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, Boolean, Integer, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base, TimestampMixin, generate_uuid

if TYPE_CHECKING:
    from app.models.bill import Bill


class Report(Base, TimestampMixin):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    bill_id: Mapped[str] = mapped_column(String(36), ForeignKey("bills.id", ondelete="CASCADE"), nullable=False, index=True)
    report_type: Mapped[str] = mapped_column(String(50), default="audit_dossier", nullable=False)
    report_status: Mapped[str] = mapped_column(String(50), default="generated", nullable=False)
    storage_path: Mapped[str] = mapped_column(String(500), nullable=False)
    summary_data: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON-encoded summary data
    bill_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    audit_version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_demo: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    bill: Mapped["Bill"] = relationship("Bill", back_populates="reports")

