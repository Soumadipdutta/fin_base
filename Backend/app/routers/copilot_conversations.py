
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.conversation import CopilotConversation, CopilotMessage

router = APIRouter(tags=["Copilot Conversations"])


class ConversationResponse(BaseModel):
    id: str
    title: str

    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    id: int
    conversation_id: str
    role: str
    content: str

    model_config = ConfigDict(from_attributes=True)


@router.get(
    "/companies/{company_id}/copilot/conversations",
    response_model=list[ConversationResponse],
)
def list_conversations(
    company_id: int,
    db: Session = Depends(get_db),
):
    statement = (
        select(CopilotConversation)
        .where(CopilotConversation.company_id == company_id)
        .order_by(CopilotConversation.id.desc())
    )

    return list(db.scalars(statement).all())


@router.get(
    "/companies/{company_id}/copilot/conversations/{conversation_id}/messages",
    response_model=list[MessageResponse],
)
def get_conversation_messages(
    company_id: int,
    conversation_id: str,
    db: Session = Depends(get_db),
):
    conversation = db.scalar(
        select(CopilotConversation).where(
            CopilotConversation.id == conversation_id,
            CopilotConversation.company_id == company_id,
        )
    )

    if conversation is None:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    statement = (
        select(CopilotMessage)
        .where(CopilotMessage.conversation_id == conversation_id)
        .order_by(
            CopilotMessage.created_at.asc(),
            CopilotMessage.id.asc(),
        )
    )

    return list(db.scalars(statement).all())
