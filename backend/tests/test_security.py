"""Production hardening: config guard, rate limits, session
revocation, account deletion, socket room access."""

import uuid

import pytest

from app import create_app
from app.extensions import db, limiter, socketio
from app.models import User
from tests.conftest import TestConfig

AUTH = "/api/v1/auth"


def _login(client, username, password="secret123"):
    return client.post(
        f"{AUTH}/login", json={"username": username, "password": password}
    )


def test_production_requires_a_real_secret():
    class Prod(TestConfig):
        APP_ENV = "production"

    for bad in ("dev-secret-change-me", "short", ""):
        Prod.SECRET_KEY = bad
        with pytest.raises(RuntimeError):
            create_app(Prod)

    Prod.SECRET_KEY = "x" * 48
    assert create_app(Prod) is not None


def test_login_is_rate_limited(app, make_user):
    make_user("alice")

    class Limited(TestConfig):
        RATELIMIT_ENABLED = True

    limited = create_app(Limited)
    with limited.app_context():
        limiter.reset()
        client = limited.test_client()
        codes = [_login(client, "alice", "wrong-password").status_code for _ in range(12)]
        limiter.reset()

    assert codes[:10] == [401] * 10
    assert codes[10:] == [429, 429]


def test_change_password_revokes_other_sessions(client, make_user):
    alice = make_user("alice")
    other_device = _login(client, "alice").get_json()

    res = client.post(
        f"{AUTH}/password",
        json={"currentPassword": "nope", "newPassword": "brand-new-1"},
        headers=alice["headers"],
    )
    assert res.get_json()["error"]["code"] == "wrong_password"
    res = client.post(
        f"{AUTH}/password",
        json={"currentPassword": "secret123", "newPassword": "123"},
        headers=alice["headers"],
    )
    assert res.get_json()["error"]["code"] == "invalid_password"

    res = client.post(
        f"{AUTH}/password",
        json={"currentPassword": "secret123", "newPassword": "brand-new-1"},
        headers=alice["headers"],
    )
    assert res.status_code == 200
    fresh = res.get_json()["accessToken"]

    # this device keeps working with the new tokens...
    assert client.get(
        f"{AUTH}/me", headers={"Authorization": f"Bearer {fresh}"}
    ).status_code == 200
    # ...every token issued before the change is dead
    assert client.get(f"{AUTH}/me", headers=alice["headers"]).status_code == 401
    assert client.post(
        f"{AUTH}/refresh", json={"refreshToken": other_device["refreshToken"]}
    ).status_code == 401

    assert _login(client, "alice").status_code == 401
    assert _login(client, "alice", "brand-new-1").status_code == 200


def test_delete_account(app, client, make_user):
    alice, bob, carol = make_user("alice"), make_user("bob"), make_user("carol")
    for sender, target in ((alice, bob), (bob, alice), (carol, alice)):
        client.post(
            "/api/v1/friends/requests",
            json={"userId": target["id"]},
            headers=sender["headers"],
        )

    # a finished game (bob forfeits) and an open table hosted by alice
    room = client.post(
        "/api/v1/rooms", json={"gameType": "tictactoe"}, headers=alice["headers"]
    ).get_json()["room"]
    client.post("/api/v1/rooms/join", json={"code": room["code"]}, headers=bob["headers"])
    client.post(f"/api/v1/rooms/{room['id']}/ready", json={"ready": True}, headers=bob["headers"])
    client.post(f"/api/v1/rooms/{room['id']}/start", headers=alice["headers"])
    client.post(f"/api/v1/rooms/{room['id']}/leave", headers=bob["headers"])
    open_room = client.post(
        "/api/v1/rooms", json={"gameType": "tictactoe"}, headers=alice["headers"]
    ).get_json()["room"]

    res = client.delete(f"{AUTH}/me", json={"password": "wrong"}, headers=alice["headers"])
    assert res.get_json()["error"]["code"] == "wrong_password"
    res = client.delete(f"{AUTH}/me", json={"password": "secret123"}, headers=alice["headers"])
    assert res.status_code == 200

    # the account is gone: tokens dead, cannot log in
    assert client.get(f"{AUTH}/me", headers=alice["headers"]).status_code == 401
    assert _login(client, "alice").status_code == 401

    # nothing of alice is left for the others
    data = client.get("/api/v1/friends", headers=bob["headers"]).get_json()
    assert data == {"friends": [], "incoming": [], "outgoing": [], "recent": []}
    assert client.get("/api/v1/friends", headers=carol["headers"]).get_json()["outgoing"] == []
    users = client.get(
        "/api/v1/friends/search", query_string={"q": "al"}, headers=bob["headers"]
    ).get_json()["users"]
    assert users == []

    # her open table closed; the finished game keeps bob's history
    closed = client.get(
        f"/api/v1/rooms/code/{open_room['code']}", headers=bob["headers"]
    ).get_json()["room"]
    assert closed["status"] == "closed"
    stats = client.get(f"{AUTH}/me/stats", headers=bob["headers"]).get_json()["stats"]
    assert stats["gamesPlayed"] == 1

    # the username is free again
    assert make_user("alice")["id"] != alice["id"]


def test_room_channel_is_members_only(app, client, make_user):
    alice, bob, eve = make_user("alice"), make_user("bob"), make_user("eve")
    room = client.post(
        "/api/v1/rooms", json={"gameType": "tictactoe"}, headers=alice["headers"]
    ).get_json()["room"]

    def connect(user=None):
        sock = socketio.test_client(app)
        if user is not None:
            assert sock.emit("authenticate", {"token": user["token"]}, callback=True) == {"ok": True}
        return sock

    host, outsider, anonymous = connect(alice), connect(eve), connect()
    join = {"roomId": room["id"]}
    assert host.emit("join_room", join, callback=True) == {"ok": True}
    assert outsider.emit("join_room", join, callback=True) == {"ok": False}
    assert anonymous.emit("join_room", join, callback=True) == {"ok": False}
    assert host.emit("join_room", {"roomId": "nonsense"}, callback=True) == {"ok": False}

    client.post("/api/v1/rooms/join", json={"code": room["code"]}, headers=bob["headers"])

    def heard(sock):
        return [e["name"] for e in sock.get_received()]

    assert "room_updated" in heard(host)
    assert "room_updated" not in heard(outsider)
    assert "room_updated" not in heard(anonymous)


def test_profile_border_default_change_and_visibility(app, client, make_user):
    alice = make_user("alice_border")
    bob = make_user("bob_border")

    me = client.get("/api/v1/auth/me", headers=alice["headers"]).get_json()["user"]
    assert me["borderId"] == "wood"

    bad = client.patch(
        "/api/v1/auth/me", json={"borderId": "nope"}, headers=alice["headers"]
    )
    assert bad.status_code == 400
    assert bad.get_json()["error"]["code"] == "invalid_border"

    # (she has unlocked it; buying is covered in test_coins.py)
    user = db.session.get(User, uuid.UUID(alice["id"]))
    user.owned_borders = ["ember"]
    db.session.commit()

    ok = client.patch(
        "/api/v1/auth/me", json={"borderId": "ember"}, headers=alice["headers"]
    )
    assert ok.status_code == 200
    assert ok.get_json()["user"]["borderId"] == "ember"

    # Other players see it wherever she appears: in a room…
    room = client.post(
        "/api/v1/rooms", json={"gameType": "tictactoe"}, headers=alice["headers"]
    ).get_json()["room"]
    joined = client.post(
        "/api/v1/rooms/join", json={"code": room["code"]}, headers=bob["headers"]
    ).get_json()["room"]
    borders = {p["username"]: p["borderId"] for p in joined["players"]}
    assert borders == {"alice_border": "ember", "bob_border": "wood"}

    # …and in search results on the friends screen
    found = client.get(
        "/api/v1/friends/search?q=alice_border", headers=bob["headers"]
    ).get_json()
    assert found["users"][0]["borderId"] == "ember"
