"""The profile's player card: outcomes recorded when a game ends, per-game
stats and badges built from them."""

from app.games import GAMES
from app.games.base import TIERS
from tests.test_rematch import _finish, _finished_game

STATS = "/api/v1/auth/me/stats"
ROOMS = "/api/v1/rooms"


def _card(client, user):
    return client.get(STATS, headers=user["headers"]).get_json()["stats"]


def _badge(card, key):
    return next(b for b in card["badges"] if b["key"] == key)


def test_a_new_player_has_an_empty_card(client, make_user):
    card = _card(client, make_user("alice"))
    assert (card["gamesPlayed"], card["wins"], card["streak"]) == (0, 0, 0)
    assert card["games"] == [] and card["favourite"] is None
    assert card["lastGameAt"] is None
    first = _badge(card, "boardly.firstTable")
    assert (first["progress"], first["goal"], first["unlockedAt"]) == (0, 1, None)


def test_finishing_a_game_fills_both_cards(client, make_user):
    alice, bob, room = _finished_game(client, make_user)
    _finish(client, room, alice, bob)

    won, lost = _card(client, alice), _card(client, bob)
    assert (won["gamesPlayed"], won["wins"], won["streak"]) == (1, 1, 1)
    assert (lost["gamesPlayed"], lost["wins"]) == (1, 0)
    assert won["favourite"] == "tictactoe"
    assert won["games"] == [
        {"gameType": "tictactoe", "played": 1, "wins": 1, "sides": {}}
    ]
    assert _badge(won, "tictactoe.firstWin")["unlockedAt"] is not None
    assert _badge(lost, "tictactoe.firstWin")["unlockedAt"] is None
    assert _badge(lost, "boardly.firstTable")["unlockedAt"] is not None
    assert _badge(won, "boardly.company")["progress"] == 1
    # badges earned in this game carry its finishing time
    assert won["lastGameAt"] == _badge(won, "tictactoe.firstWin")["unlockedAt"]


def test_a_forfeit_counts_as_a_win_but_earns_no_badge(client, make_user):
    alice, bob, room = _finished_game(client, make_user)
    client.post(f"{ROOMS}/{room['id']}/leave", headers=bob["headers"])

    stayed, left = _card(client, alice), _card(client, bob)
    # the forfeit is alice's win on the card, but earns her no badge
    assert (stayed["gamesPlayed"], stayed["wins"]) == (1, 1)
    assert (left["gamesPlayed"], left["wins"]) == (1, 0)
    assert _badge(stayed, "tictactoe.firstWin")["unlockedAt"] is None
    assert _badge(stayed, "boardly.firstWin")["unlockedAt"] is None


def test_a_series_climbs_in_levels(client, make_user):
    card = _card(client, make_user("alice"))
    played = sorted(
        (b for b in card["badges"] if b["series"] == "played" and b["gameType"] is None),
        key=lambda b: b["goal"],
    )
    assert [b["goal"] for b in played] == [1, 10, 50, 100]
    assert _badge(card, "coup.kingpin")["series"] == "wins"


def test_every_badge_is_well_formed():
    keys = set()
    for key, game in GAMES.items():
        for badge in game.badges:
            assert badge.key.startswith(f"{key}."), badge.key
            assert badge.tier in TIERS and badge.goal >= 1
            keys.add(badge.key)
    assert len(keys) == sum(len(g.badges) for g in GAMES.values())


def test_faction_games_say_which_side_each_player_was_on():
    nightwatch = GAMES["nightwatch"]
    state = nightwatch.initial_state(5)
    for seat, role in enumerate(state["roles"]):
        outcome = nightwatch.player_outcome({**state, "winReason": "missions"}, seat)
        assert outcome["side"] == ("evil" if role in ("double", "hermit", "possessed") else "good")
        assert outcome["role"] == role

    shelter = GAMES["shelter"]
    state = shelter.initial_state(4)
    state = {**state, "roles": ["infected", "survivor", "survivor", "survivor"]}
    assert shelter.player_outcome(state, 0)["side"] == "evil"
    assert shelter.player_outcome(state, 1)["side"] == "good"
