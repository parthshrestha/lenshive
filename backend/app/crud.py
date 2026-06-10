from __future__ import annotations

import math
import re

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from . import models, schemas

# Two spots closer than this are considered the same physical location.
DUPLICATE_RADIUS_MILES = 0.12  # ~200 m


def _haversine_miles(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 3958.8
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lng2 - lng1)
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(h))


async def find_duplicate_spot(
    db: AsyncSession, place_id: str | None, lat: float, lng: float,
) -> models.Spot | None:
    """A spot is a duplicate if it shares the Google place_id, or sits within
    DUPLICATE_RADIUS_MILES of the candidate (legacy rows have no place_id)."""
    if place_id:
        existing = (await db.scalars(
            select(models.Spot).where(models.Spot.place_id == place_id)
        )).first()
        if existing:
            return existing
    rows = (await db.scalars(select(models.Spot))).all()
    for s in rows:
        if _haversine_miles(lat, lng, s.lat, s.lng) <= DUPLICATE_RADIUS_MILES:
            return s
    return None


async def list_photographers(db: AsyncSession) -> list[dict]:
    stmt = select(models.Photographer).options(
        selectinload(models.Photographer.services),
        selectinload(models.Photographer.styles),
        selectinload(models.Photographer.trust_signals),
        selectinload(models.Photographer.spot_links).selectinload(models.PhotographerSpot.spot),
    )
    rows = (await db.scalars(stmt)).all()
    return [_photographer_to_dict(p) for p in rows]


async def get_photographer(db: AsyncSession, slug: str) -> dict | None:
    stmt = select(models.Photographer).where(models.Photographer.slug == slug).options(
        selectinload(models.Photographer.services),
        selectinload(models.Photographer.styles),
        selectinload(models.Photographer.trust_signals),
        selectinload(models.Photographer.spot_links).selectinload(models.PhotographerSpot.spot),
    )
    p = (await db.scalars(stmt)).first()
    return _photographer_to_dict(p) if p else None


async def list_spots(db: AsyncSession) -> list[dict]:
    stmt = select(models.Spot).options(selectinload(models.Spot.best_for))
    rows = (await db.scalars(stmt)).all()
    return [_spot_to_dict(s) for s in rows]


async def get_spot(db: AsyncSession, slug: str) -> dict | None:
    stmt = select(models.Spot).where(models.Spot.slug == slug).options(
        selectinload(models.Spot.best_for),
    )
    s = (await db.scalars(stmt)).first()
    return _spot_to_dict(s) if s else None


def _slugify(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return s[:70] or "spot"


async def _unique_spot_slug(db: AsyncSession, name: str) -> str:
    base = _slugify(name)
    slug, n = base, 2
    while (await db.scalars(select(models.Spot.id).where(models.Spot.slug == slug))).first():
        slug = f"{base}-{n}"
        n += 1
    return slug


async def create_spot(
    db: AsyncSession,
    data: schemas.SpotCreate,
    link_photographer: models.Photographer | None = None,
) -> dict:
    spot = models.Spot(
        slug=await _unique_spot_slug(db, data.name),
        place_id=data.placeId,
        name=data.name,
        city=data.city,
        image_url=data.image,
        best_time=data.bestTime,
        notes=data.notes,
        lat=data.lat,
        lng=data.lng,
        best_for=[models.SpotBestFor(label=l.strip()) for l in dict.fromkeys(data.bestFor) if l.strip()],
    )
    if link_photographer is not None:
        spot.photographer_links.append(models.PhotographerSpot(photographer_id=link_photographer.id))
        spot.photographer_count = 1
    db.add(spot)
    await db.commit()
    await db.refresh(spot)
    return _spot_to_dict(spot)


async def get_photographer_profile(db: AsyncSession, user: models.User) -> models.Photographer | None:
    """The photographer row owned by this user, if they have one."""
    return (await db.scalars(
        select(models.Photographer).where(models.Photographer.user_id == user.id)
    )).first()


async def _unique_photographer_slug(db: AsyncSession, name: str) -> str:
    base = _slugify(name)
    slug, n = base, 2
    while (await db.scalars(select(models.Photographer.id).where(models.Photographer.slug == slug))).first():
        slug = f"{base}-{n}"
        n += 1
    return slug


async def create_photographer_from_onboarding(
    db: AsyncSession, user: models.User, answers: dict,
) -> models.Photographer:
    """Bootstrap a (draft, unverified) photographer profile from the signup
    questionnaire. Coordinates are geocoded best-effort from the stated city."""
    from datetime import datetime

    name = (answers.get("businessName") or user.name or user.username or "Photographer").strip()[:160]
    location = (answers.get("location") or "").strip()[:160]

    lat, lng = 40.01499, -105.27055  # app default (Boulder) when geocoding fails
    if location:
        try:
            from .routers.maps import _call_geocode
            result = await _call_geocode({"address": location})
            loc = result["geometry"]["location"]
            lat, lng = loc["lat"], loc["lng"]
        except Exception:
            pass

    try:
        starting_price = max(0, int(answers.get("startingPrice") or 0))
    except (TypeError, ValueError):
        starting_price = 0

    initials = "".join(w[0] for w in name.split()[:2]).upper() or "P"
    photographer = models.Photographer(
        user_id=user.id,
        slug=await _unique_photographer_slug(db, user.username or name),
        name=name,
        initials=initials,
        avatar_url="",
        cover_url="",
        location=location or "Not set",
        service_area=location or "Not set",
        bio=(answers.get("bio") or "").strip(),
        response_time="New to LensHive",
        member_since=datetime.utcnow().year,
        starting_price=starting_price,
        lat=lat,
        lng=lng,
        services=[models.PhotographerService(service=s[:60]) for s in dict.fromkeys(answers.get("specialties") or []) if s.strip()],
        styles=[models.PhotographerStyle(style=s[:60]) for s in dict.fromkeys(answers.get("styles") or []) if s.strip()],
    )
    db.add(photographer)
    await db.commit()
    await db.refresh(photographer)
    return photographer


async def update_spot(db: AsyncSession, slug: str, data: schemas.SpotUpdate) -> dict | None:
    stmt = select(models.Spot).where(models.Spot.slug == slug).options(selectinload(models.Spot.best_for))
    spot = (await db.scalars(stmt)).first()
    if not spot:
        return None
    if data.name is not None:
        spot.name = data.name
    if data.city is not None:
        spot.city = data.city
    if data.image is not None:
        spot.image_url = data.image
    if data.bestTime is not None:
        spot.best_time = data.bestTime
    if data.notes is not None:
        spot.notes = data.notes
    if data.lat is not None:
        spot.lat = data.lat
    if data.lng is not None:
        spot.lng = data.lng
    if data.bestFor is not None:
        spot.best_for = [models.SpotBestFor(label=l.strip()) for l in dict.fromkeys(data.bestFor) if l.strip()]
    await db.commit()
    await db.refresh(spot)
    return _spot_to_dict(spot)


async def delete_spot(db: AsyncSession, slug: str) -> bool:
    spot = (await db.scalars(select(models.Spot).where(models.Spot.slug == slug))).first()
    if not spot:
        return False
    await db.delete(spot)
    await db.commit()
    return True


async def create_suggestion(db: AsyncSession, data: schemas.SuggestionCreate, user: models.User) -> dict:
    sug = models.SpotSuggestion(
        name=data.name,
        city=data.city,
        notes=data.notes,
        lat=data.lat,
        lng=data.lng,
        suggested_by=user.id,
    )
    db.add(sug)
    await db.commit()
    await db.refresh(sug)
    out = _suggestion_to_dict(sug)
    out["suggestedBy"] = {"id": user.id, "name": user.name, "email": user.email}
    return out


async def list_suggestions(db: AsyncSession, user_id: int | None = None) -> list[dict]:
    stmt = select(models.SpotSuggestion).order_by(models.SpotSuggestion.created_at.desc())
    if user_id is not None:
        stmt = stmt.where(models.SpotSuggestion.suggested_by == user_id)
    rows = (await db.scalars(stmt)).all()
    return [_suggestion_to_dict(s) for s in rows]


async def set_suggestion_status(db: AsyncSession, suggestion_id: int, status: str) -> dict | None:
    sug = await db.get(models.SpotSuggestion, suggestion_id)
    if not sug:
        return None
    sug.status = models.SuggestionStatus(status)
    await db.commit()
    await db.refresh(sug)
    return _suggestion_to_dict(sug)


def _suggestion_to_dict(s: models.SpotSuggestion) -> dict:
    return {
        "id": s.id,
        "name": s.name,
        "city": s.city,
        "notes": s.notes,
        "lat": s.lat,
        "lng": s.lng,
        "status": s.status.value if hasattr(s.status, "value") else s.status,
        "suggestedBy": {"id": s.user.id, "name": s.user.name, "email": s.user.email} if s.user else None,
        "createdAt": s.created_at.isoformat() if s.created_at else None,
    }


def _photographer_to_dict(p: models.Photographer) -> dict:
    return {
        "id": p.slug,
        "name": p.name,
        "initials": p.initials,
        "avatar": p.avatar_url,
        "cover": p.cover_url,
        "location": p.location,
        "serviceArea": p.service_area,
        "rating": float(p.rating),
        "reviewCount": p.review_count,
        "startingPrice": p.starting_price,
        "bio": p.bio,
        "responseTime": p.response_time,
        "memberSince": p.member_since,
        "bookings": p.bookings_count,
        "lat": p.lat,
        "lng": p.lng,
        "services": [s.service for s in p.services],
        "styles": [s.style for s in p.styles],
        "trustSignals": [t.signal for t in p.trust_signals],
        "spots": [link.spot.slug for link in p.spot_links if link.spot],
        "distance": 0,
        "userId": p.user_id,
        # Unverified photographers have a public profile but can't be booked.
        "verified": p.verification_status == models.VerificationStatus.verified,
    }


def _spot_to_dict(s: models.Spot) -> dict:
    return {
        "id": s.slug,
        "placeId": s.place_id,
        "name": s.name,
        "city": s.city,
        "image": s.image_url,
        "bestTime": s.best_time,
        "notes": s.notes,
        "photographerCount": s.photographer_count,
        "lat": s.lat,
        "lng": s.lng,
        "bestFor": [b.label for b in s.best_for],
    }
