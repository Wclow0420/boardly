from flask import Blueprint, Response

from app.extensions import db
from app.models import Avatar, User
from app.utils import api_error

users_bp = Blueprint("users", __name__)


@users_bp.get("/<uuid:user_id>/avatar")
def avatar(user_id):
    """A player's profile picture. Public, like their username: images
    load without auth headers. The URL carries a version (?v=), so the
    picture can be cached for good."""
    user = db.session.get(User, user_id)
    picture = db.session.get(Avatar, user_id) if user and user.avatar else None
    if picture is None:
        return api_error("not_found", "No profile picture", 404)
    return Response(
        picture.data,
        mimetype=picture.mime,
        headers={
            "Cache-Control": "public, max-age=31536000, immutable",
            "X-Content-Type-Options": "nosniff",
        },
    )
