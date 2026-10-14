"""The lobby's "add bots" button (development only)."""

import pytest

from app import bots

ROOMS = "/api/v1/rooms"


@pytest.fixture()
def spawned(monkeypatch):
    calls = []
    monkeypatch.setattr(bots.subprocess, "Popen", lambda args, **kw: calls.append(args))
    return calls


def _table(client, user, game="nightwatch"):
    return client.post(ROOMS, json={"gameType": game}, headers=user["headers"]).get_json()["room"]


def test_the_host_adds_bots_to_a_waiting_table(client, make_user, spawned):
    alice = make_user("alice")
    room = _table(client, alice)
    assert room["botsAvailable"] is True
    res = client.post(f"{ROOMS}/{room['id']}/bots", json={"count": 4}, headers=alice["headers"])
    assert res.status_code == 202
    assert res.get_json() == {"added": 4}
    assert len(spawned) == 1
    assert room["code"] in spawned[0] and "4" in spawned[0]


def test_only_the_host_and_never_beyond_the_seats(client, make_user, spawned):
    alice, bob = make_user("alice"), make_user("bob")
    room = _table(client, alice)
    client.post(f"{ROOMS}/join", json={"code": room["code"]}, headers=bob["headers"])
    url = f"{ROOMS}/{room['id']}/bots"
    assert client.post(url, json={"count": 1}, headers=bob["headers"]).status_code == 403
    # ten seats, two taken
    assert client.post(url, json={"count": 9}, headers=alice["headers"]).status_code == 400
    assert client.post(url, json={"count": 0}, headers=alice["headers"]).status_code == 400
    assert client.post(url, json={"count": "3"}, headers=alice["headers"]).status_code == 400
    assert spawned == []


def test_not_for_games_without_bots(client, make_user, spawned):
    alice = make_user("alice")
    room = _table(client, alice, "tictactoe")
    assert room["botsAvailable"] is False
    res = client.post(f"{ROOMS}/{room['id']}/bots", json={"count": 1}, headers=alice["headers"])
    assert res.get_json()["error"]["code"] == "no_bots"


def test_off_unless_enabled(app, client, make_user, spawned):
    app.config["BOTS_ENABLED"] = False
    alice = make_user("alice")
    room = _table(client, alice)
    assert room["botsAvailable"] is False
    res = client.post(f"{ROOMS}/{room['id']}/bots", json={"count": 1}, headers=alice["headers"])
    assert res.status_code == 404
    assert spawned == []
