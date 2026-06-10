from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlalchemy import JSON, BigInteger, DateTime, Enum, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db import Base
from .enums import UserRole


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    # cognito_sub is the Cognito user UUID; null only for filler/robot accounts
    cognito_sub: Mapped[Optional[str]] = mapped_column(String(64), unique=True, nullable=True, index=True)
    username: Mapped[Optional[str]] = mapped_column(String(40), unique=True, nullable=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.user)
    # Post-signup questionnaire answers (shape varies by role) + when finished.
    onboarding: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    onboarded_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    photographer: Mapped[Optional["Photographer"]] = relationship(back_populates="user", uselist=False)
    bookings: Mapped[List["Booking"]] = relationship(back_populates="user")
