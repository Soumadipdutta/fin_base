
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.deps import get_db
from app.models.account import Account
from app.models.company import Company
from app.schemas.account import AccountCreate, AccountResponse

router = APIRouter(
    prefix="/companies/{company_id}/accounts",
    tags=["Accounts"],
)


@router.post(
    "",
    response_model=AccountResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_account(
    company_id: int,
    payload: AccountCreate,
    db: Session = Depends(get_db),
):
    company = db.get(Company, company_id)

    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    account = Account(
        company_id=company_id,
        name=payload.name.strip(),
        currency=payload.currency,
        balance=payload.balance,
        account_type=payload.account_type,
    )

    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.get("", response_model=list[AccountResponse])
def list_accounts(
    company_id: int,
    db: Session = Depends(get_db),
):
    company = db.get(Company, company_id)

    if company is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    statement = (
        select(Account)
        .where(Account.company_id == company_id)
        .order_by(Account.id)
    )
    return db.scalars(statement).all()