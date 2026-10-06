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


def _encode(user_id, token_type: str, ttl: timedelta, version: int = 0) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {
            "sub": str(user_id),
            "type": token_type,
            "ver": version,
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
        "accessToken": _encode(user.id, "access", ACCESS_TTL, user.token_version),
        "refreshToken": _encode(
            user.id, "refresh", REFRESH_TTL, user.token_version
        ),
    }


def decode_token(token: str, expected_type: str) -> dict:
    """Raises jwt.InvalidTokenError (incl. ExpiredSignatureError)."""
    payload = jwt.decode(
        token, current_app.config["SECRET_KEY"], algorithms=["HS256"]
    )
    if payload.get("type") != expected_type:
        raise jwt.InvalidTokenError(f"Expected a {expected_type} token")
    return payload


def user_from_token(token: str, expected_type: str) -> User:
    """The account a token belongs to. Raises jwt.InvalidTokenError if
    the token is bad, the account is gone, or the token was issued
    before the account's sessions were revoked."""
    payload = decode_token(token, expected_type)
    try:
        user = db.session.get(User, uuid.UUID(payload["sub"]))
    except (KeyError, ValueError):
        user = None
    if user is None or user.deleted_at is not None:
        raise jwt.InvalidTokenError("Account no longer exists")
    if payload.get("ver", 0) != user.token_version:
        raise jwt.InvalidTokenError("Session was signed out")
    return user


def require_auth(fn):
    """Route decorator: validates the Bearer access token and sets
    g.current_user."""

    @wraps(fn)
    def wrapper(*args, **kwargs):
        header = request.headers.get("Authorization", "")
        if not header.startswith("Bearer "):
            return api_error("unauthorized", "Missing access token", 401)
        try:
            g.current_user = user_from_token(header[len("Bearer "):], "access")
        except jwt.ExpiredSignatureError:
            return api_error("token_expired", "Access token expired", 401)
        except jwt.InvalidTokenError:
            return api_error("unauthorized", "Invalid access token", 401)
        return fn(*args, **kwargs)

    return wrapper
