
from app.services.risk_analysis import analyze_forecast


def test_detects_critical_cash_balance():
    forecast = {
        "daily_forecast": [
            {
                "date": "2026-10-12",
                "currency": "USD",
                "closing_balance": "-100.00",
                "reserve_shortfall": "5100.00",
            }
        ]
    }

    result = analyze_forecast(forecast)

    assert result["overall_status"] == "critical"
    assert result["risk_count"] == 1
    assert result["risks"][0]["severity"] == "critical"


def test_detects_reserve_warning():
    forecast = {
        "daily_forecast": [
            {
                "date": "2026-10-12",
                "currency": "USD",
                "closing_balance": "4000.00",
                "reserve_shortfall": "1000.00",
            }
        ]
    }

    result = analyze_forecast(forecast)

    assert result["overall_status"] == "warning"
    assert result["risks"][0]["severity"] == "warning"


def test_healthy_forecast_has_no_risks():
    forecast = {
        "daily_forecast": [
            {
                "date": "2026-10-12",
                "currency": "USD",
                "closing_balance": "10000.00",
                "reserve_shortfall": "0.00",
            }
        ]
    }

    result = analyze_forecast(forecast)

    assert result["overall_status"] == "healthy"
    assert result["risk_count"] == 0
    assert result["risks"] == []


def test_handles_none_reserve_shortfall():
    forecast = {
        "daily_forecast": [
            {
                "date": "2026-10-11",
                "currency": "USD",
                "closing_balance": "12500.50",
                "reserve_shortfall": None,
            }
        ]
    }

    result = analyze_forecast(forecast)

    assert result["overall_status"] == "healthy"
    assert result["risk_count"] == 0
