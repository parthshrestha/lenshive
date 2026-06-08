"""Centralised re-exports so the rest of the codebase keeps importing from
`app.models` (e.g. `from app import models; models.User`).

Importing every submodule here also ensures all SQLAlchemy classes are
registered with the shared `Base.registry` before any query / migration runs,
so string-based relationships (e.g. `Mapped["Photographer"]`) resolve.
"""

from .enums import BookingStatus, UserRole
from .user import User
from .photographer import (
    Photographer,
    PhotographerService,
    PhotographerSpot,
    PhotographerStyle,
    PhotographerTrustSignal,
)
from .spot import Spot, SpotBestFor
from .booking import Booking

__all__ = [
    "BookingStatus",
    "UserRole",
    "User",
    "Photographer",
    "PhotographerService",
    "PhotographerSpot",
    "PhotographerStyle",
    "PhotographerTrustSignal",
    "Spot",
    "SpotBestFor",
    "Booking",
]
