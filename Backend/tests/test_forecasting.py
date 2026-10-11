
from datetime import date, timedelta
from decimal import Decimal

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.models import Account, Company, Invoice, Obligation
from app.services.forecasting import generate_forecast


@pytest.fixture
def db():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    Base.metadata.create_all(engine)

    TestingSession = sessionmaker(
        bind=engine,
        autoflush=False,
        autocommit=False,
    )

    session = TestingSession()

    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(engine)
        engine.dispose()


def test_forecast_tracks_daily_cash_and_avoids_double_counting(db):
    today = date(2026, 10, 11)

    company = Company(
        name="Test SaaS",
        base_currency="USD",
        minimum_reserve=Decimal("5000.00"),
    )
    db.add(company)
    db.flush()

    db.add(
        Account(
            company_id=company.id,
            name="USD Bank Account",
            currency="USD",
            balance=Decimal("10000.00"),
            account_type="bank",
        )
    )

    # A customer is expected to pay $2,000 tomorrow.
    db.add(
        Invoice(
            company_id=company.id,
            direction="receivable",
            counterparty="Customer A",
            currency="USD",
            amount=Decimal("2000.00"),
            issue_date=today - timedelta(days=1),
            due_date=today + timedelta(days=1),
            expected_date=today + timedelta(days=1),
            status="open",
        )
    )

    # A payable invoice is linked to an obligation.
    payable = Invoice(
        company_id=company.id,
        direction="payable",
        counterparty="Cloud Provider",
        currency="USD",
        amount=Decimal("3000.00"),
        issue_date=today - timedelta(days=2),
        due_date=today + timedelta(days=2),
        expected_date=None,
        status="open",
    )
    db.add(payable)
    db.flush()

    db.add(
        Obligation(
            company_id=company.id,
            invoice_id=payable.id,
            category="cloud_infrastructure",
            amount=Decimal("3000.00"),
            currency="USD",
            due_date=today + timedelta(days=2),
            flexible_until=today + timedelta(days=4),
            priority="high",
        )
    )
    db.commit()

    result = generate_forecast(
        db,
        company.id,
        days=3,
        as_of=today,
    )

    rows = {
        row["date"]: row
        for row in result["daily_forecast"]
        if row["currency"] == "USD"
    }

    day_1 = (today + timedelta(days=1)).isoformat()
    day_2 = (today + timedelta(days=2)).isoformat()

    assert rows[today.isoformat()]["closing_balance"] == Decimal("10000.00")
    assert rows[day_1]["expected_inflows"] == Decimal("2000.00")
    assert rows[day_1]["closing_balance"] == Decimal("12000.00")

    # The payable invoice and its linked obligation count only once.
    assert rows[day_2]["expected_outflows"] == Decimal("3000.00")
    assert rows[day_2]["closing_balance"] == Decimal("9000.00")

    assert rows[day_2]["reserve_shortfall"] == Decimal("0.00")
    assert rows[day_2]["below_zero"] is False


def test_forecast_rejects_invalid_horizon(db):
    company = Company(
        name="Test SaaS",
        base_currency="USD",
        minimum_reserve=Decimal("0.00"),
    )
    db.add(company)
    db.commit()

    with pytest.raises(ValueError, match="between 1 and 90"):
        generate_forecast(db, company.id, days=0, as_of=date(2026, 10, 11))
