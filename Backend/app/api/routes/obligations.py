
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.company import Company
from app.models.invoice import Invoice
from app.models.obligation import Obligation
from app.schemas.obligation import (
    ObligationCreate,
    ObligationResponse,
)

router = APIRouter(
    prefix="/companies/{company_id}/obligations",
    tags=["Obligations"],
)


@router.post(
    "",
    response_model=ObligationResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_obligation(
    company_id: int,
    payload: ObligationCreate,
    db: Session = Depends(get_db),
):
    if db.get(Company, company_id) is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    if payload.invoice_id is not None:
        invoice = db.get(Invoice, payload.invoice_id)

        if invoice is None or invoice.company_id != company_id:
            raise HTTPException(
                status_code=400,
                detail="Invoice does not belong to this company",
            )

        if invoice.direction != "payable":
            raise HTTPException(
                status_code=400,
                detail="An obligation can only link to a payable invoice",
            )

        if invoice.currency != payload.currency:
            raise HTTPException(
                status_code=400,
                detail="Obligation currency must match its invoice",
            )

    obligation = Obligation(
        company_id=company_id,
        **payload.model_dump(),
    )

    db.add(obligation)
    db.commit()
    db.refresh(obligation)
    return obligation


@router.get("", response_model=list[ObligationResponse])
def list_obligations(
    company_id: int,
    db: Session = Depends(get_db),
):
    if db.get(Company, company_id) is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    statement = (
        select(Obligation)
        .where(Obligation.company_id == company_id)
        .order_by(Obligation.due_date, Obligation.id)
    )

    return db.scalars(statement).all()