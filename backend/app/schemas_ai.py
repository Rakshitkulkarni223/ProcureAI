"""
Pydantic schemas for AI Chat API endpoints.
"""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request body for POST /api/ai/chat"""
    message: str = Field(..., min_length=1, max_length=2000, description="User message")
    conversation_id: Optional[str] = Field(None, description="Existing conversation ID (omit to start new)")


class ChatResponse(BaseModel):
    """Response body for POST /api/ai/chat"""
    conversation_id: str
    response: str
    tools_used: list[str] = []
    model: str = ""
    latency_ms: int = 0


class ConversationListItem(BaseModel):
    """Summary of a conversation for listing."""
    id: str
    title: str
    updatedAt: str
    messageCount: int = 0


class ConversationDetail(BaseModel):
    """Full conversation with messages."""
    id: str
    title: str
    messages: list[dict] = []
    createdAt: str
    updatedAt: str


class UpdateTitleRequest(BaseModel):
    """Request body for PATCH /api/ai/conversations/:id"""
    title: str = Field(..., min_length=1, max_length=200)
