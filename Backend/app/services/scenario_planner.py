
from collections import defaultdict
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP


ZERO = Decimal("0.00")
ONE_HUNDRED = Decimal("100")


def plan_cash_flow_scenario(
    forecast: dict,
    minimum_reserve: Decimal | str,
    reserve_currency: str,
    payment_delay_days: int = 0,
    revenue_reduction_pct: Decimal | int | float = 0,
    expense_increase_pct: Decimal | int | float = 0,
) -> dict:
    """Compare a deterministic what-if scenario with the baseline forecast.

    This function only transforms forecast data. It does not modify
    invoices, obligations, accounts, or any database records.
    """
    if not 0 <= payment_delay_days <= 90:
        raise ValueError("payment_delay_days must be between 0 and 90")

    revenue_reduction = Decimal(str(revenue_reduction_pct))
    expense_increase = Decimal(str(expense_increase_pct))
    reserve = Decimal(str(minimum_reserve))

    if not Decimal("0") <= revenue_reduction <= ONE_HUNDRED:
        raise ValueError("revenue_reduction_pct must be between 0 and 100")

    if not Decimal("0") <= expense_increase <= Decimal("500"):
        raise ValueError("expense_increase_pct must be between 0 and 500")

    if reserve < 0:
        raise ValueError("minimum_reserve cannot be negative")

    if not reserve_currency:
        raise ValueError("reserve_currency is required")

    baseline_rows = forecast.get("daily_forecast", [])
    if not baseline_rows:
        raise ValueError("Forecast contains no daily rows")

    rows_by_currency = defaultdict(list)
    for row in baseline_rows:
        rows_by_currency[row["currency"]].append(dict(row))

    for currency_rows in rows_by_currency.values():
        currency_rows.sort(key=lambda row: row["date"])

    # Preserve the original forecast's non-receivable inflows, then
    # shift receivables separately so they are not counted twice.
    baseline_receipts = defaultdict(lambda: ZERO)
    scenario_receipts = defaultdict(lambda: ZERO)

    receivable_events = forecast.get("receivable_events")

    if receivable_events is not None:
        for event in receivable_events:
            currency = event["currency"]
            original_date = date.fromisoformat(event["expected_date"])
            amount = Decimal(str(event["amount"]))

            baseline_receipts[(original_date.isoformat(), currency)] += amount

            shifted_date = original_date + timedelta(
                days=payment_delay_days
            )
            scenario_receipts[(shifted_date.isoformat(), currency)] += amount

    daily_results = []
    currency_summaries = []

    for currency, currency_rows in sorted(rows_by_currency.items()):
        scenario_balance = Decimal(
            str(currency_rows[0]["opening_balance"])
        )
        baseline_closings = []
        scenario_closings = []
        reserve_breach_dates = []
        negative_balance_dates = []

        for row in currency_rows:
            day = row["date"]
            original_inflows = Decimal(str(row["expected_inflows"]))
            original_outflows = Decimal(str(row["expected_outflows"]))

            if receivable_events is not None:
                # Keep any inflows not represented by receivable events.
                other_inflows = max(
                    ZERO,
                    original_inflows
                    - baseline_receipts[(day, currency)],
                )
                inflows_before_reduction = (
                    other_inflows
                    + scenario_receipts[(day, currency)]
                )
            else:
                # Backward-compatible fallback for older forecasts.
                # The timing shift cannot be applied without invoice events.
                inflows_before_reduction = original_inflows

            scenario_inflows = (
                inflows_before_reduction
                * (ONE_HUNDRED - revenue_reduction)
                / ONE_HUNDRED
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            scenario_outflows = (
                original_outflows
                * (ONE_HUNDRED + expense_increase)
                / ONE_HUNDRED
            ).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

            opening = scenario_balance
            scenario_balance = opening + scenario_inflows - scenario_outflows

            baseline_closing = Decimal(str(row["closing_balance"]))
            baseline_closings.append(baseline_closing)
            scenario_closings.append(scenario_balance)

            shortfall = (
                max(ZERO, reserve - scenario_balance)
                if currency == reserve_currency
                else None
            )

            if scenario_balance < ZERO:
                negative_balance_dates.append(day)

            if shortfall is not None and shortfall > ZERO:
                reserve_breach_dates.append(day)

            daily_results.append(
                {
                    "date": day,
                    "currency": currency,
                    "baseline_closing_balance": baseline_closing,
                    "opening_balance": opening,
                    "expected_inflows": scenario_inflows,
                    "expected_outflows": scenario_outflows,
                    "closing_balance": scenario_balance,
                    "delta_vs_baseline": (
                        scenario_balance - baseline_closing
                    ),
                    "reserve_shortfall": shortfall,
                    "below_zero": scenario_balance < ZERO,
                }
            )

        currency_summaries.append(
            {
                "currency": currency,
                "baseline_ending_balance": baseline_closings[-1],
                "scenario_ending_balance": scenario_closings[-1],
                "ending_balance_delta": (
                    scenario_closings[-1] - baseline_closings[-1]
                ),
                "baseline_minimum_balance": min(baseline_closings),
                "scenario_minimum_balance": min(scenario_closings),
                "negative_balance_days": len(negative_balance_dates),
                "negative_balance_dates": negative_balance_dates,
                "reserve_breach_days": len(reserve_breach_dates),
                "reserve_breach_dates": reserve_breach_dates,
            }
        )

    return {
        "company_id": forecast.get("company_id"),
        "forecast_start": forecast.get("forecast_start"),
        "forecast_end": forecast.get("forecast_end"),
        "days": forecast.get("days"),
        "scenario": {
            "payment_delay_days": payment_delay_days,
            "revenue_reduction_pct": str(revenue_reduction),
            "expense_increase_pct": str(expense_increase),
        },
        "currency_summaries": currency_summaries,
        "daily_forecast": daily_results,
        "limitations": [
            "This is a deterministic what-if scenario, not a prediction.",
            "Receipts delayed beyond the forecast horizon are excluded.",
            "Payment delays require invoice-level receivable events.",
            "Expense increases are applied uniformly to forecast outflows.",
            "Currency balances are not converted or combined.",
            "No financial records or payments are modified.",
        ],
    }
