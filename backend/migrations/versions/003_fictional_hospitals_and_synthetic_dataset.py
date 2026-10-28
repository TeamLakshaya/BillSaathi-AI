"""Fictional hospitals and synthetic dataset migration

Revision ID: 003_fictional_hospitals_and_synthetic_dataset
Revises: 002_enhanced_audit_and_security
Create Date: 2026-10-28 04:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "003_fictional_hospitals_and_synthetic_dataset"
down_revision = "002_enhanced_audit_and_security"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    for tmp_tbl in ["_alembic_tmp_bills", "_alembic_tmp_bill_items", "_alembic_tmp_hospitals", "_alembic_tmp_admissions", "_alembic_tmp_verification_results"]:
        try:
            conn.execute(sa.text(f"DROP TABLE IF EXISTS {tmp_tbl}"))
        except Exception:
            pass
    insp = inspect(conn)
    existing_tables = set(insp.get_table_names())

    # 1. Update hospitals table
    if "hospitals" in existing_tables:
        existing_cols = {c["name"] for c in insp.get_columns("hospitals")}
        with op.batch_alter_table("hospitals") as batch_op:
            if "tier" not in existing_cols:
                batch_op.add_column(sa.Column("tier", sa.String(50), nullable=True))
            if "bed_count" not in existing_cols:
                batch_op.add_column(sa.Column("bed_count", sa.Integer(), nullable=True))
            if "nabh_status" not in existing_cols:
                batch_op.add_column(sa.Column("nabh_status", sa.String(100), nullable=True))
            if "facilities_json" not in existing_cols:
                batch_op.add_column(sa.Column("facilities_json", sa.Text(), nullable=True))
            if "specialties_json" not in existing_cols:
                batch_op.add_column(sa.Column("specialties_json", sa.Text(), nullable=True))
            if "is_simulated" not in existing_cols:
                batch_op.add_column(sa.Column("is_simulated", sa.Boolean(), nullable=False, server_default=sa.text("1")))
            if "code" not in existing_cols:
                batch_op.add_column(sa.Column("code", sa.String(50), nullable=True))
            if "city" not in existing_cols:
                batch_op.add_column(sa.Column("city", sa.String(100), nullable=False, server_default="Lucknow"))
            if "hospital_type" not in existing_cols:
                batch_op.add_column(sa.Column("hospital_type", sa.String(50), nullable=False, server_default="Private"))
            if "facility_category" not in existing_cols:
                batch_op.add_column(sa.Column("facility_category", sa.String(100), nullable=False, server_default="Multispecialty"))
            if "tariff_profile" not in existing_cols:
                batch_op.add_column(sa.Column("tariff_profile", sa.String(100), nullable=False, server_default="Standard"))
            if "aliases_json" not in existing_cols:
                batch_op.add_column(sa.Column("aliases_json", sa.Text(), nullable=True))
            if "is_active" not in existing_cols:
                batch_op.add_column(sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")))


    # 2. Update hospital_service_catalogs table
    if "hospital_service_catalogs" in existing_tables:
        existing_cols = {c["name"] for c in insp.get_columns("hospital_service_catalogs")}
        with op.batch_alter_table("hospital_service_catalogs") as batch_op:
            if "description" not in existing_cols:
                batch_op.add_column(sa.Column("description", sa.Text(), nullable=True))
            if "applicable_service_type" not in existing_cols:
                batch_op.add_column(sa.Column("applicable_service_type", sa.String(50), nullable=False, server_default="other"))
            if "package_inclusions_json" not in existing_cols:
                batch_op.add_column(sa.Column("package_inclusions_json", sa.Text(), nullable=True))
    else:
        op.create_table(
            "hospital_service_catalogs",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("hospital_id", sa.String(36), sa.ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("service_code", sa.String(100), index=True, nullable=False),
            sa.Column("service_name", sa.String(255), index=True, nullable=False),
            sa.Column("description", sa.Text(), nullable=True),
            sa.Column("category", sa.String(100), index=True, nullable=False),
            sa.Column("department", sa.String(100), nullable=False),
            sa.Column("applicable_service_type", sa.String(50), nullable=False, server_default="other"),
            sa.Column("unit", sa.String(50), nullable=False, server_default="unit"),
            sa.Column("rate", sa.Numeric(12, 2), nullable=False),
            sa.Column("currency", sa.String(10), nullable=False, server_default="INR"),
            sa.Column("room_category", sa.String(100), nullable=True),
            sa.Column("service_inclusions", sa.Text(), nullable=True),
            sa.Column("package_inclusions_json", sa.Text(), nullable=True),
            sa.Column("effective_from", sa.Date(), nullable=False),
            sa.Column("effective_until", sa.Date(), nullable=True),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
            sa.Column("data_provenance", sa.String(255), nullable=False, server_default="Simulated Hospital Tariff 2026"),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        )

    # 3. Create hospital_medicines table if not exists
    if "hospital_medicines" not in existing_tables:
        op.create_table(
            "hospital_medicines",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("hospital_id", sa.String(36), sa.ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("service_code", sa.String(100), index=True, nullable=False),
            sa.Column("medicine_name", sa.String(255), index=True, nullable=False),
            sa.Column("generic_name", sa.String(255), index=True, nullable=False),
            sa.Column("brand_name", sa.String(255), nullable=True),
            sa.Column("strength", sa.String(100), nullable=False),
            sa.Column("dosage_form", sa.String(100), nullable=False, server_default="Tablet"),
            sa.Column("pack_size", sa.Integer(), nullable=False, server_default="10"),
            sa.Column("dispensing_unit", sa.String(50), nullable=False, server_default="tablet"),
            sa.Column("manufacturer", sa.String(255), nullable=True),
            sa.Column("mrp", sa.Numeric(12, 2), nullable=False),
            sa.Column("regulated_ceiling_price", sa.Numeric(12, 2), nullable=True),
            sa.Column("procurement_cost", sa.Numeric(12, 2), nullable=True),
            sa.Column("billed_rate_per_unit", sa.Numeric(12, 2), nullable=False),
            sa.Column("patient_payable_rate", sa.Numeric(12, 2), nullable=False),
            sa.Column("stock_status", sa.String(50), nullable=False, server_default="in_stock"),
            sa.Column("subsidy_category", sa.String(50), nullable=False, server_default="non_subsidized"),
            sa.Column("subsidy_reason", sa.String(255), nullable=True),
            sa.Column("source_reference", sa.String(255), nullable=False, server_default="Simulated Formulary 2026"),
            sa.Column("is_synthetic", sa.Boolean(), nullable=False, server_default=sa.text("1")),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        )

    # 4. Update admissions table
    if "admissions" in existing_tables:
        existing_cols = {c["name"] for c in insp.get_columns("admissions")}
        with op.batch_alter_table("admissions") as batch_op:
            if "room_category" not in existing_cols:
                batch_op.add_column(sa.Column("room_category", sa.String(100), nullable=True))
            if "length_of_stay_days" not in existing_cols:
                batch_op.add_column(sa.Column("length_of_stay_days", sa.Integer(), nullable=True))
            if "package_code" not in existing_cols:
                batch_op.add_column(sa.Column("package_code", sa.String(100), nullable=True))
    else:
        op.create_table(
            "admissions",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("hospital_id", sa.String(36), sa.ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("patient_mrn", sa.String(100), index=True, nullable=False),
            sa.Column("patient_name", sa.String(255), nullable=False),
            sa.Column("admission_date", sa.Date(), nullable=False),
            sa.Column("discharge_date", sa.Date(), nullable=True),
            sa.Column("admission_type", sa.String(50), nullable=False, server_default="Planned/Elective"),
            sa.Column("primary_diagnosis", sa.String(255), nullable=False),
            sa.Column("attending_doctor", sa.String(255), nullable=False),
            sa.Column("assigned_ward", sa.String(100), nullable=False),
            sa.Column("room_category", sa.String(100), nullable=True),
            sa.Column("length_of_stay_days", sa.Integer(), nullable=True),
            sa.Column("package_code", sa.String(100), nullable=True),
            sa.Column("discharge_status", sa.String(50), nullable=False, server_default="Discharged Stable"),
            sa.Column("is_synthetic", sa.Boolean(), nullable=False, server_default=sa.text("1")),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        )

    # 5. Create clinical_orders table if not exists
    if "clinical_orders" not in existing_tables:
        op.create_table(
            "clinical_orders",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("admission_id", sa.String(36), sa.ForeignKey("admissions.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("hospital_id", sa.String(36), sa.ForeignKey("hospitals.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("service_code", sa.String(100), index=True, nullable=False),
            sa.Column("order_type", sa.String(50), nullable=False),
            sa.Column("order_description", sa.String(255), nullable=False),
            sa.Column("ordered_quantity", sa.Numeric(10, 2), nullable=False, server_default="1.00"),
            sa.Column("dispensed_quantity", sa.Numeric(10, 2), nullable=True),
            sa.Column("administered_quantity", sa.Numeric(10, 2), nullable=True),
            sa.Column("order_status", sa.String(50), nullable=False, server_default="completed"),
            sa.Column("order_date", sa.DateTime(timezone=True), nullable=False),
            sa.Column("completion_date", sa.DateTime(timezone=True), nullable=True),
            sa.Column("ordering_clinician", sa.String(255), nullable=False),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        )

    # 6. Update bills table
    if "bills" in existing_tables:
        existing_cols = {c["name"] for c in insp.get_columns("bills")}
        with op.batch_alter_table("bills") as batch_op:
            if "admission_id" not in existing_cols:
                batch_op.add_column(sa.Column("admission_id", sa.String(36), sa.ForeignKey("admissions.id", ondelete="SET NULL", name="fk_bills_admission_id"), nullable=True))
            if "invoice_number" not in existing_cols:
                batch_op.add_column(sa.Column("invoice_number", sa.String(100), nullable=True))
            if "invoice_type" not in existing_cols:
                batch_op.add_column(sa.Column("invoice_type", sa.String(50), nullable=False, server_default="final"))
            if "patient_mrn" not in existing_cols:
                batch_op.add_column(sa.Column("patient_mrn", sa.String(100), nullable=True))
            if "patient_name" not in existing_cols:
                batch_op.add_column(sa.Column("patient_name", sa.String(255), nullable=True))
            if "room_category" not in existing_cols:
                batch_op.add_column(sa.Column("room_category", sa.String(100), nullable=True))
            if "admission_date" not in existing_cols:
                batch_op.add_column(sa.Column("admission_date", sa.Date(), nullable=True))
            if "discharge_date" not in existing_cols:
                batch_op.add_column(sa.Column("discharge_date", sa.Date(), nullable=True))
            if "rounding_adjustment" not in existing_cols:
                batch_op.add_column(sa.Column("rounding_adjustment", sa.Numeric(10, 2), nullable=False, server_default="0.00"))
            if "net_amount" not in existing_cols:
                batch_op.add_column(sa.Column("net_amount", sa.Numeric(12, 2), nullable=True))
            if "audit_scenario" not in existing_cols:
                batch_op.add_column(sa.Column("audit_scenario", sa.String(100), nullable=True))

    # 7. Update bill_items table
    if "bill_items" in existing_tables:
        existing_cols = {c["name"] for c in insp.get_columns("bill_items")}
        with op.batch_alter_table("bill_items") as batch_op:
            if "order_id" not in existing_cols:
                batch_op.add_column(sa.Column("order_id", sa.String(36), sa.ForeignKey("clinical_orders.id", ondelete="SET NULL", name="fk_items_order_id"), nullable=True))
            if "line_number" not in existing_cols:
                batch_op.add_column(sa.Column("line_number", sa.Integer(), nullable=True))
            if "dispensed_quantity" not in existing_cols:
                batch_op.add_column(sa.Column("dispensed_quantity", sa.Numeric(10, 2), nullable=True))
            if "administered_quantity" not in existing_cols:
                batch_op.add_column(sa.Column("administered_quantity", sa.Numeric(10, 2), nullable=True))
            if "discount_amount" not in existing_cols:
                batch_op.add_column(sa.Column("discount_amount", sa.Numeric(12, 2), nullable=False, server_default="0.00"))
            if "tax_amount" not in existing_cols:
                batch_op.add_column(sa.Column("tax_amount", sa.Numeric(12, 2), nullable=False, server_default="0.00"))
            if "is_package_inclusion" not in existing_cols:
                batch_op.add_column(sa.Column("is_package_inclusion", sa.Boolean(), nullable=False, server_default=sa.text("0")))
            if "package_name" not in existing_cols:
                batch_op.add_column(sa.Column("package_name", sa.String(255), nullable=True))
            if "is_synthetic" not in existing_cols:
                batch_op.add_column(sa.Column("is_synthetic", sa.Boolean(), nullable=False, server_default=sa.text("1")))

    # 8. Create bill_payments table if not exists
    if "bill_payments" not in existing_tables:
        op.create_table(
            "bill_payments",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("bill_id", sa.String(36), sa.ForeignKey("bills.id", ondelete="CASCADE"), nullable=False, index=True),
            sa.Column("payment_date", sa.Date(), nullable=False),
            sa.Column("payment_type", sa.String(50), nullable=False),
            sa.Column("payment_mode", sa.String(50), nullable=False, server_default="UPI"),
            sa.Column("amount", sa.Numeric(12, 2), nullable=False),
            sa.Column("transaction_reference", sa.String(100), nullable=False),
            sa.Column("insurance_claim_id", sa.String(100), nullable=True),
            sa.Column("tpa_name", sa.String(255), nullable=True),
            sa.Column("claim_claimed_amount", sa.Numeric(12, 2), nullable=True),
            sa.Column("claim_approved_amount", sa.Numeric(12, 2), nullable=True),
            sa.Column("claim_deduction_amount", sa.Numeric(12, 2), nullable=True),
            sa.Column("claim_status", sa.String(50), nullable=True),
            sa.Column("reconciliation_status", sa.String(50), nullable=False, server_default="reconciled"),
            sa.Column("notes", sa.Text(), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        )

    # 9. Update verification_results table
    if "verification_results" in existing_tables:
        existing_cols = {c["name"] for c in insp.get_columns("verification_results")}
        with op.batch_alter_table("verification_results") as batch_op:
            if "finding_category" not in existing_cols:
                batch_op.add_column(sa.Column("finding_category", sa.String(100), nullable=False, server_default="arithmetic_mismatch"))
            if "severity" not in existing_cols:
                batch_op.add_column(sa.Column("severity", sa.String(50), nullable=False, server_default="medium"))
            if "recommendation" not in existing_cols:
                batch_op.add_column(sa.Column("recommendation", sa.Text(), nullable=True))
            if "reviewer_status" not in existing_cols:
                batch_op.add_column(sa.Column("reviewer_status", sa.String(50), nullable=False, server_default="requires_review"))


def downgrade() -> None:
    pass
