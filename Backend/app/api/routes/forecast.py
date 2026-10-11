
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.company import Company
from app.services.forecasting import generate_forecast

router = APIRouter(
    prefix="/companies/{company_id}/forecast",
    tags=["Forecasting"],
)


@router.get("")
def get_forecast(
    company_id: int,
    days: int = Query(default=30, ge=1, le=90),
    db: Session = Depends(get_db),
):
    if db.get(Company, company_id) is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    try:
        return generate_forecast(db, company_id, days)
    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
