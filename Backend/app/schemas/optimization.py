
from datetime import date
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict


class OptimizationRecommendation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    obligation_id: int
    currency: str
    amount: Decimal
    original_due_date: date
    recommended_date: date
    reason: str
    expected_benefit: dict[str, Any]
    priority: int


class ScheduleBreach(BaseModel):
    model_config = ConfigDict(extra="forbid")

    currency: str
    date: date
    projected_closing_balance: Decimal
    applicable_reserve: Decimal
    shortfall: Decimal


class ScheduleValidation(BaseModel):
    model_config = ConfigDict(extra="forbid")

    is_safe: bool
    breach_count: int
    breaches: list[ScheduleBreach]


class OptimizationResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    company_id: int
    minimum_reserve: Decimal
    recommendations: list[OptimizationRecommendation]
    total_deferred_by_currency: dict[str, Decimal]
    limitations: list[str]
    schedule_validation: ScheduleValidation
