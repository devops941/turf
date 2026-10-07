"""Slot & availability routes."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.constants import Role, SlotStatus
from app.database import db
from app.deps import require_owner
from app.schemas import SlotGenerateRequest, SlotStatusUpdate
from app.serializers import to_dict
from app.services import slot_engine

router = APIRouter(prefix="/api", tags=["slots"])


@router.get("/venues/{venue_id}/slots")
async def list_venue_slots(venue_id: str, date: str):
    venue = await db.venue.find_unique(where={"id": venue_id})
    if venue is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Venue not found")
    slots = await slot_engine.list_slots(venue_id, date)
    return {"date": date, "venueId": venue_id, "items": [to_dict(s) for s in slots]}


@router.post("/venues/{venue_id}/slots/generate")
async def generate_slots(
    venue_id: str, payload: SlotGenerateRequest, user=Depends(require_owner)
):
    venue = await db.venue.find_unique(where={"id": venue_id})
    if venue is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Venue not found")
    if user.role != Role.ADMIN and venue.ownerId != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your venue")

    price = payload.price or venue.basePrice
    created = await slot_engine.generate_slots(
        venue_id=venue_id,
        date=payload.date,
        start=payload.startTime,
        end=payload.endTime,
        duration=payload.durationMinutes,
        price=price,
    )
    return {"created": len(created), "items": [to_dict(s) for s in created]}


@router.patch("/slots/{slot_id}/status")
async def update_slot_status(
    slot_id: str, payload: SlotStatusUpdate, user=Depends(require_owner)
):
    slot = await db.slot.find_unique(where={"id": slot_id})
    if slot is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Slot not found")

    venue = await db.venue.find_unique(where={"id": slot.venueId})
    if user.role != Role.ADMIN and (venue is None or venue.ownerId != user.id):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your venue")

    if slot.status == SlotStatus.BOOKED:
        raise HTTPException(status.HTTP_409_CONFLICT, "Booked slots cannot be changed")

    updated = await db.slot.update(
        where={"id": slot_id},
        data={"status": payload.status, "heldUntil": None, "heldBy": None},
    )
    return to_dict(updated)
