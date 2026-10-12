
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.company import Company
from app.models.obligation import Obligation
from app.services.forecasting import generate_forecast
from app.services.optimization import optimize_payments


router = APIRouter()


@router.post("/companies/{company_id}/optimization")
def get_payment_optimization(
    company_id: int,
    days: int = Query(default=30, ge=1, le=90),
    db: Session = Depends(get_db),
):
    """
    Generate payment postponement recommendations.
    This endpoint does not modify or execute payments.
    """

    company = db.get(Company, company_id)

    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    try:
        forecast = generate_forecast(
            db=db,
            company_id=company_id,
            days=days,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    obligations = db.scalars(
        select(Obligation).where(
            Obligation.company_id == company_id
        )
    ).all()

    # Convert database models into the dictionary format expected
    # by the optimization service.
    obligation_data = [
        {
            "id": obligation.id,
            "currency": obligation.currency,
            "amount": str(obligation.amount),
            "due_date": obligation.due_date.isoformat(),
            "flexible_until": (
                obligation.flexible_until.isoformat()
                if obligation.flexible_until
                else None
            ),
            "priority": obligation.priority,
        }
        for obligation in obligations
    ]

    try:
        result = optimize_payments(
            forecast=forecast,
            obligations=obligation_data,
            minimum_reserve=company.minimum_reserve,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    return result
