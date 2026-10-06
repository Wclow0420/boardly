import uuid
from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import UUID

from app.cosmetics import DEFAULT_BORDER
from app.extensions import db


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    avatar = db.Column(db.String(255), nullable=True)
    # Profile border worn around the avatar (see app/cosmetics.py)
    border_id = db.Column(
        db.String(32),
        nullable=False,
        default=DEFAULT_BORDER,
        server_default=DEFAULT_BORDER,
    )
    # Bumped to sign out every device (password change, account deletion):
    # tokens carry the version they were issued for.
    token_version = db.Column(db.Integer, nullable=False, default=0, server_default="0")
    # Deleted accounts are scrubbed and kept as a tombstone so other
    # players' game history stays intact.
    deleted_at = db.Column(db.DateTime(timezone=True), nullable=True)
    created_at = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    def to_dict(self):
        return {
            "id": str(self.id),
            "username": self.username,
            "avatar": self.avatar,
            "borderId": self.border_id or DEFAULT_BORDER,
        }
