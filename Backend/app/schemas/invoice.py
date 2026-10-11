
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


class InvoiceCreate(BaseModel):
    direction: Literal["receivable", "payable"]
    counterparty: str = Field(min_length=1, max_length=150)
    currency: str = Field(min_length=3, max_length=3)
    amount: Decimal = Field(gt=0, max_digits=18, decimal_places=2)
    issue_date: date
    due_date: date
    expected_date: date | None = None
    status: Literal["open", "paid", "cancelled"] = "open"

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        value = value.strip().upper()
        if len(value) != 3 or not value.isalpha():
            raise ValueError("Currency must be a 3-letter code")
        return value

    @field_validator("counterparty")
    @classmethod
    def normalize_counterparty(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Counterparty cannot be empty")
        return value

    @model_validator(mode="after")
    def validate_dates(self):
        if self.due_date < self.issue_date:
            raise ValueError("Due date cannot precede issue date")
        if self.expected_date is not None and self.expected_date < self.issue_date:
            raise ValueError("Expected date cannot precede issue date")
        return self


class InvoiceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    direction: str
    counterparty: str
    currency: str
    amount: Decimal
    issue_date: date
    due_date: date
    expected_date: date | None
    status: str