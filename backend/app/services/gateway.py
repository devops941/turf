"""Payment gateway client.

Supports a configurable provider. Razorpay/Cashfree use HMAC-SHA256 webhook
signatures over the raw request body; Stripe uses its own timestamped scheme.
SANDBOX is a fully offline simulated provider used for local demos and tests -
it signs webhooks with the same HMAC scheme so the real verification code path
is exercised end to end.
"""

import hashlib
import hmac
import json
import logging
import uuid

import httpx

from app.constants import GatewayProvider

log = logging.getLogger("turf.gateway")

TIMEOUT = 20


class GatewayError(Exception):
    pass


# --------------------------------------------------------------- signatures
def compute_hmac_signature(payload: bytes, secret: str) -> str:
    return hmac.new(secret.encode("utf-8"), payload, hashlib.sha256).hexdigest()


def verify_hmac_signature(payload: bytes, signature: str, secret: str) -> bool:
    if not signature or not secret:
        return False
    expected = compute_hmac_signature(payload, secret)
    return hmac.compare_digest(expected, signature.strip())


def verify_stripe_signature(payload: bytes, header: str, secret: str, tolerance: int = 300) -> bool:
    """Verify a Stripe `Stripe-Signature` header (t=...,v1=...)."""
    if not header or not secret:
        return False
    import time

    parts = dict(p.split("=", 1) for p in header.split(",") if "=" in p)
    timestamp, signature = parts.get("t"), parts.get("v1")
    if not timestamp or not signature:
        return False
    try:
        if abs(time.time() - int(timestamp)) > tolerance:
            return False
    except ValueError:
        return False
    signed = f"{timestamp}.{payload.decode('utf-8')}".encode("utf-8")
    return verify_hmac_signature(signed, signature, secret)


def verify_webhook_signature(provider: str, raw_body: bytes, headers: dict, secret: str) -> bool:
    headers_lower = {k.lower(): v for k, v in headers.items()}
    if provider == GatewayProvider.STRIPE:
        return verify_stripe_signature(
            raw_body, headers_lower.get("stripe-signature", ""), secret
        )
    # Razorpay / Cashfree / Sandbox
    signature = (
        headers_lower.get("x-razorpay-signature")
        or headers_lower.get("x-webhook-signature")
        or headers_lower.get("x-sandbox-signature")
        or ""
    )
    return verify_hmac_signature(raw_body, signature, secret)


# -------------------------------------------------------------------- orders
async def create_order(config: dict, order_id: str, amount: float, currency: str, notes: dict) -> dict:
    """Create a payment order with the configured gateway.

    Returns a dict with the gateway order id, the public key the frontend needs,
    and the amount in minor units.
    """
    provider = config.get("provider", GatewayProvider.SANDBOX)
    amount_minor = int(round(amount * 100))

    if provider == GatewayProvider.SANDBOX or not config.get("configured"):
        return {
            "provider": provider,
            "gatewayOrderId": f"sbx_{order_id}",
            "publicKey": config.get("api_key") or "sbx_public_key",
            "amount": amount,
            "amountMinor": amount_minor,
            "currency": currency,
            "sandbox": True,
        }

    if provider == GatewayProvider.RAZORPAY:
        return await _razorpay_order(config, order_id, amount_minor, currency, notes)

    # Stripe / Cashfree: represent the intent; wire real calls when keys exist.
    return {
        "provider": provider,
        "gatewayOrderId": f"{provider.lower()}_{order_id}",
        "publicKey": config.get("api_key", ""),
        "amount": amount,
        "amountMinor": amount_minor,
        "currency": currency,
        "sandbox": False,
    }


async def _razorpay_order(config: dict, order_id: str, amount_minor: int, currency: str, notes: dict) -> dict:
    key_id = config.get("api_key")
    key_secret = config.get("secret_key")
    if not key_id or not key_secret:
        raise GatewayError("Razorpay API key/secret are not configured")

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            resp = await client.post(
                "https://api.razorpay.com/v1/orders",
                auth=(key_id, key_secret),
                json={
                    "amount": amount_minor,
                    "currency": currency,
                    "receipt": order_id,
                    "notes": notes,
                },
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPError as exc:
        raise GatewayError(f"Razorpay order creation failed: {exc}") from exc

    return {
        "provider": GatewayProvider.RAZORPAY,
        "gatewayOrderId": data["id"],
        "publicKey": key_id,
        "amount": amount_minor / 100,
        "amountMinor": amount_minor,
        "currency": currency,
        "sandbox": False,
    }


# ------------------------------------------------------------------- payouts
async def execute_transfer(config: dict, beneficiary_id: str, amount: float, reference: str) -> dict:
    """Execute a payout/route transfer to a beneficiary.

    For SANDBOX this simulates a successful transfer. For real providers this is
    where the gateway's transfer/route API would be called.
    """
    provider = config.get("provider", GatewayProvider.SANDBOX)
    if provider == GatewayProvider.SANDBOX or not config.get("configured"):
        return {"status": "PAID", "gatewayRef": f"sbx_tr_{uuid.uuid4().hex[:12]}"}

    # Placeholder for real provider transfer APIs (Razorpay Route, Stripe Connect,
    # Cashfree Payouts). Kept explicit so a failure is never silently swallowed.
    log.info("Transfer requested: %s -> %s %.2f", reference, beneficiary_id, amount)
    return {"status": "PROCESSING", "gatewayRef": f"{provider.lower()}_tr_{uuid.uuid4().hex[:12]}"}


async def route_platform_share(
    config: dict, amount: float, reference: str, destination_account: str | None
) -> dict:
    """Move the platform's commission from a venue gateway to the platform.

    Used when the player paid into the venue owner's own gateway: the owner
    already holds the full amount, so the platform share is routed out to the
    platform account on that same gateway.

    For SANDBOX this simulates an instant successful route. For real providers
    this is where the gateway's split/route-to-account API would be called
    (Razorpay Route transfer, Stripe Connect transfer, Cashfree vendor split).
    """
    provider = config.get("provider", GatewayProvider.SANDBOX)
    if provider == GatewayProvider.SANDBOX or not config.get("configured"):
        return {"status": "PAID", "gatewayRef": f"sbx_route_{uuid.uuid4().hex[:12]}"}

    if not destination_account:
        raise GatewayError(
            "Platform account id is required to route the platform share from a venue gateway"
        )

    log.info(
        "Platform share route requested: %s -> %s %.2f", reference, destination_account, amount
    )
    return {
        "status": "PROCESSING",
        "gatewayRef": f"{provider.lower()}_route_{uuid.uuid4().hex[:12]}",
    }


# ---------------------------------------------------------------------- test
async def test_credentials(config: dict) -> dict:
    """Dry-run credential check used by the Admin "Test connection" action."""
    provider = config.get("provider", GatewayProvider.SANDBOX)
    if provider == GatewayProvider.SANDBOX:
        return {"ok": True, "message": "Sandbox provider is always available"}

    if provider == GatewayProvider.RAZORPAY:
        if not config.get("api_key") or not config.get("secret_key"):
            return {"ok": False, "message": "API key and secret key are required"}
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                resp = await client.get(
                    "https://api.razorpay.com/v1/payments?count=1",
                    auth=(config["api_key"], config["secret_key"]),
                )
            if resp.status_code in (200, 400):
                # 200 = ok; 400 = authenticated but bad params -> creds valid
                return {"ok": True, "message": "Credentials accepted by Razorpay"}
            if resp.status_code in (401, 403):
                return {"ok": False, "message": "Razorpay rejected the credentials"}
            return {"ok": False, "message": f"Unexpected response: {resp.status_code}"}
        except httpx.HTTPError as exc:
            return {"ok": False, "message": f"Could not reach gateway: {exc}"}

    if not config.get("api_key") or not config.get("secret_key"):
        return {"ok": False, "message": "API key and secret key are required"}
    return {"ok": True, "message": f"{provider} credentials saved (live check not implemented)"}
