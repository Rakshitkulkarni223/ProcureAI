"""
LLM Procurement Advisor — Groq-powered natural language explanations.

Generates human-readable AI procurement advice from recommendation data
using Groq API (Qwen 3.6-27B / Llama 3.1-8B). Falls back to template-based
explanation if no API key is set or if the API call fails.
"""
from __future__ import annotations

import asyncio
import re
from openai import AsyncOpenAI

from app.config import env

# ---------------------------------------------------------------------------
# Groq client (lazy init — only created when GROQ_API_KEY is set)
# ---------------------------------------------------------------------------
_groq_client: AsyncOpenAI | None = None


def _get_groq_client() -> AsyncOpenAI | None:
    """Return a shared AsyncOpenAI client pointed at Groq, or None."""
    global _groq_client
    try:
        if not env.GROQ_API_KEY:
            return None
        if _groq_client is None:
            _groq_client = AsyncOpenAI(
                api_key=env.GROQ_API_KEY,
                base_url="https://api.groq.com/openai/v1",
            )
        return _groq_client
    except Exception:
        return None


def _strip_reasoning(text: str) -> str:
    """Remove leaked chain-of-thought / drafting patterns from model output."""
    try:
        if not text:
            return text
        # Reasoning markers that indicate internal planning leaked into output
        reasoning_markers = [
            "Drafting", "Critique:", "Goal:", "Data Points:",
            "Sentence 1", "Sentence 2", "Sentence 3",
            "Focus on", "Let me ", "I need to", "I'll ",
            "Here's my", "Step 1", "Step 2", "Step 3",
        ]
        # If the text contains multiple reasoning markers, it's leaked CoT
        marker_count = sum(1 for m in reasoning_markers if m in text)
        if marker_count >= 2:
            return ""
        # Strip everything before the first actual sentence if garbage prefix exists
        # e.g. "` tags. Content: ..." → strip until we find a proper sentence start
        text = re.sub(r"^[`\s]*tags\.?\s*", "", text).strip()
        text = re.sub(r"^Content:\s*", "", text).strip()
        return text
    except Exception:
        return text


async def _groq_completion(prompt: str, max_tokens: int = 512, model: str | None = None) -> str:
    """Call Groq chat completion. Returns empty string on failure."""
    try:
        client = _get_groq_client()
        if client is None:
            return ""
        chosen_model = model or env.AI_PRIMARY_MODEL
        response = await client.chat.completions.create(
            model=chosen_model,
            messages=[
                {"role": "system", "content": "You are a procurement advisor for ProcureAI. Be professional, concise, and use specific numbers. Never use markdown formatting. Do NOT use <think> tags or any chain-of-thought wrapper. Output ONLY the final answer — never show reasoning, planning, drafting steps, critiques, or internal notes."},
                {"role": "user", "content": prompt},
            ],
            temperature=env.AI_TEMPERATURE,
            max_tokens=max_tokens,
        )
        text = (response.choices[0].message.content or "").strip()
        # Strip Qwen <think>...</think> chain-of-thought blocks (complete)
        text = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()
        # Strip truncated/unclosed <think> blocks (model hit max_tokens before closing)
        text = re.sub(r"<think>.*", "", text, flags=re.DOTALL).strip()
        # Clean up any markdown the model might add
        text = text.replace("**", "").replace("*", "").replace("#", "").strip()
        # Strip leaked chain-of-thought reasoning (no <think> tags but visible planning)
        text = _strip_reasoning(text)
        # If primary model produced only <think> content, retry with fallback
        if not text and model is None and env.AI_FALLBACK_MODEL:
            return await _groq_completion(prompt, max_tokens, model=env.AI_FALLBACK_MODEL)
        return text
    except Exception as e:
        # If primary model fails, try fallback
        if model is None and env.AI_FALLBACK_MODEL:
            try:
                return await _groq_completion(prompt, max_tokens, model=env.AI_FALLBACK_MODEL)
            except Exception:
                pass
        print(f"[WARN] Groq completion failed: {e}")
        return ""


def _format_inr(amount: float) -> str:
    """Format a number as Indian Rupee string."""
    try:
        if amount >= 100_000:
            return f"₹{amount / 100_000:.1f}L"
        if amount >= 1_000:
            return f"₹{amount:,.0f}"
        return f"₹{amount:.0f}"
    except Exception:
        return f"₹{amount}"


def _build_prompt(recommendation: dict, products: list[dict], mode: str) -> str:
    """Build a structured prompt from recommendation data."""
    try:
        best = recommendation.get("product", {})
        supplier = recommendation.get("supplier", "Unknown")
        savings = recommendation.get("estimatedSavings", 0)
        confidence = recommendation.get("confidence", 0)
        factors = recommendation.get("factors", [])
        scoreboard = recommendation.get("scoreboard", [])

        # Build competitor summary
        competitors = []
        for p in products:
            if p["provider"] != supplier:
                competitors.append(
                    f"- {p['provider']}: ₹{p['price']:,.0f}, "
                    f"rating {p.get('rating', 0)}/5, "
                    f"{p.get('deliveryDays', 0)}d delivery"
                )

        competitor_text = "\n".join(competitors[:5]) if competitors else "No other suppliers"

        # Build factor summary
        factor_text = ", ".join(
            f"{f['label']}: {round(f['score'] * 100)}%"
            for f in factors
        ) if factors else "N/A"

        # Mode label mapping
        mode_labels = {
            "balanced": "Balanced (best overall value)",
            "lowest_cost": "Lowest Total Procurement Cost",
            "lowest_risk": "Lowest Procurement Risk",
            "fastest_delivery": "Fastest Delivery",
            "highest_reliability": "Highest Supplier Reliability",
            "best_long_term_value": "Best Long-Term Value",
        }
        mode_label = mode_labels.get(mode, mode)

        prompt = f"""You are a procurement advisor for an enterprise procurement platform called ProcureAI.

Based on the following data, write a concise 2-3 sentence natural language explanation of why this supplier was recommended. Write in a professional, confident tone. Use specific numbers (prices, delivery days, savings). Do NOT use bullet points or markdown formatting — write flowing prose.

PROCUREMENT STRATEGY: {mode_label}

RECOMMENDED SUPPLIER: {supplier}
- Product: {best.get('title', 'N/A')}
- Price: ₹{best.get('price', 0):,.0f}
- Rating: {best.get('rating', 0)}/5
- Delivery: {best.get('deliveryDays', 0)} days
- Discount: {best.get('discount', 0)}%

COMPETING SUPPLIERS:
{competitor_text}

SCORING FACTORS: {factor_text}
ESTIMATED SAVINGS: ₹{savings:,.0f}
AI CONFIDENCE: {round(confidence * 100)}%

Write the explanation now. Keep it under 80 words. Start with the supplier name."""

        return prompt
    except Exception:
        return ""


def _template_fallback(recommendation: dict, products: list[dict], mode: str) -> str:
    """Generate a template-based explanation when Groq is unavailable."""
    try:
        supplier = recommendation.get("supplier", "Unknown")
        best = recommendation.get("product", {})
        price = best.get("price", 0)
        delivery = best.get("deliveryDays", 0)
        savings = recommendation.get("estimatedSavings", 0)
        others = [p for p in products if p["provider"] != supplier]

        # Build first sentence: "{Supplier} is recommended because ..."
        if mode == "lowest_cost":
            first = (f"{supplier} is recommended because it offers the lowest total "
                     f"procurement cost at {_format_inr(price)}")
        elif mode == "lowest_risk":
            first = (f"{supplier} is recommended because it has the lowest procurement "
                     f"risk while maintaining competitive pricing at {_format_inr(price)}")
        elif mode == "fastest_delivery":
            first = (f"{supplier} is recommended for urgent procurement with delivery "
                     f"in {delivery} day{'s' if delivery != 1 else ''} at {_format_inr(price)}")
        elif mode == "highest_reliability":
            first = (f"{supplier} is recommended because it has the highest delivery "
                     f"reliability, minimising supply chain disruptions")
        elif mode == "best_long_term_value":
            first = (f"{supplier} is recommended for long-term procurement due to its "
                     f"strong supplier score and consistent reliability")
        else:
            first = (f"{supplier} is recommended because it offers the best balance of "
                     f"cost ({_format_inr(price)}), {delivery}-day delivery, and reliability")

        # Append savings info
        if savings > 0:
            first += f", saving an estimated {_format_inr(savings)} compared to the most expensive option"
        first += "."

        # Build second sentence: trade-off comparison
        sentences = [first]
        if others:
            cheapest_other = min(others, key=lambda p: p["price"])
            if cheapest_other["price"] < price:
                diff = price - cheapest_other["price"]
                sentences.append(
                    f"Although {cheapest_other['provider']} is {_format_inr(diff)} cheaper, "
                    f"{supplier} provides better overall value considering delivery and reliability."
                )

        return " ".join(sentences)
    except Exception:
        return ""


async def generate_explanation(recommendation: dict, products: list[dict], mode: str = "balanced") -> str:
    """Generate a natural language AI explanation for a procurement recommendation.

    Uses Groq API if GROQ_API_KEY is set, otherwise falls back to template.
    Never raises — returns empty string on failure.
    """
    try:
        prompt = _build_prompt(recommendation, products, mode)
        if not prompt:
            return _template_fallback(recommendation, products, mode)

        if env.GROQ_API_KEY:
            text = await _groq_completion(prompt, max_tokens=512)
            if text:
                return text

        return _template_fallback(recommendation, products, mode)

    except Exception as e:
        print(f"[WARN] LLM explanation failed, using template fallback: {e}")
        try:
            return _template_fallback(recommendation, products, mode)
        except Exception:
            return ""


# ---------------------------------------------------------------------------
# Basket AI Summary
# ---------------------------------------------------------------------------

def _build_basket_prompt(intelligence: dict) -> str:
    """Build a prompt from basket intelligence data."""
    try:
        savings = intelligence.get("savings", {})
        risk = intelligence.get("risk", {})
        delivery = intelligence.get("deliveryWindow", {})
        complexity = intelligence.get("complexity", {})
        consolidation = intelligence.get("consolidationScore", {})
        supplier_dep = intelligence.get("supplierDependency", {})
        dominant = intelligence.get("dominantSupplier")
        supplier_count = intelligence.get("supplierCount", 0)
        ai_score = intelligence.get("aiScore", 0)
        cost_vs_conv = intelligence.get("costVsConvenience", {})
        logistics = intelligence.get("logisticsBreakdown", {})
        total_cost = intelligence.get("totalProcurementCost", 0)
        expected = intelligence.get("expectedSavings", {})

        # Supplier dependency summary
        dep_lines = []
        for supplier, dep in supplier_dep.items():
            if isinstance(dep, dict):
                dep_lines.append(f"- {supplier}: ₹{dep.get('amount', 0):,.0f} ({dep.get('percentage', 0)}%)")

        prompt = f"""You are a procurement advisor for ProcureAI.

The user already sees these metrics in the UI: total cost, savings, risk level, delivery window, complexity, AI score, supplier count. Do NOT repeat these numbers.

Instead, write 3 short actionable insights about this basket that ADD VALUE beyond the metrics. Focus on:
1. A strategic observation (e.g. supplier concentration risk, cost-delivery trade-off)
2. An actionable recommendation (what the buyer should do next)
3. A forward-looking insight (projected impact or what to watch for)

Keep each insight to 1 sentence. Use this format exactly:
INSIGHT: [observation]
ACTION: [recommendation]
OUTLOOK: [forward-looking point]

BASKET DATA:
- Total cost: ₹{total_cost:,.0f} (Products: ₹{intelligence.get('productCost', 0):,.0f} + Logistics: ₹{logistics.get('total', 0):,.0f})
- Suppliers: {supplier_count}, Risk: {risk.get('level', 'Medium')} ({risk.get('score', 50)}/100)
- Savings: ₹{savings.get('amount', 0):,.0f} ({savings.get('percentage', 0)}%)
- Delivery: {delivery.get('latest', 0)} days, Complexity: {complexity.get('level', 'Easy')}
- Consolidation: {consolidation.get('label', 'Good')}, AI Score: {ai_score}/100
- Plan: {cost_vs_conv.get('recommended', 'split')}
- Projected monthly savings: ₹{expected.get('monthly', 0):,.0f}, yearly: ₹{expected.get('yearly', 0):,.0f}
{f'- ⚠ {dominant} has {supplier_dep.get(dominant, {}).get("percentage", 0)}% basket share' if dominant else '- Supplier spend is evenly distributed'}

SUPPLIER DEPENDENCY:
{chr(10).join(dep_lines) if dep_lines else 'Evenly distributed'}

Do NOT use markdown, bullet points, or bold. Write plain text only."""

        return prompt
    except Exception:
        return ""


async def generate_basket_explanation(intelligence: dict) -> str:
    """Generate an AI explanation for basket optimization.

    Uses Groq if available, falls back to deterministic template.
    """
    try:
        existing_summary = intelligence.get("aiSummary", "")

        prompt = _build_basket_prompt(intelligence)
        if not prompt:
            return existing_summary

        if env.GROQ_API_KEY:
            text = await _groq_completion(prompt, max_tokens=512)
            if text:
                return text

        return existing_summary

    except Exception as e:
        print(f"[WARN] Basket summary LLM failed: {e}")
        try:
            return intelligence.get("aiSummary", "")
        except Exception:
            return ""


# ---------------------------------------------------------------------------
# Long-Term Recommendation
# ---------------------------------------------------------------------------

def _build_longterm_prompt(long_term: dict, products: list[dict]) -> str:
    """Build a prompt for long-term recommendation."""
    try:
        supplier = long_term.get("supplier", "Unknown")
        score = long_term.get("longTermScore", 0)
        supplier_score = long_term.get("supplierScore", 0)
        risk_level = long_term.get("riskLevel", "Medium")
        reliability = long_term.get("deliveryReliability", 0)
        total_cost = long_term.get("totalProcurementCost", 0)

        # Competitors
        competitors = []
        for p in products:
            if p["provider"] != supplier:
                competitors.append(
                    f"- {p['provider']}: ₹{p['price']:,.0f}, "
                    f"rating {p.get('rating', 0)}/5, "
                    f"{p.get('deliveryDays', 0)}d delivery"
                )

        competitor_text = "\n".join(competitors[:5]) if competitors else "No other suppliers"

        prompt = f"""You are a procurement advisor for ProcureAI.

Write a concise 2-3 sentence explanation of why this supplier is recommended as a long-term procurement partner. Be professional, use specific numbers. Do NOT use bullet points or markdown — write flowing prose.

RECOMMENDED LONG-TERM PARTNER: {supplier}
- Long-Term Score: {score}/100
- Supplier Score: {supplier_score}/100
- Risk Level: {risk_level}
- Delivery Reliability: {reliability}%
- Total Procurement Cost: ₹{total_cost:,.0f}

COMPETING SUPPLIERS:
{competitor_text}

Write the explanation now. Start with the supplier name."""

        return prompt
    except Exception:
        return ""


async def generate_longterm_explanation(long_term: dict, products: list[dict]) -> str:
    """Generate an AI explanation for long-term recommendation.

    Uses Groq if available, falls back to deterministic template.
    """
    try:
        reasons = long_term.get("reasons", [])
        fallback = " ".join(reasons) if reasons else ""

        prompt = _build_longterm_prompt(long_term, products)
        if not prompt:
            return fallback

        if env.GROQ_API_KEY:
            text = await _groq_completion(prompt, max_tokens=512)
            if text:
                return text

        return fallback

    except Exception as e:
        print(f"[WARN] Long-term LLM failed: {e}")
        try:
            return " ".join(long_term.get("reasons", []))
        except Exception:
            return ""
