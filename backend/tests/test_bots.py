"""Bot players: the host fills seats from the lobby and the server
plays them (app/bots.py). Tests run the bots inline (BOTS_INLINE), so
every bot move the game waits on is made before the request returns."""

import random

from app.extensions import db
from app.games import get_game
from app.models import CoinReward, SessionPlayer, User

AUTH = "/api/v1/auth"
ROOMS = "/api/v1/rooms"


def _table(client, user, game="nightwatch"):
    return client.post(ROOMS, json={"gameType": game}, headers=user["headers"]).get_json()["room"]


def _add(client, user, room, count):
    return client.post(f"{ROOMS}/{room['id']}/bots", json={"count": count}, headers=user["headers"])


def _room(client, user, room):
    return client.get(f"{ROOMS}/code/{room['code']}", headers=user["headers"]).get_json()["room"]


def test_the_host_seats_bots_ready_to_play(client, make_user):
    alice = make_user("alice")
    room = _table(client, alice)
    assert room["botsAvailable"] is True
    res = _add(client, alice, room, 4)
    assert res.status_code == 201
    players = res.get_json()["room"]["players"]
    assert [p["seat"] for p in players] == [0, 1, 2, 3, 4]
    bots = [p for p in players if p["isBot"]]
    assert len(bots) == 4 and all(p["ready"] for p in bots)
    assert all(p["username"].startswith("🤖 ") for p in bots)
    assert len({p["userId"] for p in bots}) == 4
    assert players[0]["isBot"] is False


def test_only_the_host_and_never_beyond_the_seats(client, make_user):
    alice, bob = make_user("alice"), make_user("bob")
    room = _table(client, alice)
    client.post(f"{ROOMS}/join", json={"code": room["code"]}, headers=bob["headers"])
    assert _add(client, bob, room, 1).status_code == 403
    # ten seats, two taken
    assert _add(client, alice, room, 9).status_code == 400
    assert _add(client, alice, room, 0).status_code == 400
    assert _add(client, alice, room, "3").status_code == 400
    assert _add(client, alice, room, 8).status_code == 201
    assert _add(client, alice, room, 1).status_code == 400


def test_not_for_games_without_bots(client, make_user, monkeypatch):
    # every game has bots now: take them away from one
    monkeypatch.setattr(type(get_game("tictactoe")), "has_bots", False)
    alice = make_user("alice")
    room = _table(client, alice, "tictactoe")
    assert room["botsAvailable"] is False
    assert _add(client, alice, room, 1).get_json()["error"]["code"] == "no_bots"


def test_off_when_disabled(app, client, make_user):
    app.config["BOTS_ENABLED"] = False
    alice = make_user("alice")
    room = _table(client, alice)
    assert room["botsAvailable"] is False
    assert _add(client, alice, room, 1).status_code == 404


def test_a_bot_sits_at_one_table_at_a_time_and_is_reused(app, client, make_user):
    alice, bob = make_user("alice"), make_user("bob")
    first = _table(client, alice)
    second = _table(client, bob)
    a = {p["userId"] for p in _add(client, alice, first, 3).get_json()["room"]["players"][1:]}
    b = {p["userId"] for p in _add(client, bob, second, 3).get_json()["room"]["players"][1:]}
    assert not a & b
    # Alice closes her table: her bots are free for the next one
    client.post(f"{ROOMS}/{first['id']}/leave", headers=alice["headers"])
    third = _table(client, alice)
    c = {p["userId"] for p in _add(client, alice, third, 3).get_json()["room"]["players"][1:]}
    assert c == a
    with app.app_context():
        assert User.query.filter_by(is_bot=True).count() == 6


def test_the_host_removes_a_bot(client, make_user):
    alice, bob = make_user("alice"), make_user("bob")
    room = _table(client, alice)
    client.post(f"{ROOMS}/join", json={"code": room["code"]}, headers=bob["headers"])
    players = _add(client, alice, room, 2).get_json()["room"]["players"]
    bot = players[2]
    url = f"{ROOMS}/{room['id']}/bots/{bot['userId']}"
    assert client.delete(url, headers=bob["headers"]).status_code == 403
    # people aren't bots
    assert client.delete(f"{ROOMS}/{room['id']}/bots/{players[1]['userId']}",
                         headers=alice["headers"]).status_code == 404
    left = client.delete(url, headers=alice["headers"]).get_json()["room"]["players"]
    assert [p["seat"] for p in left] == [0, 1, 2]
    assert bot["userId"] not in {p["userId"] for p in left}


def test_bots_can_never_sign_in_or_be_found(client, make_user):
    alice = make_user("alice")
    room = _table(client, alice)
    bot = _add(client, alice, room, 1).get_json()["room"]["players"][1]
    for password in ("", "botbot123"):
        res = client.post(f"{AUTH}/login", json={"username": bot["username"], "password": password})
        assert res.status_code in (400, 401)
    found = client.get("/api/v1/friends/search?q=%F0%9F%A4%96", headers=alice["headers"])
    assert found.get_json()["users"] == []
    res = client.post("/api/v1/friends/requests", json={"userId": bot["userId"]},
                      headers=alice["headers"])
    assert res.status_code == 404


def _play_out(client, alice, room, seat=0):
    """Alice plays her seat like a bot would until the game ends."""
    rng = random.Random(1)
    game = get_game(room["gameType"])
    for _ in range(500):
        state = _room(client, alice, room)["session"]
        if state["status"] != "in_progress":
            return state
        move = game.bot_move(state["state"], seat, rng)
        assert move is not None, "the game waits on neither Alice nor a bot"
        res = client.post(f"{ROOMS}/{room['id']}/move", json={"move": move},
                          headers=alice["headers"])
        assert res.status_code == 200, res.get_json()
    raise AssertionError("game never ended")


def test_bots_play_a_whole_game_with_a_person(app, client, make_user):
    alice = make_user("alice")
    room = _table(client, alice)
    _add(client, alice, room, 4)
    started = client.post(f"{ROOMS}/{room['id']}/start", headers=alice["headers"])
    assert started.status_code == 201
    # The bots already read the announcement; only Alice is left
    view = _room(client, alice, room)["session"]["state"]
    assert view["ready"] == [False, True, True, True, True]

    session = _play_out(client, alice, room)
    assert session["status"] == "finished"
    with app.app_context():
        rewards = CoinReward.query.filter_by(session_id=session["id"]).all()
        # Only Alice is paid, and never the win bonus with bots around
        assert [(r.reason, r.amount) for r in rewards] == [
            ("played", get_game("nightwatch").coins_play)
        ]
        # Practice: no stats or badges
        assert SessionPlayer.query.filter_by(session_id=session["id"]).count() == 0


def test_bots_come_along_to_a_rematch(client, make_user):
    alice = make_user("alice")
    room = _table(client, alice)
    bots = {p["userId"] for p in _add(client, alice, room, 4).get_json()["room"]["players"][1:]}
    client.post(f"{ROOMS}/{room['id']}/start", headers=alice["headers"])
    _play_out(client, alice, room)
    again = client.post(f"{ROOMS}/{room['id']}/rematch", headers=alice["headers"]).get_json()["room"]
    assert {p["userId"] for p in again["players"] if p["isBot"]} == bots
    assert all(p["ready"] for p in again["players"])


def test_a_table_left_mid_game_frees_its_bots(app, client, make_user):
    alice = make_user("alice")
    room = _table(client, alice)
    _add(client, alice, room, 4)
    client.post(f"{ROOMS}/{room['id']}/start", headers=alice["headers"])
    client.post(f"{ROOMS}/{room['id']}/leave", headers=alice["headers"])
    assert _room(client, alice, room)["status"] == "finished"
    with app.app_context():
        assert CoinReward.query.count() == 0
    # The same four bots sit down at the next table
    again = _table(client, alice)
    _add(client, alice, again, 4)
    with app.app_context():
        assert User.query.filter_by(is_bot=True).count() == 4


def test_seal_the_manor_bots_finish_games_at_every_size():
    """The bots' policy only makes legal moves, and games end."""
    from app.games.nightwatch.game import Nightwatch

    for n in range(5, 11):
        for seed in range(10):
            game = Nightwatch(random.Random(seed))
            rng = random.Random(seed)
            state = game.initial_state(n)
            for _ in range(2000):
                if state["phase"] == "finished":
                    break
                for seat in range(n):
                    move = game.bot_move(game.view_for(state, seat), seat, rng)
                    if move is not None:
                        state = game.apply_move(state, seat, move)
                        break
            assert state["phase"] == "finished", (n, seed)


def test_the_server_plays_bots_in_the_background(app, client, make_user):
    import time

    from app import bots

    app.config["BOTS_INLINE"] = False
    alice = make_user("alice")
    room = _table(client, alice)
    _add(client, alice, room, 4)
    client.post(f"{ROOMS}/{room['id']}/start", headers=alice["headers"])
    for _ in range(100):
        view = _room(client, alice, room)["session"]["state"]
        if view["ready"] == [False, True, True, True, True] and not bots._running:
            break
        time.sleep(0.05)
    assert view["ready"] == [False, True, True, True, True]
    assert not bots._running and not bots._again
