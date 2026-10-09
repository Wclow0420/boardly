import random
import string
import uuid
from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.extensions import db


def generate_room_code():
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=6))


class Room(db.Model):
    """A lobby where friends gather before/while playing a game."""

    __tablename__ = "rooms"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = db.Column(db.String(6), unique=True, nullable=False, default=generate_room_code)
    game_type = db.Column(db.String(50), nullable=False)
    host_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False)
    status = db.Column(db.String(20), default="waiting")  # waiting | playing | finished | closed
    # The host's game settings (see BaseGame.options)
    options = db.Column(JSONB, nullable=False, default=dict, server_default="{}")
    # The table opened by "Play again" after this room's game finished
    rematch_room_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("rooms.id"), nullable=True
    )
    created_at = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    host = db.relationship("User", foreign_keys=[host_id])
    rematch_room = db.relationship("Room", remote_side=[id])
    players = db.relationship("RoomPlayer", back_populates="room", cascade="all, delete-orphan")
    sessions = db.relationship("GameSession", back_populates="room", cascade="all, delete-orphan")

    def to_dict(self):
        # Local import to avoid a models <-> games import cycle
        from app.games import GAMES

        game = GAMES.get(self.game_type)
        rematch = self.rematch_room
        return {
            "id": str(self.id),
            "code": self.code,
            "gameType": self.game_type,
            "hostId": str(self.host_id),
            "status": self.status,
            "players": [p.to_dict() for p in self.players],
            "game": game.to_dict() if game else None,
            "options": game.clean_options(None, self.options) if game else {},
            # Set while a rematch table is open and waiting for players
            "rematchCode": (
                rematch.code if rematch is not None and rematch.status == "waiting" else None
            ),
        }


class RoomPlayer(db.Model):
    __tablename__ = "room_players"
    __table_args__ = (db.UniqueConstraint("room_id", "user_id"),)

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id = db.Column(UUID(as_uuid=True), db.ForeignKey("rooms.id"), nullable=False)
    user_id = db.Column(UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False)
    seat = db.Column(db.Integer, nullable=False)  # turn order / player index
    # Lobby readiness — the host is always ready by definition
    ready = db.Column(db.Boolean, nullable=False, default=False, server_default="false")
    joined_at = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    room = db.relationship("Room", back_populates="players")
    user = db.relationship("User")

    def to_dict(self):
        return {
            "userId": str(self.user_id),
            "username": self.user.username if self.user else None,
            "borderId": self.user.border_id if self.user else None,
            "avatarUrl": self.user.avatar_url if self.user else None,
            "seat": self.seat,
            "ready": self.ready,
        }
