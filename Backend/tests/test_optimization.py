
from decimal import Decimal

import pytest

from app.services.optimization import optimize_payments


def make_forecast():
    return {
        "company_id": 1,
        "base_currency": "INR",
        "daily_forecast": [
            {
                "date": "2026-10-12",
                "currency": "INR",
                "opening_balance": "100.00",
                "expected_inflows": "0.00",
                "expected_outflows": "80.00",
                "closing_balance": "20.00",
            },
            {
                "date": "2026-10-13",
                "currency": "INR",
                "opening_balance": "20.00",
                "expected_inflows": "100.00",
                "expected_outflows": "0.00",
                "closing_balance": "120.00",
            },
        ],
    }


def test_flexible_payment_can_be_postponed():
    result = optimize_payments(
        forecast=make_forecast(),
        obligations=[
            {
                "id": 101,
                "currency": "INR",
                "amount": "80.00",
                "due_date": "2026-10-12",
                "flexible_until": "2026-10-13",
                "priority": 3,
            }
        ],
        minimum_reserve=Decimal("30.00"),
    )

    assert len(result["recommendations"]) == 1
    assert result["recommendations"][0]["obligation_id"] == 101
    assert result["recommendations"][0]["recommended_date"] == "2026-10-13"


def test_does_not_postpone_payment_when_reserve_is_safe():
    forecast = make_forecast()
    forecast["daily_forecast"][0]["closing_balance"] = "60.00"

    result = optimize_payments(
        forecast=forecast,
        obligations=[
            {
                "id": 102,
                "currency": "INR",
                "amount": "20.00",
                "due_date": "2026-10-12",
                "flexible_until": "2026-10-13",
                "priority": 3,
            }
        ],
        minimum_reserve=Decimal("50.00"),
    )

    assert result["recommendations"] == []


def test_does_not_recommend_date_beyond_flexible_until():
    result = optimize_payments(
        forecast=make_forecast(),
        obligations=[
            {
                "id": 103,
                "currency": "INR",
                "amount": "80.00",
                "due_date": "2026-10-12",
                "flexible_until": "2026-10-12",
                "priority": 3,
            }
        ],
        minimum_reserve=Decimal("30.00"),
    )

    assert result["recommendations"] == []


def test_rejects_negative_minimum_reserve():
    with pytest.raises(ValueError, match="minimum_reserve"):
        optimize_payments(
            forecast=make_forecast(),
            obligations=[],
            minimum_reserve="-1.00",
        )



def test_multiple_recommendations_keep_projected_balances_consistent():
    forecast = {
        "company_id": 1,
        "base_currency": "INR",
        "daily_forecast": [
            {
                "date": "2026-10-12",
                "currency": "INR",
                "opening_balance": "100.00",
                "expected_inflows": "0.00",
                "expected_outflows": "90.00",
                "closing_balance": "10.00",
            },
            {
                "date": "2026-10-13",
                "currency": "INR",
                "opening_balance": "10.00",
                "expected_inflows": "150.00",
                "expected_outflows": "0.00",
                "closing_balance": "160.00",
            },
            {
                "date": "2026-10-14",
                "currency": "INR",
                "opening_balance": "160.00",
                "expected_inflows": "0.00",
                "expected_outflows": "0.00",
                "closing_balance": "160.00",
            },
        ],
    }

    obligations = [
        {
            "id": 201,
            "currency": "INR",
            "amount": "40.00",
            "due_date": "2026-10-12",
            "flexible_until": "2026-10-14",
            "priority": 3,
        },
        {
            "id": 202,
            "currency": "INR",
            "amount": "30.00",
            "due_date": "2026-10-12",
            "flexible_until": "2026-10-14",
            "priority": 2,
        },
    ]

    result = optimize_payments(
        forecast=forecast,
        obligations=obligations,
        minimum_reserve="60.00",
    )

    # The original projected balance is below reserve.
    # Recommendations must remain within the permitted dates.
    for recommendation in result["recommendations"]:
        assert (
            recommendation["original_due_date"]
            < recommendation["recommended_date"]
            <= "2026-10-14"
        )

    assert result["total_deferred_by_currency"]["INR"] == "70.00"


def test_reserve_is_not_applied_to_foreign_currency():
    forecast = {
        "company_id": 1,
        "base_currency": "INR",
        "daily_forecast": [
            {
                "date": "2026-10-12",
                "currency": "USD",
                "opening_balance": "100.00",
                "expected_inflows": "0.00",
                "expected_outflows": "90.00",
                "closing_balance": "10.00",
            },
            {
                "date": "2026-10-13",
                "currency": "USD",
                "opening_balance": "10.00",
                "expected_inflows": "100.00",
                "expected_outflows": "0.00",
                "closing_balance": "110.00",
            },
        ],
    }

    result = optimize_payments(
        forecast=forecast,
        obligations=[
            {
                "id": 301,
                "currency": "USD",
                "amount": "90.00",
                "due_date": "2026-10-12",
                "flexible_until": "2026-10-13",
                "priority": 3,
            }
        ],
        minimum_reserve="50000.00",
    )

    assert result["recommendations"] == []
