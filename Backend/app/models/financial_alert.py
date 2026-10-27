from datetime import date, datetime, timezone
from typing import Any

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    Numeric,
    String,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class FinancialAlert(Base):
    __tablename__ = "financial_alerts"

    id: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    alert_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )
    severity: Mapped[str] = mapped_column(
        String(20), nullable=False
    )
    title: Mapped[str] = mapped_column(
        String(200), nullable=False
    )
    message: Mapped[str] = mapped_column(
        String(1000), nullable=False
    )
    affected_date: Mapped[date | None] = mapped_column(
        Date, nullable=True
    )
    currency: Mapped[str | None] = mapped_column(
        String(3), nullable=True
    )
    estimated_impact: Mapped[Any | None] = mapped_column(
        Numeric(18, 2), nullable=True
    )
    recommended_action: Mapped[str] = mapped_column(
        String(1000), nullable=False
    )
    evidence: Mapped[dict[str, Any]] = mapped_column(
        JSON, nullable=False, default=dict
    )
    status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="new", index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )