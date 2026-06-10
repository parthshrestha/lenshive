"""Authenticated-user endpoints. /me returns the canonical user row that
the Cognito ID token resolves to, auto-provisioned on first call.
/me/onboarding stores the post-signup questionnaire; for photographers it
also bootstraps their (unverified) public profile."""

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from .. import crud
from ..auth import get_current_user
from ..db import get_session
from ..models import User, UserRole

router = APIRouter(prefix="/api", tags=["users"])


class OnboardingSubmit(BaseModel):
    answers: dict


async def _me_payload(db: AsyncSession, user: User) -> dict:
    payload = {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "name": user.name,
        "role": user.role.value,
        "cognitoSub": user.cognito_sub,
        # Admins skip onboarding entirely.
        "onboarded": bool(user.onboarded_at) or user.role == UserRole.admin,
    }
    if user.role in (UserRole.photographer, UserRole.videographer):
        p = await crud.get_photographer_profile(db, user)
        payload["photographer"] = {
            "slug": p.slug,
            "name": p.name,
            "startingPrice": p.starting_price,
            "verificationStatus": p.verification_status.value,
            "stripeAccountId": p.stripe_account_id,
        } if p else None
    return payload


@router.get("/me")
async def me(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    return await _me_payload(db, user)


@router.post("/me/onboarding")
async def submit_onboarding(
    body: OnboardingSubmit,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    if user.role == UserRole.admin:
        raise HTTPException(status_code=400, detail="Admins don't have onboarding")
    user.onboarding = body.answers
    user.onboarded_at = datetime.utcnow()
    await db.commit()

    if user.role in (UserRole.photographer, UserRole.videographer):
        existing = await crud.get_photographer_profile(db, user)
        if existing is None:
            await crud.create_photographer_from_onboarding(db, user, body.answers)

    return await _me_payload(db, user)
