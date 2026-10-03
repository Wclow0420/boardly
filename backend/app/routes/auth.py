import uuid

import jwt as pyjwt
from flask import Blueprint, g, request
from werkzeug.security import check_password_hash, generate_password_hash

from app.auth import decode_token, issue_tokens, require_auth
from app.extensions import db
from app.models import User
from app.utils import api_error

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/register")
def register():
    """Body: {"username": "...", "password": "..."}"""
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if len(username) < 3 or len(username) > 30:
        return api_error(
            "invalid_username", "Username must be 3-30 characters", 400
        )
    if len(password) < 6:
        return api_error(
            "invalid_password", "Password must be at least 6 characters", 400
        )
    if User.query.filter_by(username=username).first() is not None:
        return api_error("username_taken", "That username is already taken", 409)

    user = User(username=username, password_hash=generate_password_hash(password))
    db.session.add(user)
    db.session.commit()
    return {"user": user.to_dict(), **issue_tokens(user)}, 201


@auth_bp.post("/login")
def login():
    """Body: {"username": "...", "password": "..."}"""
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    user = User.query.filter_by(username=username).first()
    if user is None or not check_password_hash(user.password_hash, password):
        return api_error("invalid_credentials", "Wrong username or password", 401)

    return {"user": user.to_dict(), **issue_tokens(user)}


@auth_bp.post("/refresh")
def refresh():
    """Body: {"refreshToken": "..."} — rotates both tokens."""
    data = request.get_json() or {}
    token = data.get("refreshToken") or ""
    try:
        payload = decode_token(token, "refresh")
    except pyjwt.InvalidTokenError:
        return api_error("unauthorized", "Invalid or expired refresh token", 401)

    user = db.session.get(User, uuid.UUID(payload["sub"]))
    if user is None:
        return api_error("unauthorized", "Account no longer exists", 401)
    return {"user": user.to_dict(), **issue_tokens(user)}


@auth_bp.get("/me")
@require_auth
def me():
    return {"user": g.current_user.to_dict()}
