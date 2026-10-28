def test_register_and_login_flow(client):
    # 1. Register
    reg_payload = {
        "name": "Jane Doe",
        "email": "jane@example.com",
        "password": "SecurePassword@123",
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201
    reg_data = reg_resp.json()
    assert reg_data["success"] is True
    assert "access_token" in reg_data["data"]
    assert reg_data["data"]["user"]["email"] == "jane@example.com"

    # 2. Duplicate registration should fail
    dup_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert dup_resp.status_code == 400

    # 3. Login
    login_payload = {
        "email": "jane@example.com",
        "password": "SecurePassword@123",
    }
    login_resp = client.post("/api/v1/auth/login", json=login_payload)
    assert login_resp.status_code == 200
    token = login_resp.json()["data"]["access_token"]
    assert token

    # 4. Get Current Profile
    me_resp = client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_resp.status_code == 200
    assert me_resp.json()["data"]["name"] == "Jane Doe"


def test_login_invalid_password(client, regular_user):
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": regular_user.email, "password": "WrongPassword"},
    )
    assert resp.status_code == 401


def test_auth_me_unauthorized(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401
