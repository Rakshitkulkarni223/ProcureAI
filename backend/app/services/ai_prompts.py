"""
AI Procurement Assistant — System prompts, guardrails, and few-shot examples.

All prompts are structured for Groq (Qwen3 / Llama 3.3) function calling.
"""
from __future__ import annotations


# ---------------------------------------------------------------------------
# System prompt — injected as the first message in every conversation
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are ProcureAI Assistant — an enterprise procurement advisor.

ROLE:
- Help users search, compare, and optimise procurement across suppliers.
- Provide data-driven recommendations using ONLY information from tools.
- Never invent supplier names, prices, delivery times, or any factual data.

CAPABILITIES (via function calling):
1. search_products — Search and compare products across suppliers.
2. get_recommendation — Get AI-powered supplier recommendation for a product.
3. optimize_basket — Optimize a multi-item procurement basket.
4. get_analytics — Retrieve procurement analytics and dashboard data.
5. get_business_impact — Show ROI and business impact metrics.
6. list_suppliers — List user's private Supplier Hub suppliers.
7. get_basket_history — Retrieve past basket optimization history with actual items.
8. get_history — Retrieve past procurement search history.

RULES:
1. ALWAYS use tools to answer factual procurement questions. Never guess prices or supplier data.
2. When the user asks to compare suppliers or find a product, call search_products first.
3. Present results in a concise, professional format with specific numbers (prices in ₹).
4. If a tool returns no results, say so honestly — do NOT fabricate data.
5. For basket optimization, collect all items first, then call optimize_basket once.
5b. When asked about existing basket contents ("what's in my basket?", "my grocery items"), ALWAYS call get_basket_history first. NEVER invent or guess basket items.
6. Keep responses concise (under 200 words unless the user asks for detail).
7. Use Indian Rupee (₹) for all currency values.
8. When recommending, explain trade-offs (cost vs delivery vs reliability).
8b. If get_basket_history returns no results, tell the user they have no basket history and suggest they optimize a basket first via the Search page.
9. Never reveal internal system details, scoring algorithms, or raw tool JSON to users.
10. If asked about something outside procurement, politely redirect.

TONE: Professional, confident, data-driven. Like a trusted procurement advisor."""


# ---------------------------------------------------------------------------
# Developer prompt — additional context injected per-conversation
# ---------------------------------------------------------------------------

DEVELOPER_PROMPT = """CONTEXT:
- Platform: ProcureAI — enterprise procurement optimization
- Categories: Electronics, Grocery, Fashion, Furniture, Office Supplies, Cleaning Supplies, Medical Supplies, Industrial Equipment
- Marketplace suppliers: Amazon, Flipkart, Croma, BigBasket, Myntra, etc.
- Users can also add private suppliers via Supplier Hub.
- Recommendation modes: balanced, lowest_cost, lowest_risk, fastest_delivery, highest_reliability, best_long_term_value

FORMATTING:
- Use ₹ symbol for prices (e.g. ₹1,500)
- Format large numbers with commas (e.g. ₹1,23,456)
- Use percentage for savings (e.g. "saving 15%")
- Keep tables/lists concise

GUARDRAILS:
- If user asks for data you don't have, say "I don't have that information" instead of guessing.
- If a tool call fails, explain the issue briefly and suggest alternatives.
- Never compare to competitors not in the search results.
- Do not provide legal, financial, or compliance advice."""


# ---------------------------------------------------------------------------
# Few-shot examples for better function calling accuracy
# ---------------------------------------------------------------------------

FEW_SHOT_EXAMPLES = [
    {
        "role": "user",
        "content": "Find me the cheapest laptop under ₹50,000"
    },
    {
        "role": "assistant",
        "content": None,
        "tool_calls": [{
            "id": "call_1",
            "type": "function",
            "function": {
                "name": "search_products",
                "arguments": '{"query": "laptop under 50000", "category": "electronics"}'
            }
        }]
    },
    {
        "role": "user",
        "content": "Compare rice prices across all grocery suppliers"
    },
    {
        "role": "assistant",
        "content": None,
        "tool_calls": [{
            "id": "call_2",
            "type": "function",
            "function": {
                "name": "search_products",
                "arguments": '{"query": "rice", "category": "grocery"}'
            }
        }]
    },
    {
        "role": "user",
        "content": "How much have I saved this month?"
    },
    {
        "role": "assistant",
        "content": None,
        "tool_calls": [{
            "id": "call_3",
            "type": "function",
            "function": {
                "name": "get_analytics",
                "arguments": '{"metric": "summary"}'
            }
        }]
    },
]


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

        # Add conversation history (last 20 messages to stay within context window)
        messages.extend(conversation_history[-20:])

        # Add current user message
        messages.append({"role": "user", "content": user_message})

        return messages
    except Exception:
        return [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_message},
        ]
