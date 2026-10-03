import uuid
from datetime import datetime, timezone

from sqlalchemy.dialects.postgresql import UUID

from app.extensions import db


class Friendship(db.Model):
    """A friend request (pending) or an established friendship
    (accepted). One row per pair — the routes never create a reverse
    duplicate, they accept the existing request instead."""

    __tablename__ = "friendships"
    __table_args__ = (db.UniqueConstraint("requester_id", "addressee_id"),)

    id = db.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    requester_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True
    )
    addressee_id = db.Column(
        UUID(as_uuid=True), db.ForeignKey("users.id"), nullable=False, index=True
    )
    status = db.Column(db.String(20), nullable=False, default="pending")  # pending | accepted
    created_at = db.Column(
        db.DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    responded_at = db.Column(db.DateTime(timezone=True), nullable=True)

    requester = db.relationship("User", foreign_keys=[requester_id])
    addressee = db.relationship("User", foreign_keys=[addressee_id])

    def other_id(self, user_id):
        return self.addressee_id if self.requester_id == user_id else self.requester_id
