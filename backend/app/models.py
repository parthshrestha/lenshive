from __future__ import annotations

import enum
from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import (
    BigInteger, DateTime, Enum, ForeignKey, Numeric, String, Text, UniqueConstraint, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


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


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    # cognito_sub is the Cognito user UUID; null only for filler/robot accounts
    cognito_sub: Mapped[Optional[str]] = mapped_column(String(64), unique=True, nullable=True, index=True)
    username: Mapped[Optional[str]] = mapped_column(String(40), unique=True, nullable=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.user)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    photographer: Mapped[Optional["Photographer"]] = relationship(back_populates="user", uselist=False)
    bookings: Mapped[List["Booking"]] = relationship(back_populates="user")


class Photographer(Base):
    __tablename__ = "photographers"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    initials: Mapped[str] = mapped_column(String(8))
    avatar_url: Mapped[str] = mapped_column(String(500))
    cover_url: Mapped[str] = mapped_column(String(500))
    location: Mapped[str] = mapped_column(String(160))
    service_area: Mapped[str] = mapped_column(String(255))
    rating: Mapped[Decimal] = mapped_column(Numeric(3, 2), default=0)
    review_count: Mapped[int] = mapped_column(default=0)
    starting_price: Mapped[int] = mapped_column(default=0)
    bio: Mapped[str] = mapped_column(Text)
    response_time: Mapped[str] = mapped_column(String(40))
    member_since: Mapped[int] = mapped_column(default=2024)
    bookings_count: Mapped[int] = mapped_column(default=0)
    lat: Mapped[float] = mapped_column()
    lng: Mapped[float] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped[Optional["User"]] = relationship(back_populates="photographer")
    services: Mapped[List["PhotographerService"]] = relationship(
        back_populates="photographer", cascade="all, delete-orphan", lazy="selectin",
    )
    styles: Mapped[List["PhotographerStyle"]] = relationship(
        back_populates="photographer", cascade="all, delete-orphan", lazy="selectin",
    )
    trust_signals: Mapped[List["PhotographerTrustSignal"]] = relationship(
        back_populates="photographer", cascade="all, delete-orphan", lazy="selectin",
    )
    spot_links: Mapped[List["PhotographerSpot"]] = relationship(
        back_populates="photographer", cascade="all, delete-orphan", lazy="selectin",
    )


class PhotographerService(Base):
    __tablename__ = "photographer_services"
    photographer_id: Mapped[int] = mapped_column(ForeignKey("photographers.id", ondelete="CASCADE"), primary_key=True)
    service: Mapped[str] = mapped_column(String(60), primary_key=True)
    photographer: Mapped[Photographer] = relationship(back_populates="services")


class PhotographerStyle(Base):
    __tablename__ = "photographer_styles"
    photographer_id: Mapped[int] = mapped_column(ForeignKey("photographers.id", ondelete="CASCADE"), primary_key=True)
    style: Mapped[str] = mapped_column(String(60), primary_key=True)
    photographer: Mapped[Photographer] = relationship(back_populates="styles")


class PhotographerTrustSignal(Base):
    __tablename__ = "photographer_trust_signals"
    photographer_id: Mapped[int] = mapped_column(ForeignKey("photographers.id", ondelete="CASCADE"), primary_key=True)
    signal: Mapped[str] = mapped_column(String(60), primary_key=True)
    photographer: Mapped[Photographer] = relationship(back_populates="trust_signals")


class Spot(Base):
    __tablename__ = "spots"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    slug: Mapped[str] = mapped_column(String(80), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    city: Mapped[str] = mapped_column(String(120))
    image_url: Mapped[str] = mapped_column(String(500))
    best_time: Mapped[str] = mapped_column(String(120))
    notes: Mapped[str] = mapped_column(Text)
    photographer_count: Mapped[int] = mapped_column(default=0)
    lat: Mapped[float] = mapped_column()
    lng: Mapped[float] = mapped_column()
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    best_for: Mapped[List["SpotBestFor"]] = relationship(
        back_populates="spot", cascade="all, delete-orphan", lazy="selectin",
    )
    photographer_links: Mapped[List["PhotographerSpot"]] = relationship(
        back_populates="spot", cascade="all, delete-orphan", lazy="selectin",
    )


class SpotBestFor(Base):
    __tablename__ = "spot_best_for"
    spot_id: Mapped[int] = mapped_column(ForeignKey("spots.id", ondelete="CASCADE"), primary_key=True)
    label: Mapped[str] = mapped_column(String(60), primary_key=True)
    spot: Mapped[Spot] = relationship(back_populates="best_for")


class PhotographerSpot(Base):
    __tablename__ = "photographer_spots"
    photographer_id: Mapped[int] = mapped_column(ForeignKey("photographers.id", ondelete="CASCADE"), primary_key=True)
    spot_id: Mapped[int] = mapped_column(ForeignKey("spots.id", ondelete="CASCADE"), primary_key=True)
    photographer: Mapped[Photographer] = relationship(back_populates="spot_links")
    spot: Mapped[Spot] = relationship(back_populates="photographer_links")


class Booking(Base):
    __tablename__ = "bookings"
    id: Mapped[int] = mapped_column(BigInteger, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    photographer_id: Mapped[int] = mapped_column(ForeignKey("photographers.id", ondelete="CASCADE"))
    spot_id: Mapped[Optional[int]] = mapped_column(ForeignKey("spots.id", ondelete="SET NULL"), nullable=True)
    status: Mapped[BookingStatus] = mapped_column(Enum(BookingStatus), default=BookingStatus.pending)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime)
    total_price: Mapped[int] = mapped_column(default=0)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped[User] = relationship(back_populates="bookings")
    photographer: Mapped[Photographer] = relationship()
    spot: Mapped[Optional["Spot"]] = relationship()

    __table_args__ = (UniqueConstraint("user_id", "photographer_id", "scheduled_at", name="uq_user_photographer_time"),)
