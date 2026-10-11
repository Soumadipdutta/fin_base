
import pytest
from decimal import Decimal

from app.services.monte_carlo import simulate_forecast


def sample_forecast():
    return {
        "company_id": 2,
        "forecast_start": "2026-10-11",
        "forecast_end": "2026-10-13",
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
            },
            {
                "date": "2026-10-12",
                "currency": "USD",
                "opening_balance": "100.00",
                "expected_inflows": "0.00",
                "expected_outflows": "80.00",
                "closing_balance": "20.00",
                "reserve_shortfall": None,
                "below_zero": False,
            },
            {
                "date": "2026-10-13",
                "currency": "USD",
                "opening_balance": "20.00",
                "expected_inflows": "100.00",
                "expected_outflows": "50.00",
                "closing_balance": "70.00",
                "reserve_shortfall": None,
                "below_zero": False,
            },
        ],
    }


def test_simulation_is_reproducible():
    forecast = sample_forecast()

    first = simulate_forecast(
        forecast, simulations=200, max_delay_days=2, seed=7
    )
    second = simulate_forecast(
        forecast, simulations=200, max_delay_days=2, seed=7
    )

    assert first == second


def test_zero_delay_matches_deterministic_negative_balance_risk():
    forecast = sample_forecast()

    result = simulate_forecast(
        forecast, simulations=100, max_delay_days=0
    )

    assert result["results"][0]["currency"] == "USD"
    assert result["results"][0]["probability_ever_below_zero"] == 0.0
    assert all(
        row["probability_below_zero"] == 0.0
        for row in result["results"][0]["daily_risk"]
    )


def test_rejects_invalid_simulation_count():
    with pytest.raises(ValueError, match="simulations"):
        simulate_forecast(sample_forecast(), simulations=0)


def test_rejects_invalid_delay():
    with pytest.raises(ValueError, match="max_delay_days"):
        simulate_forecast(sample_forecast(), max_delay_days=91)


def test_detects_reserve_breach_without_negative_balance():
    forecast = {
        "company_id": 2,
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
            },
            {
                "date": "2026-10-12",
                "currency": "USD",
                "opening_balance": "100.00",
                "expected_inflows": "0.00",
                "expected_outflows": "30.00",
                "closing_balance": "70.00",
            },
        ],
    }

    result = simulate_forecast(
        forecast,
        simulations=100,
        max_delay_days=0,
        minimum_reserve="80.00",
        reserve_currency="USD",
    )

    usd = result["results"][0]

    assert usd["probability_ever_below_zero"] == 0.0
    assert usd["probability_ever_below_reserve"] == 1.0
    assert usd["daily_risk"][0]["probability_below_reserve"] == 0.0
    assert usd["daily_risk"][1]["probability_below_reserve"] == 1.0
    assert Decimal(usd["worst_shortfall_observed"]) == Decimal("10.00")
