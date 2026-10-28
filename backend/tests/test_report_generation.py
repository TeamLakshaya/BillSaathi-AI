def test_report_generation_and_download(client, sample_pdf_bytes, auth_headers):
    # 1. Upload bill
    files = {"file": ("bill.pdf", sample_pdf_bytes, "application/pdf")}
    upload_resp = client.post("/api/v1/bills/upload", files=files, headers=auth_headers)
    bill_id = upload_resp.json()["data"]["id"]

    # 2. Generate report
    gen_resp = client.post(f"/api/v1/bills/{bill_id}/report", headers=auth_headers)
    assert gen_resp.status_code == 201
    report_data = gen_resp.json()["data"]
    report_id = report_data["id"]
    assert report_data["report_status"] == "completed"
    assert report_data["download_url"] == f"/api/v1/reports/{report_id}/download"

    # 3. Retrieve report metadata
    get_resp = client.get(f"/api/v1/bills/{bill_id}/report", headers=auth_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["data"]["id"] == report_id

    # 4. Download PDF
    down_resp = client.get(f"/api/v1/reports/{report_id}/download", headers=auth_headers)
    assert down_resp.status_code == 200
    assert down_resp.headers["content-type"] == "application/pdf"
    assert down_resp.content.startswith(b"%PDF-")
    assert len(down_resp.content) > 1000
