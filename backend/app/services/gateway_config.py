"""Dynamic payment-gateway configuration.

Credentials live in the gateway_config collection, encrypted at rest. The Admin
manages them from a settings screen so providers can be switched or keys rotated
without a code deployment.
"""

from datetime import datetime, timezone

from app.constants import GatewayProvider
from app.database import db
from app.encryption import decrypt, encrypt


def _now() -> datetime:
    return datetime.now(timezone.utc)


async def get_active_config():
    """Return the active gateway config row, or None."""
    return await db.gatewayconfig.find_first(
        where={"isActive": True}, order={"updatedAt": "desc"}
    )


async def get_decrypted_secrets() -> dict:
    """Server-side-only view of the gateway credentials."""
    config = await get_active_config()
    if config is None:
        return {
            "provider": GatewayProvider.SANDBOX,
            "api_key": "",
            "secret_key": "",
            "webhook_secret": "",
            "webhook_url": None,
            "configured": False,
        }
    return {
        "provider": config.provider,
        "api_key": config.apiKey,
        "secret_key": decrypt(config.secretKeyEnc),
        "webhook_secret": decrypt(config.webhookSecretEnc),
        "webhook_url": config.webhookUrl,
        "configured": True,
    }


async def upsert_config(
    provider: str | None = None,
    api_key: str | None = None,
    secret_key: str | None = None,
    webhook_secret: str | None = None,
    webhook_url: str | None = None,
):
    existing = await get_active_config()

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

    if existing is None:
        data.setdefault("provider", GatewayProvider.SANDBOX)
        data.setdefault("apiKey", "")
        data.setdefault("secretKeyEnc", encrypt(""))
        data.setdefault("webhookSecretEnc", encrypt(""))
        return await db.gatewayconfig.create(data=data)

    return await db.gatewayconfig.update(where={"id": existing.id}, data=data)


async def record_test_result(status: str):
    existing = await get_active_config()
    if existing is None:
        return None
    return await db.gatewayconfig.update(
        where={"id": existing.id},
        data={"lastTestedAt": _now(), "lastTestStatus": status},
    )
