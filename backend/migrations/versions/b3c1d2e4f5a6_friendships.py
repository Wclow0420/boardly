"""friendships

Revision ID: b3c1d2e4f5a6
Revises: 00aafe69b479
Create Date: 2026-10-03 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'b3c1d2e4f5a6'
down_revision = '00aafe69b479'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'friendships',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('requester_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('addressee_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('responded_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['addressee_id'], ['users.id']),
        sa.ForeignKeyConstraint(['requester_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('requester_id', 'addressee_id'),
    )
    with op.batch_alter_table('friendships', schema=None) as batch_op:
        batch_op.create_index(
            batch_op.f('ix_friendships_addressee_id'), ['addressee_id'], unique=False
        )
        batch_op.create_index(
            batch_op.f('ix_friendships_requester_id'), ['requester_id'], unique=False
        )


def downgrade():
    with op.batch_alter_table('friendships', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_friendships_requester_id'))
        batch_op.drop_index(batch_op.f('ix_friendships_addressee_id'))

    op.drop_table('friendships')
