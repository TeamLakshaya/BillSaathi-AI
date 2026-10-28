"""Initial schema migration for Bill Saathi AI

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-28 01:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = "001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # 1. users table
    op.create_table(
        "users",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255), nullable=True),
        sa.Column("is_admin", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"])

    # 2. hospitals table
    op.create_table(
        "hospitals",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("location", sa.String(255), nullable=False),
        sa.Column("state", sa.String(100), nullable=False),
        sa.Column("hospital_category", sa.String(100), nullable=False, server_default="Private"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_hospitals_name", "hospitals", ["name"])
    op.create_index("ix_hospitals_state", "hospitals", ["state"])

    # 3. bills table
    op.create_table(
        "bills",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("hospital_id", sa.String(36), sa.ForeignKey("hospitals.id", ondelete="SET NULL"), nullable=True),
        sa.Column("original_filename", sa.String(255), nullable=False),
        sa.Column("storage_path", sa.String(500), nullable=False),
        sa.Column("bill_date", sa.Date(), nullable=True),
        sa.Column("total_amount", sa.Numeric(12, 2), nullable=False, server_default="0.00"),
        sa.Column("extracted_text", sa.Text(), nullable=True),
        sa.Column("processing_status", sa.String(50), nullable=False, server_default="uploaded"),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_bills_user_id", "bills", ["user_id"])
    op.create_index("ix_bills_hospital_id", "bills", ["hospital_id"])

    # 4. bill_items table
    op.create_table(
        "bill_items",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("bill_id", sa.String(36), sa.ForeignKey("bills.id", ondelete="CASCADE"), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("normalized_name", sa.String(255), nullable=False),
        sa.Column("service_code", sa.String(100), nullable=True),
        sa.Column("category", sa.String(100), nullable=False, server_default="General"),
        sa.Column("quantity", sa.Numeric(10, 2), nullable=False, server_default="1.00"),
        sa.Column("unit", sa.String(50), nullable=False, server_default="unit"),
        sa.Column("unit_price", sa.Numeric(12, 2), nullable=False, server_default="0.00"),
        sa.Column("line_total", sa.Numeric(12, 2), nullable=False, server_default="0.00"),
        sa.Column("extraction_confidence", sa.Numeric(5, 2), nullable=True),
        sa.Column("user_confirmed", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_bill_items_bill_id", "bill_items", ["bill_id"])
    op.create_index("ix_bill_items_normalized_name", "bill_items", ["normalized_name"])
    op.create_index("ix_bill_items_service_code", "bill_items", ["service_code"])

    # 5. benchmarks table
    op.create_table(
        "benchmarks",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("normalized_item_name", sa.String(255), nullable=False),
        sa.Column("service_code", sa.String(100), nullable=True),
        sa.Column("hospital_id", sa.String(36), sa.ForeignKey("hospitals.id", ondelete="SET NULL"), nullable=True),
        sa.Column("applicable_region", sa.String(100), nullable=False, server_default="National"),
        sa.Column("benchmark_type", sa.String(100), nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(10), nullable=False, server_default="INR"),
        sa.Column("source_name", sa.String(255), nullable=False),
        sa.Column("source_reference", sa.String(255), nullable=False),
        sa.Column("source_url", sa.String(500), nullable=True),
        sa.Column("effective_from", sa.Date(), nullable=True),
        sa.Column("effective_until", sa.Date(), nullable=True),
        sa.Column("applicability_conditions", sa.Text(), nullable=True),
        sa.Column("verification_status", sa.String(50), nullable=False, server_default="verified"),
        sa.Column("is_synthetic", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_benchmarks_normalized_item_name", "benchmarks", ["normalized_item_name"])
    op.create_index("ix_benchmarks_service_code", "benchmarks", ["service_code"])
    op.create_index("ix_benchmarks_hospital_id", "benchmarks", ["hospital_id"])

    # 6. price_rules table
    op.create_table(
        "price_rules",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("rule_name", sa.String(255), nullable=False),
        sa.Column("rule_type", sa.String(100), nullable=False),
        sa.Column("applicable_item_category", sa.String(100), nullable=False),
        sa.Column("rule_parameters", sa.Text(), nullable=True),
        sa.Column("source_reference", sa.String(255), nullable=False),
        sa.Column("effective_from", sa.Date(), nullable=True),
        sa.Column("effective_until", sa.Date(), nullable=True),
        sa.Column("applicability_conditions", sa.Text(), nullable=True),
        sa.Column("is_verified", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("is_synthetic", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )

    # 7. verification_results table
    op.create_table(
        "verification_results",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("bill_id", sa.String(36), sa.ForeignKey("bills.id", ondelete="CASCADE"), nullable=False),
        sa.Column("bill_item_id", sa.String(36), sa.ForeignKey("bill_items.id", ondelete="CASCADE"), nullable=True),
        sa.Column("billed_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("benchmark_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("difference_amount", sa.Numeric(12, 2), nullable=True),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("evidence", sa.Text(), nullable=True),
        sa.Column("confidence", sa.Numeric(5, 2), nullable=False, server_default="1.00"),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_verification_results_bill_id", "verification_results", ["bill_id"])
    op.create_index("ix_verification_results_bill_item_id", "verification_results", ["bill_item_id"])

    # 8. reports table
    op.create_table(
        "reports",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("bill_id", sa.String(36), sa.ForeignKey("bills.id", ondelete="CASCADE"), nullable=False),
        sa.Column("report_type", sa.String(50), nullable=False, server_default="audit_dossier"),
        sa.Column("report_status", sa.String(50), nullable=False, server_default="generated"),
        sa.Column("storage_path", sa.String(500), nullable=False),
        sa.Column("summary_data", sa.Text(), nullable=True),
        sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_reports_bill_id", "reports", ["bill_id"])


def downgrade() -> None:
    op.drop_table("reports")
    op.drop_table("verification_results")
    op.drop_table("price_rules")
    op.drop_table("benchmarks")
    op.drop_table("bill_items")
    op.drop_table("bills")
    op.drop_table("hospitals")
    op.drop_table("users")
