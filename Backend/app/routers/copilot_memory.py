
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.memory import CopilotMemory
from app.services.copilot_memory_service import (
    list_memories,
    delete_memory,
)

router = APIRouter(tags=["Copilot Memory"])


class MemoryResponse(BaseModel):
    id: int
    company_id: int
    category: str
    content: str

    model_config = ConfigDict(from_attributes=True)


@router.get(
    "/companies/{company_id}/copilot/memories",
    response_model=list[MemoryResponse],
)
def get_memories(
    company_id: int,
    db: Session = Depends(get_db),
):
    memories = list_memories(db, company_id)
    return memories


@router.delete(
    "/companies/{company_id}/copilot/memories/{memory_id}",
    status_code=204,
)
def remove_memory(
    company_id: int,
    memory_id: int,
    db: Session = Depends(get_db),
):
    deleted = delete_memory(db, company_id, memory_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Memory not found",
        )

    return Response(status_code=204)
