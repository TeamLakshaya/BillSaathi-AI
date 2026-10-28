from decimal import Decimal
from app.core.security import create_access_token
from app.models.bill import Bill
from app.models.user import User


def test_bill_ownership_isolation(client, db_session, regular_user, auth_headers):
    # Create another user
    other_user = User(
        name="Other Patient",
        email="other@test.com",
        password_hash="fakehash",
        is_admin=False,
    )
    db_session.add(other_user)
    db_session.commit()
    db_session.refresh(other_user)

    # Create a private bill owned by other_user
    private_bill = Bill(
        user_id=other_user.id,
        original_filename="private_bill.pdf",
        storage_path="private/bill.pdf",
        total_amount=Decimal("5000.00"),
        is_demo=False,
    )
    db_session.add(private_bill)
    db_session.commit()
    db_session.refresh(private_bill)

    # regular_user attempts to access other_user's bill -> 403 Forbidden
    resp = client.get(f"/api/v1/bills/{private_bill.id}", headers=auth_headers)
    assert resp.status_code == 403


def test_admin_rbac_protection(client, auth_headers, admin_headers):
    # Benchmark creation attempt by normal user -> 403 Forbidden
    new_bm = {
        "normalized_item_name": "test test",
        "benchmark_type": "price_ceiling",
        "amount": 100.0,
        "source_name": "Test Source",
        "source_reference": "Ref 123",
    }
    forbidden_resp = client.post("/api/v1/benchmarks", json=new_bm, headers=auth_headers)
    assert forbidden_resp.status_code == 403

    # Benchmark creation attempt by Admin user -> 201 Created
    allowed_resp = client.post("/api/v1/benchmarks", json=new_bm, headers=admin_headers)
    assert allowed_resp.status_code == 201
    assert allowed_resp.json()["success"] is True
