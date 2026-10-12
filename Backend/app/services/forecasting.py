
from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.account import Account
from app.models.company import Company
from app.models.invoice import Invoice
from app.models.obligation import Obligation


ZERO = Decimal("0.00")


def generate_forecast(
    db: Session,
    company_id: int,
    days: int = 30,
    as_of: date | None = None,
) -> dict:
    if not 1 <= days <= 90:
        raise ValueError("Forecast days must be between 1 and 90")

    company = db.get(Company, company_id)
    if company is None:
        raise ValueError("Company not found")

    today = as_of or date.today()
    end_date = today + timedelta(days=days - 1)

    # Current cash, tracked separately for each currency.
    balances = defaultdict(lambda: ZERO)

    accounts = db.scalars(
        select(Account).where(Account.company_id == company_id)
    ).all()

    for account in accounts:
        balances[account.currency] += account.balance

    # Each event is recorded as (date, currency, amount).
    inflows = defaultdict(lambda: ZERO)
    outflows = defaultdict(lambda: ZERO)
    receivable_events = []

    def scheduled_date(event_date: date) -> date:
        # Overdue items are assumed to occur today.
        return max(event_date, today)

    def add_event(
        target: dict,
        event_date: date,
        currency: str,
        amount: Decimal,
    ) -> None:
        event_date = scheduled_date(event_date)

        if today <= event_date <= end_date:
            target[(event_date, currency)] += amount

    invoices = db.scalars(
        select(Invoice).where(
            Invoice.company_id == company_id,
            Invoice.status == "open",
        )
    ).all()

    obligations = db.scalars(
        select(Obligation).where(
            Obligation.company_id == company_id
        )
    ).all()

    # If a payable invoice is represented by an obligation,
    # count the obligation instead of counting the invoice twice.
    linked_invoice_ids = {
        obligation.invoice_id
        for obligation in obligations
        if obligation.invoice_id is not None
    }

    for invoice in invoices:
        if (
            invoice.direction == "payable"
            and invoice.id in linked_invoice_ids
        ):
            continue

        event_date = invoice.expected_date or invoice.due_date

        if invoice.direction == "receivable":
            scheduled = scheduled_date(event_date)
            add_event(
                inflows,
                event_date,
                invoice.currency,
                invoice.amount,
            )

            if today <= scheduled <= end_date:
                receivable_events.append(
                {
                "invoice_id": invoice.id,
                "currency": invoice.currency,
                "amount": str(invoice.amount),
                "expected_date": scheduled.isoformat(),
                }
                )
        elif invoice.direction == "payable":
            add_event(
                outflows,
                event_date,
                invoice.currency,
                invoice.amount,
            )

    for obligation in obligations:
        add_event(
            outflows,
            obligation.due_date,
            obligation.currency,
            obligation.amount,
        )

    # Generate daily balances for each currency independently.
    currencies = sorted(
        set(balances.keys())
        | {currency for _, currency in inflows}
        | {currency for _, currency in outflows}
    )

    # Include the company's base currency even if it has no account yet.
    if company.base_currency not in currencies:
        currencies.append(company.base_currency)

    daily_rows = []

    for offset in range(days):
        current_date = today + timedelta(days=offset)

        for currency in currencies:
            opening = balances[currency]
            received = inflows[(current_date, currency)]
            paid = outflows[(current_date, currency)]
            closing = opening + received - paid

            balances[currency] = closing

            reserve_shortfall = None
            if currency == company.base_currency:
                reserve_shortfall = max(
                    ZERO,
                    company.minimum_reserve - closing,
                )

            daily_rows.append(
                {
                    "date": current_date.isoformat(),
                    "currency": currency,
                    "opening_balance": opening,
                    "expected_inflows": received,
                    "expected_outflows": paid,
                    "closing_balance": closing,
                    "reserve_shortfall": reserve_shortfall,
                    "below_zero": closing < ZERO,
                }
            )

    return {
        "company_id": company_id,
        "base_currency": company.base_currency,
        "forecast_start": today.isoformat(),
        "forecast_end": end_date.isoformat(),
        "days": days,
        "assumptions": [
            "Amounts are forecast separately by currency.",
            "Overdue open invoices and obligations are scheduled for today.",
            "Payable invoices linked to obligations are not counted twice.",
            "Flexible payment dates are not optimized in this forecast.",
            "Expected amounts and dates are estimates, not guarantees.",
        ],
        "daily_forecast": daily_rows,
        "receivable_events": receivable_events,
    }