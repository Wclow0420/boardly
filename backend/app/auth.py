"""JWT auth: access token (short-lived) + refresh token (long-lived).

Stateless HS256 tokens signed with SECRET_KEY. Logout is client-side
(delete tokens); add a revocation table if/when sessions must be
killable server-side.
"""

import uuid
from datetime import datetime, timedelta, timezone
from functools import wraps

import jwt
from flask import current_app, g, request

from app.extensions import db
from app.models import User
from app.utils import api_error

ACCESS_TTL = timedelta(hours=1)
REFRESH_TTL = timedelta(days=30)


def _encode(user_id, token_type: str, ttl: timedelta) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": str(user_id),
            "type": token_type,
            "iat": now,
            "exp": now + ttl,
            # Unique token id — also makes same-second tokens distinct
            "jti": uuid.uuid4().hex,
        },
        current_app.config["SECRET_KEY"],
        algorithm="HS256",
    )


def issue_tokens(user: User) -> dict:
    return {
        "accessToken": _encode(user.id, "access", ACCESS_TTL),
        "refreshToken": _encode(user.id, "refresh", REFRESH_TTL),
    }


def decode_token(token: str, expected_type: str) -> dict:
    """Raises jwt.InvalidTokenError (incl. ExpiredSignatureError)."""
    payload = jwt.decode(
        token, current_app.config["SECRET_KEY"], algorithms=["HS256"]
    )
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError(f"Expected a {expected_type} token")
    return payload


def require_auth(fn):
    """Route decorator: validates the Bearer access token and sets
    g.current_user."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return api_error("unauthorized", "Missing access token", 401)
        try:
            payload = decode_token(header[len("Bearer "):], "access")
        except jwt.ExpiredSignatureError:
            return api_error("token_expired", "Access token expired", 401)
        except jwt.InvalidTokenError:
            return api_error("unauthorized", "Invalid access token", 401)

        user = db.session.get(User, uuid.UUID(payload["sub"]))
        if user is None:
            return api_error("unauthorized", "Account no longer exists", 401)
        g.current_user = user
        return fn(*args, **kwargs)

    return wrapper
