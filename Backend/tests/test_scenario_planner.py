
from decimal import Decimal

import pytest

from app.services.scenario_planner import plan_cash_flow_scenario


@pytest.fixture
def forecast():
    return {
        "company_id": 4,
        "forecast_start": "2026-10-22",
        "forecast_end": "2026-10-24",
        "days": 3,
        "receivable_events": [
            {
                "invoice_id": 10,
                "currency": "USD",
                "amount": "100.00",
                "expected_date": "2026-10-23",
            }
        ],
        "daily_forecast": [
            {
                "date": "2026-10-22",
                "currency": "USD",
                "opening_balance": Decimal("500.00"),
                "expected_inflows": Decimal("0.00"),
                "expected_outflows": Decimal("50.00"),
                "closing_balance": Decimal("450.00"),
            },
            {
                "date": "2026-10-23",
                "currency": "USD",
                "opening_balance": Decimal("450.00"),
                "expected_inflows": Decimal("100.00"),
                "expected_outflows": Decimal("50.00"),
                "closing_balance": Decimal("500.00"),
            },
            {
                "date": "2026-10-24",
                "currency": "USD",
                "opening_balance": Decimal("500.00"),
                "expected_inflows": Decimal("0.00"),
                "expected_outflows": Decimal("50.00"),
                "closing_balance": Decimal("450.00"),
            },
        ],
    }


def run_scenario(forecast, **overrides):
    params = {
        "forecast": forecast,
        "minimum_reserve": Decimal("400.00"),
        "reserve_currency": "USD",
        "payment_delay_days": 0,
        "revenue_reduction_pct": 0,
        "expense_increase_pct": 0,
    }
    params.update(overrides)
    return plan_cash_flow_scenario(**params)


def test_zero_changes_match_baseline(forecast):
    result = run_scenario(forecast)

    assert [
        row["closing_balance"] for row in result["daily_forecast"]
    ] == [
        row["closing_balance"] for row in forecast["daily_forecast"]
    ]


def test_payment_delay_shifts_receipt(forecast):
    result = run_scenario(forecast, payment_delay_days=1)
    rows = result["daily_forecast"]

    # The $100 receipt moves from Oct 23 to Oct 24.
    assert rows[1]["expected_inflows"] == Decimal("0.00")
    assert rows[2]["expected_inflows"] == Decimal("100.00")
    assert rows[1]["closing_balance"] == Decimal("400.00")
    assert rows[2]["closing_balance"] == Decimal("450.00")


def test_revenue_reduction_changes_inflows(forecast):
    result = run_scenario(forecast, revenue_reduction_pct=50)
    rows = result["daily_forecast"]

    assert rows[1]["expected_inflows"] == Decimal("50.00")
    assert rows[1]["closing_balance"] == Decimal("450.00")


def test_expense_increase_changes_outflows(forecast):
    result = run_scenario(forecast, expense_increase_pct=20)
    rows = result["daily_forecast"]

    assert rows[0]["expected_outflows"] == Decimal("60.00")
    assert rows[0]["closing_balance"] == Decimal("440.00")


@pytest.mark.parametrize(
    "kwargs",
    [
        {"payment_delay_days": -1},
        {"payment_delay_days": 91},
        {"revenue_reduction_pct": -1},
        {"revenue_reduction_pct": 101},
        {"expense_increase_pct": -1},
        {"expense_increase_pct": 501},
    ],
)
def test_invalid_parameters_are_rejected(forecast, kwargs):
    with pytest.raises(ValueError):
        run_scenario(forecast, **kwargs)
