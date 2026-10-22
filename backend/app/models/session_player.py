import uuid

from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.extensions import db


class SessionPlayer(db.Model):
    """How one player did in one finished game: the record behind
    per-game stats and badges. Written once, when the game ends (see
    app/outcomes.py), so it survives players leaving the room later.

    `facts` holds what the game wants remembered for its badges (its
    player_outcome hook). Rows copied from games played before this
    table existed have facts = NULL until they are filled in from the
    game's saved state."""

    __tablename__ = "session_players"
    __table_args__ = (
        db.UniqueConstraint("session_id", "user_id", name="session_players_session_user_key"),
    )

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("game_sessions.id"), nullable=False
    )
    user_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True
    )
    game_type = db.Column(db.String(50), nullable=False)
    seat = db.Column(db.Integer, nullable=False)
    # "good" | "evil" in games with hidden sides, else None
    side = db.Column(db.String(20), nullable=True)
    role = db.Column(db.String(40), nullable=True)
    won = db.Column(db.Boolean, nullable=False, default=False)
    # The game ended because someone walked out
    abandoned = db.Column(db.Boolean, nullable=False, default=False)
    # This player is the one who walked out
    left_game = db.Column(db.Boolean, nullable=False, default=False)
    # A bot was at the table: counts as played (and won) on the card,
    # never towards a badge (see app/rewards.py)
    with_bots = db.Column(db.Boolean, nullable=False, default=False, server_default="false")
    facts = db.Column(JSONB, nullable=True)
    finished_at = db.Column(db.DateTime(timezone=True), nullable=False)
