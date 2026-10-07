"""profile pictures

Revision ID: b8c9d0e1f2a3
Revises: a7b8c9d0e1f2
Create Date: 2026-10-07 15:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'b8c9d0e1f2a3'
down_revision = 'a7b8c9d0e1f2'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'avatars',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('data', sa.LargeBinary(), nullable=False),
        sa.Column('mime', sa.String(length=32), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id'),
    )


def downgrade():
    op.drop_table('avatars')
