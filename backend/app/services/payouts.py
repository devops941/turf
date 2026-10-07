"""Payout & Settlement service.

How a booking's money is settled depends on WHERE the player paid:

* PLATFORM gateway - the platform holds the full amount, so the venue share is
  transferred out to the owner (as before).
* VENUE gateway - the owner's own gateway already holds the full amount, so the
  owner's share is instantly satisfied and the platform's commission is routed
  from the venue gateway to the platform account.

Payouts are executed instantly when PAYOUT_MODE=AUTO or left PENDING for batch
settlement.
"""

from datetime import datetime, timezone

from app.config import settings
from app.constants import Beneficiary, GatewaySource, PayoutStatus
from app.database import db
from app.services import gateway, gateway_config, venue_gateway


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def create_payouts(transaction, booking) -> list:
    """Create the venue and admin payout rows for a captured transaction."""
    payouts = []
    plan = [
        (Beneficiary.VENUE, booking.venueId, transaction.venueShare),
        (Beneficiary.ADMIN, Beneficiary.ADMIN_ID, transaction.adminShare),
    ]

    for beneficiary_type, beneficiary_id, amount in plan:
        payout = await db.payout.create(
            data={
                "transactionId": transaction.id,
                "bookingId": booking.id,
                "beneficiaryType": beneficiary_type,
                "beneficiaryId": beneficiary_id,
                "amount": amount,
                "status": PayoutStatus.PENDING,
            }
        )
        payouts.append(payout)

    if settings.payout_mode.upper() == "AUTO":
        for payout in payouts:
            await execute_payout(payout.id, transaction=transaction)

    return payouts


async def _resolve_config(transaction) -> tuple[dict, str]:
    """Return (gateway_config, gateway_source) that hold the booking's money."""
    source = getattr(transaction, "gatewaySource", None) or GatewaySource.PLATFORM
    if source == GatewaySource.VENUE:
        booking = await db.booking.find_unique(where={"id": transaction.bookingId})
        if booking is not None:
            secrets = await venue_gateway.get_decrypted_secrets(booking.venueId)
            if secrets is not None:
                return secrets, GatewaySource.VENUE
    config = await gateway_config.get_decrypted_secrets()
    return config, GatewaySource.PLATFORM


async def execute_payout(
    payout_id: str, config: dict | None = None, transaction=None
) -> dict:
    payout = await db.payout.find_unique(where={"id": payout_id})
    if payout is None or payout.status == PayoutStatus.PAID:
        return {"status": payout.status if payout else "NOT_FOUND"}

    if transaction is None:
        transaction = await db.transaction.find_unique(where={"id": payout.transactionId})
    if transaction is None:
        await db.payout.update(
            where={"id": payout_id},
            data={"status": PayoutStatus.FAILED, "gatewayRef": "missing transaction"},
        )
        return {"status": PayoutStatus.FAILED, "error": "transaction not found"}

    source = getattr(transaction, "gatewaySource", None) or GatewaySource.PLATFORM
    if config is None:
        config, source = await _resolve_config(transaction)

    await db.payout.update(
        where={"id": payout_id}, data={"status": PayoutStatus.PROCESSING}
    )

    try:
        if source == GatewaySource.VENUE:
            result = await _execute_venue_source_payout(payout, transaction, config)
        else:
            result = await gateway.execute_transfer(
                config,
                beneficiary_id=payout.beneficiaryId,
                amount=payout.amount,
                reference=payout.id,
            )
    except Exception as exc:  # noqa: BLE001
        await db.payout.update(
            where={"id": payout_id},
            data={"status": PayoutStatus.FAILED, "gatewayRef": str(exc)[:200]},
        )
        return {"status": PayoutStatus.FAILED, "error": str(exc)}

    status = result.get("status", PayoutStatus.PAID)
    await db.payout.update(
        where={"id": payout_id},
        data={
            "status": status,
            "gatewayRef": result.get("gatewayRef"),
            "settledAt": _now() if status == PayoutStatus.PAID else None,
        },
    )
    return {"status": status, "gatewayRef": result.get("gatewayRef")}


async def _execute_venue_source_payout(payout, transaction, config: dict) -> dict:
    """Settle one payout when the money sits in the venue owner's gateway.

    - Venue payout: the owner already holds these funds in their own gateway, so
      it is marked paid immediately.
    - Admin payout: the platform's commission is routed out of the venue gateway
      to the platform account.
    """
    if payout.beneficiaryType == Beneficiary.VENUE:
        return {
            "status": PayoutStatus.PAID,
            "gatewayRef": f"venue_held_{transaction.orderId}",
        }

    return await gateway.route_platform_share(
        config,
        amount=payout.amount,
        reference=payout.id,
        destination_account=config.get("platform_account_id"),
    )


async def settle_pending_payouts() -> int:
    """Batch-settle every PENDING payout (used in BATCH mode)."""
    pending = await db.payout.find_many(where={"status": PayoutStatus.PENDING})
    for payout in pending:
        transaction = await db.transaction.find_unique(where={"id": payout.transactionId})
        config = None
        if transaction is not None:
            config, _ = await _resolve_config(transaction)
        await execute_payout(payout.id, config, transaction=transaction)
    return len(pending)
