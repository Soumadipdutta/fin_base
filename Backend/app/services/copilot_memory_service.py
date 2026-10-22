
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.memory import CopilotMemory
import re

ALLOWED_CATEGORIES = {
    "preference",
    "business_context",
    "workflow",
}


def list_memories(db: Session, company_id: int) -> list[CopilotMemory]:
    statement = (
        select(CopilotMemory)
        .where(CopilotMemory.company_id == company_id)
        .order_by(CopilotMemory.updated_at.desc())
    )
    return list(db.scalars(statement).all())


def save_memory(
    db: Session,
    company_id: int,
    category: str,
    content: str,
) -> CopilotMemory:
    if category not in ALLOWED_CATEGORIES:
        raise ValueError("Unsupported memory category.")

    content = content.strip()
    if not content or len(content) > 1000:
        raise ValueError("Memory must contain 1–1000 characters.")

    existing = db.scalar(
        select(CopilotMemory).where(
            CopilotMemory.company_id == company_id,
            CopilotMemory.category == category,
            CopilotMemory.content == content,
        )
    )

    if existing:
        return existing

    memory = CopilotMemory(
        company_id=company_id,
        category=category,
        content=content,
    )
    db.add(memory)
    db.commit()
    db.refresh(memory)
    return memory


def delete_memory(
    db: Session,
    company_id: int,
    memory_id: int,
) -> bool:
    memory = db.scalar(
        select(CopilotMemory).where(
            CopilotMemory.id == memory_id,
            CopilotMemory.company_id == company_id,
        )
    )

    if memory is None:
        return False

    db.delete(memory)
    db.commit()
    return True


def get_memory_context(
    db: Session,
    company_id: int,
    limit: int = 10,
) -> str:
    memories = list_memories(db, company_id)[:limit]

    if not memories:
        return "No saved long-term memories."

    return "\n".join(
        f"- [{memory.category}] {memory.content}"
        for memory in memories
    )

def extract_explicit_memory(message: str) -> tuple[str, str] | None:
    """Recognize a simple, explicit request to save company memory."""
    match = re.match(
        r"^\s*(?:please\s+)?(?:remember|don't forget)\s+"
        r"(?:that\s+)?(.+?)\s*[.!]?\s*$",
        message,
        flags=re.IGNORECASE,
    )

    if not match:
        return None

    content = match.group(1).strip().rstrip(".!? ")
    if not content or len(content) > 1000:
        return None

    lowered = content.lower()

    if any(word in lowered for word in (
        "prefer", "preference", "likes", "like ",
    )):
        category = "preference"
    elif any(word in lowered for word in (
        "workflow", "process", "usually", "always",
    )):
        category = "workflow"
    else:
        category = "business_context"

    return category, content
