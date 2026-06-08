from __future__ import annotations

import enum


class UserRole(str, enum.Enum):
    user = "user"
    photographer = "photographer"
    videographer = "videographer"
    admin = "admin"
    robot = "robot"


class BookingStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    cancelled = "cancelled"
    completed = "completed"
