"""session players: each player's outcome per finished game

Revision ID: a1b2c3d4e5f6
Revises: c9d0e1f2a3b4
Create Date: 2026-10-14 17:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = 'a1b2c3d4e5f6'
down_revision = 'c9d0e1f2a3b4'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'session_players',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('session_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('game_type', sa.String(length=50), nullable=False),
        sa.Column('seat', sa.Integer(), nullable=False),
        sa.Column('side', sa.String(length=20), nullable=True),
        sa.Column('role', sa.String(length=40), nullable=True),
        sa.Column('won', sa.Boolean(), nullable=False),
        sa.Column('abandoned', sa.Boolean(), nullable=False),
        sa.Column('left_game', sa.Boolean(), nullable=False),
        sa.Column('facts', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('finished_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['session_id'], ['game_sessions.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_id', 'user_id', name='session_players_session_user_key'),
    )
    op.create_index('ix_session_players_user_id', 'session_players', ['user_id'])
    # Games finished before this table: the players still listed in the
    # room. facts stays NULL so sides and roles are filled in later from
    # each game's saved state (app/outcomes.py).
    op.execute(
        """
        INSERT INTO session_players
            (id, session_id, user_id, game_type, seat, won, abandoned, left_game, facts, finished_at)
        SELECT gen_random_uuid(), s.id, rp.user_id, s.game_type, rp.seat,
               COALESCE(s.winner_user_id = rp.user_id, false)
                OR COALESCE(s.winner_user_ids, '[]'::jsonb) @> jsonb_build_array(rp.user_id::text),
               false, false, NULL, COALESCE(s.finished_at, s.started_at)
        FROM game_sessions s
        JOIN room_players rp ON rp.room_id = s.room_id
        WHERE s.status = 'finished'
        ON CONFLICT DO NOTHING
        """
    )


def downgrade():
    op.drop_index('ix_session_players_user_id', table_name='session_players')
    op.drop_table('session_players')
