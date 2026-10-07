from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import UUID

from app.extensions import db


class Avatar(db.Model):
    """A player's profile picture. Kept in the database (not on disk) so
    it survives redeploys on hosts with throwaway disks; the app shrinks
    pictures to a small square before uploading."""

    __tablename__ = "avatars"

    user_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("users.id", ondelete="CASCADE"),
        primary_key=True,
    )
    data = db.Column(db.LargeBinary, nullable=False)
    mime = db.Column(db.String(32), nullable=False)
    updated_at = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
