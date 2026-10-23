
from datetime import date, timedelta
from decimal import Decimal

from fastapi.testclient import TestClient

from app.main import app
from app.db.deps import get_db
from app.api.routes import optimization as optimization_route


class FakeCompany:
    def __init__(self, company_id):
        self.id = company_id
        self.minimum_reserve = Decimal("5000.00")
        self.base_currency = "INR"


class FakeObligation:
    def __init__(self, obligation_id=1):
        today = date.today()
        self.id = obligation_id
        self.currency = "INR"
        self.amount = Decimal("2000.00")
        self.due_date = today
        self.flexible_until = today + timedelta(days=5)
        self.priority = "normal"


class FakeScalars:
    def all(self):
        return [FakeObligation()]


class FakeDB:
    def __init__(self):
        self.added_objects = []
        self.committed = False

    def get(self, model, company_id):
        if company_id == 1:
            return FakeCompany(company_id)
        return None

    def scalars(self, statement):
        return FakeScalars()

    def add(self, obj):
        self.added_objects.append(obj)

    def commit(self):
        self.committed = True

    def refresh(self, obj):
        pass


def fake_get_db():
    yield FakeDB()


def fake_forecast(db, company_id, days):
    today = date.today()
    return {
        "company_id": company_id,
        "base_currency": "INR",
        "forecast_start": today.isoformat(),
        "forecast_end": (today + timedelta(days=days - 1)).isoformat(),
        "days": days,
        "daily_forecast": [
            {
                "date": (today + timedelta(days=i)).isoformat(),
                "currency": "INR",
                "opening_balance": "3000.00",
                "expected_inflows": "0.00",
                "expected_outflows": "2000.00" if i == 0 else "0.00",
                "closing_balance": "1000.00" if i == 0 else "3000.00",
                "reserve_shortfall": "4000.00" if i == 0 else "2000.00",
                "below_zero": False,
            }
            for i in range(days)
        ],
    }


def test_optimization_returns_404_for_unknown_company(monkeypatch):
    app.dependency_overrides[get_db] = fake_get_db

    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/v1/companies/999999/optimization"
            )

        assert response.status_code == 404
        assert response.json()["detail"] == "Company not found"
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_optimization_endpoint_returns_result(monkeypatch):
    app.dependency_overrides[get_db] = fake_get_db
    monkeypatch.setattr(
        optimization_route,
        "generate_forecast",
        fake_forecast,
    )

    try:
        with TestClient(app) as client:
            response = client.post(
                "/api/v1/companies/1/optimization",
                params={"days": 30},
            )

        assert response.status_code == 200, response.text
        body = response.json()
        assert isinstance(body, list)
        assert len(body) > 0

        result = body[0]
        assert isinstance(result, dict)
        assert "company_id" in result
        assert "recommendations" in result
        assert "schedule_validation" in result
    finally:
        app.dependency_overrides.pop(get_db, None)
