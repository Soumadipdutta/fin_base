
from app.routers import copilot


def test_build_copilot_prompt_warns_against_inventing_financial_data():
    prompt = copilot.build_copilot_prompt("")

    assert "Do not invent numbers" in prompt
    assert 'If a financial tool returns an "error" field' in prompt
    assert "Only present figures supported by successful tool results" in prompt


def test_copilot_request_rejects_empty_message():
    import pytest
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        copilot.CopilotChatRequest(message="")


def test_copilot_request_rejects_oversized_message():
    import pytest
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        copilot.CopilotChatRequest(message="x" * 2001)


def test_forecast_normalizer_preserves_api_error():
    error = {
        "error": "Financial data is temporarily unavailable."
    }

    assert copilot.normalize_forecast_response(error) == error


def test_forecast_normalizer_rejects_non_dictionary_response():
    result = copilot.normalize_forecast_response(["invalid"])

    assert "error" in result
    assert "daily_forecast" not in result


def test_forecast_normalizer_rejects_missing_daily_forecast():
    result = copilot.normalize_forecast_response({
        "forecast_start": "2026-10-24",
        "base_currency": "USD",
    })

    assert "error" in result
    assert "daily_forecast" not in result


def test_forecast_normalizer_preserves_valid_forecast():
    forecast = {
        "forecast_start": "2026-10-24",
        "forecast_end": "2026-11-23",
        "base_currency": "USD",
        "daily_forecast": [{"closing_balance": 12000.0}],
        "assumptions": ["No unexpected expenses"],
    }

    assert copilot.normalize_forecast_response(forecast) == forecast




import asyncio


def test_financial_risk_tool_preserves_api_error(monkeypatch):
    async def fake_fetch_financial_json(url, params=None, timeout=45.0):
        assert url.endswith("/companies/1/risks")
        return {"error": "Financial data is temporarily unavailable."}

    monkeypatch.setattr(
        copilot,
        "fetch_financial_json",
        fake_fetch_financial_json,
    )

    tools = copilot.build_financial_tools(company_id=1)

    risk_tool = next(
        item for item in tools
        if item.name == "get_financial_risks"
    )

    result = asyncio.run(risk_tool.ainvoke({}))

    assert result == {
        "error": "Financial data is temporarily unavailable."
    }


def test_simulation_tool_preserves_api_error(monkeypatch):
    async def fake_fetch_financial_json(url, params=None, timeout=45.0):
        assert url.endswith("/companies/1/simulation")
        assert params == {
            "days": 30,
            "simulations": 100,
            "max_delay_days": 7,
            "seed": 42,
        }
        return {"error": "No verified result is available."}

    monkeypatch.setattr(
        copilot,
        "fetch_financial_json",
        fake_fetch_financial_json,
    )

    tools = copilot.build_financial_tools(company_id=1)

    simulation_tool = next(
        item for item in tools
        if item.name == "run_cashflow_simulation"
    )

    result = asyncio.run(simulation_tool.ainvoke({}))

    assert result == {
        "error": "No verified result is available."
    }
