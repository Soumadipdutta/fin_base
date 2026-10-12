
from collections import defaultdict
from decimal import Decimal
import random


def simulate_forecast(
    forecast: dict,
    simulations: int = 1000,
    max_delay_days: int = 7,
    seed: int = 42,
    minimum_reserve: Decimal | str | None = None,
    reserve_currency: str | None = None,
) -> dict:
    """Simulate delayed receipts and estimate liquidity risk."""

    if not 1 <= simulations <= 100_000:
        raise ValueError("simulations must be between 1 and 100000")

    if not 0 <= max_delay_days <= 90:
        raise ValueError("max_delay_days must be between 0 and 90")

    rows = forecast.get("daily_forecast", [])
    if not rows:
        raise ValueError("Forecast contains no daily rows")

    reserve = (
        Decimal(str(minimum_reserve))
        if minimum_reserve is not None
        else None
    )

    if reserve is not None and reserve < 0:
        raise ValueError("minimum_reserve cannot be negative")

    if reserve is not None and not reserve_currency:
        raise ValueError(
            "reserve_currency is required when minimum_reserve is set"
        )

    grouped = defaultdict(list)
    for row in rows:
        grouped[row["currency"]].append(row)

    # New forecasts provide individual receivable events.
    # Older test fixtures can continue using aggregated daily inflows.
    receivable_events = forecast.get("receivable_events")
    invoice_level = receivable_events is not None

    events_by_currency = defaultdict(list)
    if invoice_level:
        for event in receivable_events:
            amount = Decimal(str(event["amount"]))

            if amount < 0:
                raise ValueError("Receivable amounts cannot be negative")

            events_by_currency[event["currency"]].append(
                {
                    "date": event["expected_date"],
                    "amount": amount,
                    "invoice_id": event.get("invoice_id"),
                }
            )

    rng = random.Random(seed)
    currency_results = []

    for currency, currency_rows in sorted(grouped.items()):
        currency_rows = sorted(
            currency_rows,
            key=lambda row: row["date"],
        )

        dates = [row["date"] for row in currency_rows]
        date_indexes = {
            day: index for index, day in enumerate(dates)
        }
        day_count = len(dates)

        opening_balance = Decimal(
            str(currency_rows[0]["opening_balance"])
        )

        outflows = [
            Decimal(str(row["expected_outflows"]))
            for row in currency_rows
        ]

        # Legacy forecasts use aggregated inflows.
        inflows = [
            Decimal(str(row["expected_inflows"]))
            for row in currency_rows
        ]

        events = events_by_currency.get(currency, [])

        track_reserve = (
            reserve is not None and currency == reserve_currency
        )

        negative_counts = [0] * day_count
        reserve_counts = [0] * day_count
        scenarios_negative = 0
        scenarios_below_reserve = 0
        worst_shortfall = Decimal("0")

        for _ in range(simulations):
            shifted_inflows = [Decimal("0")] * day_count

            if invoice_level:
                # Independently delay each invoice.
                for event in events:
                    original_index = date_indexes.get(event["date"])

                    # Ignore events outside this currency's forecast dates.
                    if original_index is None:
                        continue

                    delay = rng.randint(0, max_delay_days)
                    target = original_index + delay

                    # Receipts after the forecast horizon are not received
                    # within this scenario's forecast window.
                    if target < day_count:
                        shifted_inflows[target] += event["amount"]
            else:
                # Backward-compatible behavior for older forecast fixtures.
                for i, amount in enumerate(inflows):
                    if amount <= 0:
                        continue

                    delay = rng.randint(0, max_delay_days)
                    target = i + delay

                    if target < day_count:
                        shifted_inflows[target] += amount

            balance = opening_balance
            scenario_negative = False
            scenario_reserve_breach = False
            scenario_worst_shortfall = Decimal("0")

            for i in range(day_count):
                balance += shifted_inflows[i] - outflows[i]

                if balance < 0:
                    negative_counts[i] += 1
                    scenario_negative = True

                if track_reserve:
                    shortfall = max(
                        Decimal("0"),
                        reserve - balance,
                    )
                    scenario_worst_shortfall = max(
                        scenario_worst_shortfall,
                        shortfall,
                    )

                    if shortfall > 0:
                        reserve_counts[i] += 1
                        scenario_reserve_breach = True

            if scenario_negative:
                scenarios_negative += 1

            if scenario_reserve_breach:
                scenarios_below_reserve += 1

            worst_shortfall = max(
                worst_shortfall,
                scenario_worst_shortfall,
            )

        daily_risk = []

        for i, day in enumerate(dates):
            item = {
                "date": day,
                "probability_below_zero": round(
                    negative_counts[i] / simulations, 4
                ),
            }

            if track_reserve:
                item["probability_below_reserve"] = round(
                    reserve_counts[i] / simulations, 4
                )

            daily_risk.append(item)

        result = {
            "currency": currency,
            "simulations": simulations,
            "max_delay_days": max_delay_days,
            "probability_ever_below_zero": round(
                scenarios_negative / simulations, 4
            ),
            "daily_risk": daily_risk,
        }

        if track_reserve:
            result["minimum_reserve"] = str(reserve)
            result["probability_ever_below_reserve"] = round(
                scenarios_below_reserve / simulations, 4
            )
            result["worst_shortfall_observed"] = str(worst_shortfall)

        currency_results.append(result)

    return {
        "company_id": forecast.get("company_id"),
        "forecast_start": forecast.get("forecast_start"),
        "forecast_end": forecast.get("forecast_end"),
        "method": (
            "independent_invoice_delay"
            if invoice_level
            else "uniform_receivable_delay"
        ),
        "seed": seed,
        "results": currency_results,
        "limitations": [
            "Delay probabilities are uniform and not historically calibrated.",
            "Outflows remain fixed.",
            "Currency balances are not converted.",
            "Reserve risk is evaluated only in the configured reserve currency.",
            "Receipts delayed beyond the forecast horizon are excluded.",
            "Worst shortfall is the maximum observed in these simulations, "
            "not a guaranteed upper bound.",
        ],
    }
