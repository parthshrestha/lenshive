from __future__ import annotations

from datetime import datetime
from typing import Optional

from sqlalchemy import BigInteger, DateTime, Enum, ForeignKey, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..db import Base
from .enums import BookingStatus


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

    user: Mapped["User"] = relationship(back_populates="bookings")
    photographer: Mapped["Photographer"] = relationship()
    spot: Mapped[Optional["Spot"]] = relationship()

    __table_args__ = (
        UniqueConstraint("user_id", "photographer_id", "scheduled_at", name="uq_user_photographer_time"),
    )
