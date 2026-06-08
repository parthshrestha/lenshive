"""Public, read-only catalog endpoints for photographers and photo spots."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from .. import crud
from ..db import get_session

router = APIRouter(prefix="/api", tags=["catalog"])


@router.get("/photographers")
async def list_photographers(db: AsyncSession = Depends(get_session)):
    return await crud.list_photographers(db)


@router.get("/photographers/{slug}")
async def get_photographer(slug: str, db: AsyncSession = Depends(get_session)):
    p = await crud.get_photographer(db, slug)
    if not p:
        raise HTTPException(status_code=404, detail="Photographer not found")
    return p


@router.get("/spots")
async def list_spots(db: AsyncSession = Depends(get_session)):
    return await crud.list_spots(db)


@router.get("/spots/{slug}")
async def get_spot(slug: str, db: AsyncSession = Depends(get_session)):
    s = await crud.get_spot(db, slug)
    if not s:
        raise HTTPException(status_code=404, detail="Spot not found")
    return s
