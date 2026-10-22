
from uuid import uuid4

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.conversation import CopilotConversation, CopilotMessage


def create_conversation(db: Session, company_id: int) -> CopilotConversation:
    conversation = CopilotConversation(
        id=str(uuid4()),
        company_id=company_id,
        title="New conversation",
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


def get_conversation(
    db: Session,
    company_id: int,
    conversation_id: str,
) -> CopilotConversation | None:
    return db.scalar(
        select(CopilotConversation).where(
            CopilotConversation.id == conversation_id,
            CopilotConversation.company_id == company_id,
        )
    )


def save_message(
    db: Session,
    conversation_id: str,
    role: str,
    content: str,
) -> CopilotMessage:
    if role not in {"user", "assistant"}:
        raise ValueError("Invalid message role")

    message = CopilotMessage(
        conversation_id=conversation_id,
        role=role,
        content=content,
    )
    db.add(message)

    conversation = db.get(CopilotConversation, conversation_id)
    if conversation is not None and conversation.title == "New conversation":
        if role == "user":
            conversation.title = content[:80]

    db.commit()
    db.refresh(message)
    return message


def get_recent_messages(
    db: Session,
    conversation_id: str,
    limit: int = 12,
) -> list[CopilotMessage]:
    statement = (
        select(CopilotMessage)
        .where(CopilotMessage.conversation_id == conversation_id)
        .order_by(CopilotMessage.created_at.desc(), CopilotMessage.id.desc())
        .limit(limit)
    )

    # Query newest first, then restore chronological order for the LLM.
    return list(reversed(db.scalars(statement).all()))
