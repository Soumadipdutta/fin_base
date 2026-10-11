
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator


class AccountCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    currency: str = Field(min_length=3, max_length=3)
    balance: Decimal = Field(
        default=Decimal("0.00"),
        max_digits=18,
        decimal_places=2,
    )
    account_type: Literal["bank", "paypal", "wallet", "other"] = "bank"

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        value = value.strip().upper()
        if len(value) != 3 or not value.isalpha():
            raise ValueError("Currency must be a 3-letter code, e.g. INR or USD")
        return value


class AccountResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    company_id: int
    name: str
    currency: str
    balance: Decimal
    account_type: str