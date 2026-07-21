"""
Pydantic models for request validation — mirrors the Zod schemas from the
Node.js backend so the API contract stays identical.
"""
from typing import Optional, Literal

from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class RegisterInput(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=128)
    businessType: Optional[str] = None


class LoginInput(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------

class SearchFilters(BaseModel):
    brand: Optional[str] = None
    supplier: Optional[str] = None
    minRating: Optional[float] = Field(None, ge=0, le=5)
    maxPrice: Optional[float] = Field(None, ge=0)
    inStockOnly: Optional[bool] = None


RecommendationMode = Literal[
    "balanced", "lowest_cost", "lowest_risk",
    "fastest_delivery", "highest_reliability", "best_long_term_value",
]


class SearchInput(BaseModel):
    category: str = Field(..., min_length=1)
    suppliers: list[str] = Field(default_factory=list)
    query: str = Field(..., min_length=1)
    sortBy: Optional[Literal["lowest_price", "lowest_total_cost", "highest_rating", "fastest_delivery", "highest_discount"]] = None
    filters: Optional[SearchFilters] = None
    weightProfile: Optional[Literal["balanced", "budget", "urgent", "fast"]] = None
    recommendationMode: Optional[RecommendationMode] = None
    includeSupplierHub: Optional[bool] = True
    userCity: Optional[str] = None


class RecommendationInput(BaseModel):
    products: list[dict] = Field(..., min_length=1)
    weightProfile: Optional[Literal["balanced", "budget", "urgent", "fast"]] = None
    recommendationMode: Optional[RecommendationMode] = None


# ---------------------------------------------------------------------------
# Preferences
# ---------------------------------------------------------------------------

class PreferenceInput(BaseModel):
    defaultCategory: Optional[str] = None
    enabledSuppliers: Optional[list[str]] = None
    sortPreference: Optional[Literal["lowest_price", "lowest_total_cost", "highest_rating", "fastest_delivery", "highest_discount"]] = None
    weightProfile: Optional[Literal["balanced", "budget", "urgent", "fast"]] = None
    businessType: Optional[str] = None
    city: Optional[str] = None


# ---------------------------------------------------------------------------
# Basket
# ---------------------------------------------------------------------------

class BasketItem(BaseModel):
    query: str = Field(..., min_length=1)
    quantity: Optional[int] = Field(None, ge=1, le=999)


class BasketInput(BaseModel):
    category: str = Field(..., min_length=1)
    suppliers: list[str] = Field(default_factory=list)
    items: list[BasketItem] = Field(..., min_length=1)
    weightProfile: Optional[Literal["balanced", "budget", "urgent", "fast"]] = None
    consolidationPenalty: Optional[float] = Field(None, ge=0, le=100000)
    recommendationMode: Optional[RecommendationMode] = None
    includeSupplierHub: Optional[bool] = True
    userCity: Optional[str] = None


class CurrentBasketInput(BaseModel):
    category: str = Field(..., min_length=1)
    items: list[BasketItem] = Field(default_factory=list)
