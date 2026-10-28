from decimal import Decimal
from app.repositories.bill_repository import BillRepository
from app.services.verification_service import VerificationService


def test_bill_version_increment_on_item_mutation(db_session, sample_pdf_bytes, client, auth_headers):
    # Upload bill
    files = {"file": ("version_test.pdf", sample_pdf_bytes, "application/pdf")}
    resp = client.post("/api/v1/bills/upload", files=files, headers=auth_headers)
    assert resp.status_code == 201
    bill_data = resp.json()["data"]
    bill_id = bill_data["id"]
    initial_version = bill_data["version"]
    assert initial_version == 1

    first_item_id = bill_data["items"][0]["id"]

    # Modify an item via PATCH
    patch_resp = client.patch(
        f"/api/v1/bills/{bill_id}/items/{first_item_id}",
        json={"unit_price": "999.00", "line_total": "999.00"},
        headers=auth_headers,
    )
    assert patch_resp.status_code == 200
    updated_item = patch_resp.json()["data"]
    assert updated_item["data_source"] == "user_corrected"
    assert updated_item["user_confirmed"] is True

    # Retrieve bill: version must have incremented
    bill_resp = client.get(f"/api/v1/bills/{bill_id}", headers=auth_headers)
    assert bill_resp.status_code == 200
    new_version = bill_resp.json()["data"]["version"]
    assert new_version > initial_version


def test_verification_with_tax_and_discounts(db_session):
    repo = BillRepository(db_session)
    # Stated total: items (1000) + tax (180) - discount (50) = 1130
    bill = repo.create(
        original_filename="tax_bill.pdf",
        storage_path="uploads/mock_tax.pdf",
        subtotal=Decimal("1000.00"),
        tax_amount=Decimal("180.00"),
        discount_amount=Decimal("50.00"),
        total_amount=Decimal("1130.00"),
        is_demo=True,
    )
    repo.add_items(bill.id, [
        {
            "description": "Medicine Pack A",
            "quantity": Decimal("10.00"),
            "unit": "tab",
            "unit_price": Decimal("100.00"),
            "line_total": Decimal("1000.00"),
        }
    ])

    service = VerificationService(db_session)
    summary = service.verify_bill(bill.id)

    # Arithmetic should be valid because 1000 + 180 - 50 == 1130
    assert summary.arithmetic_valid is True
    # No grand total mismatch finding
    gt_findings = [r for r in summary.results if r.bill_item_id is None]
    assert len(gt_findings) == 0

    # Now simulate overcharge in stated total (e.g. 1200 instead of 1130)
    repo.update(bill.id, total_amount=Decimal("1200.00"))
    summary_mismatch = service.verify_bill(bill.id)
    assert summary_mismatch.arithmetic_valid is False
    mismatch_findings = [r for r in summary_mismatch.results if r.bill_item_id is None]
    assert len(mismatch_findings) > 0
    assert mismatch_findings[0].difference_amount == Decimal("70.00")
