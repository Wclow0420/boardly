"""Play again: a finished game's players regroup at a fresh table."""

from concurrent.futures import ThreadPoolExecutor

ROOMS = "/api/v1/rooms"


def _finished_game(client, make_user):
    alice, bob = make_user("alice"), make_user("bob")
    room = client.post(
        ROOMS, json={"gameType": "tictactoe"}, headers=alice["headers"]
    ).get_json()["room"]
    client.post(f"{ROOMS}/join", json={"code": room["code"]}, headers=bob["headers"])
    client.post(f"{ROOMS}/{room['id']}/ready", json={"ready": True}, headers=bob["headers"])
    client.post(f"{ROOMS}/{room['id']}/start", headers=alice["headers"])
    return alice, bob, room


def _finish(client, room, alice, bob):
    # X wins the top row
    for user, cell in ((alice, 0), (bob, 3), (alice, 1), (bob, 4), (alice, 2)):
        client.post(
            f"{ROOMS}/{room['id']}/move", json={"move": {"cell": cell}}, headers=user["headers"]
        )


def _rematch(client, room, user):
    return client.post(f"{ROOMS}/{room['id']}/rematch", headers=user["headers"])


def _room(client, room, user):
    return client.get(
        f"{ROOMS}/code/{room['code']}", headers=user["headers"]
    ).get_json()["room"]


def test_not_before_the_game_is_over(client, make_user):
    alice, bob, room = _finished_game(client, make_user)
    assert _rematch(client, room, alice).get_json()["error"]["code"] == "game_not_finished"


def test_only_for_players_of_that_game(client, make_user):
    alice, bob, room = _finished_game(client, make_user)
    _finish(client, room, alice, bob)
    eve = make_user("eve")
    assert _rematch(client, room, eve).get_json()["error"]["code"] == "not_in_room"


def test_first_player_opens_a_table_and_the_rest_join_it(client, make_user):
    alice, bob, room = _finished_game(client, make_user)
    _finish(client, room, alice, bob)
    assert _room(client, room, alice)["rematchCode"] is None

    # the loser asks first, so the loser hosts
    first = _rematch(client, room, bob)
    assert first.status_code == 200
    new_room = first.get_json()["room"]
    assert new_room["id"] != room["id"]
    assert new_room["status"] == "waiting"
    assert new_room["hostId"] == bob["id"]
    assert new_room["gameType"] == "tictactoe"
    assert [p["username"] for p in new_room["players"]] == ["bob"]

    # the other player, still on the finished game, sees the invitation
    assert _room(client, room, alice)["rematchCode"] == new_room["code"]

    second = _rematch(client, room, alice).get_json()["room"]
    assert second["id"] == new_room["id"]
    assert [p["username"] for p in second["players"]] == ["bob", "alice"]
    # asking again is harmless
    assert _rematch(client, room, alice).get_json()["room"]["id"] == new_room["id"]

    # the finished game keeps its result and stats
    old = _room(client, room, alice)
    assert old["status"] == "finished"
    assert old["session"]["winnerUserId"] == alice["id"]
    stats = client.get("/api/v1/auth/me/stats", headers=alice["headers"]).get_json()["stats"]
    assert (stats["gamesPlayed"], stats["wins"]) == (1, 1)

    # and the new table plays like any other
    client.post(f"{ROOMS}/{new_room['id']}/ready", json={"ready": True}, headers=alice["headers"])
    assert client.post(f"{ROOMS}/{new_room['id']}/start", headers=bob["headers"]).status_code == 201
    assert _room(client, room, alice)["rematchCode"] is None  # no longer joinable
    assert _rematch(client, room, alice).status_code == 200  # already seated there


def test_closed_rematch_table_is_replaced(client, make_user):
    alice, bob, room = _finished_game(client, make_user)
    _finish(client, room, alice, bob)
    first = _rematch(client, room, bob).get_json()["room"]
    client.post(f"{ROOMS}/{first['id']}/leave", headers=bob["headers"])  # host closes it
    assert _room(client, room, alice)["rematchCode"] is None

    second = _rematch(client, room, alice).get_json()["room"]
    assert second["id"] != first["id"]
    assert second["hostId"] == alice["id"]


def test_cannot_rematch_while_at_another_table(client, make_user):
    alice, bob, room = _finished_game(client, make_user)
    _finish(client, room, alice, bob)
    client.post(ROOMS, json={"gameType": "tictactoe"}, headers=bob["headers"])
    assert _rematch(client, room, bob).get_json()["error"]["code"] == "already_in_room"


def test_both_asking_at_once_share_one_table(app, client, make_user):
    alice, bob, room = _finished_game(client, make_user)
    _finish(client, room, alice, bob)

    def ask(user):
        with app.app_context():
            return app.test_client().post(
                f"{ROOMS}/{room['id']}/rematch", headers=user["headers"]
            ).get_json()["room"]["id"]

    with ThreadPoolExecutor(max_workers=2) as pool:
        ids = list(pool.map(ask, [alice, bob]))
    assert ids[0] == ids[1]
