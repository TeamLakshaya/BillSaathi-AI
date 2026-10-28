from datetime import date
from typing import Optional
from sqlalchemy import String, Date, Boolean, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base, TimestampMixin, generate_uuid


class PriceRule(Base, TimestampMixin):
    __tablename__ = "price_rules"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=generate_uuid)
    rule_name: Mapped[str] = mapped_column(String(255), nullable=False)
    rule_type: Mapped[str] = mapped_column(String(100), nullable=False)  # nppa_ceiling, cghs_rate, package_inclusion, tariff_cap
    applicable_item_category: Mapped[str] = mapped_column(String(100), nullable=False)
    rule_parameters: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON-encoded parameters
    source_reference: Mapped[str] = mapped_column(String(255), nullable=False)
    effective_from: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    effective_until: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    applicability_conditions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON-encoded conditions
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_synthetic: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
