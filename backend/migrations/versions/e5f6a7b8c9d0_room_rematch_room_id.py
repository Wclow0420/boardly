"""room rematch_room_id

Revision ID: e5f6a7b8c9d0
Revises: d1e2f3a4b5c6
Create Date: 2026-10-03 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'e5f6a7b8c9d0'
down_revision = 'd1e2f3a4b5c6'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('rooms', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('rematch_room_id', postgresql.UUID(as_uuid=True), nullable=True)
        )
        batch_op.create_foreign_key(
            'rooms_rematch_room_id_fkey', 'rooms', ['rematch_room_id'], ['id']
        )


def downgrade():
    with op.batch_alter_table('rooms', schema=None) as batch_op:
        batch_op.drop_constraint('rooms_rematch_room_id_fkey', type_='foreignkey')
        batch_op.drop_column('rematch_room_id')
