
import asyncio

import httpx

from app.services.copilot_api_client import fetch_financial_json


def run_async(coro):
    """Run an async function in a normal pytest test."""
    return asyncio.run(coro)





def make_client_mock(monkeypatch, handler):
    """Replace AsyncClient with an HTTPX mock transport."""
    original_async_client = httpx.AsyncClient
    transport = httpx.MockTransport(handler)

    def create_client(**kwargs):
        kwargs["transport"] = transport
        return original_async_client(**kwargs)

    monkeypatch.setattr(
        "app.services.copilot_api_client.httpx.AsyncClient",
        create_client,
    )


def test_fetch_financial_json_returns_successful_json(monkeypatch):
    def handler(request):
        return httpx.Response(
            200,
            json={"balance": 12000, "currency": "USD"},
        )

    make_client_mock(monkeypatch, handler)

    result = run_async(
        fetch_financial_json("http://test.local/forecast")
    )

    assert result == {"balance": 12000, "currency": "USD"}


def test_fetch_financial_json_handles_http_error(monkeypatch):
    def handler(request):
        return httpx.Response(500, json={"detail": "Internal error"})

    make_client_mock(monkeypatch, handler)

    result = run_async(
        fetch_financial_json("http://test.local/forecast")
    )

    assert "error" in result
    assert "HTTP 500" in result["error"]


def test_fetch_financial_json_handles_network_error(monkeypatch):
    def handler(request):
        raise httpx.ConnectError("Connection refused", request=request)

    make_client_mock(monkeypatch, handler)

    result = run_async(
        fetch_financial_json("http://test.local/forecast")
    )

    assert "error" in result
    assert "temporarily unavailable" in result["error"]


def test_fetch_financial_json_handles_invalid_json(monkeypatch):
    def handler(request):
        return httpx.Response(
            200,
            content=b"not valid json",
            headers={"Content-Type": "application/json"},
        )

    make_client_mock(monkeypatch, handler)

    result = run_async(
        fetch_financial_json("http://test.local/forecast")
    )

    assert "error" in result
    assert "invalid response" in result["error"]


def test_fetch_financial_json_rejects_unexpected_json_type(monkeypatch):
    def handler(request):
        return httpx.Response(200, json="unexpected string")

    make_client_mock(monkeypatch, handler)

    result = run_async(
        fetch_financial_json("http://test.local/forecast")
    )

    assert "error" in result
    assert "invalid response" in result["error"]


def test_fetch_financial_json_passes_query_parameters(monkeypatch):
    def handler(request):
        assert request.url.params["days"] == "30"
        return httpx.Response(200, json={"daily_forecast": []})

    make_client_mock(monkeypatch, handler)

    result = run_async(
        fetch_financial_json(
            "http://test.local/forecast",
            params={"days": 30},
        )
    )

    assert result == {"daily_forecast": []}
