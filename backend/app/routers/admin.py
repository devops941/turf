"""Admin analytics & user management routes."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.constants import BookingStatus, Role, TransactionStatus, UserStatus, VenueStatus
from app.database import db
from app.deps import require_admin
from app.serializers import public_user, to_dict

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/analytics")
async def analytics(admin=Depends(require_admin)):
    bookings = await db.booking.find_many()
    transactions = await db.transaction.find_many()
    venues = await db.venue.find_many()

    confirmed = [b for b in bookings if b.status in (BookingStatus.CONFIRMED, BookingStatus.COMPLETED)]
    gmv = sum(t.amount for t in transactions if t.status == TransactionStatus.CAPTURED)
    commission = sum(t.adminShare for t in transactions if t.status == TransactionStatus.CAPTURED)

    # Top venues by captured revenue.
    revenue_by_venue: dict[str, float] = {}
    for t in transactions:
        if t.status != TransactionStatus.CAPTURED:
            continue
        booking = await db.booking.find_unique(where={"id": t.bookingId})
        if booking:
            revenue_by_venue[booking.venueId] = revenue_by_venue.get(booking.venueId, 0) + t.amount

    top_venues = []
    for venue_id, revenue in sorted(revenue_by_venue.items(), key=lambda kv: kv[1], reverse=True)[:5]:
        venue = await db.venue.find_unique(where={"id": venue_id})
        top_venues.append(
            {"venueId": venue_id, "name": venue.name if venue else "Unknown", "revenue": round(revenue, 2)}
        )

    total_bookings = len(bookings)
    failed = len([b for b in bookings if b.status == BookingStatus.CANCELLED])
    failed_rate = round((failed / total_bookings) * 100, 2) if total_bookings else 0.0

    return {
        "totalBookings": total_bookings,
        "confirmedBookings": len(confirmed),
        "gmv": round(gmv, 2),
        "commissionEarned": round(commission, 2),
        "totalVenues": len(venues),
        "approvedVenues": len([v for v in venues if v.status == VenueStatus.APPROVED]),
        "pendingVenues": len([v for v in venues if v.status == VenueStatus.PENDING]),
        "failedPaymentRate": failed_rate,
        "topVenues": top_venues,
    }


@router.get("/users")
async def list_users(role: str | None = None, admin=Depends(require_admin)):
    where = {"role": role} if role else {}
    users = await db.user.find_many(where=where, order={"createdAt": "desc"})
    return {"items": [public_user(u) for u in users]}


@router.patch("/users/{user_id}/status")
async def set_user_status(user_id: str, payload: dict, admin=Depends(require_admin)):
    new_status = payload.get("status")
    if new_status not in (UserStatus.ACTIVE, UserStatus.SUSPENDED):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid status")

    user = await db.user.find_unique(where={"id": user_id})
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    if user.role == Role.ADMIN:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot modify another admin")

    updated = await db.user.update(where={"id": user_id}, data={"status": new_status})
    return public_user(updated)


@router.get("/audit-logs")
async def audit_logs(admin=Depends(require_admin)):
    rows = await db.auditlog.find_many(order={"createdAt": "desc"}, take=100)
    return {"items": [to_dict(r) for r in rows]}
