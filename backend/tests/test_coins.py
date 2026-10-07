"""Coins: earned when a game ends, claimed by the player, spent on
profile borders."""

from tests.test_rematch import _finish, _finished_game

AUTH = "/api/v1/auth"
REWARDS = "/api/v1/rewards"
ROOMS = "/api/v1/rooms"


def _me(client, user):
    return client.get(f"{AUTH}/me", headers=user["headers"]).get_json()["user"]


def _claim(client, user):
    return client.post(f"{REWARDS}/claim", headers=user["headers"]).get_json()


def test_new_players_start_with_nothing(client, make_user):
    alice = make_user("alice")
    me = _me(client, alice)
    assert me["coins"] == 0
    assert me["ownedBorders"] == []
    assert client.get(REWARDS, headers=alice["headers"]).get_json() == {
        "rewards": [],
        "total": 0,
    }


def test_finishing_a_game_pays_winner_and_loser(client, make_user):
    alice, bob, room = _finished_game(client, make_user)
    # nothing while the game is still running
    assert client.get(REWARDS, headers=alice["headers"]).get_json()["total"] == 0

    _finish(client, room, alice, bob)

    won = client.get(REWARDS, headers=alice["headers"]).get_json()
    lost = client.get(REWARDS, headers=bob["headers"]).get_json()
    assert (won["total"], won["rewards"][0]["reason"]) == (6, "win")
    assert (lost["total"], lost["rewards"][0]["reason"]) == (2, "played")
    assert won["rewards"][0]["gameType"] == "tictactoe"
    # waiting rewards are not on the balance yet
    assert _me(client, alice)["coins"] == 0


def test_claiming_moves_coins_to_the_balance_once(client, make_user):
    alice, bob, room = _finished_game(client, make_user)
    _finish(client, room, alice, bob)

    first = _claim(client, alice)
    assert first["claimed"] == 6
    assert first["user"]["coins"] == 6

    again = _claim(client, alice)
    assert again["claimed"] == 0
    assert again["user"]["coins"] == 6
    assert client.get(REWARDS, headers=alice["headers"]).get_json()["total"] == 0
    # bob's coins are his own
    assert _me(client, bob)["coins"] == 0


def test_walking_out_pays_no_win_and_nothing_to_the_leaver(client, make_user):
    alice, bob, room = _finished_game(client, make_user)
    client.post(f"{ROOMS}/{room['id']}/leave", headers=bob["headers"])

    stayed = client.get(REWARDS, headers=alice["headers"]).get_json()
    assert (stayed["total"], stayed["rewards"][0]["reason"]) == (2, "played")
    assert client.get(REWARDS, headers=bob["headers"]).get_json()["total"] == 0


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
