import uuid
from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import UUID

from app.extensions import db


class CoinReward(db.Model):
    """Coins a player earned from one finished game. They sit here until
    the player claims them, which moves them onto User.coins."""

    __tablename__ = "coin_rewards"
    __table_args__ = (
        db.UniqueConstraint("user_id", "session_id", name="coin_rewards_user_session_key"),
    )

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True
    )
    session_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("game_sessions.id"), nullable=False
    )
    game_type = db.Column(db.String(50), nullable=False)
    amount = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.String(20), nullable=False)  # win | played
    created_at = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    claimed_at = db.Column(db.DateTime(timezone=True), nullable=True)

    def to_dict(self):
        return {
            "id": str(self.id),
            "sessionId": str(self.session_id),
            "gameType": self.game_type,
            "amount": self.amount,
            "reason": self.reason,
        }
