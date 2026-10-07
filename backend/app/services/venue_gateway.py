"""Per-venue (venue-owner) payment gateway configuration.

A venue owner can connect their OWN gateway credentials. When they do, players
pay into the owner's gateway and the platform share is routed from there to the
platform account. When they don't, bookings fall back to the platform gateway.

Secrets are encrypted at rest with the same AES-256-GCM helper used for the
platform gateway, and are only ever decrypted in backend memory.
"""

from datetime import datetime, timezone

from app.constants import GatewayProvider, GatewaySource
from app.database import db
from app.encryption import decrypt, encrypt
from app.services import gateway


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def get_config(venue_id: str):
    return await db.venuegatewayconfig.find_unique(where={"venueId": venue_id})


async def get_decrypted_secrets(venue_id: str) -> dict | None:
    """Server-side-only view of a venue's gateway credentials.

    Returns None when the venue has no active gateway configured.
    """
    config = await get_config(venue_id)
    if config is None or not config.isActive:
        return None
    return {
        "provider": config.provider,
        "api_key": config.apiKey,
        "secret_key": decrypt(config.secretKeyEnc),
        "webhook_secret": decrypt(config.webhookSecretEnc),
        "webhook_url": config.webhookUrl,
        "platform_account_id": config.platformAccountId,
        "configured": True,
        "venue_id": config.venueId,
    }


async def upsert_config(
    venue_id: str,
    owner_id: str,
    *,
    provider: str | None = None,
    api_key: str | None = None,
    secret_key: str | None = None,
    webhook_secret: str | None = None,
    webhook_url: str | None = None,
    platform_account_id: str | None = None,
    is_active: bool | None = None,
):
    existing = await get_config(venue_id)

    data: dict = {}
    if provider is not None:
        data["provider"] = provider
    if api_key is not None:
        data["apiKey"] = api_key
    if secret_key is not None:
        data["secretKeyEnc"] = encrypt(secret_key)
    if webhook_secret is not None:
        data["webhookSecretEnc"] = encrypt(webhook_secret)
    if webhook_url is not None:
        data["webhookUrl"] = webhook_url
    if platform_account_id is not None:
        data["platformAccountId"] = platform_account_id
    if is_active is not None:
        data["isActive"] = is_active

    if existing is None:
        data.setdefault("provider", GatewayProvider.RAZORPAY)
        data.setdefault("apiKey", "")
        data.setdefault("secretKeyEnc", encrypt(""))
        data.setdefault("webhookSecretEnc", encrypt(""))
        return await db.venuegatewayconfig.create(
            data={"venueId": venue_id, "ownerId": owner_id, **data}
        )

    return await db.venuegatewayconfig.update(where={"id": existing.id}, data=data)


async def delete_config(venue_id: str):
    return await db.venuegatewayconfig.delete(where={"venueId": venue_id})


async def record_test_result(venue_id: str, status: str):
    existing = await get_config(venue_id)
    if existing is None:
        return None
    return await db.venuegatewayconfig.update(
        where={"id": existing.id},
        data={"lastTestedAt": _now(), "lastTestStatus": status},
    )


async def resolve_for_venue(venue_id: str) -> tuple[dict, str]:
    """Return (gateway_config, gateway_source) to use for a venue's booking.

    Prefers the venue owner's own active gateway; otherwise falls back to the
    platform gateway. The source tells the payout engine where the money landed.
    """
    venue_secrets = await get_decrypted_secrets(venue_id)
    if venue_secrets is not None:
        return venue_secrets, GatewaySource.VENUE

    from app.services import gateway_config as platform_gateway_config

    return await platform_gateway_config.get_decrypted_secrets(), GatewaySource.PLATFORM


async def resolve_webhook_secret(order_id: str) -> tuple[str, str] | None:
    """Resolve (provider, webhook_secret) for an incoming webhook by order id.

    Venue gateways and the platform gateway may use different providers and
    secrets, so the correct secret is chosen from the booking's gateway source.
    """
    booking = await db.booking.find_first(where={"orderId": order_id})
    if booking is None:
        return None

    if booking.gatewaySource == GatewaySource.VENUE:
        secrets = await get_decrypted_secrets(booking.venueId)
        if secrets is not None:
            return secrets["provider"], secrets.get("webhook_secret", "")

    from app.services import gateway_config as platform_gateway_config

    platform = await platform_gateway_config.get_decrypted_secrets()
    return platform.get("provider", GatewayProvider.SANDBOX), platform.get("webhook_secret", "")


async def test_credentials(secrets: dict) -> dict:
    """Dry-run credential check for an owner's gateway (reuses gateway client)."""
    return await gateway.test_credentials(secrets)
