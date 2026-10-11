
from decimal import Decimal, InvalidOperation


def analyze_forecast(forecast: dict) -> dict:
    """Summarize cash-flow risks from a generated forecast."""

    daily_rows = forecast.get("daily_forecast", [])
    risks = []

    for row in daily_rows:
        currency = row["currency"]

        try:
            closing_balance = Decimal(str(row["closing_balance"]))
            raw_shortfall = row.get("reserve_shortfall")
            reserve_shortfall = (
                Decimal("0")
                if raw_shortfall is None
                else Decimal(str(raw_shortfall))
            )
        except (InvalidOperation, ValueError, TypeError) as exc:
            raise ValueError(
                f"Invalid balance data for {currency} on {row.get('date')}"
            ) from exc

        forecast_date = row["date"]

        if closing_balance < 0:
            severity = "critical"
            message = (
                f"Projected {currency} cash balance becomes negative "
                f"on {forecast_date}."
            )
        elif reserve_shortfall > 0:
            severity = "warning"
            message = (
                f"Projected {currency} cash balance falls below "
                f"the required reserve on {forecast_date}."
            )
        else:
            continue

        risks.append(
            {
                "date": forecast_date,
                "currency": currency,
                "severity": severity,
                "closing_balance": str(closing_balance),
                "reserve_shortfall": str(reserve_shortfall),
                "message": message,
            }
        )

    if any(risk["severity"] == "critical" for risk in risks):
        overall_status = "critical"
    elif risks:
        overall_status = "warning"
    else:
        overall_status = "healthy"

    return {
        "overall_status": overall_status,
        "risk_count": len(risks),
        "risks": risks,
    }
