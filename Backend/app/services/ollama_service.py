
import os

from langchain_ollama import ChatOllama

MODEL_NAME = os.getenv("OLLAMA_MODEL", "ministral-3:8b")
OLLAMA_BASE_URL = os.getenv(
    "OLLAMA_BASE_URL",
    "http://127.0.0.1:11434",
)


def get_chat_model() -> ChatOllama:
    """Create the local Ollama chat model."""
    return ChatOllama(
        model=MODEL_NAME,
        base_url=OLLAMA_BASE_URL,
        temperature=0.2,
    )
