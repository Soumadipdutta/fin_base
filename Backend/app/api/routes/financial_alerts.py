from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Literal
from pydantic import BaseModel
from app.db.deps import get_db
from app.models.company import Company
from app.services.financial_alerts import generate_financial_alerts
from sqlalchemy import select
from app.models.financial_alert import FinancialAlert

router = APIRouter(
    prefix="/companies/{company_id}/alerts",
    tags=["Financial Alerts"],
)


@router.post("/generate")
def generate_alerts(
    company_id: int,
    days: int = Query(default=30, ge=1, le=90),
    db: Session = Depends(get_db),
):
    if db.get(Company, company_id) is None:
        raise HTTPException(status_code=404, detail="Company not found")

    try:
        alerts = generate_financial_alerts(db, company_id, days)
        return {
            "company_id": company_id,
            "alert_count": len(alerts),
            "alerts": [
                {
                    "id": alert.id,
                    "type": alert.alert_type,
                    "severity": alert.severity,
                    "title": alert.title,
                    "message": alert.message,
                    "affected_date": (
                        alert.affected_date.isoformat()
                        if alert.affected_date else None
                    ),
                    "currency": alert.currency,
                    "estimated_impact": (
                        str(alert.estimated_impact)
                        if alert.estimated_impact is not None else None
                    ),
                    "recommended_action": alert.recommended_action,
                    "evidence": alert.evidence,
                    "status": alert.status,
                }
                for alert in alerts
            ],
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("")
def list_alerts(
    company_id: int,
    status: str | None = Query(default=None),
    db: Session = Depends(get_db),
):
    if db.get(Company, company_id) is None:
        raise HTTPException(status_code=404, detail="Company not found")

    query = select(FinancialAlert).where(
        FinancialAlert.company_id == company_id
    )

    if status is not None:
        if status not in {"new", "acknowledged", "resolved"}:
            raise HTTPException(
                status_code=400,
                detail="Invalid alert status",
            )
        query = query.where(FinancialAlert.status == status)

    query = query.order_by(FinancialAlert.created_at.desc())
    alerts = db.scalars(query).all()

    return {
        "company_id": company_id,
        "alert_count": len(alerts),
        "alerts": [
            {
                "id": alert.id,
                "type": alert.alert_type,
                "severity": alert.severity,
                "title": alert.title,
                "message": alert.message,
                "affected_date": (
                    alert.affected_date.isoformat()
                    if alert.affected_date else None
                ),
                "currency": alert.currency,
                "estimated_impact": (
                    str(alert.estimated_impact)
                    if alert.estimated_impact is not None else None
                ),
                "recommended_action": alert.recommended_action,
                "evidence": alert.evidence,
                "status": alert.status,
                "created_at": alert.created_at.isoformat(),
            }
            for alert in alerts
        ],
    }

class AlertStatusUpdate(BaseModel):
    status: Literal["acknowledged", "resolved"]


@router.patch("/{alert_id}")
def update_alert_status(
    company_id: int,
    alert_id: int,
    payload: AlertStatusUpdate,
    db: Session = Depends(get_db),
):
    if db.get(Company, company_id) is None:
        raise HTTPException(status_code=404, detail="Company not found")

    alert = db.scalar(
        select(FinancialAlert).where(
            FinancialAlert.id == alert_id,
            FinancialAlert.company_id == company_id,
        )
    )

    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")

    alert.status = payload.status
    db.commit()
    db.refresh(alert)

    return {
        "id": alert.id,
        "title": alert.title,
        "status": alert.status,
        "message": "Alert status updated successfully",
    }