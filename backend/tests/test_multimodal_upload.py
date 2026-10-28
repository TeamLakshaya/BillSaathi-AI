import base64
import io
import json
from decimal import Decimal
from unittest.mock import MagicMock, patch
import pytest
from PIL import Image

from app.core.config import settings


@pytest.fixture
def sample_jpeg_bytes() -> bytes:
    """Creates a valid JPEG image byte sequence."""
    buf = io.BytesIO()
    img = Image.new("RGB", (200, 200), color=(255, 255, 255))
    img.save(buf, format="JPEG")
    return buf.getvalue()


@pytest.fixture
def sample_png_image_bytes() -> bytes:
    """Creates a valid PNG image byte sequence."""
    buf = io.BytesIO()
    img = Image.new("RGBA", (150, 150), color=(240, 240, 240, 255))
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_upload_valid_jpg_with_mocked_gemini(client, auth_headers, sample_jpeg_bytes, monkeypatch):
    """
    Test uploading a JPG bill:
    - Pass original file bytes and canonical MIME (image/jpeg) to Gemini via inlineData base64.
    - Validate line items, arithmetic totals, and status.
    - Verify document streaming returns image/jpeg.
    """
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test_gemini_key_12345")
    monkeypatch.setattr(settings, "DEMO_MODE", False)

    mock_gemini_payload = {
        "hospital_name": "Max Super Speciality Hospital",
        "hospital_location": "Saket, New Delhi",
        "bill_date": "2026-03-15",
        "items": [
            {
                "description": "Complete Blood Count (CBC)",
                "normalized_name": "complete blood count",
                "service_code": "LAB-101",
                "category": "Diagnostics",
                "quantity": 1.0,
                "unit": "test",
                "unit_price": 450.0,
                "line_total": 450.0,
                "confidence": 0.98,
                "is_uncertain": False,
                "uncertainty_reason": None,
            },
            {
                "description": "Paracetamol Infusion 100ml",
                "normalized_name": "paracetamol infusion",
                "service_code": "PHARM-202",
                "category": "Pharmacy",
                "quantity": 2.0,
                "unit": "vial",
                "unit_price": 120.0,
                "line_total": 240.0,
                "confidence": 0.95,
                "is_uncertain": False,
                "uncertainty_reason": None,
            },
        ],
        "subtotal": 690.0,
        "tax_amount": 0.0,
        "discount_amount": 0.0,
        "grand_total": 690.0,
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": json.dumps(mock_gemini_payload)}]
                }
            }
        ]
    }

    captured_requests = []

    def mock_post(url, json=None, headers=None, **kwargs):
        captured_requests.append({"url": url, "json": json, "headers": headers})
        return mock_resp

    mock_client = MagicMock()
    mock_client.__enter__.return_value = mock_client
    mock_client.post.side_effect = mock_post

    with patch("app.providers.ai.gemini_provider.httpx.Client", return_value=mock_client):
        files = {"file": ("hospital_bill.jpg", sample_jpeg_bytes, "image/jpeg")}
        resp = client.post("/api/v1/bills/upload", files=files, headers=auth_headers)

    assert resp.status_code == 201
    payload = resp.json()
    assert payload["success"] is True
    assert "successfully" in payload["message"].lower()

    bill_data = payload["data"]
    assert bill_data["original_filename"] == "hospital_bill.jpg"
    assert bill_data["processing_status"] == "ready_for_audit"
    assert len(bill_data["items"]) == 2
    assert Decimal(str(bill_data["total_amount"])) == Decimal("690.00")

    # Verify Gemini request structure
    assert len(captured_requests) == 1
    req_body = captured_requests[0]["json"]
    parts = req_body["contents"][0]["parts"]
    assert len(parts) == 2
    assert "medical bill" in parts[0]["text"].lower()

    # Verify multimodal inlineData
    inline_data = parts[1]["inlineData"]
    assert inline_data["mimeType"] == "image/jpeg"
    decoded_bytes = base64.b64decode(inline_data["data"])
    assert decoded_bytes == sample_jpeg_bytes

    # Verify document streaming endpoint returns image/jpeg
    doc_resp = client.get(f"/api/v1/bills/{bill_data['id']}/document", headers=auth_headers)
    assert doc_resp.status_code == 200
    assert doc_resp.headers["content-type"] == "image/jpeg"
    assert doc_resp.content == sample_jpeg_bytes


def test_upload_valid_png_with_mocked_gemini(client, auth_headers, sample_png_image_bytes, monkeypatch):
    """
    Test uploading a PNG bill:
    - Pass image/png MIME and base64 bytes to Gemini.
    - Verify document streaming returns image/png.
    """
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test_gemini_key_png")
    monkeypatch.setattr(settings, "DEMO_MODE", False)

    mock_gemini_payload = {
        "hospital_name": "Fortis Escorts Heart Institute",
        "hospital_location": "Okhla, New Delhi",
        "bill_date": "2026-02-10",
        "items": [
            {
                "description": "ECG 12 Leads",
                "normalized_name": "ecg 12 leads",
                "service_code": "CARD-01",
                "category": "Diagnostics",
                "quantity": 1.0,
                "unit": "test",
                "unit_price": 800.0,
                "line_total": 800.0,
                "confidence": 0.99,
                "is_uncertain": False,
                "uncertainty_reason": None,
            }
        ],
        "subtotal": 800.0,
        "tax_amount": 0.0,
        "discount_amount": 50.0,
        "grand_total": 750.0,
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": json.dumps(mock_gemini_payload)}]
                }
            }
        ]
    }

    captured_requests = []

    def mock_post(url, json=None, headers=None, **kwargs):
        captured_requests.append({"url": url, "json": json})
        return mock_resp

    mock_client = MagicMock()
    mock_client.__enter__.return_value = mock_client
    mock_client.post.side_effect = mock_post

    with patch("app.providers.ai.gemini_provider.httpx.Client", return_value=mock_client):
        files = {"file": ("ecg_bill.png", sample_png_image_bytes, "image/png")}
        resp = client.post("/api/v1/bills/upload", files=files, headers=auth_headers)

    assert resp.status_code == 201
    payload = resp.json()
    bill_data = payload["data"]
    assert bill_data["processing_status"] == "ready_for_audit"
    assert len(bill_data["items"]) == 1

    # Verify multimodal inlineData MIME
    inline_data = captured_requests[0]["json"]["contents"][0]["parts"][1]["inlineData"]
    assert inline_data["mimeType"] == "image/png"

    # Verify document streaming content-type
    doc_resp = client.get(f"/api/v1/bills/{bill_data['id']}/document", headers=auth_headers)
    assert doc_resp.status_code == 200
    assert doc_resp.headers["content-type"] == "image/png"


def test_upload_pdf_with_multimodal_gemini(client, auth_headers, sample_pdf_bytes, monkeypatch):
    """
    Test uploading a PDF bill passing application/pdf inlineData to Gemini.
    """
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test_gemini_key_pdf")
    monkeypatch.setattr(settings, "DEMO_MODE", False)

    mock_gemini_payload = {
        "hospital_name": "Apollo Hospitals",
        "hospital_location": "Chennai",
        "bill_date": "2026-01-20",
        "items": [
            {
                "description": "General Ward Bed Charges",
                "normalized_name": "general ward bed charges",
                "service_code": "BED-01",
                "category": "Room & Nursing",
                "quantity": 3.0,
                "unit": "day",
                "unit_price": 2000.0,
                "line_total": 6000.0,
                "confidence": 0.96,
                "is_uncertain": False,
                "uncertainty_reason": None,
            }
        ],
        "subtotal": 6000.0,
        "tax_amount": 0.0,
        "discount_amount": 0.0,
        "grand_total": 6000.0,
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": json.dumps(mock_gemini_payload)}]
                }
            }
        ]
    }

    captured_requests = []

    def mock_post(url, json=None, headers=None, **kwargs):
        captured_requests.append({"url": url, "json": json})
        return mock_resp

    mock_client = MagicMock()
    mock_client.__enter__.return_value = mock_client
    mock_client.post.side_effect = mock_post

    with patch("app.providers.ai.gemini_provider.httpx.Client", return_value=mock_client):
        files = {"file": ("apollo_invoice.pdf", sample_pdf_bytes, "application/pdf")}
        resp = client.post("/api/v1/bills/upload", files=files, headers=auth_headers)

    assert resp.status_code == 201
    bill_data = resp.json()["data"]
    inline_data = captured_requests[0]["json"]["contents"][0]["parts"][1]["inlineData"]
    assert inline_data["mimeType"] == "application/pdf"
    assert bill_data["items"][0]["description"] == "General Ward Bed Charges"


def test_upload_corrupted_image_rejection(client, auth_headers):
    """
    Test uploading a corrupted image file:
    Magic bytes match JPG signature, but body > 128 bytes is corrupted data.
    Server rejects with 400 Bad Request.
    """
    corrupted_jpg = b"\xff\xd8\xff\xe0" + b"CORRUPTED_IMAGE_STREAM_GARBAGE_BYTES" * 10
    files = {"file": ("corrupted.jpg", corrupted_jpg, "image/jpeg")}
    resp = client.post("/api/v1/bills/upload", files=files, headers=auth_headers)
    assert resp.status_code == 400
    assert "corrupted" in resp.json()["detail"].lower()


def test_missing_credentials_configuration_notice(client, auth_headers, sample_jpeg_bytes, monkeypatch):
    """
    Test behavior when credentials are unavailable (GEMINI_API_KEY is not configured):
    - Shows a clear configuration message rather than claiming real analysis.
    - processing_status is set to 'review_required'.
    - items list is empty, requiring manual review.
    """
    monkeypatch.setattr(settings, "GEMINI_API_KEY", None)
    monkeypatch.setattr(settings, "DEMO_MODE", False)

    files = {"file": ("live_bill.jpg", sample_jpeg_bytes, "image/jpeg")}
    data = {"is_demo": "false"}
    resp = client.post("/api/v1/bills/upload", files=files, data=data, headers=auth_headers)

    assert resp.status_code == 201
    payload = resp.json()
    assert payload["success"] is True
    # Message clearly indicates live AI extraction requires GEMINI_API_KEY
    assert "requires gemini_api_key" in payload["message"].lower() or "manual review" in payload["message"].lower()

    bill_data = payload["data"]
    assert bill_data["processing_status"] == "review_required"
    assert len(bill_data["items"]) == 0

    # Verify bill detail contains the configuration notice in extracted_text
    detail_resp = client.get(f"/api/v1/bills/{bill_data['id']}", headers=auth_headers)
    assert detail_resp.status_code == 200
    extracted_text = detail_resp.json()["data"]["extracted_text"]
    assert "CONFIGURATION NOTICE" in extracted_text
    assert "GEMINI_API_KEY is not configured" in extracted_text


def test_malformed_ai_output_handling(client, auth_headers, sample_jpeg_bytes, monkeypatch):
    """
    Test handling when Gemini returns malformed non-JSON output:
    - Gracefully handles syntax error without crashing.
    - Document flagged for manual review with review_required status.
    - Never reports failed extraction as success.
    """
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "valid_key")
    monkeypatch.setattr(settings, "DEMO_MODE", False)

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": "I am unable to parse this bill: {malformed json: broken..."}]
                }
            }
        ]
    }

    mock_client = MagicMock()
    mock_client.__enter__.return_value = mock_client
    mock_client.post.return_value = mock_resp

    with patch("app.providers.ai.gemini_provider.httpx.Client", return_value=mock_client):
        files = {"file": ("malformed_ai.jpg", sample_jpeg_bytes, "image/jpeg")}
        resp = client.post("/api/v1/bills/upload", files=files, headers=auth_headers)

    assert resp.status_code == 201
    payload = resp.json()
    bill_data = payload["data"]
    assert bill_data["processing_status"] == "review_required"
    assert len(bill_data["items"]) == 0

    detail_resp = client.get(f"/api/v1/bills/{bill_data['id']}", headers=auth_headers)
    extracted_text = detail_resp.json()["data"]["extracted_text"]
    assert "EXTRACTION ERROR" in extracted_text or "Malformed AI" in extracted_text


def test_failed_ai_extraction_never_reports_success(client, auth_headers, sample_jpeg_bytes, monkeypatch):
    """
    Test handling when Gemini API returns an HTTP 500 error:
    - Never reports failed extraction as success.
    - processing_status is set to review_required.
    - Error is documented for manual review.
    """
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "valid_key")
    monkeypatch.setattr(settings, "DEMO_MODE", False)

    mock_resp = MagicMock()
    mock_resp.status_code = 500
    mock_resp.text = "Internal Google API Error: Model overloaded"

    mock_client = MagicMock()
    mock_client.__enter__.return_value = mock_client
    mock_client.post.return_value = mock_resp

    with patch("app.providers.ai.gemini_provider.httpx.Client", return_value=mock_client):
        files = {"file": ("server_error.jpg", sample_jpeg_bytes, "image/jpeg")}
        resp = client.post("/api/v1/bills/upload", files=files, headers=auth_headers)

    assert resp.status_code == 201
    payload = resp.json()
    bill_data = payload["data"]
    assert bill_data["processing_status"] == "review_required"
    assert len(bill_data["items"]) == 0

    detail_resp = client.get(f"/api/v1/bills/{bill_data['id']}", headers=auth_headers)
    extracted_text = detail_resp.json()["data"]["extracted_text"]
    assert "EXTRACTION FAILED" in extracted_text
    assert "500" in extracted_text


def test_visible_fields_and_uncertainty_flagging(client, auth_headers, sample_jpeg_bytes, monkeypatch):
    """
    Test uncertainty detection:
    - When an arithmetic mismatch exists in AI extraction (qty * rate != line_total)
      or low extraction confidence is returned, is_uncertain is flagged True with a specific reason.
    - Bill processing_status is flagged as review_required.
    """
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "valid_key")
    monkeypatch.setattr(settings, "DEMO_MODE", False)

    mock_gemini_payload = {
        "hospital_name": "City Care Hospital",
        "hospital_location": "Mumbai",
        "bill_date": "2026-03-01",
        "items": [
            {
                "description": "MRI Brain Scan",
                "normalized_name": "mri brain scan",
                "service_code": "RAD-09",
                "category": "Diagnostics",
                "quantity": 1.0,
                "unit": "scan",
                "unit_price": 5000.0,
                "line_total": 7500.0,  # Arithmetic mismatch (1 x 5000 != 7500)
                "confidence": 0.60,    # Low confidence
                "is_uncertain": False,
                "uncertainty_reason": None,
            }
        ],
        "subtotal": 7500.0,
        "tax_amount": 0.0,
        "discount_amount": 0.0,
        "grand_total": 7500.0,
    }

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": json.dumps(mock_gemini_payload)}]
                }
            }
        ]
    }

    mock_client = MagicMock()
    mock_client.__enter__.return_value = mock_client
    mock_client.post.return_value = mock_resp

    with patch("app.providers.ai.gemini_provider.httpx.Client", return_value=mock_client):
        files = {"file": ("mri_bill.jpg", sample_jpeg_bytes, "image/jpeg")}
        resp = client.post("/api/v1/bills/upload", files=files, headers=auth_headers)

    assert resp.status_code == 201
    bill_data = resp.json()["data"]
    assert bill_data["processing_status"] == "review_required"

    # Verify item-level uncertainty flag and reason
    item = bill_data["items"][0]
    assert item["is_uncertain"] is True
    assert item["uncertainty_reason"] is not None
    assert "Arithmetic mismatch" in item["uncertainty_reason"] or "Low" in item["uncertainty_reason"]
