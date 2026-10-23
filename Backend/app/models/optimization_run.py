
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import DateTime, ForeignKey, Integer, JSON
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class OptimizationRun(Base):
    __tablename__ = "optimization_runs"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    company_id: Mapped[int] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    horizon_days: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    recommendation_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    is_safe: Mapped[bool] = mapped_column(
        nullable=False,
    )

    breach_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    result: Mapped[dict[str, Any]] = mapped_column(
        JSON,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )
