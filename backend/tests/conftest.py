import io
import os
import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.core.security import create_access_token, get_password_hash
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.user import User
from app.models.hospital import Hospital
from app.models.benchmark import Benchmark
from app.models.bill import Bill
from app.models.bill_item import BillItem

# In-memory SQLite database for test isolation
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_directories():
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.REPORT_DIR, exist_ok=True)


@pytest.fixture(scope="function")
def db_session():
    """Provides a transactional database session per test."""
    Base.metadata.create_all(bind=test_engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Provides FastAPI TestClient wired to the test database session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def regular_user(db_session) -> User:
    user = User(
        name="Test Patient",
        email="patient@test.com",
        password_hash=get_password_hash("TestPass@123"),
        is_admin=False,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def admin_user(db_session) -> User:
    admin = User(
        name="Admin User",
        email="admin@test.com",
        password_hash=get_password_hash("AdminPass@123"),
        is_admin=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture(scope="function")
def user_token(regular_user) -> str:
    return create_access_token(data={"sub": regular_user.id, "email": regular_user.email})


@pytest.fixture(scope="function")
def admin_token(admin_user) -> str:
    return create_access_token(data={"sub": admin_user.id, "email": admin_user.email})


@pytest.fixture(scope="function")
def auth_headers(user_token) -> dict:
    return {"Authorization": f"Bearer {user_token}"}


@pytest.fixture(scope="function")
def admin_headers(admin_token) -> dict:
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(scope="function")
def sample_pdf_bytes() -> bytes:
    """Generates a minimal valid PDF byte sequence using ReportLab."""
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=letter)
    c.drawString(100, 750, "Apollo Hospital - Medical Invoice")
    c.drawString(100, 720, "Complete Blood Count (CBC) 1 180.00 180.00")
    c.drawString(100, 700, "Paracetamol 650mg 10 2.50 25.00")
    c.drawString(100, 680, "Total: 205.00")
    c.save()
    return buf.getvalue()
