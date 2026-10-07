"""AES-256-GCM encryption for gateway secrets at rest.

The gateway Secret Key and Webhook Signing Secret are encrypted before being
stored and only decrypted in backend memory at request time. The encryption
key never lives in the database.
"""

import base64
import hashlib
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

from app.config import settings

_PREFIX = "v1:"


def _derive_key() -> bytes:
    raw = settings.encryption_key.strip()
    if raw:
        # Accept a 64-char hex key or any passphrase.
        try:
            key = bytes.fromhex(raw)
            if len(key) == 32:
                return key
        except ValueError:
            pass
        return hashlib.sha256(raw.encode("utf-8")).digest()
    # Fall back to a deterministic key derived from the JWT secret so the app
    # still works out of the box in dev. Production should set ENCRYPTION_KEY.
    return hashlib.sha256(f"gateway::{settings.jwt_secret}".encode("utf-8")).digest()


def encrypt(plaintext: str) -> str:
    if plaintext is None:
        plaintext = ""
    aes = AESGCM(_derive_key())
    nonce = os.urandom(12)
    ct = aes.encrypt(nonce, plaintext.encode("utf-8"), None)
    return _PREFIX + base64.b64encode(nonce + ct).decode("utf-8")


def decrypt(token: str) -> str:
    if not token:
        return ""
    if not token.startswith(_PREFIX):
        # Legacy / plaintext value - return as-is so the app keeps working.
        return token
    blob = base64.b64decode(token[len(_PREFIX):])
    nonce, ct = blob[:12], blob[12:]
    aes = AESGCM(_derive_key())
    return aes.decrypt(nonce, ct, None).decode("utf-8")


def mask(value: str, visible: int = 4) -> str:
    """Return a masked preview of a secret (never the full value)."""
    if not value:
        return ""
    if len(value) <= visible:
        return "*" * len(value)
    return "*" * (len(value) - visible) + value[-visible:]
