"""room game options

Revision ID: c9d0e1f2a3b4
Revises: b8c9d0e1f2a3
Create Date: 2026-10-09 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'c9d0e1f2a3b4'
down_revision = 'b8c9d0e1f2a3'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('rooms', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                'options',
                postgresql.JSONB(astext_type=sa.Text()),
                nullable=False,
                server_default='{}',
            )
        )


def downgrade():
    with op.batch_alter_table('rooms', schema=None) as batch_op:
        batch_op.drop_column('options')
