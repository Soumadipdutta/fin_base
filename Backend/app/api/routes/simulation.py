
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.company import Company
from app.services.forecasting import generate_forecast
from app.services.monte_carlo import simulate_forecast

router = APIRouter(
    prefix="/companies/{company_id}/simulation",
    tags=["Monte Carlo Simulation"],
)


@router.get("")
def get_company_simulation(
    company_id: int,
    days: int = Query(default=30, ge=1, le=90),
    simulations: int = Query(default=1000, ge=1, le=100000),
    max_delay_days: int = Query(default=7, ge=0, le=90),
    seed: int = Query(default=42, ge=0, le=2147483647),
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

        
        return simulate_forecast(
            forecast=forecast,
            simulations=simulations,
            max_delay_days=max_delay_days,
            seed=seed,
            minimum_reserve=company.minimum_reserve,
            reserve_currency=company.base_currency,
        )


    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
