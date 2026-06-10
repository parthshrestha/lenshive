"""add place_id to spots

Revision ID: 0004
Revises: 0003
Create Date: 2026-06-09

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("spots", sa.Column("place_id", sa.String(255), nullable=True))
    op.create_unique_constraint("uq_spots_place_id", "spots", ["place_id"])


def downgrade() -> None:
    op.drop_constraint("uq_spots_place_id", "spots", type_="unique")
    op.drop_column("spots", "place_id")
