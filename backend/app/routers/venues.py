"""Venue & Turf Management routes.

Venue Owners manage their own turfs; Admins approve/suspend them. Users browse
only APPROVED venues.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.constants import Role, VenueStatus
from app.database import db
from app.deps import get_current_user, require_admin, require_owner
from app.schemas import VenueCreate, VenueStatusUpdate, VenueUpdate
from app.serializers import to_dict

router = APIRouter(prefix="/api/venues", tags=["venues"])


async def _owned_venue_or_404(venue_id: str, user):
    venue = await db.venue.find_unique(where={"id": venue_id})
    if venue is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Venue not found")
    if user.role != Role.ADMIN and venue.ownerId != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your venue")
    return venue


# ------------------------------------------------------------- public browse
@router.get("")
async def list_venues(
    city: str | None = None,
    sport: str | None = None,
    minPrice: float | None = None,
    maxPrice: float | None = None,
    minRating: float | None = None,
    q: str | None = None,
    sort: str = Query("rating", pattern="^(rating|price_asc|price_desc|newest)$"),
    page: int = 1,
    limit: int = 24,
):
    where: dict = {"status": VenueStatus.APPROVED}
    if city:
        where["city"] = {"equals": city, "mode": "insensitive"}
    if sport:
        where["sportTypes"] = {"has": sport}
    if minPrice is not None or maxPrice is not None:
        price_filter: dict = {}
        if minPrice is not None:
            price_filter["gte"] = minPrice
        if maxPrice is not None:
            price_filter["lte"] = maxPrice
        where["basePrice"] = price_filter
    if minRating is not None:
        where["rating"] = {"gte": minRating}
    if q:
        where["OR"] = [
            {"name": {"contains": q, "mode": "insensitive"}},
            {"city": {"contains": q, "mode": "insensitive"}},
            {"address": {"contains": q, "mode": "insensitive"}},
        ]

    order = {
        "rating": {"rating": "desc"},
        "price_asc": {"basePrice": "asc"},
        "price_desc": {"basePrice": "desc"},
        "newest": {"createdAt": "desc"},
    }[sort]

    skip = max(page - 1, 0) * limit
    venues = await db.venue.find_many(
        where=where, order=order, skip=skip, take=limit
    )
    total = await db.venue.count(where=where)
    return {"items": [to_dict(v) for v in venues], "total": total, "page": page, "limit": limit}


@router.get("/meta/cities")
async def list_cities():
    venues = await db.venue.find_many(where={"status": VenueStatus.APPROVED})
    cities = sorted({v.city for v in venues if v.city})
    return {"cities": cities}


@router.get("/mine")
async def my_venues(user=Depends(require_owner)):
    venues = await db.venue.find_many(
        where={"ownerId": user.id}, order={"createdAt": "desc"}
    )
    return {"items": [to_dict(v) for v in venues]}


@router.get("/{venue_id}")
async def get_venue(venue_id: str):
    venue = await db.venue.find_unique(where={"id": venue_id})
    if venue is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Venue not found")
    owner = await db.user.find_unique(where={"id": venue.ownerId})
    data = to_dict(venue)
    data["owner"] = {"id": owner.id, "name": owner.name} if owner else None
    return data


# --------------------------------------------------------------- owner CRUD
@router.post("", status_code=status.HTTP_201_CREATED)
async def create_venue(payload: VenueCreate, user=Depends(require_owner)):
    venue = await db.venue.create(
        data={
            **payload.model_dump(),
            "ownerId": user.id,
            "status": VenueStatus.PENDING,
        }
    )
    return to_dict(venue)


@router.patch("/{venue_id}")
async def update_venue(venue_id: str, payload: VenueUpdate, user=Depends(require_owner)):
    await _owned_venue_or_404(venue_id, user)
    data = {k: v for k, v in payload.model_dump(exclude_unset=True).items() if v is not None}
    venue = await db.venue.update(where={"id": venue_id}, data=data)
    return to_dict(venue)


@router.delete("/{venue_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_venue(venue_id: str, user=Depends(require_owner)):
    await _owned_venue_or_404(venue_id, user)
    await db.venue.delete(where={"id": venue_id})
    return None


# ------------------------------------------------------------ admin approval
@router.get("/admin/all")
async def admin_list_venues(
    status_filter: str | None = Query(None, alias="status"),
    admin=Depends(require_admin),
):
    where = {"status": status_filter} if status_filter else {}
    venues = await db.venue.find_many(where=where, order={"createdAt": "desc"})
    items = []
    for v in venues:
        owner = await db.user.find_unique(where={"id": v.ownerId})
        row = to_dict(v)
        row["owner"] = {"id": owner.id, "name": owner.name, "email": owner.email} if owner else None
        items.append(row)
    return {"items": items}


@router.patch("/{venue_id}/status")
async def set_venue_status(
    venue_id: str, payload: VenueStatusUpdate, admin=Depends(require_admin)
):
    venue = await db.venue.find_unique(where={"id": venue_id})
    if venue is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Venue not found")
    updated = await db.venue.update(
        where={"id": venue_id}, data={"status": payload.status}
    )
    await db.auditlog.create(
        data={
            "actorId": admin.id,
            "action": "VENUE_STATUS_CHANGED",
            "entity": "venue",
            "entityId": venue_id,
            "details": f"{venue.status} -> {payload.status}",
        }
    )
    return to_dict(updated)
