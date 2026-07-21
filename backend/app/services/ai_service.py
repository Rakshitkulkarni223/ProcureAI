"""
AI Procurement Assistant — Main orchestrator.

Handles the conversation loop: user message → LLM → tool calls → LLM → response.
Uses the configured OpenAI-compatible AI provider with function calling.
"""
from __future__ import annotations

import asyncio
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
# AI client (shared singleton)
# ---------------------------------------------------------------------------
_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    """Return a shared client for the configured OpenAI-compatible provider."""
    global _client
    try:
        if _client is None:
            if not env.AI_API_KEY:
                key_name = "GEMINI_API_KEY" if env.AI_PROVIDER == "gemini" else "GROQ_API_KEY"
                raise RuntimeError(f"{key_name} not set. Add it to your .env file.")
            _client = AsyncOpenAI(
                api_key=env.AI_API_KEY,
                base_url=env.AI_BASE_URL,
                timeout=30.0,
            )
        return _client
    except Exception:
        raise


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

MAX_TOOL_ROUNDS = 3          # Max tool-call loops per user message
MAX_RESPONSE_TOKENS = 4096   # Max tokens for final response
TOOL_RESULT_MAX_CHARS = 3000 # Truncate tool results to keep within context
LLM_CALL_TIMEOUT = 25        # Per-call timeout in seconds (bounds each LLM request)
MAX_TOTAL_TIME = 45          # Total wall-clock budget before bailing out
RETRY_503_MAX = 3            # Max retries on 503/UNAVAILABLE before falling back
RETRY_503_BASE_DELAY = 1.0   # Base delay in seconds for exponential backoff


def _is_503(err: Exception) -> bool:
    """Check if an error is a 503 Service Unavailable or similar transient error."""
    try:
        err_str = str(err).lower()
        return "503" in err_str or "unavailable" in err_str or "overloaded" in err_str or "capacity" in err_str
    except Exception:
        return False


async def _llm_create_with_retry(
    client: AsyncOpenAI,
    model: str,
    messages: list[dict],
    **kwargs,
):
    """Call the LLM with exponential backoff on 503 errors.

    Falls back to the fallback model if the primary model is overloaded
    and retries are exhausted.
    """
    for attempt in range(RETRY_503_MAX):
        try:
            return await asyncio.wait_for(
                client.chat.completions.create(
                    model=model, messages=messages, **kwargs,
                ),
                timeout=LLM_CALL_TIMEOUT,
            )
        except Exception as err:
            if _is_503(err) and attempt < RETRY_503_MAX - 1:
                delay = RETRY_503_BASE_DELAY * (2 ** attempt)
                print(f"[AI] 503 from {model}, retry {attempt + 1}/{RETRY_503_MAX} after {delay:.1f}s")
                await asyncio.sleep(delay)
                continue
            raise

# Regex to strip <think>...</think> chain-of-thought blocks (safety net)
_THINK_CLOSED_RE = re.compile(r"<think>.*?</think>", re.DOTALL)
_THINK_OPEN_RE = re.compile(r"<think>.*", re.DOTALL)


def _clean_response(text: str) -> str:
    """Strip <think> blocks (complete and truncated) and clean up LLM output."""
    try:
        text = _THINK_CLOSED_RE.sub("", text).strip()
        text = _THINK_OPEN_RE.sub("", text).strip()
        return text
    except Exception:
        return text


def _serialize_tool_call(tool_call: Any) -> dict[str, Any]:
    """Serialize a tool call while retaining Gemini-specific metadata."""
    try:
        serialized: dict[str, Any] = {
            "id": tool_call.id,
            "type": "function",
            "function": {
                "name": tool_call.function.name,
                "arguments": tool_call.function.arguments,
            },
        }
        raw_extra = getattr(tool_call, "model_extra", None) or {}
        extra_content = raw_extra.get("extra_content") or getattr(tool_call, "extra_content", None)
        if isinstance(extra_content, dict):
            google = extra_content.get("google")
            if isinstance(google, dict) and google.get("thought_signature"):
                serialized["extra_content"] = extra_content
        return serialized
    except Exception:
        return {
            "id": tool_call.id,
            "type": "function",
            "function": {
                "name": tool_call.function.name,
                "arguments": tool_call.function.arguments,
            },
        }


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

        _llm_kwargs = dict(
            tools=TOOL_DEFINITIONS,
            tool_choice="auto",
            temperature=env.AI_TEMPERATURE,
            top_p=env.AI_TOP_P,
            max_tokens=MAX_RESPONSE_TOKENS,
        )

        for _round in range(MAX_TOOL_ROUNDS):
            # Bail out if total time budget exceeded
            if time.time() - start > MAX_TOTAL_TIME:
                break
            try:
                response = await _llm_create_with_retry(
                    client, model, messages, **_llm_kwargs,
                )
            except Exception as api_err:
                # Try fallback model (including on 503/timeout — fallback is faster)
                if model == env.AI_PRIMARY_MODEL and env.AI_FALLBACK_MODEL:
                    model = env.AI_FALLBACK_MODEL
                    print(f"[AI] Primary model failed ({api_err}), switching to fallback: {model}")
                    try:
                        response = await _llm_create_with_retry(
                            client, model, messages, **_llm_kwargs,
                        )
                    except Exception:
                        raise api_err
                else:
                    raise

            choice = response.choices[0]
            assistant_message = choice.message

            # If no tool calls, we have the final response
            if not assistant_message.tool_calls:
                final_text = _clean_response(assistant_message.content or "")

                # If empty after stripping <think>, retry once with fallback model
                if not final_text and env.AI_FALLBACK_MODEL:
                    try:
                        retry = await _llm_create_with_retry(
                            client, env.AI_FALLBACK_MODEL, messages,
                            tools=TOOL_DEFINITIONS, tool_choice="none",
                            temperature=env.AI_TEMPERATURE, max_tokens=MAX_RESPONSE_TOKENS,
                        )
                        final_text = _clean_response(retry.choices[0].message.content or "")
                    except Exception:
                        pass

                if not final_text:
                    final_text = "I couldn't generate a response. Please try again."

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
            tool_calls_serialized = [
                _serialize_tool_call(tc) for tc in assistant_message.tool_calls
            ]

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

            # Execute all tool calls concurrently
            async def _exec_tool(tc):
                tool_name = tc.function.name
                try:
                    arguments = json.loads(tc.function.arguments)
                except (json.JSONDecodeError, TypeError):
                    arguments = {}
                result = await execute_tool(tool_name, arguments, user_id)
                result_str = json.dumps(result, default=str, ensure_ascii=False)
                if len(result_str) > TOOL_RESULT_MAX_CHARS:
                    result_str = result_str[:TOOL_RESULT_MAX_CHARS] + '..."}'
                return tool_name, tc.id, result_str

            tool_results = await asyncio.gather(
                *[_exec_tool(tc) for tc in assistant_message.tool_calls],
                return_exceptions=True,
            )

            for tc, res in zip(assistant_message.tool_calls, tool_results):
                if isinstance(res, Exception):
                    tool_name = tc.function.name
                    tools_used.append(tool_name)
                    result_str = json.dumps({"error": str(res)})
                else:
                    tool_name, tool_call_id, result_str = res
                    tools_used.append(tool_name)

                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": result_str,
                })

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
        if _is_503(e):
            error_msg = "The AI service is currently experiencing high demand. Please try again in a moment."
        else:
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
# Streaming API
# ---------------------------------------------------------------------------

async def chat_stream(
    user_id: str,
    message: str,
    conversation_id: str | None = None,
):
    """Process a user message and yield SSE events as the response streams.

    Yields JSON-encoded SSE events:
      {"type": "conversation_id", "data": "<id>"}
      {"type": "tool_start", "data": "<tool_name>"}
      {"type": "tool_done", "data": "<tool_name>"}
      {"type": "thinking"}
      {"type": "token", "data": "<text_chunk>"}
      {"type": "done", "data": {"tools_used": [...], "model": "...", "latency_ms": ...}}
      {"type": "error", "data": "<message>"}
    """
    try:
        start = time.time()

        # --- Guardrails ---
        if is_prompt_injection(message):
            fallback = "I'm a procurement assistant. I can help you search products, compare suppliers, and optimize procurement. How can I help?"
            yield _sse_event("conversation_id", conversation_id or "")
            yield _sse_event("token", fallback)
            yield _sse_event("done", {"tools_used": [], "model": "", "latency_ms": 0})
            return

        # --- Conversation memory ---
        if not conversation_id:
            title = await ConversationMemory.generate_title(message)
            conv = await ConversationMemory.create_conversation(user_id, title)
            conversation_id = conv["id"]
        else:
            existing = await ConversationMemory.get_conversation(user_id, conversation_id)
            if not existing:
                title = await ConversationMemory.generate_title(message)
                conv = await ConversationMemory.create_conversation(user_id, title)
                conversation_id = conv["id"]

        yield _sse_event("conversation_id", conversation_id)

        # Persist user message
        await ConversationMemory.add_message(user_id, conversation_id, "user", content=message)

        # Load conversation history
        history = await ConversationMemory.get_history_for_llm(user_id, conversation_id)
        messages = build_messages(
            conversation_history=history[:-1],
            user_message=message,
            include_few_shot=len(history) <= 1,
        )

        # --- LLM call with tool-calling loop ---
        client = _get_client()
        model = env.AI_PRIMARY_MODEL
        tools_used: list[str] = []

        _llm_kwargs = dict(
            tools=TOOL_DEFINITIONS,
            tool_choice="auto",
            temperature=env.AI_TEMPERATURE,
            top_p=env.AI_TOP_P,
            max_tokens=MAX_RESPONSE_TOKENS,
        )

        # ---------- Tool-calling loop (non-streaming to detect tool calls) ----------
        for _round in range(MAX_TOOL_ROUNDS):
            # Bail out if total time budget exceeded
            if time.time() - start > MAX_TOTAL_TIME:
                break
            try:
                response = await _llm_create_with_retry(
                    client, model, messages, **_llm_kwargs,
                )
            except Exception as api_err:
                if model == env.AI_PRIMARY_MODEL and env.AI_FALLBACK_MODEL:
                    model = env.AI_FALLBACK_MODEL
                    print(f"[AI-STREAM] Primary model failed ({api_err}), switching to fallback: {model}")
                    try:
                        response = await _llm_create_with_retry(
                            client, model, messages, **_llm_kwargs,
                        )
                    except Exception:
                        raise api_err
                else:
                    raise

            choice = response.choices[0]
            assistant_message = choice.message

            has_tools = bool(assistant_message.tool_calls)
            has_content = bool(assistant_message.content)
            content_len = len(assistant_message.content or "")
            print(f"[AI-STREAM] Round {_round}: has_tools={has_tools}, has_content={has_content}, content_len={content_len}")

            # No tool calls → we already have the answer from this call
            if not assistant_message.tool_calls:
                break

            # --- Execute tool calls ---
            tool_calls_serialized = [
                _serialize_tool_call(tc) for tc in assistant_message.tool_calls
            ]

            messages.append({
                "role": "assistant",
                "content": None,
                "tool_calls": tool_calls_serialized,
            })

            await ConversationMemory.add_message(
                user_id, conversation_id, "assistant",
                content=None,
                tool_calls=tool_calls_serialized,
            )

            # Yield all tool_start events first
            for tc in assistant_message.tool_calls:
                yield _sse_event("tool_start", tc.function.name)

            # Execute all tool calls concurrently
            async def _exec_tool_stream(tc):
                tool_name = tc.function.name
                try:
                    arguments = json.loads(tc.function.arguments)
                except (json.JSONDecodeError, TypeError):
                    arguments = {}
                result = await execute_tool(tool_name, arguments, user_id)
                result_str = json.dumps(result, default=str, ensure_ascii=False)
                if len(result_str) > TOOL_RESULT_MAX_CHARS:
                    result_str = result_str[:TOOL_RESULT_MAX_CHARS] + '..."}'
                return tool_name, tc.id, result_str

            tool_results = await asyncio.gather(
                *[_exec_tool_stream(tc) for tc in assistant_message.tool_calls],
                return_exceptions=True,
            )

            for tc, res in zip(assistant_message.tool_calls, tool_results):
                if isinstance(res, Exception):
                    tool_name = tc.function.name
                    tools_used.append(tool_name)
                    result_str = json.dumps({"error": str(res)})
                else:
                    tool_name, tool_call_id, result_str = res
                    tools_used.append(tool_name)

                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": result_str,
                })

                await ConversationMemory.add_message(
                    user_id, conversation_id, "tool",
                    content=result_str,
                    tool_call_id=tc.id,
                    name=tool_name,
                )

                yield _sse_event("tool_done", tool_name)

        # ---------- Final response ----------
        # Try to extract text from the loop's last response first.
        final_text = ""
        if not assistant_message.tool_calls and assistant_message.content:
            raw_content = assistant_message.content
            final_text = _clean_response(raw_content)
            if not final_text and raw_content:
                print(f"[AI-STREAM] Response was think-only ({len(raw_content)} chars). Will retry with tool_choice=none.")

        if final_text:
            # Already have a clean answer — yield it immediately (no artificial delay)
            yield _sse_event("token", final_text)
        else:
            # No text yet (think-only response or exhausted tool rounds).
            # Make a single streaming call with tool_choice="none" to force a text answer.
            yield _sse_event("thinking")
            raw_stream = ""
            # Try at most 2 models (primary then fallback) with per-call timeout
            for attempt_model in [model, env.AI_FALLBACK_MODEL]:
                if not attempt_model or final_text:
                    break
                if time.time() - start > MAX_TOTAL_TIME:
                    break
                try:
                    # Retry on 503 with backoff before opening the stream
                    for _retry in range(RETRY_503_MAX):
                        try:
                            stream = await asyncio.wait_for(
                                client.chat.completions.create(
                                    model=attempt_model,
                                    messages=messages,
                                    tools=TOOL_DEFINITIONS,
                                    temperature=env.AI_TEMPERATURE,
                                    max_tokens=MAX_RESPONSE_TOKENS,
                                    tool_choice="none",
                                    stream=True,
                                ),
                                timeout=LLM_CALL_TIMEOUT,
                            )
                            break
                        except Exception as stream_err:
                            if _is_503(stream_err) and _retry < RETRY_503_MAX - 1:
                                await asyncio.sleep(RETRY_503_BASE_DELAY * (2 ** _retry))
                                continue
                            raise
                    async for chunk in stream:
                        delta = chunk.choices[0].delta if chunk.choices else None
                        if not delta or not delta.content:
                            continue
                        raw_stream += delta.content
                        # Buffer-based think stripping: only yield text outside <think> blocks
                        cleaned = _clean_response(raw_stream)
                        new_chars = cleaned[len(final_text):]
                        if new_chars:
                            final_text = cleaned
                            yield _sse_event("token", new_chars)
                    # Final clean pass
                    final_text = _clean_response(raw_stream).strip()
                    if final_text:
                        break
                except Exception:
                    continue

            # Last resort: single non-streaming fallback with timeout
            if not final_text and env.AI_FALLBACK_MODEL and (time.time() - start <= MAX_TOTAL_TIME):
                try:
                    fb = await _llm_create_with_retry(
                        client, env.AI_FALLBACK_MODEL, messages,
                        tools=TOOL_DEFINITIONS, tool_choice="none",
                        temperature=env.AI_TEMPERATURE, max_tokens=MAX_RESPONSE_TOKENS,
                    )
                    final_text = _clean_response(fb.choices[0].message.content or "").strip()
                    if final_text:
                        yield _sse_event("token", final_text)
                except Exception:
                    pass

        if not final_text:
            final_text = "I couldn't generate a response. Please try again."
            yield _sse_event("token", final_text)

        # Persist and finish
        await ConversationMemory.add_message(
            user_id, conversation_id, "assistant", content=final_text
        )
        latency_ms = int((time.time() - start) * 1000)
        yield _sse_event("done", {
            "tools_used": tools_used,
            "model": model,
            "latency_ms": latency_ms,
        })

    except Exception as e:
        if _is_503(e):
            yield _sse_event("token", "The AI service is currently experiencing high demand. Please try again in a moment.")
            yield _sse_event("done", {"tools_used": [], "model": "", "latency_ms": 0})
        else:
            yield _sse_event("error", str(e))


def _sse_event(event_type: str, data: Any = None) -> str:
    """Format an SSE event line."""
    try:
        payload = {"type": event_type}
        if data is not None:
            payload["data"] = data
        return f"data: {json.dumps(payload, default=str, ensure_ascii=False)}\n\n"
    except Exception:
        return f"data: {json.dumps({'type': 'error', 'data': 'Serialization error'})}\n\n"


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
