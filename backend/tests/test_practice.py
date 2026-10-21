"""Practice tables (opened already filled with bots) and the bot-game
rule (app/rewards.py): a game with any bot at the table pays a quarter
of the coins and counts towards no badge, but still counts as played."""

import pytest

from app.bots import PRACTICE_BOTS, practice_bots
from app.games import GAMES, get_game
from app.rewards import BOT_GAME_COINS, game_coins
from tests.test_rematch import _finish, _finished_game

AUTH = "/api/v1/auth"
ROOMS = "/api/v1/rooms"
STATS = "/api/v1/auth/me/stats"


def _practice(client, user, game):
    return client.post(
        ROOMS, json={"gameType": game, "practice": True}, headers=user["headers"]
    )


def _card(client, user):
    return client.get(STATS, headers=user["headers"]).get_json()["stats"]


def _coins(client, user):
    return client.get(f"{AUTH}/me", headers=user["headers"]).get_json()["user"]["coins"]


@pytest.mark.parametrize("game", sorted(GAMES))
def test_a_practice_table_comes_filled_with_ready_bots(client, make_user, game):
    alice = make_user("alice")
    res = _practice(client, alice, game)
    assert res.status_code == 201, res.get_json()
    room = res.get_json()["room"]
    engine = get_game(game)
    bots = [p for p in room["players"] if p["isBot"]]
    assert room["practice"] is True and room["status"] == "waiting"
    host = next(p for p in room["players"] if p["seat"] == 0)
    assert host["userId"] == alice["id"] and not host["isBot"]
    assert len(bots) == practice_bots(engine) and all(p["ready"] for p in bots)
    assert engine.min_players <= len(room["players"]) <= engine.max_players
    # ready to start straight away
    started = client.post(f"{ROOMS}/{room['id']}/start", headers=alice["headers"])
    assert started.status_code == 201, started.get_json()


def test_the_practice_table_sizes():
    assert PRACTICE_BOTS["nightwatch"] == 5
    assert PRACTICE_BOTS["avalon"] == 4
    assert PRACTICE_BOTS["coup"] == 3
    assert PRACTICE_BOTS["liarsdice"] == 3
    assert PRACTICE_BOTS["tictactoe"] == 1


def test_a_practice_table_stays_a_normal_lobby(client, make_user):
    alice, bob = make_user("alice"), make_user("bob")
    room = _practice(client, alice, "coup").get_json()["room"]
    # a friend still joins by the code, the host can take a bot off
    joined = client.post(f"{ROOMS}/join", json={"code": room["code"]}, headers=bob["headers"])
    assert joined.status_code == 200
    bot = next(p for p in room["players"] if p["isBot"])
    res = client.delete(f"{ROOMS}/{room['id']}/bots/{bot['userId']}", headers=alice["headers"])
    assert len(res.get_json()["room"]["players"]) == 4
    # one table at a time
    again = _practice(client, alice, "coup")
    assert again.get_json()["error"]["code"] == "already_in_room"
    # an ordinary table is no practice table
    eve = make_user("eve")
    plain = client.post(ROOMS, json={"gameType": "coup"}, headers=eve["headers"]).get_json()
    assert plain["room"]["practice"] is False and len(plain["room"]["players"]) == 1


def test_no_practice_without_bots(app, client, make_user):
    app.config["BOTS_ENABLED"] = False
    alice = make_user("alice")
    assert _practice(client, alice, "coup").get_json()["error"]["code"] == "no_bots"
    # and nothing was left open
    assert client.get(f"{ROOMS}/mine", headers=alice["headers"]).get_json()["rooms"] == []


def test_a_bot_game_pays_a_quarter_rounded_and_at_least_one():
    assert BOT_GAME_COINS == 0.25
    nightwatch, tictactoe = get_game("nightwatch"), get_game("tictactoe")
    assert (nightwatch.coins_win, nightwatch.coins_play) == (25, 8)
    assert game_coins(nightwatch, True, bot_game=True) == 6
    assert game_coins(nightwatch, False, bot_game=True) == 2
    assert game_coins(tictactoe, True, bot_game=True) == 2  # 1.5 rounds up
    assert game_coins(tictactoe, False, bot_game=True) == 1  # never below 1
    # among people: unchanged
    assert game_coins(nightwatch, True, bot_game=False) == 25
    assert game_coins(tictactoe, False, bot_game=False) == 2


def _dumb_bot(view, seat, rng):
    """A bot that takes the lowest free cell, so the game is known."""
    if view["currentSeat"] != seat or get_game("tictactoe").get_result(view):
        return None
    return {"cell": view["board"].index(None)}


def test_a_bot_game_pays_less_and_counts_towards_no_badge(app, client, make_user, monkeypatch):
    monkeypatch.setattr(type(get_game("tictactoe")), "bot_move", lambda self, v, s, r: _dumb_bot(v, s, r))
    alice = make_user("alice")
    room = _practice(client, alice, "tictactoe").get_json()["room"]
    client.post(f"{ROOMS}/{room['id']}/start", headers=alice["headers"])
    # X: 4, bot 0, X: 2, bot 1, X: 6 takes the diagonal
    for cell in (4, 2, 6):
        res = client.post(f"{ROOMS}/{room['id']}/move", json={"move": {"cell": cell}},
                          headers=alice["headers"])
        assert res.status_code == 200, res.get_json()
    assert res.get_json()["result"] == {"winnerSeat": 0}

    # a quarter of the win (6 -> 1.5 -> 2), on the balance at once
    assert _coins(client, alice) == 2
    card = _card(client, alice)
    # it counts as played and won...
    assert (card["gamesPlayed"], card["wins"]) == (1, 1)
    assert card["games"] == [{"gameType": "tictactoe", "played": 1, "wins": 1, "sides": {}}]
    # ...but towards no badge at all
    assert all(b["progress"] == 0 and b["tier"] is None for b in card["badges"]), [
        b for b in card["badges"] if b["progress"]
    ]


def test_a_game_among_people_is_unchanged(client, make_user):
    alice, bob, room = _finished_game(client, make_user)
    _finish(client, room, alice, bob)
    assert (_coins(client, alice), _coins(client, bob)) == (6, 2)
    card = _card(client, alice)
    assert (card["gamesPlayed"], card["wins"]) == (1, 1)
    tiers = {b["key"]: b["tier"] for b in card["badges"]}
    assert tiers["tictactoe.master"] == "bronze"
    assert tiers["boardly.regular"] == "bronze"
    assert tiers["boardly.champion"] == "bronze"


def test_a_rematch_of_a_practice_table_is_practice_too(client, make_user, monkeypatch):
    monkeypatch.setattr(type(get_game("tictactoe")), "bot_move", lambda self, v, s, r: _dumb_bot(v, s, r))
    alice = make_user("alice")
    room = _practice(client, alice, "tictactoe").get_json()["room"]
    client.post(f"{ROOMS}/{room['id']}/start", headers=alice["headers"])
    for cell in (4, 2, 6):
        client.post(f"{ROOMS}/{room['id']}/move", json={"move": {"cell": cell}},
                    headers=alice["headers"])
    again = client.post(f"{ROOMS}/{room['id']}/rematch", headers=alice["headers"]).get_json()
    assert again["room"]["practice"] is True
    seated = sorted(again["room"]["players"], key=lambda p: p["seat"])
    assert [p["isBot"] for p in seated] == [False, True]
