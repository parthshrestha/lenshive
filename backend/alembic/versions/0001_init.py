"""init schema

Revision ID: 0001
Revises:
Create Date: 2026-06-06

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("email", sa.String(255), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("role", sa.Enum("user", "photographer", "videographer", "admin", "robot", name="userrole"), nullable=False, server_default="user"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )

    op.create_table(
        "photographers",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.BigInteger(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
        sa.Column("slug", sa.String(80), nullable=False),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("initials", sa.String(8), nullable=False),
        sa.Column("avatar_url", sa.String(500), nullable=False),
        sa.Column("cover_url", sa.String(500), nullable=False),
        sa.Column("location", sa.String(160), nullable=False),
        sa.Column("service_area", sa.String(255), nullable=False),
        sa.Column("rating", sa.Numeric(3, 2), nullable=False, server_default="0"),
        sa.Column("review_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("starting_price", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("bio", sa.Text(), nullable=False),
        sa.Column("response_time", sa.String(40), nullable=False),
        sa.Column("member_since", sa.Integer(), nullable=False, server_default="2024"),
        sa.Column("bookings_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lng", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("slug", name="uq_photographers_slug"),
    )

    for table, col in [
        ("photographer_services", "service"),
        ("photographer_styles", "style"),
        ("photographer_trust_signals", "signal"),
    ]:
        op.create_table(
            table,
            sa.Column("photographer_id", sa.BigInteger(), sa.ForeignKey("photographers.id", ondelete="CASCADE"), primary_key=True),
            sa.Column(col, sa.String(60), primary_key=True),
        )

    op.create_table(
        "spots",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("slug", sa.String(80), nullable=False),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("city", sa.String(120), nullable=False),
        sa.Column("image_url", sa.String(500), nullable=False),
        sa.Column("best_time", sa.String(120), nullable=False),
        sa.Column("notes", sa.Text(), nullable=False),
        sa.Column("photographer_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("lat", sa.Float(), nullable=False),
        sa.Column("lng", sa.Float(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("slug", name="uq_spots_slug"),
    )

    op.create_table(
        "spot_best_for",
        sa.Column("spot_id", sa.BigInteger(), sa.ForeignKey("spots.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("label", sa.String(60), primary_key=True),
    )

    op.create_table(
        "photographer_spots",
        sa.Column("photographer_id", sa.BigInteger(), sa.ForeignKey("photographers.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("spot_id", sa.BigInteger(), sa.ForeignKey("spots.id", ondelete="CASCADE"), primary_key=True),
    )

    op.create_table(
        "bookings",
        sa.Column("id", sa.BigInteger(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.BigInteger(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("photographer_id", sa.BigInteger(), sa.ForeignKey("photographers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("spot_id", sa.BigInteger(), sa.ForeignKey("spots.id", ondelete="SET NULL"), nullable=True),
        sa.Column("status", sa.Enum("pending", "confirmed", "cancelled", "completed", name="bookingstatus"), nullable=False, server_default="pending"),
        sa.Column("scheduled_at", sa.DateTime(), nullable=False),
        sa.Column("total_price", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("user_id", "photographer_id", "scheduled_at", name="uq_user_photographer_time"),
    )


def downgrade() -> None:
    for t in [
        "bookings",
        "photographer_spots",
        "spot_best_for",
        "spots",
        "photographer_trust_signals",
        "photographer_styles",
        "photographer_services",
        "photographers",
        "users",
    ]:
        op.drop_table(t)
