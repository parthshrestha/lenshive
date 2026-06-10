"""user onboarding answers + photographer Stripe verification

Revision ID: 0005
Revises: 0004
Create Date: 2026-06-09

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0005"
down_revision: Union[str, None] = "0004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("onboarding", sa.JSON(), nullable=True))
    op.add_column("users", sa.Column("onboarded_at", sa.DateTime(), nullable=True))
    op.add_column("photographers", sa.Column("stripe_account_id", sa.String(64), nullable=True))
    op.add_column(
        "photographers",
        sa.Column(
            "verification_status",
            sa.Enum("unverified", "pending", "verified", name="verificationstatus"),
            nullable=False,
            server_default="unverified",
        ),
    )
    # Seeded/filler photographers predate verification and keep the demo
    # marketplace bookable; real signups start unverified.
    op.execute("UPDATE photographers SET verification_status = 'verified'")


def downgrade() -> None:
    op.drop_column("photographers", "verification_status")
    op.drop_column("photographers", "stripe_account_id")
    op.drop_column("users", "onboarded_at")
    op.drop_column("users", "onboarding")
