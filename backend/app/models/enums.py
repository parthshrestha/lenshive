from __future__ import annotations

import enum


class UserRole(str, enum.Enum):
    user = "user"
    photographer = "photographer"
    videographer = "videographer"
    admin = "admin"
    robot = "robot"


class VerificationStatus(str, enum.Enum):
    """Stripe Connect identity/business (SSN/EIN) verification progress.
    Photographers stay public-profile-only until `verified`."""
    unverified = "unverified"
    pending = "pending"
    verified = "verified"


class SuggestionStatus(str, enum.Enum):
    pending = "pending"
    approved = "approved"
    rejected = "rejected"


class BookingStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"
    completed = "completed"
