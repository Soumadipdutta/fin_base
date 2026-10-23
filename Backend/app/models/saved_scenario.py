
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class SavedScenario(Base):
    __tablename__ = "saved_scenarios"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        nullable=False,
        default="Untitled scenario",
    )

    days: Mapped[int] = mapped_column(Integer, nullable=False)

    payment_delay_days: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    revenue_reduction_pct: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    expense_increase_pct: Mapped[Decimal] = mapped_column(
        Numeric(5, 2),
        nullable=False,
        default=Decimal("0.00"),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
