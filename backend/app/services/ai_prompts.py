"""
AI Procurement Assistant — System prompts, guardrails, and few-shot examples.

All prompts are structured for Groq (Qwen3 / Llama 3.3) function calling.
"""
from __future__ import annotations


# ---------------------------------------------------------------------------
# System prompt — injected as the first message in every conversation
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """You are ProcureAI Assistant — an enterprise procurement advisor.
Use ONLY data from tool results. NEVER invent suppliers, prices, or delivery times.

TOOLS:
- search_products — compare products across suppliers
- get_recommendation — AI supplier recommendation
- optimize_basket — optimize multi-item basket
- get_analytics — procurement analytics
- get_business_impact — ROI metrics
- list_suppliers — user's Supplier Hub
- get_basket_history — past basket items
- get_history — past search history

RULES:
1. Only report data from tool results. Never fabricate.
2. optimize_basket: items MUST be a JSON array with "query" and "quantity" ONLY.
   Example: {"category":"grocery","items":[{"query":"rice","quantity":1}]}
3. Basket optimization → ALWAYS call get_basket_history FIRST, merge existing + new items, then optimize_basket.
4. If no basket history, tell user and optimize with only the new items they specified.
5. Multi-category → separate tool calls per category.
6. Greetings → respond briefly, no tools.
7. Use ₹ for all prices. Use human labels ("Lowest Cost" not "lowest_cost").

RESPONSE FORMAT — ALWAYS structure responses like this:

For basket/optimization results:
### Optimized Basket Summary
- **Total Cost:** ₹X,XXX
- **Savings:** ₹X,XXX (XX%)
- **Delivery:** X days
- **Suppliers:** X (names)

| Product | Qty | Supplier | Unit Price | Total |
|---------|-----|----------|------------|-------|
| Item    | 1   | Name     | ₹XXX       | ₹XXX  |

### Insight
- **Risk:** Low/Medium/High — brief reason
- **Action:** one-line recommendation
- **Impact:** projected savings estimate

For search/comparison results:
### Search Results: [Product]

| Supplier | Price | Rating | Delivery |
|----------|-------|--------|----------|
| Name     | ₹XXX  | X.X/5  | X days   |

### Recommendation
**Best Pick:** Supplier at ₹XXX — brief reason.

General rules for ALL responses:
- Use ### headings to separate sections
- Use **bold** for key values (prices, names, metrics)
- Use bullet lists (- item) for summaries
- Use markdown tables (| col |) for 3+ items
- Use --- between major sections
- End with a follow-up question
- Keep it concise and scannable"""


DEVELOPER_PROMPT = """Categories: electronics, grocery, fashion, furniture, office, cleaning, medical, industrial.
Modes: balanced, lowest_cost, lowest_risk, fastest_delivery, highest_reliability, best_long_term_value.
If data is missing from tool results, say "not available". Never guess. Professional tone."""


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
        "content": "Optimize my grocery basket with fruits, sugar, and peanuts"
    },
    {
        "role": "assistant",
        "content": None,
        "tool_calls": [{
            "id": "call_3",
            "type": "function",
            "function": {
                "name": "optimize_basket",
                "arguments": '{"category": "grocery", "items": [{"query": "fruits", "quantity": 1}, {"query": "sugar", "quantity": 1}, {"query": "peanuts", "quantity": 1}]}'
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