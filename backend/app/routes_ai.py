"""
AI Chat API routes — /api/ai/*

Provides endpoints for:
- Chat with the AI assistant (function-calling loop)
- Conversation CRUD (list, get, delete, rename)
- Health check for AI subsystem
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse

from app.auth import get_current_user
from app.schemas_ai import ChatRequest, UpdateTitleRequest
from app.services.ai_service import chat as ai_chat, chat_stream as ai_chat_stream
from app.services.ai_memory import ConversationMemory
from app.config import env

router = APIRouter(prefix="/ai", tags=["AI Assistant"])


def _ok(data):
    """Consistent response wrapper."""
    try:
        return {"success": True, "data": data}
    except Exception:
        return {"success": True, "data": data}


# ---------------------------------------------------------------------------
# Chat
# ---------------------------------------------------------------------------

@router.post("/chat")
async def chat_endpoint(body: ChatRequest, user: dict = Depends(get_current_user)):
    """Send a message to the AI procurement assistant."""
    try:
        result = await ai_chat(
            user_id=user["sub"],
            message=body.message,
            conversation_id=body.conversation_id,
        )
        return _ok(result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/chat/stream")
async def chat_stream_endpoint(body: ChatRequest, user: dict = Depends(get_current_user)):
    """Stream AI assistant response via Server-Sent Events."""
    try:
        return StreamingResponse(
            ai_chat_stream(
                user_id=user["sub"],
                message=body.message,
                conversation_id=body.conversation_id,
            ),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
                "X-Accel-Buffering": "no",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Conversations CRUD
# ---------------------------------------------------------------------------

@router.get("/conversations")
async def list_conversations(
    limit: int = Query(20, ge=1, le=50),
    user: dict = Depends(get_current_user),
):
    """List recent conversations."""
    try:
        conversations = await ConversationMemory.list_conversations(user["sub"], limit)
        return _ok(conversations)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str, user: dict = Depends(get_current_user)):
    """Get a specific conversation with full message history."""
    try:
        conv = await ConversationMemory.get_conversation(user["sub"], conversation_id)
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return _ok(conv)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/conversations/{conversation_id}")
async def update_conversation(
    conversation_id: str,
    body: UpdateTitleRequest,
    user: dict = Depends(get_current_user),
):
    """Rename a conversation."""
    try:
        await ConversationMemory.update_title(user["sub"], conversation_id, body.title)
        return _ok({"message": "Updated"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str, user: dict = Depends(get_current_user)):
    """Delete a conversation."""
    try:
        deleted = await ConversationMemory.delete_conversation(user["sub"], conversation_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return _ok({"message": "Deleted"})
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@router.get("/health")
async def ai_health():
    """Check if the AI subsystem is operational."""
    try:
        groq_configured = bool(env.GROQ_API_KEY)
        return _ok({
            "status": "ok" if groq_configured else "degraded",
            "groq_configured": groq_configured,
            "primary_model": env.AI_PRIMARY_MODEL,
            "fallback_model": env.AI_FALLBACK_MODEL,
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
