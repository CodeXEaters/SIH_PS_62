def test_health_check(client):
    """Test root health check endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "running" in data["message"].lower()


def test_auth_register_success(client):
    """Test new user registration."""
    import uuid
    email = f"field_{uuid.uuid4().hex[:6]}@dhruv.gov.in"
    user_payload = {
        "email": email,
        "password": "Password@123",
        "full_name": "Field Test Engineer",
        "role": "FIELD_TEAM",
    }
    response = client.post("/auth/register", json=user_payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == user_payload["email"]
    assert data["role"] == "FIELD_TEAM"
    assert "hashed_password" not in data


def test_auth_login_json(client):
    """Test user login with JSON payload."""
    response = client.post(
        "/auth/login",
        json={"email": "admin@dhruv.gov.in", "password": "Admin@123456"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_auth_login_form(client):
    """Test user login with form data (Swagger OAuth2 flow)."""
    response = client.post(
        "/auth/login",
        data={"username": "ops@dhruv.gov.in", "password": "Ops@123456"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


def test_auth_get_me(client, auth_headers):
    """Test GET /auth/me for authenticated user profile."""
    response = client.get("/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "admin@dhruv.gov.in"
    assert data["role"] == "ADMIN"
