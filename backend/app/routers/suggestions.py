"""Signed-in users can suggest new photo spots; admins review them in the
admin dashboard (see routers/admin.py)."""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from .. import crud, schemas
from ..auth import get_current_user
from ..db import get_session
from ..models import User

router = APIRouter(prefix="/api", tags=["suggestions"])


@router.post("/suggestions", status_code=201)
async def submit_suggestion(
    body: schemas.SuggestionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    return await crud.create_suggestion(db, body, user)


@router.get("/suggestions/mine")
async def my_suggestions(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_session),
):
    return await crud.list_suggestions(db, user_id=user.id)
