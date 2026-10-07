"""Seed the database with an admin, sample owners, venues, slots and settings.

Run:  python -m app.seed
"""

import asyncio
from datetime import datetime, timedelta, timezone

from app.config import settings
from app.constants import Role, SlotStatus, UserStatus, VenueStatus
from app.database import connect_db, db, disconnect_db
from app.security import hash_password
from app.services import slot_engine, split_engine, venue_gateway

IMG = "https://images.unsplash.com/photo-{}?auto=format&fit=crop&w=1200&q=70"


def _today(offset: int = 0) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=offset)).strftime("%Y-%m-%d")


async def upsert_user(name, email, password, role, phone=None):
    existing = await db.user.find_unique(where={"email": email})
    if existing:
        return existing
    return await db.user.create(
        data={
            "name": name,
            "email": email,
            "phone": phone,
            "passwordHash": hash_password(password),
            "role": role,
            "status": UserStatus.ACTIVE,
        }
    )


async def seed():
    await connect_db()

    admin = await upsert_user(
        "Platform Admin", settings.admin_email, settings.admin_password, Role.ADMIN
    )
    owner1 = await upsert_user(
        "Ravi Kumar", "owner@turf.local", "Owner@123", Role.VENUE_OWNER, "+91 90000 11111"
    )
    owner2 = await upsert_user(
        "Sneha Patil", "owner2@turf.local", "Owner@123", Role.VENUE_OWNER, "+91 90000 22222"
    )
    player = await upsert_user(
        "Arjun Sharma", "player@turf.local", "Player@123", Role.USER, "+91 90000 33333"
    )

    await split_engine.set_global_split(10.0, admin.id, "initial default")

    venues_data = [
        {
            "ownerId": owner1.id,
            "name": "Greenfield Arena",
            "description": "Premium 5-a-side football turf with FIFA-approved synthetic grass and floodlights.",
            "sportTypes": ["Football", "Futsal", "Cricket"],
            "address": "12 MG Road, Indiranagar",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560038",
            "latitude": 12.9719,
            "longitude": 77.6412,
            "images": [IMG.format("1579952363873-27f3bade9f55"), IMG.format("1459865264687-595d652de67e")],
            "amenities": ["Floodlights", "Changing Room", "Parking", "Drinking Water", "Washroom"],
            "openTime": "06:00",
            "closeTime": "23:00",
            "basePrice": 1200.0,
            "rating": 4.6,
            "reviewCount": 128,
            "status": VenueStatus.APPROVED,
        },
        {
            "ownerId": owner1.id,
            "name": "SmashPoint Badminton",
            "description": "Air-conditioned indoor badminton courts with wooden flooring and pro nets.",
            "sportTypes": ["Badminton", "Table Tennis"],
            "address": "45 Koramangala 5th Block",
            "city": "Bengaluru",
            "state": "Karnataka",
            "pincode": "560095",
            "latitude": 12.9352,
            "longitude": 77.6245,
            "images": [IMG.format("1626224583764-f87db24ac4ea")],
            "amenities": ["AC", "Floodlights", "Parking", "Equipment Rental"],
            "openTime": "07:00",
            "closeTime": "22:00",
            "basePrice": 400.0,
            "rating": 4.3,
            "reviewCount": 74,
            "status": VenueStatus.APPROVED,
        },
        {
            "ownerId": owner2.id,
            "name": "TurfNation Cricket Hub",
            "description": "Box cricket and football ground with practice nets and night lighting.",
            "sportTypes": ["Cricket", "Football"],
            "address": "8 Baner Road",
            "city": "Pune",
            "state": "Maharashtra",
            "pincode": "411045",
            "latitude": 18.5590,
            "longitude": 73.7868,
            "images": [IMG.format("1531415074968-036ba1b575da")],
            "amenities": ["Floodlights", "Parking", "Cafeteria", "Washroom"],
            "openTime": "06:00",
            "closeTime": "23:30",
            "basePrice": 1000.0,
            "rating": 4.1,
            "reviewCount": 52,
            "status": VenueStatus.APPROVED,
        },
        {
            "ownerId": owner2.id,
            "name": "Ace Tennis Club",
            "description": "Two clay courts with coaching available on weekends. Pending admin approval.",
            "sportTypes": ["Tennis"],
            "address": "22 Aundh Road",
            "city": "Pune",
            "state": "Maharashtra",
            "pincode": "411007",
            "latitude": 18.5586,
            "longitude": 73.8077,
            "images": [IMG.format("1595435934249-5df7ed86e1c0")],
            "amenities": ["Floodlights", "Coaching", "Parking"],
            "openTime": "06:00",
            "closeTime": "21:00",
            "basePrice": 600.0,
            "rating": 0.0,
            "reviewCount": 0,
            "status": VenueStatus.PENDING,
        },
    ]

    created_venues = []
    for data in venues_data:
        existing = await db.venue.find_first(where={"name": data["name"]})
        if existing:
            created_venues.append(existing)
            continue
        created_venues.append(await db.venue.create(data=data))

    # Generate slots for the next 3 days for each approved venue.
    for venue in created_venues:
        if venue.status != VenueStatus.APPROVED:
            continue
        for offset in range(0, 3):
            await slot_engine.generate_slots(
                venue_id=venue.id,
                date=_today(offset),
                start=venue.openTime,
                end=venue.closeTime,
                duration=60,
                price=venue.basePrice,
            )

    # A per-venue override example: 15% commission for TurfNation.
    cricket = next((v for v in created_venues if v.name == "TurfNation Cricket Hub"), None)
    if cricket:
        await split_engine.set_venue_split(cricket.id, 15.0, admin.id, "partnership rate")

    # Demo: connect the first owner's own gateway on their first venue. Players
    # pay into it and the platform share is routed out. The other venue keeps
    # falling back to the platform gateway, so both paths are demonstrable.
    owner1_venues = [v for v in created_venues if v.ownerId == owner1.id]
    if owner1_venues:
        demo_venue = owner1_venues[0]
        await venue_gateway.upsert_config(
            demo_venue.id,
            owner1.id,
            provider="SANDBOX",
            api_key="owner_demo_public_key",
            secret_key="owner_demo_secret_key",
            webhook_secret="owner_demo_webhook_secret",
            platform_account_id="platform_demo_account",
            is_active=True,
        )

    print("\nSeed complete.")
    print(f"  Admin        : {admin.email} / {settings.admin_password}")
    print("  Venue owner  : owner@turf.local / Owner@123")
    print("  Venue owner 2: owner2@turf.local / Owner@123")
    print(f"  Player       : player@turf.local / Player@123")
    print(f"  Venues       : {len(created_venues)} ({len([v for v in created_venues if v.status == VenueStatus.APPROVED])} approved)")

    await disconnect_db()


if __name__ == "__main__":
    asyncio.run(seed())
