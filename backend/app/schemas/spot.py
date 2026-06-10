from __future__ import annotations

from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


class SpotOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str  # slug
    name: str
    city: str
    image: str = Field(alias="image_url")
    bestTime: str = Field(alias="best_time")
    notes: str
    photographerCount: int = Field(alias="photographer_count")
    lat: float
    lng: float
    bestFor: list[str]


class SpotCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    city: str = Field(min_length=1, max_length=120)
    image: str = Field(default="", max_length=500)
    bestTime: str = Field(default="", max_length=120)
    notes: str = ""
    lat: float
    lng: float
    bestFor: list[str] = []
    placeId: Optional[str] = Field(default=None, max_length=255)


class SpotUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=160)
    city: Optional[str] = Field(default=None, min_length=1, max_length=120)
    image: Optional[str] = Field(default=None, max_length=500)
    bestTime: Optional[str] = Field(default=None, max_length=120)
    notes: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    bestFor: Optional[list[str]] = None


class SuggestionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    city: str = Field(min_length=1, max_length=120)
    notes: str = ""
    lat: Optional[float] = None
    lng: Optional[float] = None


class SuggestionStatusUpdate(BaseModel):
    status: str = Field(pattern="^(pending|approved|rejected)$")
