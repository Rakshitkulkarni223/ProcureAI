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
3. Basket optimization → ALWAYS call get_basket_history FIRST (never skip this step). If basket history exists, merge existing + new items, then call optimize_basket. If basket history is empty, inform the user and ask what items they want to optimize.
4. NEVER assume data without calling a tool. Even if you think the user has no history, ALWAYS call the tool to verify.
5. Multi-category → separate tool calls per category.
6. Greetings (hi, hello, thanks) → respond briefly, no tools. For ALL other queries, you MUST call at least one tool.
7. Use ₹ for all prices. Use human labels ("Lowest Cost" not "lowest_cost").

RESPONSE FORMAT — follow these EXACT structures:

FOR BASKET OPTIMIZATION (use this exact layout):

Here is the optimized procurement plan for your [category] basket:

### Optimized Basket Summary
- **Total Cost:** ₹X,XXX
- **Total Savings:** ₹X,XXX
- **Estimated Delivery:** In X days
- **Suppliers Used:** X (supplier names)

### Item Breakdown

| Product | Quantity | Supplier | Unit Price | Total |
|---------|----------|----------|------------|-------|
| Item 1  | 1        | Name     | ₹XXX       | ₹XXX  |
| Item 2  | 2        | Name     | ₹XXX       | ₹XXX  |

### AI Insight & Risk Assessment
- **Risk Level:** High/Medium/Low
- **Observation:** Brief analysis of the optimization result
- **Recommendation:** Actionable next step
- **Projected Impact:** Monthly/annual savings estimate

---

### Try Different AI Strategies
- **Lowest Cost** — Minimize total spend
- **Lowest Risk** — Diversify across multiple suppliers
- **Fastest Delivery** — Prioritize delivery speed
- **Highest Reliability** — Favor most reliable suppliers
- **Best Long-Term Value** — Optimize for sustained savings

Would you like me to re-optimize using a different strategy?

FOR SEARCH/COMPARISON:

### Search Results: [Product]

| Supplier | Price | Rating | Delivery | Key Feature |
|----------|-------|--------|----------|-------------|
| Name     | ₹XXX  | X.X/5  | X days   | Brief note  |

### Recommendation
**Best Pick:** Supplier at **₹XXX** — brief reason.

FORMATTING RULES:
- Use ### headings, **bold** for key values, markdown tables, bullet lists
- Use --- between major sections
- End with a follow-up question or strategy suggestion
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
        "content": "Optimize my grocery basket"
    },
    {
        "role": "assistant",
        "content": None,
        "tool_calls": [{
            "id": "call_3",
            "type": "function",
            "function": {
                "name": "get_basket_history",
                "arguments": '{"category": "grocery", "limit": 1}'
            }
        }]
    },
    {
        "role": "user",
        "content": "Optimize my basket"
    },
    {
        "role": "assistant",
        "content": None,
        "tool_calls": [{
            "id": "call_4",
            "type": "function",
            "function": {
                "name": "get_basket_history",
                "arguments": '{"limit": 5}'
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