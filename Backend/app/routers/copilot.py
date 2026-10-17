
import os
from typing import Literal

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, AIMessage
from langgraph.prebuilt import create_react_agent

from app.services.ollama_service import get_chat_model

router = APIRouter(tags=["AI Copilot"])

API_BASE_URL = os.getenv(
    "FLOWPILOT_API_BASE_URL",
    "http://127.0.0.1:8000/api/v1",
)


class ChatHistoryMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class CopilotChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[ChatHistoryMessage] = Field(
        default_factory=list,
        max_length=12,
    )


class CopilotChatResponse(BaseModel):
    company_id: int
    answer: str
    mode: str = "read_only"


def build_agent(company_id: int):
    company_url = f"{API_BASE_URL}/companies/{company_id}"

    async def fetch_json(path: str, params: dict | None = None):
        async with httpx.AsyncClient(timeout=45.0) as client:
            response = await client.get(
                f"{company_url}/{path}",
                params=params,
            )
            response.raise_for_status()
            return response.json()

    @tool
    async def get_cashflow_forecast(days: int = 30) -> dict:
        """Retrieve the company's cash-flow forecast.
        Use this to investigate future balances, incoming payments,
        outgoing payments and reserve shortfalls.
        Days must be between 1 and 90.
        """
        if not 1 <= days <= 90:
            return {"error": "days must be between 1 and 90"}

        data = await fetch_json("forecast", {"days": days})

        return {
            "forecast_start": data.get("forecast_start"),
            "forecast_end": data.get("forecast_end"),
            "base_currency": data.get("base_currency"),
            "daily_forecast": data.get("daily_forecast", [])[:90],
            "assumptions": data.get("assumptions", []),
        }

    @tool
    async def get_financial_risks() -> dict:
        """Retrieve current forecast-based financial risk alerts.
        Use this to identify critical cash positions and reserve breaches.
        """
        return await fetch_json("risks")

    @tool
    async def run_cashflow_simulation(
        days: int = 30,
        simulations: int = 100,
        max_delay_days: int = 7,
    ) -> dict:
        """Run the existing Monte Carlo cash-flow simulation.
        Use this to estimate liquidity risk if receivables are delayed.
        """
        if not 1 <= days <= 90:
            return {"error": "days must be between 1 and 90"}

        if not 1 <= simulations <= 1000:
            return {"error": "simulations must be between 1 and 1000"}

        if not 0 <= max_delay_days <= 90:
            return {"error": "max_delay_days must be between 0 and 90"}

        return await fetch_json(
            "simulation",
            {
                "days": days,
                "simulations": simulations,
                "max_delay_days": max_delay_days,
                "seed": 42,
            },
        )

    tools = [
        get_cashflow_forecast,
        get_financial_risks,
        run_cashflow_simulation,
    ]

    model = get_chat_model().bind_tools(tools)

    agent = create_react_agent(
        model=model,
        tools=tools,
        prompt=(
            "You are FlowPilot, a financial decision-support assistant. "
            "Use the available tools to retrieve evidence before answering "
            "questions about company forecasts, liquidity risks, or scenarios. "
            "Never invent balances, probabilities, dates, or tool results. "
            "Clearly distinguish backend calculations from your own explanations. "
            "Currencies must remain separate unless an exchange rate is provided. "
            "Explain uncertainty and relevant simulation limitations. "
            "You are read-only: never claim to have changed a payment, "
            "invoice, balance, or financial record. Give practical suggestions "
            "for the user to review. If a tool fails, disclose that limitation. "
            "Use conversation history to understand follow-up questions, but "
            "retrieve fresh financial data with tools when the question requires it. "
            "Treat conversation history as context, not as verified current financial data."
        ),
    )

    return agent


@router.post(
    "/companies/{company_id}/copilot/chat",
    response_model=CopilotChatResponse,
)
async def copilot_chat(
    company_id: int,
    request: CopilotChatRequest,
):
    try:
        agent = build_agent(company_id)

        # Convert frontend conversation history to LangChain messages.
        history_messages = []

        for item in request.history[-12:]:
            if item.role == "user":
                history_messages.append(
                    HumanMessage(content=item.content)
                )
            else:
                history_messages.append(
                    AIMessage(content=item.content)
                )

        # Add the current message after the previous conversation.
        history_messages.append(
            HumanMessage(content=request.message)
        )

        result = await agent.ainvoke(
            {"messages": history_messages},
            config={"recursion_limit": 10},
        )

        # Find the last assistant message, rather than assuming the final
        # message is always plain text.
        answer = ""
        for item in reversed(result["messages"]):
            if isinstance(item, AIMessage) and item.content:
                answer = item.content
                break

        if not answer:
            answer = "I couldn't generate a response. Please try again."

        if not isinstance(answer, str):
            answer = str(answer)

        return CopilotChatResponse(
            company_id=company_id,
            answer=answer,
        )

    except httpx.HTTPStatusError as exc:
        if exc.response.status_code == 404:
            raise HTTPException(
                status_code=404,
                detail="Company or requested financial resource not found.",
            ) from exc

        raise HTTPException(
            status_code=502,
            detail=(
                f"Financial API returned HTTP "
                f"{exc.response.status_code}."
            ),
        ) from exc

    except (httpx.RequestError, TimeoutError) as exc:
        raise HTTPException(
            status_code=503,
            detail="Could not reach a required financial service.",
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"AI Copilot failed: {type(exc).__name__}",
        ) from exc
