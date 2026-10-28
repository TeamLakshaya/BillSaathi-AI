from datetime import date
from decimal import Decimal
from app.models.benchmark import Benchmark
from app.models.bill import Bill
from app.models.bill_item import BillItem
from app.services.verification_service import VerificationService


def test_deterministic_verification_engine(db_session):
    # 1. Setup Benchmark
    bm = Benchmark(
        normalized_item_name="paracetamol 650mg",
        benchmark_type="price_ceiling",
        amount=Decimal("2.50"),
        source_name="NPPA Drug Ceiling",
        source_reference="DPCO Schedule",
        effective_from=date(2023, 1, 1),
        is_synthetic=False,
    )
    db_session.add(bm)

    # 2. Setup Bill with arithmetic error and overcharging
    bill = Bill(
        original_filename="audit_test_bill.pdf",
        storage_path="test/path.pdf",
        bill_date=date(2024, 2, 1),
        total_amount=Decimal("150.00"),  # Actual sum: 100 + 20 = 120, mismatch of 30!
        processing_status="extracted",
        is_demo=False,
    )
    db_session.add(bill)
    db_session.commit()
    db_session.refresh(bill)

    item1 = BillItem(
        bill_id=bill.id,
        description="Paracetamol 650mg Tablets",
        normalized_name="paracetamol 650mg",
        quantity=Decimal("10.00"),
        unit_price=Decimal("10.00"),  # Billed at 10 vs cap of 2.50
        line_total=Decimal("100.00"),  # Correct line math: 10 * 10 = 100
    )
    item2 = BillItem(
        bill_id=bill.id,
        description="Surgical Syringe",
        normalized_name="surgical syringe",
        quantity=Decimal("2.00"),
        unit_price=Decimal("10.00"),
        line_total=Decimal("30.00"),  # Arithmetic error: 2 * 10 = 20, but billed 30!
    )
    db_session.add_all([item1, item2])
    db_session.commit()

    # 3. Run Verification
    service = VerificationService(db_session)
    summary = service.verify_bill(bill.id)

    assert summary.arithmetic_valid is False
    assert summary.total_verified_discrepancies > Decimal("0.00")
    assert summary.overall_status == "verified_discrepancy"

    statuses = [r.status for r in summary.results]
    assert "verified_discrepancy" in statuses


def test_verification_api_endpoint(client, sample_pdf_bytes, auth_headers):
    # Upload bill
    files = {"file": ("bill.pdf", sample_pdf_bytes, "application/pdf")}
    upload_resp = client.post("/api/v1/bills/upload", files=files, headers=auth_headers)
    bill_id = upload_resp.json()["data"]["id"]

    # Verify bill via API
    verif_resp = client.post(f"/api/v1/bills/{bill_id}/verify", headers=auth_headers)
    assert verif_resp.status_code == 200
    data = verif_resp.json()
    assert data["success"] is True
    assert "total_billed" in data["data"]
    assert "overall_status" in data["data"]
