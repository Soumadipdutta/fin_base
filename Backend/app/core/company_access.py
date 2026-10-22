
import os

from fastapi import HTTPException


def require_allowed_company(company_id: int) -> int:
    configured_id = os.getenv("FLOWPILOT_ALLOWED_COMPANY_ID")

    if not configured_id:
        raise RuntimeError(
            "FLOWPILOT_ALLOWED_COMPANY_ID is not configured."
        )

    try:
        allowed_id = int(configured_id)
    except ValueError as exc:
        raise RuntimeError(
            "FLOWPILOT_ALLOWED_COMPANY_ID must be an integer."
        ) from exc

    if company_id != allowed_id:
        raise HTTPException(
            status_code=403,
            detail="Access to this company is not allowed.",
        )

    return company_id
