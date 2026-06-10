"""Spot contribution endpoints. Photographers/videographers can add new
locations (so they can tag photos to them); duplicates are rejected so the
catalog keeps one row per physical place. Admins manage spots via
routers/admin.py, which shares the same duplicate guard."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from .. import crud, schemas
from ..auth import require_creator
from ..db import get_session
from ..models import User

router = APIRouter(prefix="/api", tags=["spots"])


@router.post("/spots", status_code=201)
async def create_spot(
    body: schemas.SpotCreate,
    user: User = Depends(require_creator),
    db: AsyncSession = Depends(get_session),
):
    dup = await crud.find_duplicate_spot(db, body.placeId, body.lat, body.lng)
    if dup:
        raise HTTPException(
            status_code=409,
            detail=f"This location already exists on LensHive as “{dup.name}” ({dup.slug}).",
        )
    photographer = await crud.get_photographer_profile(db, user)
    return await crud.create_spot(db, body, link_photographer=photographer)
