"""Enhanced audit and security migration

Revision ID: 002_enhanced_audit_and_security
Revises: 001_initial_schema
Create Date: 2026-10-28 02:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "002_enhanced_audit_and_security"
down_revision = "001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    # Clean up any leftover temporary tables from interrupted SQLite batch operations
    for tmp_tbl in ["_alembic_tmp_bills", "_alembic_tmp_bill_items", "_alembic_tmp_verification_results", "_alembic_tmp_reports"]:
        try:
            conn.execute(sa.text(f"DROP TABLE IF EXISTS {tmp_tbl}"))
        except Exception:
            pass

    insp = inspect(conn)

    # 1. Update bills table
    existing_bills_cols = {c["name"] for c in insp.get_columns("bills")}
    with op.batch_alter_table("bills") as batch_op:
        if "session_id" not in existing_bills_cols:
            batch_op.add_column(sa.Column("session_id", sa.String(64), nullable=True))
        if "file_hash" not in existing_bills_cols:
            batch_op.add_column(sa.Column("file_hash", sa.String(64), nullable=True))
        if "subtotal" not in existing_bills_cols:
            batch_op.add_column(sa.Column("subtotal", sa.Numeric(12, 2), nullable=True))
        if "tax_amount" not in existing_bills_cols:
            batch_op.add_column(sa.Column("tax_amount", sa.Numeric(12, 2), nullable=True))
        if "discount_amount" not in existing_bills_cols:
            batch_op.add_column(sa.Column("discount_amount", sa.Numeric(12, 2), nullable=True))
        if "version" not in existing_bills_cols:
            batch_op.add_column(sa.Column("version", sa.Integer(), nullable=False, server_default="1"))
        if "audit_version" not in existing_bills_cols:
            batch_op.add_column(sa.Column("audit_version", sa.Integer(), nullable=False, server_default="0"))

    # 2. Update bill_items table
    existing_items_cols = {c["name"] for c in insp.get_columns("bill_items")}
    with op.batch_alter_table("bill_items") as batch_op:
        if "data_source" not in existing_items_cols:
            batch_op.add_column(sa.Column("data_source", sa.String(50), nullable=False, server_default="ocr_extracted"))
        if "page_number" not in existing_items_cols:
            batch_op.add_column(sa.Column("page_number", sa.Integer(), nullable=True))
        if "is_uncertain" not in existing_items_cols:
            batch_op.add_column(sa.Column("is_uncertain", sa.Boolean(), nullable=False, server_default=sa.text("0")))
        if "uncertainty_reason" not in existing_items_cols:
            batch_op.add_column(sa.Column("uncertainty_reason", sa.String(255), nullable=True))

    # 3. Update verification_results table
    existing_verif_cols = {c["name"] for c in insp.get_columns("verification_results")}
    with op.batch_alter_table("verification_results") as batch_op:
        if "benchmark_id" not in existing_verif_cols:
            batch_op.add_column(sa.Column("benchmark_id", sa.String(36), sa.ForeignKey("benchmarks.id", ondelete="SET NULL", name="fk_verif_benchmark_id"), nullable=True))
        if "rule_version" not in existing_verif_cols:
            batch_op.add_column(sa.Column("rule_version", sa.String(50), nullable=False, server_default="v1.0.0"))
        if "bill_version" not in existing_verif_cols:
            batch_op.add_column(sa.Column("bill_version", sa.Integer(), nullable=False, server_default="1"))

    # 4. Update reports table
    existing_rep_cols = {c["name"] for c in insp.get_columns("reports")}
    with op.batch_alter_table("reports") as batch_op:
        if "bill_version" not in existing_rep_cols:
            batch_op.add_column(sa.Column("bill_version", sa.Integer(), nullable=False, server_default="1"))
        if "audit_version" not in existing_rep_cols:
            batch_op.add_column(sa.Column("audit_version", sa.Integer(), nullable=False, server_default="1"))


def downgrade() -> None:
    pass
