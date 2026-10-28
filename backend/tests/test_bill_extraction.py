from decimal import Decimal
from app.providers.ai.demo_provider import DemoAIProvider
from app.schemas.bill import ExtractedBillData


def test_ai_extraction_schema_validation():
    provider = DemoAIProvider()
    raw_text = """
    Fortis Hospital
    Bill Date: 2024-04-01
    Complete Blood Count 1 180.00 180.00
    Paracetamol 650mg 10 2.50 25.00
    Total: 205.00
    """
    extracted = provider.extract_bill_data(raw_text)
    assert isinstance(extracted, ExtractedBillData)
    assert len(extracted.items) >= 2
    assert extracted.grand_total > Decimal("0.00")


def test_manual_correction_of_bill_item(client, sample_pdf_bytes, auth_headers):
    # 1. Upload bill
    files = {"file": ("bill.pdf", sample_pdf_bytes, "application/pdf")}
    upload_resp = client.post("/api/v1/bills/upload", files=files, headers=auth_headers)
    bill_id = upload_resp.json()["data"]["id"]
    item_id = upload_resp.json()["data"]["items"][0]["id"]

    # 2. Correct extracted item (e.g. user updates unit_price and line_total)
    patch_payload = {
        "unit_price": 250.00,
        "line_total": 250.00,
        "user_confirmed": True,
    }
    patch_resp = client.patch(
        f"/api/v1/bills/{bill_id}/items/{item_id}",
        json=patch_payload,
        headers=auth_headers,
    )
    assert patch_resp.status_code == 200
    updated_data = patch_resp.json()["data"]
    assert Decimal(str(updated_data["unit_price"])) == Decimal("250.00")
    assert Decimal(str(updated_data["line_total"])) == Decimal("250.00")
    assert updated_data["user_confirmed"] is True


def test_add_and_delete_bill_item(client, sample_pdf_bytes, auth_headers):
    files = {"file": ("bill.pdf", sample_pdf_bytes, "application/pdf")}
    upload_resp = client.post("/api/v1/bills/upload", files=files, headers=auth_headers)
    bill_id = upload_resp.json()["data"]["id"]

    # Add item
    new_item = {
        "description": "Manual Stethoscope Fee",
        "normalized_name": "stethoscope fee",
        "category": "Consultation",
        "quantity": 1.0,
        "unit": "visit",
        "unit_price": 300.0,
        "line_total": 300.0,
    }
    add_resp = client.post(f"/api/v1/bills/{bill_id}/items", json=new_item, headers=auth_headers)
    assert add_resp.status_code == 201
    created_id = add_resp.json()["data"]["id"]

    # Delete item
    del_resp = client.delete(f"/api/v1/bills/{bill_id}/items/{created_id}", headers=auth_headers)
    assert del_resp.status_code == 200
    assert del_resp.json()["data"]["deleted_item_id"] == created_id
