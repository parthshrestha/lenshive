"""Admin-only endpoints: manage the photo-spot catalog and review
user-submitted location suggestions. Every route requires an admin role."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from .. import crud, schemas
from ..auth import require_admin
from ..db import get_session

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(require_admin)])


@router.post("/spots", status_code=201)
async def create_spot(body: schemas.SpotCreate, db: AsyncSession = Depends(get_session)):
    dup = await crud.find_duplicate_spot(db, body.placeId, body.lat, body.lng)
    if dup:
        raise HTTPException(
            status_code=409,
            detail=f"This location already exists on LensHive as “{dup.name}” ({dup.slug}).",
        )
    return await crud.create_spot(db, body)


@router.put("/spots/{slug}")
async def update_spot(slug: str, body: schemas.SpotUpdate, db: AsyncSession = Depends(get_session)):
    spot = await crud.update_spot(db, slug, body)
    if not spot:
        raise HTTPException(status_code=404, detail="Spot not found")
    return spot


@router.delete("/spots/{slug}", status_code=204)
async def delete_spot(slug: str, db: AsyncSession = Depends(get_session)):
    if not await crud.delete_spot(db, slug):
        raise HTTPException(status_code=404, detail="Spot not found")


@router.get("/suggestions")
async def list_suggestions(db: AsyncSession = Depends(get_session)):
    return await crud.list_suggestions(db)


@router.patch("/suggestions/{suggestion_id}")
async def set_suggestion_status(
    suggestion_id: int,
    body: schemas.SuggestionStatusUpdate,
    db: AsyncSession = Depends(get_session),
):
    sug = await crud.set_suggestion_status(db, suggestion_id, body.status)
    if not sug:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    return sug
