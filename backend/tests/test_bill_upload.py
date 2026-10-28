import io


def test_upload_valid_pdf(client, sample_pdf_bytes, auth_headers):
    files = {"file": ("hospital_bill.pdf", sample_pdf_bytes, "application/pdf")}
    data = {"is_demo": "true"}
    resp = client.post("/api/v1/bills/upload", files=files, data=data, headers=auth_headers)
    assert resp.status_code == 201
    payload = resp.json()
    assert payload["success"] is True
    assert payload["data"]["original_filename"] == "hospital_bill.pdf"
    assert len(payload["data"]["items"]) > 0


def test_upload_invalid_extension(client, auth_headers):
    files = {"file": ("malicious.exe", b"MZ\x90\x00\x03\x00\x00\x00", "application/x-msdownload")}
    resp = client.post("/api/v1/bills/upload", files=files, headers=auth_headers)
    assert resp.status_code == 400
    assert "not allowed" in resp.json()["detail"].lower()


def test_upload_signature_mismatch(client, auth_headers):
    # Extension claims .pdf but body is random string without %PDF- magic signature
    files = {"file": ("fake_bill.pdf", b"NOT_A_PDF_FILE_HEADER", "application/pdf")}
    resp = client.post("/api/v1/bills/upload", files=files, headers=auth_headers)
    assert resp.status_code == 400
    assert "signature mismatch" in resp.json()["detail"].lower()


def test_upload_valid_png(client, auth_headers):
    # Minimal 1x1 valid PNG signature
    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
    files = {"file": ("receipt.png", png_bytes, "image/png")}
    resp = client.post("/api/v1/bills/upload", files=files, headers=auth_headers)
    assert resp.status_code == 201
    assert resp.json()["success"] is True
