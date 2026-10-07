"""Turf Booking Platform - FastAPI application entrypoint."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import connect_db, db, disconnect_db
from app.routers import admin, auth, bookings, payments, reviews, slots, venues, webhooks
from app.services import split_engine

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger("turf")


async def ensure_defaults() -> None:
    """Seed a global split percentage if none exists."""
    existing = await db.splitsetting.find_first(
        where={"scope": "GLOBAL", "isActive": True}
    )
    if existing is None:
        await split_engine.set_global_split(
            split_engine.DEFAULT_GLOBAL_PERCENTAGE, changed_by="system", note="default"
        )
        log.info("Created default global split percentage (%.2f%%)", split_engine.DEFAULT_GLOBAL_PERCENTAGE)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    await ensure_defaults()
    log.info("Connected to MongoDB and ready")
    yield
    await disconnect_db()


app = FastAPI(
    title="Turf Booking Platform API",
    description=(
        "Multi-role sports turf booking system with dynamic payment-gateway "
        "configuration and automatic split payouts."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(venues.router)
app.include_router(slots.router)
app.include_router(bookings.router)
app.include_router(payments.router)
app.include_router(webhooks.router)
app.include_router(reviews.router)
app.include_router(admin.router)


@app.get("/api/health", tags=["health"])
async def health():
    return {"status": "ok", "service": "turf-booking-api", "version": app.version}


@app.get("/", tags=["health"])
async def root():
    return {
        "service": "Turf Booking Platform API",
        "docs": "/docs",
        "openapi": "/openapi.json",
    }
