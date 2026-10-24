
import logging

import httpx

logger = logging.getLogger(__name__)


async def fetch_financial_json(
    url: str,
    params: dict | None = None,
    timeout: float = 45.0,
) -> dict | list:
    """Fetch financial JSON and return a safe error object on failure."""
    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

        if not isinstance(data, (dict, list)):
            raise ValueError("Unexpected JSON response type")

        return data

    except httpx.HTTPStatusError as exc:
        logger.warning(
            "Financial API returned HTTP %s",
            exc.response.status_code,
        )
        return {
            "error": (
                f"Financial data request failed with HTTP "
                f"{exc.response.status_code}. "
                "No verified result is available."
            )
        }

    except (httpx.RequestError, TimeoutError):
        logger.exception("Could not reach financial API")
        return {
            "error": (
                "Financial data is temporarily unavailable. "
                "No verified result is available."
            )
        }

    except ValueError:
        logger.exception("Financial API returned invalid JSON")
        return {
            "error": (
                "The financial service returned an invalid response. "
                "No verified result is available."
            )
        }
