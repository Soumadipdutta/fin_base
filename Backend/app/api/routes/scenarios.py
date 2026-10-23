
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.company import Company
from app.services.forecasting import generate_forecast
from app.services.scenario_planner import plan_cash_flow_scenario
from app.core.company_access import require_allowed_company
from app.models.saved_scenario import SavedScenario
from app.schemas.scenario import (
    SavedScenarioCreate,
    SavedScenarioResponse,
)

router = APIRouter(
    prefix="/companies/{company_id}/scenarios",
    tags=["What-if Scenarios"],
    dependencies=[Depends(require_allowed_company)],
)


class ScenarioRequest(BaseModel):
    days: int = Field(default=30, ge=1, le=90)
    payment_delay_days: int = Field(default=0, ge=0, le=90)
    revenue_reduction_pct: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        le=100,
    )
    expense_increase_pct: Decimal = Field(
        default=Decimal("0"),
        ge=0,
        le=500,
    )


@router.post("/preview")
def preview_scenario(
    company_id: int,
    payload: ScenarioRequest,
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
            days=payload.days,
        )

        result = plan_cash_flow_scenario(
            forecast=forecast,
            minimum_reserve=company.minimum_reserve,
            reserve_currency=company.base_currency,
            payment_delay_days=payload.payment_delay_days,
            revenue_reduction_pct=payload.revenue_reduction_pct,
            expense_increase_pct=payload.expense_increase_pct,
        )
        return result

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc


@router.post(
    "",
    response_model=SavedScenarioResponse,
    status_code=201,
)
def save_scenario(
    company_id: int,
    payload: SavedScenarioCreate,
    db: Session = Depends(get_db),
):
    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found")

    scenario = SavedScenario(
        company_id=company_id,
        name=payload.name.strip() or "Untitled scenario",
        days=payload.days,
        payment_delay_days=payload.payment_delay_days,
        revenue_reduction_pct=payload.revenue_reduction_pct,
        expense_increase_pct=payload.expense_increase_pct,
    )

    try:
        db.add(scenario)
        db.commit()
        db.refresh(scenario)
        return scenario
    except Exception:
        db.rollback()
        raise


@router.get("", response_model=list[SavedScenarioResponse])
def list_saved_scenarios(
    company_id: int,
    db: Session = Depends(get_db),
):
    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found")

    return (
        db.query(SavedScenario)
        .filter(SavedScenario.company_id == company_id)
        .order_by(SavedScenario.created_at.desc(), SavedScenario.id.desc())
        .all()
    )


@router.get("/{scenario_id}", response_model=SavedScenarioResponse)
def get_saved_scenario(
    company_id: int,
    scenario_id: int,
    db: Session = Depends(get_db),
):
    scenario = (
        db.query(SavedScenario)
        .filter(
            SavedScenario.id == scenario_id,
            SavedScenario.company_id == company_id,
        )
        .first()
    )

    if scenario is None:
        raise HTTPException(
            status_code=404,
            detail="Saved scenario not found",
        )

    return scenario
@router.delete("/{scenario_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_saved_scenario(
    company_id: int,
    scenario_id: int,
    db: Session = Depends(get_db),
):
    scenario = (
        db.query(SavedScenario)
        .filter(
            SavedScenario.id == scenario_id,
            SavedScenario.company_id == company_id,
        )
        .first()
    )

    if scenario is None:
        raise HTTPException(
            status_code=404,
            detail="Saved scenario not found",
        )

    db.delete(scenario)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)