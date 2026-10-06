"""game session winner_user_ids

Revision ID: d1e2f3a4b5c6
Revises: c7d8e9f0a1b2
Create Date: 2026-10-03 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'd1e2f3a4b5c6'
down_revision = 'c7d8e9f0a1b2'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('game_sessions', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                'winner_user_ids',
                postgresql.JSONB(astext_type=sa.Text()),
                nullable=True,
            )
        )


def downgrade():
    with op.batch_alter_table('game_sessions', schema=None) as batch_op:
        batch_op.drop_column('winner_user_ids')
