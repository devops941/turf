"""Gateway webhook handler.

The gateway POSTs signed events here. We verify the signature against the
webhook secret and reconcile the booking asynchronously. The confirmation itself
is idempotent, so replayed callbacks are harmless.

The signing secret depends on where the player paid: bookings routed to a venue
owner's own gateway are verified with that venue's webhook secret, everything
else with the platform secret.

This route is intentionally unauthenticated (gateways cannot present a JWT) and
is protected purely by signature verification.
"""

import json
import logging

from fastapi import APIRouter, HTTPException, Request, status

from app.constants import BookingStatus
from app.database import db
from app.services import gateway, payments, venue_gateway

log = logging.getLogger("turf.webhook")

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@router.post("/payment")
async def payment_webhook(request: Request):
    raw_body = await request.body()
    headers = dict(request.headers)

    try:
        event = json.loads(raw_body.decode("utf-8") or "{}")
    except json.JSONDecodeError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid JSON payload") from exc

    event_type = event.get("event") or event.get("type") or "payment.captured"
    order_id = _extract_order_id(event)

    if not order_id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Missing order id in event")

    # Choose the secret that matches where this booking's money was collected.
    resolved = await venue_gateway.resolve_webhook_secret(order_id)
    provider, secret = resolved if resolved else ("SANDBOX", "")

    if not gateway.verify_webhook_signature(provider, raw_body, headers, secret):
        log.warning("Rejected webhook: invalid signature (provider=%s)", provider)
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid webhook signature")

    booking = await db.booking.find_first(where={"orderId": order_id})
    if booking is None:
        # Unknown order - acknowledge so the gateway stops retrying.
        return {"ok": True, "ignored": "unknown_order"}

    if event_type in ("payment.failed", "payment.failure"):
        await payments.cancel_booking(booking.id, booking.userId, "ADMIN")
        return {"ok": True, "bookingId": booking.id, "status": BookingStatus.CANCELLED}

    if event_type in ("refund.processed", "refund.created"):
        await payments.cancel_booking(booking.id, booking.userId, "ADMIN")
        return {"ok": True, "bookingId": booking.id, "status": BookingStatus.REFUNDED}

    amount = _extract_amount(event) or booking.amount
    payment_id = _extract_payment_id(event)

    result = await payments.confirm_booking_payment(
        booking, amount=amount, gateway_payment_id=payment_id
    )
    return {
        "ok": True,
        "bookingId": result["booking"].id,
        "status": result["booking"].status,
        "alreadyConfirmed": result["alreadyConfirmed"],
    }


def _extract_order_id(event: dict) -> str | None:
    if event.get("order_id"):
        return event["order_id"]
    payload = event.get("payload", {})
    entity = payload.get("payment", {}).get("entity", {}) if isinstance(payload, dict) else {}
    return entity.get("order_id") or event.get("orderId")


def _extract_amount(event: dict) -> float | None:
    if event.get("amount") is not None:
        amount = float(event["amount"])
        # Razorpay sends minor units; sandbox sends rupees.
        return amount / 100 if event.get("minor_units") else amount
    payload = event.get("payload", {})
    entity = payload.get("payment", {}).get("entity", {}) if isinstance(payload, dict) else {}
    if entity.get("amount") is not None:
        return float(entity["amount"]) / 100
    return None


def _extract_payment_id(event: dict) -> str | None:
    payload = event.get("payload", {})
    entity = payload.get("payment", {}).get("entity", {}) if isinstance(payload, dict) else {}
    return entity.get("id") or event.get("payment_id")


@router.get("/health")
async def webhook_health():
    config = await gateway_config.get_active_config()
    return {
        "ok": True,
        "provider": config.provider if config else "SANDBOX",
        "configured": config is not None,
    }
