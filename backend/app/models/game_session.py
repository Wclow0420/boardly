import uuid
from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.extensions import db


class GameSession(db.Model):
    """One playthrough of a game inside a room. Game-agnostic:
    the per-game state lives in the JSONB `state` column and is
    interpreted by the game engine in app/games/<game_type>/."""

    __tablename__ = "game_sessions"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id = db.Column(UUID(as_uuid=True), db.ForeignKey("rooms.id"), nullable=False)
    game_type = db.Column(db.String(50), nullable=False)
    state = db.Column(JSONB, nullable=False, default=dict)
    status = db.Column(db.String(20), default="in_progress")  # in_progress | finished
    winner_user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=True)
    # Every winner as a list of user-id strings (team games have several).
    # winner_user_id stays set when there is exactly one.
    winner_user_ids = db.Column(JSONB, nullable=True)
    started_at = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    finished_at = db.Column(db.DateTime(timezone=True), nullable=True)

    room = db.relationship("Room", back_populates="sessions")

    def to_dict(self, seat: int = -1):
        """Session as one player sees it — `state` goes through the
        game's view_for so hidden information never leaves the server.
        `seat` is -1 for someone who is not at the table."""
        # Local import to avoid a models <-> games import cycle
        from app.games import GAMES

        game = GAMES.get(self.game_type)
        return {
            "id": str(self.id),
            "roomId": str(self.room_id),
            "gameType": self.game_type,
            "state": game.view_for(self.state, seat) if game else {},
            "status": self.status,
            "winnerUserId": (
                str(self.winner_user_id) if self.winner_user_id else None
            ),
            "winnerUserIds": self.winner_user_ids or [],
        }
