"""Pydantic request/response schemas."""

import re
from datetime import datetime
from typing import Annotated, Literal

from pydantic import AfterValidator, BaseModel, Field

RoleLiteral = Literal["ADMIN", "VENUE_OWNER", "USER"]

_EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def _validate_email(value: str) -> str:
    value = value.strip().lower()
    # Deliberately permissive: accepts internal domains such as admin@crm.local.
    if not _EMAIL_RE.match(value):
        raise ValueError("invalid email address")
    return value


Email = Annotated[str, AfterValidator(_validate_email)]


# ------------------------------------------------------------------ auth
class SignupRequest(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    email: Email
    phone: str | None = None
    password: str = Field(min_length=6, max_length=128)
    role: Literal["VENUE_OWNER", "USER"] = "USER"


class LoginRequest(BaseModel):
    email: Email
    password: str


class UserOut(BaseModel):
    id: str
    name: str
    email: str
    phone: str | None = None
    role: str
    status: str
    createdAt: datetime | None = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ----------------------------------------------------------------- venue
class VenueCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str | None = None
    sportTypes: list[str] = Field(min_length=1)
    address: str
    city: str
    state: str | None = None
    pincode: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    images: list[str] = []
    amenities: list[str] = []
    openTime: str = "06:00"
    closeTime: str = "23:00"
    basePrice: float = Field(gt=0)


class VenueUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    sportTypes: list[str] | None = None
    address: str | None = None
    city: str | None = None
    state: str | None = None
    pincode: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    images: list[str] | None = None
    amenities: list[str] | None = None
    openTime: str | None = None
    closeTime: str | None = None
    basePrice: float | None = Field(default=None, gt=0)


class VenueStatusUpdate(BaseModel):
    status: Literal["PENDING", "APPROVED", "SUSPENDED"]


# ------------------------------------------------------------------ slot
class SlotGenerateRequest(BaseModel):
    date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")
    startTime: str = "06:00"
    endTime: str = "23:00"
    durationMinutes: int = Field(default=60, ge=30, le=240)
    price: float | None = Field(default=None, gt=0)


class SlotStatusUpdate(BaseModel):
    status: Literal["OPEN", "BLOCKED"]


# --------------------------------------------------------------- booking
class BookingCreate(BaseModel):
    slotId: str
    # Optional client-side coupon/notes could go here later.


# --------------------------------------------------------------- payment
class GatewayConfigUpdate(BaseModel):
    provider: Literal["RAZORPAY", "STRIPE", "CASHFREE", "SANDBOX"] | None = None
    apiKey: str | None = None
    secretKey: str | None = None
    webhookSecret: str | None = None
    webhookUrl: str | None = None


class SplitUpdate(BaseModel):
    percentage: float = Field(ge=0, le=100)
    scope: Literal["GLOBAL", "VENUE"] = "GLOBAL"
    venueId: str | None = None
    note: str | None = None


class PaymentVerify(BaseModel):
    orderId: str
    paymentId: str | None = None
    signature: str | None = None


# ---------------------------------------------------------------- review
class ReviewCreate(BaseModel):
    bookingId: str
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)
