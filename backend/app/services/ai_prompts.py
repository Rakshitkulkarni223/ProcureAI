"""
AI Procurement Assistant — System prompts and guardrails.

Prompts are optimized for Gemini 2.5 Flash function calling: concise, rule-based,
and structure-driven rather than verbose. Response formatting is delegated to the
model via a short output contract instead of long markdown templates.
"""
from __future__ import annotations


# ---------------------------------------------------------------------------
# System prompt — injected as the first message in every conversation
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are ProcureAI, an enterprise procurement intelligence assistant. You help users search products, compare suppliers, optimize baskets, and understand procurement analytics.

CORE RULES
- Use ONLY data returned by tools. Never invent suppliers, prices, ratings, delivery times, savings, or metrics.
- If a value is missing from a tool result, say "Not available". Never guess.
- Never mention tools, functions, APIs, or internal steps. Perform actions silently.
- Show prices in ₹. Use human labels ("Lowest Cost", not "lowest_cost").
- Be concise and business-focused. Always explain WHY you recommend something.

WHEN TO CALL TOOLS
- Greetings or thanks only → reply briefly, no tool.
- Any procurement question → call the relevant tool FIRST, then answer from its result. Never ask for clarification before calling a tool.
- Product search or comparison → search_products. Infer the closest category from the configured categories and map the user's stated priority to the matching recommendation strategy.
- Single supplier recommendation → get_recommendation.
- Supplier questions (best / nearby / quality / ratings) → list_suppliers; rank by reliability_score (highest = best); use city/state for proximity.
- Basket optimization → ALWAYS call get_current_basket first. If it returns items, call optimize_basket with exactly those items. If it is empty, tell the user their basket is empty and ask them to add items on the Search page. get_basket_history contains past optimizations only; never reuse its items. optimize_basket "items" must be an array of {query, quantity} only.
- Analytics → get_analytics. Business impact / ROI → get_business_impact. Past searches → get_history.
- Multiple categories in one request → one tool call per category.

OUTPUT
- Answer in markdown. Include only the sections that apply, in this order: Summary, Comparison (use a table), Recommendation, Business Impact, Next step.
- Use **bold** for key values and tables for comparisons. Keep it scannable — no filler.
- Never repeat information already shown in a table as prose, and never restate the same value twice. Summarize; prefer concise answers over exhaustive ones.
- For empty search results, state only that no matching products were found and suggest a refined query. Do not show a comparison table, recommendation, or business-impact section."""


DEVELOPER_PROMPT = """Categories: electronics, grocery, fashion, furniture, office, cleaning, medical, industrial.
Modes: balanced, lowest_cost, lowest_risk, fastest_delivery, highest_reliability, best_long_term_value.
Priorities: accuracy > correct tool usage > explainability > structure > brevity.
The backend computes every number (totals, savings, scores). Report values exactly as returned — never recalculate. If a field is missing, say "Not available"."""


# ---------------------------------------------------------------------------
# Few-shot examples (disabled — Gemini 2.5 Flash follows the rule-based prompt
# and schema reliably without examples, which also keeps input tokens low).
# ---------------------------------------------------------------------------

FEW_SHOT_EXAMPLES = []


# ---------------------------------------------------------------------------
# Guardrail: detect prompt injection / off-topic
# ---------------------------------------------------------------------------

BLOCKED_PATTERNS = [
    "ignore previous instructions",
    "ignore all instructions",
    "you are now",
    "act as",
    "pretend to be",
    "system prompt",
    "reveal your prompt",
    "override your instructions",
    "jailbreak",
    "DAN mode",
]


def is_prompt_injection(text: str) -> bool:
    """Check if user message contains prompt injection attempts."""
    try:
        lower = text.lower()
        return any(pattern in lower for pattern in BLOCKED_PATTERNS)
    except Exception:
        return False


def build_messages(
    conversation_history: list[dict],
    user_message: str,
    include_few_shot: bool = True,
) -> list[dict]:
    """Assemble the full message list for the Groq API call."""
    try:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT + "\n\n" + DEVELOPER_PROMPT},
        ]

        # Add few-shot examples for first message in conversation
        if include_few_shot and len(conversation_history) == 0:
            messages.extend(FEW_SHOT_EXAMPLES)

        # Add conversation history (last 12 messages to stay within context window)
        messages.extend(conversation_history[-12:])

        # Add current user message
        messages.append({"role": "user", "content": user_message})

        return messages
    except Exception:
        return [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ]