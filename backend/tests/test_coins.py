"""Coins: paid straight onto the balance when a game ends (nothing to
claim), spent on profile borders."""

from tests.test_rematch import _finish, _finished_game

AUTH = "/api/v1/auth"
REWARDS = "/api/v1/rewards"
ROOMS = "/api/v1/rooms"


def _me(client, user):
    return client.get(f"{AUTH}/me", headers=user["headers"]).get_json()["user"]


def _rewards(client, user):
    return client.get(REWARDS, headers=user["headers"]).get_json()


def test_new_players_start_with_nothing(client, make_user):
    alice = make_user("alice")
    me = _me(client, alice)
    assert me["coins"] == 0
    assert me["ownedBorders"] == []
    assert _rewards(client, alice) == {"rewards": [], "total": 0, "recent": []}


def test_finishing_a_game_pays_winner_and_loser_straight_away(client, make_user):
    alice, bob, room = _finished_game(client, make_user)
    # nothing while the game is still running
    assert _me(client, alice)["coins"] == 0

    _finish(client, room, alice, bob)

    # on the balance at once
    assert (_me(client, alice)["coins"], _me(client, bob)["coins"]) == (6, 2)
    won, lost = _rewards(client, alice), _rewards(client, bob)
    # nothing waits to be claimed; the payment is on record
    assert (won["total"], won["rewards"]) == (0, [])
    assert [(r["reason"], r["amount"], r["gameType"]) for r in won["recent"]] == [
        ("win", 6, "tictactoe")
    ]
    assert [(r["reason"], r["amount"]) for r in lost["recent"]] == [("played", 2)]


def test_an_old_app_claiming_gets_nothing_twice(client, make_user):
    alice, bob, room = _finished_game(client, make_user)
    _finish(client, room, alice, bob)

    claimed = client.post(f"{REWARDS}/claim", headers=alice["headers"]).get_json()
    assert claimed["claimed"] == 0
    assert claimed["user"]["coins"] == 6


def test_walking_out_pays_no_win_and_nothing_to_the_leaver(client, make_user):
    alice, bob, room = _finished_game(client, make_user)
    client.post(f"{ROOMS}/{room['id']}/leave", headers=bob["headers"])

    assert [(r["reason"], r["amount"]) for r in _rewards(client, alice)["recent"]] == [
        ("played", 2)
    ]
    assert _me(client, alice)["coins"] == 2
    assert _rewards(client, bob)["recent"] == []
    assert _me(client, bob)["coins"] == 0


def test_coins_stay_private(client, make_user):
    alice, bob = make_user("alice"), make_user("bob")
    found = client.get(
        "/api/v1/friends/search?q=alice", headers=bob["headers"]
    ).get_json()["users"][0]
    assert "coins" not in found
    assert "ownedBorders" not in found


def test_paid_borders_are_locked_until_bought(app, client, make_user):
    import uuid

    from app.extensions import db
    from app.models import User

    alice = make_user("alice")
    equip = lambda border: client.patch(  # noqa: E731
        f"{AUTH}/me", json={"borderId": border}, headers=alice["headers"]
    )
    buy = lambda border: client.post(  # noqa: E731
        f"{AUTH}/me/borders/{border}/buy", headers=alice["headers"]
    )

    # free borders work straight away
    assert equip("none").status_code == 200
    # paid ones do not
    assert equip("shield").get_json()["error"]["code"] == "border_locked"
    assert buy("shield").get_json()["error"]["code"] == "not_enough_coins"
    assert buy("nope").status_code == 404

    user = db.session.get(User, uuid.UUID(alice["id"]))
    user.coins = 300
    db.session.commit()

    bought = buy("shield").get_json()["user"]
    assert bought["coins"] == 50
    assert bought["ownedBorders"] == ["shield"]
    assert buy("shield").get_json()["error"]["code"] == "already_owned"
    assert equip("shield").get_json()["user"]["borderId"] == "shield"
    # and the balance is not enough for a second one
    assert buy("octagon").get_json()["error"]["code"] == "not_enough_coins"


def test_earned_borders_come_with_their_badge(client, make_user):
    alice = make_user("alice")
    # never for sale, and locked without the badge
    res = client.post(f"{AUTH}/me/borders/table-legend/buy", headers=alice["headers"])
    assert res.get_json()["error"]["code"] == "earned_only"
    res = client.patch(f"{AUTH}/me", json={"borderId": "table-legend"}, headers=alice["headers"])
    assert res.get_json()["error"]["code"] == "border_locked"
