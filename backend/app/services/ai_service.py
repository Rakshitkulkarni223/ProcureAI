"""
AI Procurement Assistant — Main orchestrator.

Handles the conversation loop: user message → LLM → tool calls → LLM → response.
Uses Groq (OpenAI-compatible) with function calling on Qwen3 32B / Llama 3.3 70B.
"""
from __future__ import annotations

import json
import re
import time
from datetime import datetime
from typing import Any

from openai import AsyncOpenAI

from app.config import env
from app.services.ai_prompts import SYSTEM_PROMPT, DEVELOPER_PROMPT, is_prompt_injection, build_messages
from app.services.ai_tools import TOOL_DEFINITIONS, execute_tool
from app.services.ai_memory import ConversationMemory


# ---------------------------------------------------------------------------
# Groq client (shared singleton)
# ---------------------------------------------------------------------------
_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    """Return a shared AsyncOpenAI client pointed at Groq."""
    global _client
    try:
        if _client is None:
            if not env.GROQ_API_KEY:
                raise RuntimeError("GROQ_API_KEY not set. Add it to your .env file.")
            _client = AsyncOpenAI(
                api_key=env.GROQ_API_KEY,
                base_url="https://api.groq.com/openai/v1",
            )
        return _client
    except Exception:
        raise


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MAX_TOOL_ROUNDS = 5          # Max tool-call loops per user message
MAX_RESPONSE_TOKENS = 1024   # Max tokens for final response
TOOL_RESULT_MAX_CHARS = 3000 # Truncate tool results to keep within context

# Regex to strip Qwen <think>...</think> chain-of-thought blocks
_THINK_RE = re.compile(r"<think>.*?</think>", re.DOTALL)


def _clean_response(text: str) -> str:
    """Strip <think> blocks and clean up LLM output."""
    try:
        text = _THINK_RE.sub("", text).strip()
        return text
    except Exception:
        return text


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def chat(
    user_id: str,
    message: str,
    conversation_id: str | None = None,
) -> dict[str, Any]:
    """Process a user message through the AI assistant.

    Returns:
        {
            "conversation_id": str,
            "response": str,
            "tools_used": list[str],
            "model": str,
            "latency_ms": int,
        }
    """
    try:
        start = time.time()

        # --- Guardrails ---
        if is_prompt_injection(message):
            return {
                "conversation_id": conversation_id or "",
                "response": "I'm a procurement assistant. I can help you search products, compare suppliers, and optimize procurement. How can I help?",
                "tools_used": [],
                "model": "",
                "latency_ms": 0,
            }

        # --- Conversation memory ---
        if not conversation_id:
            title = await ConversationMemory.generate_title(message)
            conv = await ConversationMemory.create_conversation(user_id, title)
            conversation_id = conv["id"]
        else:
            # Verify conversation belongs to user
            existing = await ConversationMemory.get_conversation(user_id, conversation_id)
            if not existing:
                title = await ConversationMemory.generate_title(message)
                conv = await ConversationMemory.create_conversation(user_id, title)
                conversation_id = conv["id"]

        # Persist user message
        await ConversationMemory.add_message(user_id, conversation_id, "user", content=message)

        # Load conversation history for LLM
        history = await ConversationMemory.get_history_for_llm(user_id, conversation_id)

        # Build full message list (system + few-shot + history + user message)
        # Note: history already includes the user message we just added
        messages = build_messages(
            conversation_history=history[:-1],  # Exclude last (current) message — it's added by build_messages
            user_message=message,
            include_few_shot=len(history) <= 1,
        )

        # --- LLM call with tool-calling loop ---
        client = _get_client()
        model = env.AI_PRIMARY_MODEL
        tools_used: list[str] = []

        for _round in range(MAX_TOOL_ROUNDS):
            try:
                response = await client.chat.completions.create(
                    model=model,
                    messages=messages,
                    tools=TOOL_DEFINITIONS,
                    tool_choice="auto",
                    temperature=env.AI_TEMPERATURE,
                    max_tokens=MAX_RESPONSE_TOKENS,
                )
            except Exception as api_err:
                # Try fallback model
                if model == env.AI_PRIMARY_MODEL and env.AI_FALLBACK_MODEL:
                    model = env.AI_FALLBACK_MODEL
                    try:
                        response = await client.chat.completions.create(
                            model=model,
                            messages=messages,
                            tools=TOOL_DEFINITIONS,
                            tool_choice="auto",
                            temperature=env.AI_TEMPERATURE,
                            max_tokens=MAX_RESPONSE_TOKENS,
                        )
                    except Exception:
                        raise api_err
                else:
                    raise

            choice = response.choices[0]
            assistant_message = choice.message

            # If no tool calls, we have the final response
            if not assistant_message.tool_calls:
                final_text = _clean_response(assistant_message.content or "I couldn't generate a response. Please try again.")

                # Persist assistant response
                await ConversationMemory.add_message(
                    user_id, conversation_id, "assistant", content=final_text
                )

                latency_ms = int((time.time() - start) * 1000)
                return {
                    "conversation_id": conversation_id,
                    "response": final_text,
                    "tools_used": tools_used,
                    "model": model,
                    "latency_ms": latency_ms,
                }

            # --- Execute tool calls ---
            # Add assistant message with tool_calls to messages
            tool_calls_serialized = []
            for tc in assistant_message.tool_calls:
                tool_calls_serialized.append({
                    "id": tc.id,
                    "type": "function",
                    "function": {
                        "name": tc.function.name,
                        "arguments": tc.function.arguments,
                    }
                })

            messages.append({
                "role": "assistant",
                "content": None,
                "tool_calls": tool_calls_serialized,
            })

            # Persist assistant tool-call message
            await ConversationMemory.add_message(
                user_id, conversation_id, "assistant",
                content=None,
                tool_calls=tool_calls_serialized,
            )

            # Execute each tool call
            for tc in assistant_message.tool_calls:
                tool_name = tc.function.name
                tools_used.append(tool_name)

                try:
                    arguments = json.loads(tc.function.arguments)
                except (json.JSONDecodeError, TypeError):
                    arguments = {}

                result = await execute_tool(tool_name, arguments, user_id)

                # Serialize and truncate
                result_str = json.dumps(result, default=str, ensure_ascii=False)
                if len(result_str) > TOOL_RESULT_MAX_CHARS:
                    result_str = result_str[:TOOL_RESULT_MAX_CHARS] + '..."}'

                # Add tool result to messages
                tool_msg = {
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": result_str,
                }
                messages.append(tool_msg)

                # Persist tool result
                await ConversationMemory.add_message(
                    user_id, conversation_id, "tool",
                    content=result_str,
                    tool_call_id=tc.id,
                    name=tool_name,
                )

        # If we exhausted all rounds without a final response
        fallback = "I've gathered the data but ran into complexity. Could you simplify your question?"
        await ConversationMemory.add_message(user_id, conversation_id, "assistant", content=fallback)

        latency_ms = int((time.time() - start) * 1000)
        return {
            "conversation_id": conversation_id,
            "response": fallback,
            "tools_used": tools_used,
            "model": model,
            "latency_ms": latency_ms,
        }

    except Exception as e:
        latency_ms = int((time.time() - start) * 1000) if 'start' in dir() else 0
        error_msg = f"I'm sorry, I encountered an error: {str(e)}"
        return {
            "conversation_id": conversation_id or "",
            "response": error_msg,
            "tools_used": [],
            "model": "",
            "latency_ms": latency_ms,
            "error": str(e),
        }


# ---------------------------------------------------------------------------
# Audit logging (fire-and-forget)
# ---------------------------------------------------------------------------

async def log_audit(user_id: str, conversation_id: str, action: str, details: dict | None = None) -> None:
    """Log AI interactions for audit/compliance purposes."""
    try:
        from app.database import get_db
        db = get_db()
        await db.ai_audit_log.insert_one({
            "userId": user_id,
            "conversationId": conversation_id,
            "action": action,
            "details": details or {},
            "timestamp": datetime.utcnow(),
        })
    except Exception:
        pass  # Audit logging should never break the main flow
