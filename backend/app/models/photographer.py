from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db import Base
from .enums import VerificationStatus


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
    # Stripe Connect Express account + KYC progress. Unverified photographers
    # have a public profile but can't take bookings.
    stripe_account_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        Enum(VerificationStatus), default=VerificationStatus.unverified,
    )
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


class PhotographerSpot(Base):
    """Join table linking photographers to the spots they shoot at."""
    __tablename__ = "photographer_spots"
    photographer_id: Mapped[int] = mapped_column(ForeignKey("photographers.id", ondelete="CASCADE"), primary_key=True)
    spot_id: Mapped[int] = mapped_column(ForeignKey("spots.id", ondelete="CASCADE"), primary_key=True)
    photographer: Mapped[Photographer] = relationship(back_populates="spot_links")
    spot: Mapped["Spot"] = relationship(back_populates="photographer_links")
