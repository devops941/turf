"""Slot & Availability Engine.

Slots are generated per turf per day. Double-booking is prevented by an atomic
conditional update: a slot can only transition OPEN -> HELD by the request that
observes it as OPEN, so two concurrent bookings can never both win.
"""

from datetime import datetime, timedelta, timezone

from app.config import settings
from app.constants import SlotStatus
from app.database import db

TIME_FMT = "%H:%M"


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _to_minutes(value: str) -> int:
    h, m = value.split(":")
    return int(h) * 60 + int(m)


def _to_hhmm(minutes: int) -> str:
    return f"{minutes // 60:02d}:{minutes % 60:02d}"


def build_time_ranges(start: str, end: str, duration: int) -> list[tuple[str, str]]:
    out: list[tuple[str, str]] = []
    cursor = _to_minutes(start)
    limit = _to_minutes(end)
    while cursor + duration <= limit:
        out.append((_to_hhmm(cursor), _to_hhmm(cursor + duration)))
        cursor += duration
    return out


async def release_expired_holds() -> int:
    """Return HELD slots whose TTL elapsed back to OPEN.

    Called lazily before reads/bookings so stale holds never block real users.
    """
    now = _now()
    stale = await db.slot.find_many(
        where={"status": SlotStatus.HELD, "heldUntil": {"lt": now}}
    )
    for slot in stale:
        await db.slot.update(
            where={"id": slot.id},
            data={"status": SlotStatus.OPEN, "heldUntil": None, "heldBy": None},
        )
    return len(stale)


async def generate_slots(
    venue_id: str, date: str, start: str, end: str, duration: int, price: float
) -> list[dict]:
    ranges = build_time_ranges(start, end, duration)
    created = []
    for start_time, end_time in ranges:
        existing = await db.slot.find_first(
            where={"venueId": venue_id, "date": date, "startTime": start_time}
        )
        if existing:
            continue
        slot = await db.slot.create(
            data={
                "venueId": venue_id,
                "date": date,
                "startTime": start_time,
                "endTime": end_time,
                "price": price,
                "status": SlotStatus.OPEN,
            }
        )
        created.append(slot)
    return created


async def list_slots(venue_id: str, date: str) -> list:
    await release_expired_holds()
    return await db.slot.find_many(
        where={"venueId": venue_id, "date": date},
        order={"startTime": "asc"},
    )


async def hold_slot(slot_id: str, user_id: str) -> bool:
    """Atomically transition a slot OPEN -> HELD. Returns False if unavailable."""
    await release_expired_holds()
    now = _now()
    held_until = now + timedelta(minutes=settings.hold_ttl_minutes)

    # Atomic guard: the update only applies while the slot is still OPEN, so a
    # concurrent booking that already flipped it to HELD/BOOKED updates 0 rows.
    result = await db.slot.update_many(
        where={"id": slot_id, "status": SlotStatus.OPEN},
        data={
            "status": SlotStatus.HELD,
            "heldBy": user_id,
            "heldUntil": held_until,
        },
    )
    return result > 0


async def release_slot(slot_id: str) -> None:
    slot = await db.slot.find_unique(where={"id": slot_id})
    if slot and slot.status == SlotStatus.HELD:
        await db.slot.update(
            where={"id": slot_id},
            data={"status": SlotStatus.OPEN, "heldUntil": None, "heldBy": None},
        )


async def mark_booked(slot_id: str) -> None:
    await db.slot.update(
        where={"id": slot_id},
        data={"status": SlotStatus.BOOKED, "heldUntil": None, "heldBy": None},
    )
