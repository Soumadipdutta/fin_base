
from collections import defaultdict
from decimal import Decimal


ZERO = Decimal("0.00")


def priority_rank(value) -> int:
    """Convert textual or numeric priorities to a sortable rank."""
    if isinstance(value, (int, float)):
        return int(value)

    ranks = {
        "low": 1,
        "normal": 2,
        "medium": 2,
        "high": 3,
        "urgent": 4,
        "critical": 5,
    }

    return ranks.get(str(value).strip().lower(), 2)

def optimize_payments(
    forecast: dict,
    obligations: list[dict],
    minimum_reserve: Decimal | str = "0.00",
) -> dict:
    """
    Recommend postponing flexible obligations to reduce forecast
    cash shortfalls.

    This is a deterministic heuristic, not a globally optimal solver.
    All amounts are evaluated separately by currency.
    """

    reserve = Decimal(str(minimum_reserve))
    if reserve < ZERO:
        raise ValueError("minimum_reserve cannot be negative")

    base_currency = forecast.get("base_currency")
    if not base_currency:
        raise ValueError("Forecast must specify base_currency")

    rows = forecast.get("daily_forecast", [])
    if not rows:
        raise ValueError("Forecast contains no daily rows")

    # Build each currency's projected closing balances.
    projected = defaultdict(list)

    for row in rows:
        currency = row["currency"]
        projected[currency].append({
            "date": row["date"],
            "closing_balance": Decimal(str(row["closing_balance"])),
        })

    for currency in projected:
        projected[currency].sort(key=lambda item: item["date"])

    # Validate and normalize flexible obligations.
    candidates = []

    for obligation in obligations:
        amount = Decimal(str(obligation["amount"]))

        if amount < ZERO:
            raise ValueError("Obligation amounts cannot be negative")

        due_date = obligation["due_date"]
        flexible_until = obligation.get("flexible_until")

        if (
            flexible_until
            and flexible_until > due_date
            and amount > ZERO
        ):
            candidates.append({
                "obligation_id": obligation.get("id"),
                "currency": obligation["currency"],
                "amount": amount,
                "due_date": due_date,
                "flexible_until": flexible_until,
                "priority": priority_rank(obligation.get("priority", "normal")),
            })

    # Lower numeric priority means more urgent.
    # Consider less urgent payments first.
    candidates.sort(
        key=lambda item: (
            -item["priority"],
            item["due_date"],
            str(item["obligation_id"]),
        )
    )

    recommendations = []
    total_deferred = defaultdict(lambda: ZERO)

    for candidate in candidates:
        currency = candidate["currency"]
        currency_reserve = reserve if currency == base_currency else ZERO

        if currency not in projected:
            continue

        schedule = projected[currency]
        original_due = candidate["due_date"]

        # Only consider dates where this payment can be postponed.
        eligible_dates = [
            day for day in schedule
            if original_due < day["date"] <= candidate["flexible_until"]
        ]

        if not eligible_dates:
            continue

        # Find the first date on which moving this payment would
        # avoid a reserve breach at its original due date.
        due_rows = [
            day for day in schedule
            if day["date"] == original_due
        ]

        if not due_rows:
            continue

        due_balance = due_rows[0]["closing_balance"]

# The forecast closing balance already includes scheduled outflows.
# Do not subtract this obligation a second time.
        if due_balance >= currency_reserve:
            continue

        
        chosen_date = None

        for day in eligible_dates:
            candidate_date = day["date"]

            # Check balances after the original due date.
            # The original due date is already known to be unsafe.
            interval = [
                item
                for item in schedule
                if original_due < item["date"] <= candidate_date
            ]

            if interval and all(
                item["closing_balance"] >= currency_reserve
                for item in interval
            ):
                chosen_date = candidate_date
                break


        if chosen_date is None:
            # Do not recommend a move that still breaches the reserve
            # on the candidate's new payment date.
            continue

        
        original_shortfall = max(
            ZERO,
            currency_reserve - due_balance,
        )

        chosen_day = next(
            day for day in schedule
            if day["date"] == chosen_date
        )

        recommended_balance = chosen_day["closing_balance"]
        reserve_headroom = recommended_balance - currency_reserve

        recommendations.append({
            "obligation_id": candidate["obligation_id"],
            "currency": currency,
            "amount": str(candidate["amount"]),
            "original_due_date": original_due,
            "recommended_date": chosen_date,
            "reason": (
                f"Projected closing balance on the original due date "
                f"is {due_balance:.2f} {currency}, below the applicable "
                f"reserve of {currency_reserve:.2f} {currency}. "
                f"The proposed date has a projected closing balance of "
                f"{recommended_balance:.2f} {currency}."
            ),
            "expected_benefit": {
                "original_reserve_shortfall": str(original_shortfall),
                "projected_reserve_headroom_on_recommended_date": str(
                    reserve_headroom
                ),
            },
            "priority": candidate["priority"],
        })


        total_deferred[currency] += candidate["amount"]

        # Adjust the projected balances after moving the payment.
        for day in schedule:
            if original_due <= day["date"] < chosen_date:
                day["closing_balance"] += candidate["amount"]

            elif day["date"] >= chosen_date:
                break

    return {
        "company_id": forecast.get("company_id"),
        "minimum_reserve": str(reserve),
        "recommendations": recommendations,
        "total_deferred_by_currency": {
            currency: str(amount)
            for currency, amount in sorted(total_deferred.items())
        },
        "limitations": [
            "Recommendations use a deterministic heuristic.",
            "Currencies are evaluated separately without conversion.",
            "Supplier penalties, interest, and contractual consequences "
            "are not modeled.",
            "Recommendations must be reviewed before payments are changed.",
        ],
    }
