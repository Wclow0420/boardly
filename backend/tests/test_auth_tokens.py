"""Token helper tests — pure JWT round-trips, no database needed."""

import uuid

import jwt as pyjwt
import pytest

from app import create_app
from app.auth import _encode, ACCESS_TTL, decode_token


@pytest.fixture()
def app_ctx():
    app = create_app()
    with app.app_context():
        yield


def test_access_token_round_trip(app_ctx):
    user_id = uuid.uuid4()
    token = _encode(user_id, "access", ACCESS_TTL)
    payload = decode_token(token, "access")
    assert payload["sub"] == str(user_id)


def test_wrong_token_type_rejected(app_ctx):
    token = _encode(uuid.uuid4(), "refresh", ACCESS_TTL)
    with pytest.raises(pyjwt.InvalidTokenError):
        decode_token(token, "access")


def test_tampered_token_rejected(app_ctx):
    token = _encode(uuid.uuid4(), "access", ACCESS_TTL)
    with pytest.raises(pyjwt.InvalidTokenError):
        decode_token(token[:-2] + "xx", "access")
