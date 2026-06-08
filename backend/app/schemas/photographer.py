from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class PhotographerOut(BaseModel):
    """Shape matches the legacy mockData entries the frontend already consumes."""
    model_config = ConfigDict(from_attributes=True)

    id: str  # slug, kept as `id` for frontend parity
    name: str
    initials: str
    avatar: str = Field(alias="avatar_url")
    cover: str = Field(alias="cover_url")
    location: str
    serviceArea: str = Field(alias="service_area")
    rating: float
    reviewCount: int = Field(alias="review_count")
    startingPrice: int = Field(alias="starting_price")
    bio: str
    responseTime: str = Field(alias="response_time")
    memberSince: int = Field(alias="member_since")
    bookings: int = Field(alias="bookings_count")
    lat: float
    lng: float
    services: list[str]
    styles: list[str]
    trustSignals: list[str]
    spots: list[str]
    # `distance` is computed on the frontend now (haversine from user location)
    distance: int = 0
