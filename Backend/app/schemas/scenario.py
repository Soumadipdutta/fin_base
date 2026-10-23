
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class SavedScenarioCreate(BaseModel):
    name: str = Field(
        default="Untitled scenario",
        min_length=1,
        max_length=150,
    )
    days: int = Field(default=30, ge=1, le=365)
    payment_delay_days: int = Field(default=0, ge=0, le=365)
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


class SavedScenarioResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    name: str
    days: int
    payment_delay_days: int
    revenue_reduction_pct: Decimal
    expense_increase_pct: Decimal
    created_at: datetime
