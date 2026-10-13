from datetime import date
from decimal import Decimal
from typing import Literal

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)

class ObligationCreate(BaseModel):
    invoice_id: int | None = Field(default=None, gt=0)
    category: str = Field(min_length=1, max_length=50)
    amount: Decimal = Field(gt=0, max_digits=18, decimal_places=2)
    currency: str = Field(min_length=3, max_length=3)
    due_date: date
    flexible_until: date | None = None
    priority: Literal["critical", "high", "normal", "low"] = "normal"

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        value = value.strip().upper()
        if len(value) != 3 or not value.isalpha():
            raise ValueError("Currency must be a 3-letter code")
        return value

    @field_validator("category")
    @classmethod
    def normalize_category(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Category cannot be empty")
        return value

    @model_validator(mode="after")
    def validate_flexible_date(self):
        if (
            self.flexible_until is not None
            and self.flexible_until < self.due_date
        ):
            raise ValueError(
                "Flexible-until date cannot precede due date"
            )
        return self


class ObligationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    invoice_id: int | None
    category: str
    amount: Decimal
    currency: str
    due_date: date
    flexible_until: date | None
    priority: str