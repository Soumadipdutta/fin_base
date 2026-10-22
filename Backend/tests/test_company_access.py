
import pytest
from fastapi import FastAPI, Depends
from fastapi.testclient import TestClient

from app.core.company_access import require_allowed_company


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setenv("FLOWPILOT_ALLOWED_COMPANY_ID", "4")

    app = FastAPI()

    @app.get("/companies/{company_id}")
    def get_company(
        company_id: int = Depends(require_allowed_company),
    ):
        return {"company_id": company_id}

    return TestClient(app)


def test_allowed_company_can_access(client):
    response = client.get("/companies/4")

    assert response.status_code == 200
    assert response.json() == {"company_id": 4}


def test_other_company_is_forbidden(client):
    response = client.get("/companies/5")

    assert response.status_code == 403
    assert response.json()["detail"] == (
        "Access to this company is not allowed."
    )


def test_invalid_company_id_is_rejected(client):
    response = client.get("/companies/0")

    assert response.status_code == 403
