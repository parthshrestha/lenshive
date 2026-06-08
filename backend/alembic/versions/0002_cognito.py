"""drop password_hash, add cognito_sub + username

Revision ID: 0002
Revises: 0001
Create Date: 2026-06-06

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("users", "password_hash")
    op.add_column("users", sa.Column("cognito_sub", sa.String(64), nullable=True))
    op.add_column("users", sa.Column("username", sa.String(40), nullable=True))
    op.create_unique_constraint("uq_users_cognito_sub", "users", ["cognito_sub"])
    op.create_unique_constraint("uq_users_username", "users", ["username"])
    op.create_index("ix_users_cognito_sub", "users", ["cognito_sub"])
    op.create_index("ix_users_username", "users", ["username"])


def downgrade() -> None:
    op.drop_index("ix_users_username", "users")
    op.drop_index("ix_users_cognito_sub", "users")
    op.drop_constraint("uq_users_username", "users", type_="unique")
    op.drop_constraint("uq_users_cognito_sub", "users", type_="unique")
    op.drop_column("users", "username")
    op.drop_column("users", "cognito_sub")
    op.add_column("users", sa.Column("password_hash", sa.String(255), nullable=False))
