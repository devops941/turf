"""FastAPI dependencies: current user resolution and role-based access control."""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.constants import Role, UserStatus
from app.database import db
from app.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
):
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing authentication token")

    payload = decode_access_token(credentials.credentials)
    if not payload or not payload.get("sub"):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")

    user = await db.user.find_unique(where={"id": payload["sub"]})
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User no longer exists")
    if user.status == UserStatus.SUSPENDED:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account suspended")
    return user


def require_roles(*roles: str):
    async def _guard(user=Depends(get_current_user)):
        if user.role not in roles:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                f"Requires one of roles: {', '.join(roles)}",
            )
        return user

    return _guard


require_admin = require_roles(Role.ADMIN)
require_owner = require_roles(Role.VENUE_OWNER)
require_player = require_roles(Role.USER)
require_owner_or_admin = require_roles(Role.VENUE_OWNER, Role.ADMIN)
