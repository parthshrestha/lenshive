"""Cognito ID-token verification + current-user dependency."""
from __future__ import annotations

import os
import time
from typing import Optional

import httpx
from fastapi import Depends, HTTPException, Request
from jose import jwk, jwt
from jose.utils import base64url_decode
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .db import get_session
from .models import User, UserRole

COGNITO_REGION = os.getenv("COGNITO_REGION", "")
USER_POOL_ID = os.getenv("COGNITO_USER_POOL_ID", "")
APP_CLIENT_ID = os.getenv("COGNITO_APP_CLIENT_ID", "")
ISSUER = f"https://cognito-idp.{COGNITO_REGION}.amazonaws.com/{USER_POOL_ID}" if COGNITO_REGION and USER_POOL_ID else ""
JWKS_URL = f"{ISSUER}/.well-known/jwks.json" if ISSUER else ""

_jwks_cache: dict = {"keys": [], "fetched_at": 0.0}
_JWKS_TTL_SECONDS = 60 * 60  # rotate every hour


async def _get_jwks() -> list[dict]:
    """Fetch + cache Cognito's signing keys."""
    if not JWKS_URL:
        raise HTTPException(status_code=503, detail="Cognito not configured")
    now = time.time()
    if _jwks_cache["keys"] and now - _jwks_cache["fetched_at"] < _JWKS_TTL_SECONDS:
        return _jwks_cache["keys"]
    async with httpx.AsyncClient(timeout=5) as client:
        resp = await client.get(JWKS_URL)
    resp.raise_for_status()
    _jwks_cache["keys"] = resp.json()["keys"]
    _jwks_cache["fetched_at"] = now
    return _jwks_cache["keys"]


async def _verify_id_token(token: str) -> dict:
    """Verify a Cognito ID token's signature, issuer, audience, and expiry."""
    try:
        headers = jwt.get_unverified_header(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Malformed token")

    kid = headers.get("kid")
    keys = await _get_jwks()
    key_data = next((k for k in keys if k["kid"] == kid), None)
    if not key_data:
        raise HTTPException(status_code=401, detail="Unknown signing key")

    public_key = jwk.construct(key_data)
    message, encoded_sig = token.rsplit(".", 1)
    decoded_sig = base64url_decode(encoded_sig.encode())
    if not public_key.verify(message.encode(), decoded_sig):
        raise HTTPException(status_code=401, detail="Bad signature")

    try:
        claims = jwt.get_unverified_claims(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Malformed claims")

    if claims.get("token_use") != "id":
        raise HTTPException(status_code=401, detail="Wrong token type (need ID token)")
    if claims.get("aud") != APP_CLIENT_ID:
        raise HTTPException(status_code=401, detail="Wrong audience")
    if claims.get("iss") != ISSUER:
        raise HTTPException(status_code=401, detail="Wrong issuer")
    if claims.get("exp", 0) < int(time.time()):
        raise HTTPException(status_code=401, detail="Token expired")

    return claims


async def _claims_from_request(request: Request) -> dict:
    auth = request.headers.get("authorization") or ""
    scheme, _, token = auth.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return await _verify_id_token(token)


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_session),
) -> User:
    """Resolve the logged-in user. Auto-provisions a User row on first request."""
    claims = await _claims_from_request(request)
    sub = claims["sub"]

    user = (await db.scalars(select(User).where(User.cognito_sub == sub))).first()
    if user is None:
        # Honor the role chosen at signup time (Cognito custom:role attribute).
        # Falls back to "user" if the claim is missing or not a known role.
        claimed_role = claims.get("custom:role")
        try:
            role = UserRole(claimed_role) if claimed_role else UserRole.user
        except ValueError:
            role = UserRole.user
        user = User(
            cognito_sub=sub,
            email=claims.get("email", ""),
            username=claims.get("preferred_username") or claims.get("cognito:username"),
            name=claims.get("name") or claims.get("email", ""),
            role=role,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    return user


async def require_admin(user: User = Depends(get_current_user)) -> User:
    """Gate for admin-only routes."""
    if user.role != UserRole.admin:
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def require_creator(user: User = Depends(get_current_user)) -> User:
    """Gate for routes open to photographers/videographers (and admins)."""
    if user.role not in (UserRole.photographer, UserRole.videographer, UserRole.admin):
        raise HTTPException(status_code=403, detail="Creator access required")
    return user


async def get_current_user_optional(
    request: Request,
    db: AsyncSession = Depends(get_session),
) -> Optional[User]:
    """Same, but returns None instead of 401 when no token is present."""
    if "authorization" not in request.headers:
        return None
    return await get_current_user(request, db)
