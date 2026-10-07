"""Helpers to turn Prisma model instances into JSON-safe dicts."""

from datetime import date, datetime
from typing import Any


def _clean(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, list):
        return [_clean(v) for v in value]
    if isinstance(value, dict):
        return {k: _clean(v) for k, v in value.items()}
    return value


def to_dict(model: Any, exclude: set[str] | None = None) -> dict:
    if model is None:
        return {}
    exclude = exclude or set()
    data = model.model_dump() if hasattr(model, "model_dump") else dict(model)
    return {k: _clean(v) for k, v in data.items() if k not in exclude}


def public_user(model: Any) -> dict:
    return to_dict(model, exclude={"passwordHash"})
