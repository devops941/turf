"""Authentication & user account routes."""

from fastapi import APIRouter, Depends, HTTPException, status

from app.constants import Role, UserStatus
from app.database import db
from app.deps import get_current_user
from app.schemas import LoginRequest, SignupRequest, TokenResponse
from app.security import create_access_token, hash_password, verify_password
from app.serializers import public_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _token_response(user) -> TokenResponse:
    token = create_access_token(user.id, user.role)
    return TokenResponse(access_token=token, user=public_user(user))


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest):
    existing = await db.user.find_unique(where={"email": payload.email.lower()})
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    user = await db.user.create(
        data={
            "name": payload.name.strip(),
            "email": payload.email.lower(),
            "phone": payload.phone,
            "passwordHash": hash_password(payload.password),
            "role": payload.role,
            "status": UserStatus.ACTIVE,
        }
    )
    return _token_response(user)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest):
    user = await db.user.find_unique(where={"email": payload.email.lower()})
    if user is None or not verify_password(payload.password, user.passwordHash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    if user.status == UserStatus.SUSPENDED:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Account suspended")
    return _token_response(user)


@router.get("/me")
async def me(user=Depends(get_current_user)):
    return public_user(user)
