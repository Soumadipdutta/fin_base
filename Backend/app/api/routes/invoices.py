
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.company import Company
from app.models.invoice import Invoice
from app.schemas.invoice import InvoiceCreate, InvoiceResponse

router = APIRouter(
    prefix="/companies/{company_id}/invoices",
    tags=["Invoices"],
)


@router.post(
    "",
    response_model=InvoiceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_invoice(
    company_id: int,
    payload: InvoiceCreate,
    db: Session = Depends(get_db),
):
    if db.get(Company, company_id) is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    invoice = Invoice(
        company_id=company_id,
        **payload.model_dump(),
    )

    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


@router.get("", response_model=list[InvoiceResponse])
def list_invoices(
    company_id: int,
    db: Session = Depends(get_db),
):
    if db.get(Company, company_id) is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    statement = (
        select(Invoice)
        .where(Invoice.company_id == company_id)
        .order_by(Invoice.due_date, Invoice.id)
    )

    return db.scalars(statement).all()