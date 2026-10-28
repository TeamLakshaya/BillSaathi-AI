import io
from app.core.config import settings


def test_session_scoped_anonymous_bill_access(client, sample_pdf_bytes):
    # 1. Anonymous user uploads a bill without token
    files = {"file": ("anonymous_invoice.pdf", sample_pdf_bytes, "application/pdf")}
    resp = client.post("/api/v1/bills/upload", files=files)
    assert resp.status_code == 201
    data = resp.json()["data"]
    bill_id = data["id"]

    # Server must issue X-Session-ID header
    session_id = resp.headers.get("X-Session-ID")
    assert session_id is not None
    assert len(session_id) >= 16

    # Verify server filesystem path is masked
    assert "\\" not in data["storage_path"]
    assert "/" not in data["storage_path"] or data["storage_path"].startswith("uploads/")

    # 2. Accessing bill with matching session header succeeds
    get_resp = client.get(f"/api/v1/bills/{bill_id}", headers={"X-Session-ID": session_id})
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["id"] == bill_id

    # 3. Accessing bill with missing or wrong session header fails with 403 Forbidden
    unauth_resp = client.get(f"/api/v1/bills/{bill_id}", headers={"X-Session-ID": "wrong-session-token-12345"})
    assert unauth_resp.status_code == 403

    no_session_resp = client.get(f"/api/v1/bills/{bill_id}")
    assert no_session_resp.status_code == 403


def test_document_streaming_download_security(client, sample_pdf_bytes, auth_headers):
    # Upload bill as authenticated user
    files = {"file": ("patient_record.pdf", sample_pdf_bytes, "application/pdf")}
    resp = client.post("/api/v1/bills/upload", files=files, headers=auth_headers)
    assert resp.status_code == 201
    bill_id = resp.json()["data"]["id"]

    # Authorized user can stream document
    doc_resp = client.get(f"/api/v1/bills/{bill_id}/document", headers=auth_headers)
    assert doc_resp.status_code == 200
    assert doc_resp.headers["content-type"] == "application/pdf"
    assert doc_resp.content.startswith(b"%PDF-")

    # Unauthorized guest without token or wrong user receives 401 or 403
    unauth_doc_resp = client.get(f"/api/v1/bills/{bill_id}/document")
    assert unauth_doc_resp.status_code == 401
