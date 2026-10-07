import uuid
from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import JSONB, UUID

from app.cosmetics import DEFAULT_BORDER
from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    # Version of the uploaded profile picture (see models/avatar.py), or
    # None. It goes into the picture's URL so a new upload busts caches.
    avatar = db.Column(db.String(255), nullable=True)
    # Profile border worn around the avatar (see app/cosmetics.py)
    border_id = db.Column(
        db.String(32),
        nullable=False,
        default=DEFAULT_BORDER,
        server_default=DEFAULT_BORDER,
    )
    # Coins earned by playing, spent on cosmetics
    coins = db.Column(db.Integer, nullable=False, default=0, server_default="0")
    # Ids of the paid borders this player has unlocked
    owned_borders = db.Column(JSONB, nullable=False, default=list, server_default="[]")
    # Bumped to sign out every device (password change, account deletion):
    # tokens carry the version they were issued for.
    token_version = db.Column(db.Integer, nullable=False, default=0, server_default="0")
    # Deleted accounts are scrubbed and kept as a tombstone so other
    # players' game history stays intact.
    deleted_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    @property
    def avatar_url(self) -> str | None:
        """Path of the profile picture, relative to the API's address."""
        if not self.avatar:
            return None
        return f"/api/v1/users/{self.id}/avatar?v={self.avatar}"

    def to_dict(self):
        return {
            "id": str(self.id),
            "username": self.username,
            "avatarUrl": self.avatar_url,
            "borderId": self.border_id or DEFAULT_BORDER,
        }

    def to_self_dict(self):
        """The account as its owner sees it: adds what is private."""
        return {
            **self.to_dict(),
            "coins": self.coins,
            "ownedBorders": list(self.owned_borders or []),
        }
