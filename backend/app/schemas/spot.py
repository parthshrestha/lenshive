from __future__ import annotations

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
