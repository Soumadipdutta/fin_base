
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class CompanyCreate(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    base_currency: str = Field(default="INR", min_length=3, max_length=3)
    minimum_reserve: Decimal = Field(default=Decimal("0.00"), ge=0)

    @field_validator("base_currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        value = value.strip().upper()
        if len(value) != 3 or not value.isalpha():
            raise ValueError("Currency must be a 3-letter code, e.g. INR or USD")
        return value


class CompanyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    base_currency: str
    minimum_reserve: Decimal
    created_at: datetime