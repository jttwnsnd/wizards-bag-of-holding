"""create folders table

Revision ID: 44c377c2ee7d
Revises: 6ecb23b20667
Create Date: 2026-05-27 20:28:38.658246

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '44c377c2ee7d'
down_revision: Union[str, Sequence[str], None] = '6ecb23b20667'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'folders',
        sa.Column('id', sa.dialects.postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('owner_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('parent_id', sa.dialects.postgresql.UUID(as_uuid=True), sa.ForeignKey('folders.id'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now()),
    )


def downgrade() -> None:
    op.drop_table('folders')
