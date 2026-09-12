import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.database.session import SessionLocal, get_db
from app.database.seed import seed_database


@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    """Ensure database tables exist and are seeded before test suite runs."""
    seed_database()


@pytest.fixture(scope="function")
def db_session():
    """Yield a database session per test function."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="module")
def client():
    """FastAPI TestClient for API testing."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="module")
def admin_token(client):
    """Authenticate as seeded admin user and return JWT token."""
    response = client.post(
        "/auth/login",
        json={"email": "admin@dhruv.gov.in", "password": "Admin@123456"}
    )
    assert response.status_code == 200, f"Admin login failed: {response.text}"
    return response.json()["access_token"]


@pytest.fixture(scope="module")
def auth_headers(admin_token):
    """Return headers with Bearer token for admin."""
    return {"Authorization": f"Bearer {admin_token}"}
