"""coins, owned borders, coin rewards

Revision ID: a7b8c9d0e1f2
Revises: f6a7b8c9d0e1
Create Date: 2026-10-06 18:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision = 'a7b8c9d0e1f2'
down_revision = 'f6a7b8c9d0e1'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('coins', sa.Integer(), nullable=False, server_default='0')
        )
        batch_op.add_column(
            sa.Column(
                'owned_borders',
                postgresql.JSONB(astext_type=sa.Text()),
                nullable=False,
                server_default='[]',
            )
        )
    # Borders were free to pick before coins existed: let everyone keep
    # the paid one they are already wearing.
    op.execute(
        """
        UPDATE users
        SET owned_borders = jsonb_build_array(border_id)
        WHERE border_id NOT IN ('wood', 'none')
        """
    )

    op.create_table(
        'coin_rewards',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('game_type', sa.String(length=50), nullable=False),
        sa.Column('amount', sa.Integer(), nullable=False),
        sa.Column('reason', sa.String(length=20), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('claimed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['session_id'], ['game_sessions.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'user_id', 'session_id', name='coin_rewards_user_session_key'
        ),
    )
    op.create_index('ix_coin_rewards_user_id', 'coin_rewards', ['user_id'])


def downgrade():
    op.drop_index('ix_coin_rewards_user_id', table_name='coin_rewards')
    op.drop_table('coin_rewards')
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('owned_borders')
        batch_op.drop_column('coins')
