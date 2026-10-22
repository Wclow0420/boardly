"""practice tables, bot games kept apart from badges, coins collected

A practice table is opened already filled with bots (rooms.practice).
Games with a bot at the table now count towards stats but never badges
(session_players.with_bots). Coins go straight onto the balance when a
game ends: any reward still waiting to be claimed is paid in now.

Revision ID: e7f8a9b0c1d2
Revises: d4e5f6a7b8c9
Create Date: 2026-10-21 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e7f8a9b0c1d2'
down_revision = 'd4e5f6a7b8c9'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('rooms', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('practice', sa.Boolean(), nullable=False, server_default='false')
        )
    with op.batch_alter_table('session_players', schema=None) as batch_op:
        batch_op.add_column(
            sa.Column('with_bots', sa.Boolean(), nullable=False, server_default='false')
        )
    # No more claiming: what was waiting goes onto the balance
    op.execute(
        """
        UPDATE users AS u SET coins = u.coins + w.total
        FROM (
            SELECT user_id, SUM(amount) AS total FROM coin_rewards
            WHERE claimed_at IS NULL GROUP BY user_id
        ) AS w
        WHERE u.id = w.user_id
        """
    )
    op.execute("UPDATE coin_rewards SET claimed_at = now() WHERE claimed_at IS NULL")


def downgrade():
    with op.batch_alter_table('session_players', schema=None) as batch_op:
        batch_op.drop_column('with_bots')
    with op.batch_alter_table('rooms', schema=None) as batch_op:
        batch_op.drop_column('practice')
