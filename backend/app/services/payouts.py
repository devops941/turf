"""Payout & Settlement service.

Every captured transaction produces two payouts: one to the venue owner and one
to the admin. Payouts are executed instantly when PAYOUT_MODE=AUTO or left
PENDING for batch settlement.
"""

from datetime import datetime, timezone

from app.config import settings
from app.constants import Beneficiary, PayoutStatus
from app.database import db
from app.services import gateway, gateway_config


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def create_payouts(transaction, booking) -> list:
    """Create the venue and admin payout rows for a captured transaction."""
    config = await gateway_config.get_decrypted_secrets()

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
            await execute_payout(payout.id, config)

    return payouts


async def execute_payout(payout_id: str, config: dict | None = None) -> dict:
    payout = await db.payout.find_unique(where={"id": payout_id})
    if payout is None or payout.status == PayoutStatus.PAID:
        return {"status": payout.status if payout else "NOT_FOUND"}

    config = config or await gateway_config.get_decrypted_secrets()
    await db.payout.update(
        where={"id": payout_id}, data={"status": PayoutStatus.PROCESSING}
    )

    try:
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


async def settle_pending_payouts() -> int:
    """Batch-settle every PENDING payout (used in BATCH mode)."""
    config = await gateway_config.get_decrypted_secrets()
    pending = await db.payout.find_many(where={"status": PayoutStatus.PENDING})
    for payout in pending:
        await execute_payout(payout.id, config)
    return len(pending)
