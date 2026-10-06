"""user token_version + deleted_at

Revision ID: c7d8e9f0a1b2
Revises: b3c1d2e4f5a6
Create Date: 2026-10-03 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c7d8e9f0a1b2'
down_revision = 'b3c1d2e4f5a6'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('token_version', sa.Integer(), server_default='0', nullable=False)
        )
        batch_op.add_column(
            sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True)
        )


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('deleted_at')
        batch_op.drop_column('token_version')
