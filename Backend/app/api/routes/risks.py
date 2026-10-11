
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.company import Company
from app.services.forecasting import generate_forecast
from app.services.risk_analysis import analyze_forecast

router = APIRouter(
    prefix="/companies/{company_id}/risks",
    tags=["Risk Analysis"],
)


@router.get("")
def get_company_risks(
    company_id: int,
    days: int = Query(default=30, ge=1, le=90),
    db: Session = Depends(get_db),
):
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
        return analyze_forecast(forecast)

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
