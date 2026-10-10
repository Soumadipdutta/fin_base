
from datetime import date
from decimal import Decimal

from sqlalchemy import Date, ForeignKey, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id"), nullable=False, index=True
    )
    direction: Mapped[str] = mapped_column(
        String(10), nullable=False
    )  # receivable or payable
    counterparty: Mapped[str] = mapped_column(
        String(150), nullable=False
    )
    currency: Mapped[str] = mapped_column(String(3), nullable=False)
    amount: Mapped[Decimal] = mapped_column(
        Numeric(18, 2), nullable=False
    )
    issue_date: Mapped[date] = mapped_column(Date, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    expected_date: Mapped[date | None] = mapped_column(
        Date, nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(20), default="open", nullable=False
    )