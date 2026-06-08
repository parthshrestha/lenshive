from __future__ import annotations

from datetime import datetime
from typing import List

from sqlalchemy import BigInteger, DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db import Base


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
