"""Split Payment Engine.

Resolves the commission percentage that applies to a booking (per-venue
override wins over the global default) and computes the venue/admin shares.

The percentage is read once at payment-confirmation time and stored on the
transaction record, so a later change to the global percentage never alters the
split of an already-completed booking.
"""

from datetime import datetime, timezone

from app.constants import SplitScope
from app.database import db

DEFAULT_GLOBAL_PERCENTAGE = 10.0


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def get_active_split_percentage(venue_id: str | None = None) -> float:
    """Return the effective commission % for a venue, or the global default."""
    if venue_id:
        override = await db.splitsetting.find_first(
            where={"scope": SplitScope.VENUE, "venueId": venue_id, "isActive": True},
            order={"effectiveFrom": "desc"},
        )
        if override is not None:
            return float(override.percentage)

    global_setting = await db.splitsetting.find_first(
        where={"scope": SplitScope.GLOBAL, "isActive": True},
        order={"effectiveFrom": "desc"},
    )
    if global_setting is not None:
        return float(global_setting.percentage)
    return DEFAULT_GLOBAL_PERCENTAGE


def compute_split(amount: float, split_pct: float) -> tuple[float, float]:
    """Return (venue_share, admin_share) for an amount and commission %."""
    admin_share = round(amount * split_pct / 100, 2)
    venue_share = round(amount - admin_share, 2)
    return venue_share, admin_share


async def set_global_split(percentage: float, changed_by: str | None, note: str | None = None):
    # Deactivate previous global rows so history is preserved but only the
    # newest global setting is "active".
    await db.splitsetting.update_many(
        where={"scope": SplitScope.GLOBAL, "isActive": True},
        data={"isActive": False},
    )
    return await db.splitsetting.create(
        data={
            "scope": SplitScope.GLOBAL,
            "percentage": percentage,
            "effectiveFrom": _now(),
            "isActive": True,
            "changedBy": changed_by,
            "note": note,
        }
    )


async def set_venue_split(
    venue_id: str, percentage: float, changed_by: str | None, note: str | None = None
):
    await db.splitsetting.update_many(
        where={"scope": SplitScope.VENUE, "venueId": venue_id, "isActive": True},
        data={"isActive": False},
    )
    return await db.splitsetting.create(
        data={
            "scope": SplitScope.VENUE,
            "venueId": venue_id,
            "percentage": percentage,
            "effectiveFrom": _now(),
            "isActive": True,
            "changedBy": changed_by,
            "note": note,
        }
    )


async def clear_venue_split(venue_id: str):
    return await db.splitsetting.update_many(
        where={"scope": SplitScope.VENUE, "venueId": venue_id, "isActive": True},
        data={"isActive": False},
    )
