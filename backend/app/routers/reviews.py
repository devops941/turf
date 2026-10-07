"""Reviews & ratings routes."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.constants import BookingStatus, Role
from app.database import db
from app.deps import require_player
from app.schemas import ReviewCreate
from app.serializers import to_dict

router = APIRouter(prefix="/api/reviews", tags=["reviews"])


async def _recompute_venue_rating(venue_id: str) -> None:
    reviews = await db.review.find_many(where={"venueId": venue_id})
    if not reviews:
        await db.venue.update(where={"id": venue_id}, data={"rating": 0, "reviewCount": 0})
        return
    avg = round(sum(r.rating for r in reviews) / len(reviews), 2)
    await db.venue.update(
        where={"id": venue_id}, data={"rating": avg, "reviewCount": len(reviews)}
    )


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_review(payload: ReviewCreate, user=Depends(require_player)):
    booking = await db.booking.find_unique(where={"id": payload.bookingId})
    if booking is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Booking not found")
    if booking.userId != user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your booking")
    if booking.status not in (BookingStatus.CONFIRMED, BookingStatus.COMPLETED):
        raise HTTPException(status.HTTP_409_CONFLICT, "You can only review a completed booking")

    existing = await db.review.find_unique(where={"bookingId": booking.id})
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "You already reviewed this booking")

    review = await db.review.create(
        data={
            "venueId": booking.venueId,
            "userId": user.id,
            "bookingId": booking.id,
            "rating": payload.rating,
            "comment": payload.comment,
        }
    )
    await _recompute_venue_rating(booking.venueId)
    return to_dict(review)


@router.get("/venue/{venue_id}")
async def venue_reviews(venue_id: str):
    reviews = await db.review.find_many(
        where={"venueId": venue_id}, order={"createdAt": "desc"}
    )
    items = []
    for r in reviews:
        author = await db.user.find_unique(where={"id": r.userId})
        row = to_dict(r)
        row["user"] = {"id": author.id, "name": author.name} if author else None
        items.append(row)
    return {"items": items}
