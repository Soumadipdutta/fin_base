
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.company import Company
from app.models.optimization_run import OptimizationRun

router = APIRouter()


@router.get("/companies/{company_id}/optimization/history")
def get_optimization_history(
    company_id: int,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    """Return saved optimization runs, newest first."""
    company = db.get(Company, company_id)
    if company is None:
        raise HTTPException(status_code=404, detail="Company not found")

    runs = db.scalars(
        select(OptimizationRun)
        .where(OptimizationRun.company_id == company_id)
        .order_by(
            desc(OptimizationRun.created_at),
            desc(OptimizationRun.id),
        )
        .offset(offset)
        .limit(limit)
    ).all()

    total = db.scalar(
        select(func.count())
        .select_from(OptimizationRun)
        .where(OptimizationRun.company_id == company_id)
    )

    return {
        "company_id": company_id,
        "total": total or 0,
        "limit": limit,
        "offset": offset,
        "items": [
            {
                "id": run.id,
                "horizon_days": run.horizon_days,
                "recommendation_count": run.recommendation_count,
                "is_safe": run.is_safe,
                "breach_count": run.breach_count,
                "created_at": run.created_at,
                "result": run.result,
            }
            for run in runs
        ],
    }
