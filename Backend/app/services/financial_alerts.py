from datetime import date
from decimal import Decimal, InvalidOperation

from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.financial_alert import FinancialAlert
from app.services.forecasting import generate_forecast
from app.services.risk_analysis import analyze_forecast


def generate_financial_alerts(
    db: Session,
    company_id: int,
    days: int = 30,
) -> list[FinancialAlert]:
    forecast = generate_forecast(
        db=db,
        company_id=company_id,
        days=days,
    )
    risk_report = analyze_forecast(forecast)

    alerts = []

    for risk in risk_report["risks"]:
        severity = risk["severity"]
        currency = risk["currency"]
        affected_date = date.fromisoformat(risk["date"])
        closing_balance = Decimal(risk["closing_balance"])
        reserve_shortfall = Decimal(risk["reserve_shortfall"])

        if severity == "critical":
            title = f"Projected {currency} cash deficit"
            action = (
                "Review upcoming payment timing and receivable collection. "
                "Use payment optimization before deciding what to pay."
            )
            impact = abs(min(closing_balance, Decimal("0")))
            alert_type = "cash_deficit"
        else:
            title = f"{currency} reserve threshold at risk"
            action = (
                "Review flexible obligations and payment timing to protect "
                "the required cash reserve."
            )
            impact = reserve_shortfall
            alert_type = "reserve_breach"
        existing_alert = db.scalar(
            select(FinancialAlert).where(
            FinancialAlert.company_id == company_id,
            FinancialAlert.alert_type == alert_type,
            FinancialAlert.affected_date == affected_date,
            FinancialAlert.currency == currency,
            FinancialAlert.status != "resolved",
            )
        )

        if existing_alert is not None:
            continue
        alerts.append(
            FinancialAlert(
                company_id=company_id,
                alert_type=alert_type,
                severity=severity,
                title=title,
                message=risk["message"],
                affected_date=affected_date,
                currency=currency,
                estimated_impact=impact,
                recommended_action=action,
                evidence={
                    "closing_balance": str(closing_balance),
                    "reserve_shortfall": str(reserve_shortfall),
                    "source": "cashflow_forecast",
                },
                status="new",
            )
        )

    if alerts:
        db.add_all(alerts)
        db.commit()

        for alert in alerts:
            db.refresh(alert)

    return alerts