
from fastapi.testclient import TestClient
from decimal import Decimal
from app.main import app
from app.db.deps import get_db
from app.api.routes import simulation as simulation_route


class FakeCompany:
    def __init__(self, company_id):
        self.id = company_id
        self.minimum_reserve = Decimal("5000.00")
        self.base_currency = "USD"


class FakeDB:
    def get(self, model, company_id):
        if company_id == 2:
            return FakeCompany(company_id)
        return None


def fake_get_db():
    yield FakeDB()


def fake_forecast(db, company_id, days):
    return {
        "company_id": company_id,
        "forecast_start": "2026-10-11",
        "forecast_end": "2026-10-12",
        "daily_forecast": [
            {
                "date": "2026-10-11",
                "currency": "USD",
                "opening_balance": "100.00",
                "expected_inflows": "0.00",
                "expected_outflows": "0.00",
                "closing_balance": "100.00",
                "reserve_shortfall": None,
                "below_zero": False,
            }
        ],
    }


def test_simulation_endpoint_returns_results(monkeypatch):
    app.dependency_overrides[get_db] = fake_get_db
    monkeypatch.setattr(
        simulation_route,
        "generate_forecast",
        fake_forecast,
    )

    try:
        with TestClient(app) as client:
            response = client.get(
                "/api/v1/companies/2/simulation",
                params={
                    "days": 30,
                    "simulations": 100,
                    "max_delay_days": 7,
                    "seed": 42,
                },
            )

        assert response.status_code == 200
        body = response.json()
        assert body["company_id"] == 2
        assert body["method"] == "uniform_receivable_delay"
        assert body["results"][0]["currency"] == "USD"
    finally:
        app.dependency_overrides.pop(get_db, None)


def test_simulation_endpoint_returns_404_for_unknown_company(
    monkeypatch,
):
    app.dependency_overrides[get_db] = fake_get_db

    try:
        with TestClient(app) as client:
            response = client.get(
                "/api/v1/companies/999/simulation"
            )

        assert response.status_code == 404
    finally:
        app.dependency_overrides.pop(get_db, None)
