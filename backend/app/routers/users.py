"""Authenticated-user endpoints. /me returns the canonical user row that
the Cognito ID token resolves to, auto-provisioned on first call."""

from fastapi import APIRouter, Depends

from ..auth import get_current_user
from ..models import User

router = APIRouter(prefix="/api", tags=["users"])


@router.get("/me")
async def me(user: User = Depends(get_current_user)):
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "name": user.name,
        "role": user.role.value,
        "cognitoSub": user.cognito_sub,
    }
