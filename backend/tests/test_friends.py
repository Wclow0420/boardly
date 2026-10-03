"""Friends API: requests, presence over the socket, table invites."""

from app.extensions import socketio

BASE = "/api/v1/friends"


def _request(client, sender, target):
    return client.post(
        f"{BASE}/requests", json={"userId": target["id"]}, headers=sender["headers"]
    )


def _befriend(client, a, b):
    assert _request(client, a, b).status_code == 201
    assert _request(client, b, a).status_code == 200


def _listing(client, user):
    res = client.get(BASE, headers=user["headers"])
    assert res.status_code == 200
    return res.get_json()


def _online(app, user):
    sock = socketio.test_client(app)
    assert sock.emit("authenticate", {"token": user["token"]}, callback=True) == {
        "ok": True
    }
    return sock


def test_requires_auth(client):
    assert client.get(BASE).status_code == 401


def test_request_then_accept(client, make_user):
    alice, bob = make_user("alice"), make_user("bob")

    res = _request(client, alice, bob)
    assert res.status_code == 201
    assert res.get_json()["user"]["relation"] == "outgoing"

    assert [u["username"] for u in _listing(client, alice)["outgoing"]] == ["bob"]
    incoming = _listing(client, bob)["incoming"]
    assert [u["username"] for u in incoming] == ["alice"]
    assert incoming[0]["presence"] is None  # not shared before friendship

    res = client.post(
        f"{BASE}/requests/{incoming[0]['requestId']}/accept", headers=bob["headers"]
    )
    assert res.status_code == 200

    for me, other in ((alice, "bob"), (bob, "alice")):
        data = _listing(client, me)
        assert [f["username"] for f in data["friends"]] == [other]
        assert data["friends"][0]["presence"] == "offline"
        assert data["incoming"] == [] and data["outgoing"] == []


def test_only_addressee_can_accept(client, make_user):
    alice, bob = make_user("alice"), make_user("bob")
    _request(client, alice, bob)
    request_id = _listing(client, alice)["outgoing"][0]["requestId"]

    res = client.post(
        f"{BASE}/requests/{request_id}/accept", headers=alice["headers"]
    )
    assert res.status_code == 404
    assert _listing(client, alice)["friends"] == []


def test_request_validation(client, make_user):
    alice, bob = make_user("alice"), make_user("bob")

    res = _request(client, alice, alice)
    assert res.get_json()["error"]["code"] == "cannot_friend_self"

    for bad in ("not-a-uuid", None, "00000000-0000-0000-0000-000000000000"):
        res = client.post(
            f"{BASE}/requests", json={"userId": bad}, headers=alice["headers"]
        )
        assert res.status_code == 404, bad

    _request(client, alice, bob)
    assert _request(client, alice, bob).get_json()["error"]["code"] == "request_exists"

    _request(client, bob, alice)  # reverse request accepts
    assert _request(client, alice, bob).get_json()["error"]["code"] == "already_friends"


def test_decline_cancel_and_unfriend(client, make_user):
    alice, bob, carol = make_user("alice"), make_user("bob"), make_user("carol")

    # bob declines alice
    _request(client, alice, bob)
    request_id = _listing(client, bob)["incoming"][0]["requestId"]
    assert (
        client.delete(f"{BASE}/requests/{request_id}", headers=carol["headers"])
    ).status_code == 404
    assert (
        client.delete(f"{BASE}/requests/{request_id}", headers=bob["headers"])
    ).status_code == 200
    assert _listing(client, alice)["outgoing"] == []

    # alice cancels her own request
    _request(client, alice, bob)
    request_id = _listing(client, alice)["outgoing"][0]["requestId"]
    assert (
        client.delete(f"{BASE}/requests/{request_id}", headers=alice["headers"])
    ).status_code == 200
    assert _listing(client, bob)["incoming"] == []

    # unfriend
    _befriend(client, alice, bob)
    assert (
        client.delete(f"{BASE}/{alice['id']}", headers=bob["headers"])
    ).status_code == 200
    assert _listing(client, alice)["friends"] == []
    assert (
        client.delete(f"{BASE}/{alice['id']}", headers=bob["headers"])
    ).status_code == 404


def test_search(client, make_user):
    alice, bob = make_user("alice"), make_user("bob")
    make_user("bobby")
    make_user("a_b")
    _request(client, alice, bob)

    def search(q):
        res = client.get(f"{BASE}/search", query_string={"q": q}, headers=alice["headers"])
        return {u["username"]: u["relation"] for u in res.get_json()["users"]}

    assert search("BO") == {"bob": "outgoing", "bobby": "none"}
    assert search("al") == {}  # never returns yourself
    assert search("b") == {}  # too short
    assert search("a_") == {"a_b": "none"}  # "_" is literal, not a wildcard
    assert search("%%") == {}


def test_presence_follows_the_socket(app, client, make_user):
    alice, bob = make_user("alice"), make_user("bob")
    _befriend(client, alice, bob)
    assert _listing(client, alice)["friends"][0]["presence"] == "offline"

    alice_sock = _online(app, alice)
    bob_sock = _online(app, bob)
    assert _listing(client, alice)["friends"][0]["presence"] == "online"
    # alice was told when bob came online
    assert "friends_updated" in [e["name"] for e in alice_sock.get_received()]

    bob_sock.disconnect()
    assert _listing(client, alice)["friends"][0]["presence"] == "offline"
    assert "friends_updated" in [e["name"] for e in alice_sock.get_received()]


def test_bad_socket_token_is_not_online(app, client, make_user):
    alice, bob = make_user("alice"), make_user("bob")
    _befriend(client, alice, bob)
    sock = socketio.test_client(app)
    assert sock.emit("authenticate", {"token": "garbage"}, callback=True) == {
        "ok": False
    }
    assert _listing(client, alice)["friends"][0]["presence"] == "offline"


def test_in_game_presence_recent_players_and_stats(app, client, make_user):
    alice, bob, carol = make_user("alice"), make_user("bob"), make_user("carol")
    _befriend(client, alice, carol)
    _online(app, alice)

    room = client.post(
        "/api/v1/rooms", json={"gameType": "tictactoe"}, headers=alice["headers"]
    ).get_json()["room"]
    client.post("/api/v1/rooms/join", json={"code": room["code"]}, headers=bob["headers"])
    client.post(f"/api/v1/rooms/{room['id']}/ready", json={"ready": True}, headers=bob["headers"])
    assert (
        client.post(f"/api/v1/rooms/{room['id']}/start", headers=alice["headers"])
    ).status_code == 201

    assert _listing(client, carol)["friends"][0]["presence"] == "inGame"
    recent = _listing(client, alice)["recent"]
    assert [(u["username"], u["relation"]) for u in recent] == [("bob", "none")]

    # bob forfeits -> alice wins
    client.post(f"/api/v1/rooms/{room['id']}/leave", headers=bob["headers"])
    assert _listing(client, carol)["friends"][0]["presence"] == "online"

    stats = client.get("/api/v1/auth/me/stats", headers=alice["headers"]).get_json()
    assert stats == {"stats": {"gamesPlayed": 1, "wins": 1, "friends": 1}}
    stats = client.get("/api/v1/auth/me/stats", headers=bob["headers"]).get_json()
    assert stats == {"stats": {"gamesPlayed": 1, "wins": 0, "friends": 0}}


def test_table_invite(app, client, make_user):
    alice, bob, carol = make_user("alice"), make_user("bob"), make_user("carol")
    _befriend(client, alice, bob)

    def invite(target):
        return client.post(f"{BASE}/{target['id']}/invite", headers=alice["headers"])

    assert invite(carol).get_json()["error"]["code"] == "not_friends"
    assert invite(bob).get_json()["error"]["code"] == "no_open_table"

    room = client.post(
        "/api/v1/rooms", json={"gameType": "tictactoe"}, headers=alice["headers"]
    ).get_json()["room"]
    assert invite(bob).get_json()["error"]["code"] == "friend_offline"

    bob_sock = _online(app, bob)
    bob_sock.get_received()
    assert invite(bob).status_code == 200
    invites = [e for e in bob_sock.get_received() if e["name"] == "table_invite"]
    assert len(invites) == 1
    payload = invites[0]["args"][0]
    assert payload["code"] == room["code"]
    assert payload["from"]["username"] == "alice"
    assert payload["game"]["key"] == "tictactoe"

    client.post("/api/v1/rooms/join", json={"code": room["code"]}, headers=bob["headers"])
    assert invite(bob).get_json()["error"]["code"] == "room_full"
