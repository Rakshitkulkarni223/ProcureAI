"""
AI Conversation Memory — MongoDB-backed conversation persistence.

Stores conversation history per user so the AI assistant can maintain
context across messages and sessions.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from bson import ObjectId

from app.database import get_db


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _oid(val: str) -> ObjectId:
    """Convert string to ObjectId."""
    try:
        return ObjectId(val)
    except Exception:
        raise ValueError(f"Invalid ObjectId: {val}")


def _conv_to_json(doc: dict) -> dict:
    """Convert a MongoDB conversation doc to JSON-safe dict."""
    try:
        return {
            "id": str(doc["_id"]),
            "userId": str(doc.get("userId", "")),
            "title": doc.get("title", "New conversation"),
            "messages": doc.get("messages", []),
            "metadata": doc.get("metadata", {}),
            "createdAt": doc.get("createdAt", datetime.utcnow()).isoformat(),
            "updatedAt": doc.get("updatedAt", datetime.utcnow()).isoformat(),
        }
    except Exception:
        return {}


# ---------------------------------------------------------------------------
# ConversationMemory service
# ---------------------------------------------------------------------------

class ConversationMemory:
    """MongoDB-backed conversation memory for AI chat."""

    COLLECTION = "ai_conversations"
    MAX_MESSAGES_PER_CONVERSATION = 100
    MAX_CONVERSATIONS_PER_USER = 50

    @staticmethod
    async def create_conversation(user_id: str, title: str = "New conversation") -> dict:
        """Create a new conversation and return its JSON representation."""
        try:
            db = get_db()
            now = datetime.utcnow()
            doc = {
                "userId": _oid(user_id),
                "title": title,
                "messages": [],
                "metadata": {
                    "messageCount": 0,
                    "lastToolsUsed": [],
                    "categories": [],
                },
                "createdAt": now,
                "updatedAt": now,
            }
            result = await db[ConversationMemory.COLLECTION].insert_one(doc)
            doc["_id"] = result.inserted_id

            # Enforce max conversations per user (delete oldest if exceeded)
            try:
                count = await db[ConversationMemory.COLLECTION].count_documents(
                    {"userId": _oid(user_id)}
                )
                if count > ConversationMemory.MAX_CONVERSATIONS_PER_USER:
                    oldest = await db[ConversationMemory.COLLECTION].find(
                        {"userId": _oid(user_id)}
                    ).sort("updatedAt", 1).limit(count - ConversationMemory.MAX_CONVERSATIONS_PER_USER).to_list(length=100)
                    if oldest:
                        ids = [d["_id"] for d in oldest]
                        await db[ConversationMemory.COLLECTION].delete_many({"_id": {"$in": ids}})
            except Exception:
                pass

            return _conv_to_json(doc)
        except Exception:
            raise

    @staticmethod
    async def get_conversation(user_id: str, conversation_id: str) -> Optional[dict]:
        """Retrieve a single conversation by ID (user-scoped)."""
        try:
            db = get_db()
            doc = await db[ConversationMemory.COLLECTION].find_one({
                "_id": _oid(conversation_id),
                "userId": _oid(user_id),
            })
            return _conv_to_json(doc) if doc else None
        except Exception:
            raise

    @staticmethod
    async def list_conversations(user_id: str, limit: int = 20) -> list[dict]:
        """List recent conversations for a user (newest first)."""
        try:
            db = get_db()
            cursor = db[ConversationMemory.COLLECTION].find(
                {"userId": _oid(user_id)},
                {"messages": {"$slice": -1}, "title": 1, "metadata": 1, "createdAt": 1, "updatedAt": 1, "userId": 1},
            ).sort("updatedAt", -1).limit(limit)
            docs = await cursor.to_list(length=limit)
            return [_conv_to_json(d) for d in docs]
        except Exception:
            raise

    @staticmethod
    async def add_message(
        user_id: str,
        conversation_id: str,
        role: str,
        content: str | None = None,
        tool_calls: list[dict] | None = None,
        tool_call_id: str | None = None,
        name: str | None = None,
    ) -> None:
        """Append a message to an existing conversation."""
        try:
            db = get_db()
            now = datetime.utcnow()

            message: dict[str, Any] = {
                "role": role,
                "timestamp": now.isoformat(),
            }
            if content is not None:
                message["content"] = content
            if tool_calls is not None:
                message["tool_calls"] = tool_calls
            if tool_call_id is not None:
                message["tool_call_id"] = tool_call_id
            if name is not None:
                message["name"] = name

            # Update metadata
            update_meta: dict[str, Any] = {"metadata.messageCount": 1}
            set_fields: dict[str, Any] = {"updatedAt": now}

            # Track tools used
            if tool_calls:
                tool_names = [tc.get("function", {}).get("name", "") for tc in tool_calls if tc.get("function")]
                set_fields["metadata.lastToolsUsed"] = tool_names

            await db[ConversationMemory.COLLECTION].update_one(
                {"_id": _oid(conversation_id), "userId": _oid(user_id)},
                {
                    "$push": {"messages": message},
                    "$inc": update_meta,
                    "$set": set_fields,
                },
            )

            # Trim old messages if conversation is too long
            try:
                doc = await db[ConversationMemory.COLLECTION].find_one(
                    {"_id": _oid(conversation_id)},
                    {"messages": 1},
                )
                if doc and len(doc.get("messages", [])) > ConversationMemory.MAX_MESSAGES_PER_CONVERSATION:
                    excess = len(doc["messages"]) - ConversationMemory.MAX_MESSAGES_PER_CONVERSATION
                    await db[ConversationMemory.COLLECTION].update_one(
                        {"_id": _oid(conversation_id)},
                        {"$set": {"messages": doc["messages"][excess:]}},
                    )
            except Exception:
                pass
        except Exception:
            raise

    @staticmethod
    async def update_title(user_id: str, conversation_id: str, title: str) -> None:
        """Update the conversation title."""
        try:
            db = get_db()
            await db[ConversationMemory.COLLECTION].update_one(
                {"_id": _oid(conversation_id), "userId": _oid(user_id)},
                {"$set": {"title": title, "updatedAt": datetime.utcnow()}},
            )
        except Exception:
            raise

    @staticmethod
    async def delete_conversation(user_id: str, conversation_id: str) -> bool:
        """Delete a conversation. Returns True if deleted."""
        try:
            db = get_db()
            result = await db[ConversationMemory.COLLECTION].delete_one({
                "_id": _oid(conversation_id),
                "userId": _oid(user_id),
            })
            return result.deleted_count > 0
        except Exception:
            raise

    @staticmethod
    async def get_history_for_llm(user_id: str, conversation_id: str) -> list[dict]:
        """Get conversation messages formatted for the LLM API.

        Returns messages in OpenAI chat format (role, content, tool_calls, etc.).
        Only includes the last 12 messages to fit context window and cut tokens.
        """
        try:
            db = get_db()
            doc = await db[ConversationMemory.COLLECTION].find_one(
                {"_id": _oid(conversation_id), "userId": _oid(user_id)},
                {"messages": 1},
            )
            if not doc:
                return []

            messages = doc.get("messages", [])[-12:]
            llm_messages = []
            for m in messages:
                msg: dict[str, Any] = {"role": m["role"]}
                if m.get("content") is not None:
                    msg["content"] = m["content"]
                if m.get("tool_calls"):
                    msg["tool_calls"] = m["tool_calls"]
                    if "content" not in msg:
                        msg["content"] = None
                if m.get("tool_call_id"):
                    msg["tool_call_id"] = m["tool_call_id"]
                if m.get("name"):
                    msg["name"] = m["name"]
                llm_messages.append(msg)

            return llm_messages
        except Exception:
            return []

    @staticmethod
    async def generate_title(first_message: str) -> str:
        """Generate a short conversation title from the first user message."""
        try:
            # Simple heuristic: use first 50 chars of the message
            title = first_message.strip()[:50]
            if len(first_message) > 50:
                title += "..."
            return title or "New conversation"
        except Exception:
            return "New conversation"
