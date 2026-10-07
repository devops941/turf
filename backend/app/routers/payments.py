"""Admin payment configuration, split control, transactions and payouts."""

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.config import settings
from app.constants import GatewayProvider, PayoutStatus, Role, SplitScope
from app.database import db
from app.deps import require_admin, require_owner
from app.encryption import mask
from app.schemas import GatewayConfigUpdate, SplitUpdate
from app.serializers import to_dict
from app.services import gateway, gateway_config, payouts, split_engine

router = APIRouter(prefix="/api/payments", tags=["payments"])


# -------------------------------------------------------- gateway config (admin)
@router.get("/gateway-config")
async def get_gateway_config(admin=Depends(require_admin)):
    config = await gateway_config.get_active_config()
    if config is None:
        return {
            "provider": GatewayProvider.SANDBOX,
            "apiKey": "",
            "secretKeyMasked": "",
            "webhookSecretMasked": "",
            "webhookUrl": settings.webhook_url,
            "isActive": False,
            "lastTestedAt": None,
            "lastTestStatus": None,
            "hasSecretKey": False,
            "hasWebhookSecret": False,
        }

    secrets = await gateway_config.get_decrypted_secrets()
    return {
        "provider": config.provider,
        "apiKey": config.apiKey,
        "secretKeyMasked": mask(secrets["secret_key"]),
        "webhookSecretMasked": mask(secrets["webhook_secret"]),
        "webhookUrl": config.webhookUrl or settings.webhook_url,
        "isActive": config.isActive,
        "lastTestedAt": config.lastTestedAt.isoformat() if config.lastTestedAt else None,
        "lastTestStatus": config.lastTestStatus,
        "hasSecretKey": bool(secrets["secret_key"]),
        "hasWebhookSecret": bool(secrets["webhook_secret"]),
    }


@router.put("/gateway-config")
async def update_gateway_config(payload: GatewayConfigUpdate, admin=Depends(require_admin)):
    if payload.provider and payload.provider not in GatewayProvider.ALL:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Unsupported provider")

    # Empty strings mean "leave unchanged"; send a value to rotate.
    await gateway_config.upsert_config(
        provider=payload.provider,
        api_key=payload.apiKey,
        secret_key=payload.secretKey or None,
        webhook_secret=payload.webhookSecret or None,
        webhook_url=payload.webhookUrl or None,
    )
    await db.auditlog.create(
        data={
            "actorId": admin.id,
            "action": "GATEWAY_CONFIG_UPDATED",
            "entity": "gateway_config",
            "details": f"provider={payload.provider or 'unchanged'}",
        }
    )
    return await get_gateway_config(admin)


@router.post("/gateway-config/test")
async def test_gateway_config(admin=Depends(require_admin)):
    config = await gateway_config.get_decrypted_secrets()
    result = await gateway.test_credentials(config)
    await gateway_config.record_test_result("OK" if result["ok"] else "FAILED")
    return result


# ------------------------------------------------------------ split control
@router.get("/split")
async def get_split_settings(admin=Depends(require_admin)):
    global_pct = await split_engine.get_active_split_percentage()
    global_row = await db.splitsetting.find_first(
        where={"scope": SplitScope.GLOBAL, "isActive": True},
        order={"effectiveFrom": "desc"},
    )
    overrides = await db.splitsetting.find_many(
        where={"scope": SplitScope.VENUE, "isActive": True},
        order={"createdAt": "desc"},
    )
    items = []
    for o in overrides:
        venue = await db.venue.find_unique(where={"id": o.venueId}) if o.venueId else None
        row = to_dict(o)
        row["venueName"] = venue.name if venue else None
        items.append(row)

    return {
        "globalPercentage": global_pct,
        "global": to_dict(global_row) if global_row else None,
        "venueOverrides": items,
    }


@router.put("/split")
async def update_split(payload: SplitUpdate, admin=Depends(require_admin)):
    if payload.scope == SplitScope.VENUE:
        if not payload.venueId:
            raise HTTPException(status.HTTP_400_BAD_REQUEST, "venueId is required for a venue override")
        venue = await db.venue.find_unique(where={"id": payload.venueId})
        if venue is None:
            raise HTTPException(status.HTTP_404_NOT_FOUND, "Venue not found")
        row = await split_engine.set_venue_split(
            payload.venueId, payload.percentage, admin.id, payload.note
        )
    else:
        row = await split_engine.set_global_split(payload.percentage, admin.id, payload.note)

    await db.auditlog.create(
        data={
            "actorId": admin.id,
            "action": "SPLIT_PERCENTAGE_CHANGED",
            "entity": "split_settings",
            "entityId": row.id,
            "details": f"scope={payload.scope} venue={payload.venueId or '-'} percentage={payload.percentage}",
        }
    )
    return to_dict(row)


@router.delete("/split/venue/{venue_id}", status_code=status.HTTP_200_OK)
async def remove_venue_override(venue_id: str, admin=Depends(require_admin)):
    await split_engine.clear_venue_split(venue_id)
    await db.auditlog.create(
        data={
            "actorId": admin.id,
            "action": "SPLIT_OVERRIDE_REMOVED",
            "entity": "split_settings",
            "entityId": venue_id,
        }
    )
    return {"ok": True}


@router.get("/split/history")
async def split_history(admin=Depends(require_admin)):
    rows = await db.auditlog.find_many(
        where={"action": {"in": ["SPLIT_PERCENTAGE_CHANGED", "SPLIT_OVERRIDE_REMOVED"]}},
        order={"createdAt": "desc"},
        take=50,
    )
    return {"items": [to_dict(r) for r in rows]}


# ------------------------------------------------------------ transactions
@router.get("/transactions")
async def list_transactions(
    venueId: str | None = None,
    admin=Depends(require_admin),
):
    where = {}
    txns = await db.transaction.find_many(where=where, order={"createdAt": "desc"})
    items = []
    for t in txns:
        booking = await db.booking.find_unique(where={"id": t.bookingId})
        if venueId and (booking is None or booking.venueId != venueId):
            continue
        venue = await db.venue.find_unique(where={"id": booking.venueId}) if booking else None
        row = to_dict(t)
        row["venueName"] = venue.name if venue else None
        items.append(row)
    return {"items": items}


# ---------------------------------------------------------------- payouts
@router.get("/payouts")
async def list_payouts(
    status_filter: str | None = Query(None, alias="status"),
    admin=Depends(require_admin),
):
    where = {"status": status_filter} if status_filter else {}
    rows = await db.payout.find_many(where=where, order={"createdAt": "desc"})
    items = []
    for p in rows:
        booking = await db.booking.find_unique(where={"id": p.bookingId})
        venue = await db.venue.find_unique(where={"id": booking.venueId}) if booking else None
        row = to_dict(p)
        row["venueName"] = venue.name if venue else None
        items.append(row)
    return {"items": items}


@router.post("/payouts/{payout_id}/settle")
async def settle_payout(payout_id: str, admin=Depends(require_admin)):
    payout = await db.payout.find_unique(where={"id": payout_id})
    if payout is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Payout not found")
    result = await payouts.execute_payout(payout_id)
    return result


@router.post("/payouts/settle-all")
async def settle_all_payouts(admin=Depends(require_admin)):
    count = await payouts.settle_pending_payouts()
    return {"settled": count}


# ------------------------------------------------- owner earnings (self-serve)
@router.get("/earnings/mine")
async def my_earnings(user=Depends(require_owner)):
    venues = await db.venue.find_many(where={"ownerId": user.id})
    venue_ids = [v.id for v in venues]

    txns = await db.transaction.find_many(order={"createdAt": "desc"})
    my_txns = []
    gross = 0.0
    for t in txns:
        booking = await db.booking.find_unique(where={"id": t.bookingId})
        if booking and booking.venueId in venue_ids:
            my_txns.append(t)
            gross += t.venueShare

    payouts_rows = await db.payout.find_many(
        where={"beneficiaryType": "VENUE", "beneficiaryId": {"in": venue_ids}},
        order={"createdAt": "desc"},
    )
    pending = sum(p.amount for p in payouts_rows if p.status in (PayoutStatus.PENDING, PayoutStatus.PROCESSING))
    settled = sum(p.amount for p in payouts_rows if p.status == PayoutStatus.PAID)

    return {
        "grossEarnings": round(gross, 2),
        "pendingPayouts": round(pending, 2),
        "settledPayouts": round(settled, 2),
        "transactions": [to_dict(t) for t in my_txns],
        "payouts": [to_dict(p) for p in payouts_rows],
    }
