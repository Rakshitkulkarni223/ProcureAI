"""
Pydantic models for Supplier Hub — completely independent from existing schemas.
"""
from typing import Optional, List
from pydantic import BaseModel, Field


SUPPLIER_TYPES = [
    "marketplace", "quick_commerce", "manufacturer", "distributor",
    "wholesaler", "local_vendor", "farmer_fpo", "custom",
]


class SupplierHubCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    supplierType: str = Field(..., min_length=1)
    businessName: Optional[str] = None
    gstNumber: Optional[str] = None
    contactPerson: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    deliveryDays: Optional[int] = Field(None, ge=0, le=365)
    creditPeriod: Optional[int] = Field(None, ge=0, le=365)
    minimumOrderQuantity: Optional[float] = Field(None, ge=0)
    deliveryCharges: Optional[float] = Field(None, ge=0)
    paymentTerms: Optional[str] = None
    reliabilityScore: Optional[float] = Field(None, ge=0, le=10)
    preferredCategories: List[str] = Field(default_factory=list)
    notes: Optional[str] = None
    active: bool = True


class SupplierHubUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    supplierType: Optional[str] = None
    businessName: Optional[str] = None
    gstNumber: Optional[str] = None
    contactPerson: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    country: Optional[str] = None
    deliveryDays: Optional[int] = Field(None, ge=0, le=365)
    creditPeriod: Optional[int] = Field(None, ge=0, le=365)
    minimumOrderQuantity: Optional[float] = Field(None, ge=0)
    deliveryCharges: Optional[float] = Field(None, ge=0)
    paymentTerms: Optional[str] = None
    reliabilityScore: Optional[float] = Field(None, ge=0, le=10)
    preferredCategories: Optional[List[str]] = None
    notes: Optional[str] = None
    active: Optional[bool] = None


class SupplierProductCreate(BaseModel):
    productName: str = Field(..., min_length=1, max_length=200)
    brand: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    currentPrice: Optional[float] = Field(None, ge=0)
    moq: Optional[float] = Field(None, ge=0)
    availability: Optional[str] = None
    catalogId: Optional[str] = None
    notes: Optional[str] = None


class SupplierProductUpdate(BaseModel):
    productName: Optional[str] = Field(None, min_length=1, max_length=200)
    brand: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    currentPrice: Optional[float] = Field(None, ge=0)
    moq: Optional[float] = Field(None, ge=0)
    availability: Optional[str] = None
    catalogId: Optional[str] = None
    notes: Optional[str] = None
