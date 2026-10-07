"""Booking & checkout routes."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.constants import BookingStatus, Role
from app.database import db
from app.deps import get_current_user, require_owner, require_player
from app.schemas import BookingCreate, PaymentVerify
from app.serializers import to_dict
from app.services import payments, slot_engine

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_booking(payload: BookingCreate, user=Depends(require_player)):
    try:
        booking, venue, slot = await payments.create_booking(user.id, payload.slotId)
    except payments.BookingError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc

    order = await payments.create_gateway_order(booking, venue, slot)
    return {
        "booking": to_dict(booking),
        "venue": {"id": venue.id, "name": venue.name},
        "slot": to_dict(slot),
        "order": order,
    }


@router.get("/mine")
async def my_bookings(user=Depends(get_current_user)):
    bookings = await db.booking.find_many(
        where={"userId": user.id}, order={"createdAt": "desc"}
    )
    items = []
    for b in bookings:
        venue = await db.venue.find_unique(where={"id": b.venueId})
        slot = await db.slot.find_unique(where={"id": b.slotId})
        row = to_dict(b)
        row["venue"] = {"id": venue.id, "name": venue.name, "city": venue.city, "images": venue.images} if venue else None
        row["slot"] = to_dict(slot)
        row["reviewed"] = await db.review.find_unique(where={"bookingId": b.id}) is not None
        items.append(row)
    return {"items": items}


@router.get("/venue/{venue_id}")
async def venue_bookings(venue_id: str, user=Depends(require_owner)):
    venue = await db.venue.find_unique(where={"id": venue_id})
    if venue is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Venue not found")
    if user.role != Role.ADMIN and venue.ownerId != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your venue")

    bookings = await db.booking.find_many(
        where={"venueId": venue_id}, order={"createdAt": "desc"}
    )
    items = []
    for b in bookings:
        slot = await db.slot.find_unique(where={"id": b.slotId})
        player = await db.user.find_unique(where={"id": b.userId})
        row = to_dict(b)
        row["slot"] = to_dict(slot)
        row["user"] = {"id": player.id, "name": player.name, "email": player.email} if player else None
        items.append(row)
    return {"items": items}


@router.get("/{booking_id}")
async def get_booking(booking_id: str, user=Depends(get_current_user)):
    booking = await db.booking.find_unique(where={"id": booking_id})
    if booking is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")

    venue = await db.venue.find_unique(where={"id": booking.venueId})
    is_owner = venue is not None and venue.ownerId == user.id
    if user.role != Role.ADMIN and booking.userId != user.id and not is_owner:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed")

    data = to_dict(booking)
    data["venue"] = to_dict(venue) if venue else None
    data["slot"] = to_dict(await db.slot.find_unique(where={"id": booking.slotId}))
    return data


@router.post("/{booking_id}/verify-payment")
async def verify_payment(
    booking_id: str, payload: PaymentVerify, user=Depends(get_current_user)
):
    """Frontend callback after the gateway checkout completes.

    This is a convenience path only: the authoritative confirmation happens in
    the webhook handler. In sandbox mode we confirm here so the demo flow works
    without a real gateway round-trip.
    """
    booking = await db.booking.find_unique(where={"id": booking_id})
    if booking is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    if booking.userId != user.id and user.role != Role.ADMIN:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not allowed")

    from app.services import gateway_config

    config = await gateway_config.get_decrypted_secrets()
    is_sandbox = config.get("provider") == "SANDBOX" or not config.get("configured")

    if not is_sandbox:
        # Never trust a client-side success callback alone for real gateways.
        raise HTTPException(
            status.HTTP_202_ACCEPTED,
            "Awaiting gateway webhook confirmation",
        )

    result = await payments.confirm_booking_payment(
        booking, amount=booking.amount, gateway_payment_id=payload.paymentId or "sbx_pay"
    )
    return {
        "booking": to_dict(result["booking"]),
        "transaction": to_dict(result["transaction"]),
        "alreadyConfirmed": result["alreadyConfirmed"],
    }


@router.post("/{booking_id}/cancel")
async def cancel_booking(booking_id: str, user=Depends(get_current_user)):
    try:
        result = await payments.cancel_booking(booking_id, user.id, user.role)
    except payments.BookingError as exc:
        raise HTTPException(status.HTTP_409_CONFLICT, str(exc)) from exc
    return {
        "booking": to_dict(result["booking"]),
        "refunded": result["refunded"],
        "alreadyCancelled": result["alreadyCancelled"],
    }


@router.post("/{booking_id}/complete")
async def complete_booking(booking_id: str, user=Depends(require_owner)):
    booking = await db.booking.find_unique(where={"id": booking_id})
    if booking is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    venue = await db.venue.find_unique(where={"id": booking.venueId})
    if user.role != Role.ADMIN and (venue is None or venue.ownerId != user.id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your venue")
    if booking.status != BookingStatus.CONFIRMED:
        raise HTTPException(status.HTTP_409_CONFLICT, "Only confirmed bookings can be completed")

    updated = await db.booking.update(
        where={"id": booking_id}, data={"status": BookingStatus.COMPLETED}
    )
    return to_dict(updated)
