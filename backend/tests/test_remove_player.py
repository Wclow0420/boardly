"""The host takes a player off a waiting table
(DELETE /rooms/<id>/players/<user_id>): a person or a bot, never
themselves, never once the game is on."""

from app.extensions import socketio

ROOMS = "/api/v1/rooms"


def _table(client, user, game="nightwatch"):
    return client.post(ROOMS, json={"gameType": game}, headers=user["headers"]).get_json()["room"]


def _join(client, user, room):
    return client.post(f"{ROOMS}/join", json={"code": room["code"]}, headers=user["headers"])


def _remove(client, user, room, user_id):
    return client.delete(f"{ROOMS}/{room['id']}/players/{user_id}", headers=user["headers"])


def _ids(players):
    return [p["userId"] for p in players]


def test_the_host_removes_a_person_and_the_seats_close_up(client, make_user):
    alice, bob, carol = make_user("alice"), make_user("bob"), make_user("carol")
    room = _table(client, alice)
    _join(client, bob, room)
    _join(client, carol, room)
    res = _remove(client, alice, room, bob["id"])
    assert res.status_code == 200
    players = res.get_json()["room"]["players"]
    assert _ids(players) == [alice["id"], carol["id"]]
    assert [p["seat"] for p in players] == [0, 1]
    # Bob is free: no table of his, and he may sit down somewhere else
    mine = client.get(f"{ROOMS}/mine", headers=bob["headers"]).get_json()
    assert all(r["id"] != room["id"] for r in mine["rooms"])
    other = _table(client, bob)
    assert other["hostId"] == bob["id"]


def test_the_host_removes_a_bot_too(client, make_user):
    alice = make_user("alice")
    room = _table(client, alice)
    players = client.post(f"{ROOMS}/{room['id']}/bots", json={"count": 2},
                          headers=alice["headers"]).get_json()["room"]["players"]
    left = _remove(client, alice, room, players[1]["userId"]).get_json()["room"]["players"]
    assert _ids(left) == [players[0]["userId"], players[2]["userId"]]
    assert [p["seat"] for p in left] == [0, 1]


def test_only_the_host_not_themselves_and_only_while_waiting(client, make_user):
    alice, bob, carol = make_user("alice"), make_user("bob"), make_user("carol")
    room = _table(client, alice, "tictactoe")
    _join(client, bob, room)
    # not the host
    assert _remove(client, bob, room, alice["id"]).status_code == 403
    # not yourself
    res = _remove(client, alice, room, alice["id"])
    assert res.status_code == 400
    assert res.get_json()["error"]["code"] == "cannot_remove_self"
    # not someone who isn't seated here
    assert _remove(client, alice, room, carol["id"]).status_code == 404
    # not once playing
    client.post(f"{ROOMS}/{room['id']}/ready", json={"ready": True}, headers=bob["headers"])
    assert client.post(f"{ROOMS}/{room['id']}/start", headers=alice["headers"]).status_code == 201
    res = _remove(client, alice, room, bob["id"])
    assert res.status_code == 409
    assert res.get_json()["error"]["code"] == "game_started"


def test_the_one_removed_is_told_and_stops_hearing_the_table(app, client, make_user):
    alice, bob, carol = make_user("alice"), make_user("bob"), make_user("carol")
    room = _table(client, alice)
    _join(client, bob, room)
    _join(client, carol, room)

    def connect(user):
        sock = socketio.test_client(app)
        assert sock.emit("authenticate", {"token": user["token"]}, callback=True) == {"ok": True}
        assert sock.emit("join_room", {"roomId": room["id"]}, callback=True) == {"ok": True}
        sock.get_received()
        return sock

    host, removed, stays = connect(alice), connect(bob), connect(carol)
    assert _remove(client, alice, room, bob["id"]).status_code == 200

    heard = removed.get_received()
    told = [e for e in heard if e["name"] == "removed_from_room"]
    assert told and told[0]["args"][0] == {"roomId": room["id"], "code": room["code"]}
    assert "room_updated" not in [e["name"] for e in heard]
    for sock in (host, stays):
        events = sock.get_received()
        names = [e["name"] for e in events]
        assert "room_updated" in names and "removed_from_room" not in names
        update = next(e for e in events if e["name"] == "room_updated")["args"][0]
        assert bob["id"] not in _ids(update["players"])
    # and Bob can't listen in again
    assert removed.emit("join_room", {"roomId": room["id"]}, callback=True) == {"ok": False}
