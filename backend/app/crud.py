from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from . import models


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
    }


def _spot_to_dict(s: models.Spot) -> dict:
    return {
        "id": s.slug,
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
