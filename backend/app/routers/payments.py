"""Stripe Connect (Express) onboarding for photographer verification.

Photographers verify their identity/business (SSN or EIN) through Stripe's
hosted KYC flow. Until Stripe reports the account as fully enabled, the
photographer keeps a public profile but can't take bookings.

Requires STRIPE_SECRET_KEY in backend/.env; endpoints 503 cleanly without it.
"""

import os

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession

from .. import crud
from ..auth import require_creator
from ..db import get_session
from ..models import User, VerificationStatus

router = APIRouter(prefix="/api/stripe", tags=["payments"])

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")


def _stripe():
    if not STRIPE_SECRET_KEY:
        raise HTTPException(
            status_code=503,
            detail="Stripe is not configured yet — add STRIPE_SECRET_KEY to backend/.env.",
        )
    import stripe
    stripe.api_key = STRIPE_SECRET_KEY
    return stripe


def _frontend_origin(request: Request) -> str:
    return request.headers.get("origin") or os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")


async def _get_profile_or_400(db, user):
    photographer = await crud.get_photographer_profile(db, user)
    if photographer is None:
        raise HTTPException(status_code=400, detail="Finish onboarding first to create your profile.")
    return photographer


@router.post("/connect/start")
async def connect_start(
    request: Request,
    user: User = Depends(require_creator),
    db: AsyncSession = Depends(get_session),
):
    """Create (or reuse) the photographer's Express account and return a
    hosted onboarding link where Stripe collects identity/business details."""
    stripe = _stripe()
    photographer = await _get_profile_or_400(db, user)

    if not photographer.stripe_account_id:
        account = stripe.Account.create(
            type="express",
            email=user.email,
            capabilities={
                "card_payments": {"requested": True},
                "transfers": {"requested": True},
            },
            business_profile={"product_description": "Photography services booked via LensHive"},
            metadata={"lenshive_user_id": str(user.id), "lenshive_photographer": photographer.slug},
        )
        photographer.stripe_account_id = account.id

    origin = _frontend_origin(request)
    link = stripe.AccountLink.create(
        account=photographer.stripe_account_id,
        refresh_url=f"{origin}/dashboard?section=earnings&stripe=refresh",
        return_url=f"{origin}/dashboard?section=earnings&stripe=return",
        type="account_onboarding",
    )
    if photographer.verification_status == VerificationStatus.unverified:
        photographer.verification_status = VerificationStatus.pending
    await db.commit()
    return {"url": link.url}


@router.get("/connect/status")
async def connect_status(
    user: User = Depends(require_creator),
    db: AsyncSession = Depends(get_session),
):
    """Pull the latest account state from Stripe and sync our verification
    flag. Called when the photographer returns from Stripe's hosted flow."""
    photographer = await _get_profile_or_400(db, user)
    if not photographer.stripe_account_id:
        return {"status": "unverified", "detailsSubmitted": False, "chargesEnabled": False, "requirementsDue": []}

    stripe = _stripe()
    account = stripe.Account.retrieve(photographer.stripe_account_id)
    details_submitted = bool(account.get("details_submitted"))
    charges_enabled = bool(account.get("charges_enabled"))
    payouts_enabled = bool(account.get("payouts_enabled"))
    requirements_due = (account.get("requirements") or {}).get("currently_due") or []

    if charges_enabled and details_submitted:
        photographer.verification_status = VerificationStatus.verified
    elif details_submitted or photographer.stripe_account_id:
        photographer.verification_status = VerificationStatus.pending
    await db.commit()

    return {
        "status": photographer.verification_status.value,
        "detailsSubmitted": details_submitted,
        "chargesEnabled": charges_enabled,
        "payoutsEnabled": payouts_enabled,
        "requirementsDue": requirements_due,
    }
