"""Booking, payment-confirmation and cancellation logic."""

import logging
from datetime import datetime, timedelta, timezone

from app.config import settings
from app.constants import BookingStatus, PayoutStatus, SlotStatus, TransactionStatus
from app.database import db
from app.notifications import notify_booking_confirmed
from app.services import gateway, gateway_config, payouts, slot_engine, split_engine

log = logging.getLogger("turf.payments")


def _now() -> datetime:
    return datetime.now(timezone.utc)


class BookingError(Exception):
    pass


async def create_booking(user_id: str, slot_id: str):
    """Place a short-lived hold on a slot and create a PENDING booking.

    Returns (booking, venue, slot). Raises BookingError if the slot is not
    available or the venue is not approved.
    """
    await slot_engine.release_expired_holds()

    slot = await db.slot.find_unique(where={"id": slot_id})
    if slot is None:
        raise BookingError("Slot not found")

    venue = await db.venue.find_unique(where={"id": slot.venueId})
    if venue is None or venue.status != "APPROVED":
        raise BookingError("Venue is not available for booking")

    if not await slot_engine.hold_slot(slot_id, user_id):
        raise BookingError("This slot is no longer available")

    split_pct = await split_engine.get_active_split_percentage(venue.id)
    hold_expires = _now() + timedelta(minutes=settings.hold_ttl_minutes)
    order_id = f"ord_{int(_now().timestamp() * 1000)}_{user_id[-6:]}"

    booking = await db.booking.create(
        data={
            "userId": user_id,
            "venueId": venue.id,
            "slotId": slot.id,
            "orderId": order_id,
            "amount": slot.price,
            "splitPercentage": split_pct,
            "status": BookingStatus.PENDING,
            "holdExpiresAt": hold_expires,
        }
    )
    return booking, venue, slot


async def create_gateway_order(booking, venue, slot) -> dict:
    config = await gateway_config.get_decrypted_secrets()
    order = await gateway.create_order(
        config,
        order_id=booking.orderId,
        amount=booking.amount,
        currency="INR",
        notes={
            "venueId": venue.id,
            "slotId": slot.id,
            "bookingId": booking.id,
            "splitPercentage": str(booking.splitPercentage),
        },
    )
    return order


async def confirm_booking_payment(
    booking,
    *,
    amount: float,
    gateway_payment_id: str | None = None,
) -> dict:
    """Confirm a booking after a verified payment event.

    Idempotent: a booking that is already CONFIRMED is returned unchanged, so
    replayed or duplicate gateway callbacks are ignored.
    """
    fresh = await db.booking.find_unique(where={"id": booking.id})
    if fresh is None:
        raise BookingError("Booking not found")

    if fresh.status == BookingStatus.CONFIRMED:
        txn = await db.transaction.find_unique(where={"bookingId": fresh.id})
        return {"booking": fresh, "transaction": txn, "alreadyConfirmed": True}

    if fresh.status not in (BookingStatus.PENDING,):
        raise BookingError(f"Cannot confirm booking in status {fresh.status}")

    # Split percentage is read at confirmation time from the booking snapshot,
    # which was itself captured at booking time.
    split_pct = float(fresh.splitPercentage)
    venue_share, admin_share = split_engine.compute_split(amount, split_pct)

    transaction = await db.transaction.create(
        data={
            "bookingId": fresh.id,
            "orderId": fresh.orderId,
            "amount": amount,
            "splitPercentage": split_pct,
            "venueShare": venue_share,
            "adminShare": admin_share,
            "status": TransactionStatus.CAPTURED,
            "gatewayPaymentId": gateway_payment_id,
        }
    )

    confirmed = await db.booking.update(
        where={"id": fresh.id},
        data={"status": BookingStatus.CONFIRMED, "confirmedAt": _now()},
    )
    await slot_engine.mark_booked(fresh.slotId)

    await payouts.create_payouts(transaction, confirmed)

    venue = await db.venue.find_unique(where={"id": fresh.venueId})
    user = await db.user.find_unique(where={"id": fresh.userId})
    slot = await db.slot.find_unique(where={"id": fresh.slotId})
    if user and venue and slot:
        await notify_booking_confirmed(
            user.email, venue.name, f"{slot.date} {slot.startTime}-{slot.endTime}", amount
        )

    return {"booking": confirmed, "transaction": transaction, "alreadyConfirmed": False}


async def cancel_booking(booking_id: str, actor_id: str, actor_role: str) -> dict:
    """Cancel a booking honoring a simple policy and refund via the ledger.

    Policy: free cancellation while PENDING (hold released). A CONFIRMED booking
    is refunded in full and its slot reopened, payouts marked FAILED/void.
    """
    booking = await db.booking.find_unique(where={"id": booking_id})
    if booking is None:
        raise BookingError("Booking not found")

    if actor_role != "ADMIN" and booking.userId != actor_id:
        raise BookingError("Not allowed to cancel this booking")

    if booking.status in (BookingStatus.CANCELLED, BookingStatus.REFUNDED):
        return {"booking": booking, "refunded": 0.0, "alreadyCancelled": True}

    refunded = 0.0
    if booking.status == BookingStatus.PENDING:
        await slot_engine.release_slot(booking.slotId)
    elif booking.status == BookingStatus.CONFIRMED:
        refunded = booking.amount
        transaction = await db.transaction.find_unique(where={"bookingId": booking.id})
        if transaction:
            await db.transaction.update(
                where={"id": transaction.id}, data={"status": TransactionStatus.REFUNDED}
            )
            await db.payout.update_many(
                where={"transactionId": transaction.id},
                data={"status": PayoutStatus.FAILED},
            )
        await db.slot.update(
            where={"id": booking.slotId}, data={"status": SlotStatus.OPEN}
        )

    updated = await db.booking.update(
        where={"id": booking.id},
        data={
            "status": BookingStatus.REFUNDED if refunded else BookingStatus.CANCELLED,
            "cancelledAt": _now(),
        },
    )
    return {"booking": updated, "refunded": refunded, "alreadyCancelled": False}
