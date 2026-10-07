"""Profile pictures: upload, serve, replace, remove."""

import base64

PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 64


def _upload(client, user, data):
    return client.put(
        "/api/v1/auth/me/avatar",
        json={"image": base64.b64encode(data).decode()},
        headers=user["headers"],
    )


def test_upload_serves_the_picture_everywhere(client, make_user):
    alice = make_user("alice")
    assert client.get("/api/v1/auth/me", headers=alice["headers"]).get_json()[
        "user"
    ]["avatarUrl"] is None

    res = _upload(client, alice, PNG)
    assert res.status_code == 200
    url = res.get_json()["user"]["avatarUrl"]
    assert url.startswith(f"/api/v1/users/{alice['id']}/avatar?v=")

    picture = client.get(url)  # no auth needed: images load without headers
    assert picture.status_code == 200
    assert picture.data == PNG and picture.mimetype == "image/png"
    assert "immutable" in picture.headers["Cache-Control"]

    room = client.post(
        "/api/v1/rooms", json={"gameType": "tictactoe"}, headers=alice["headers"]
    ).get_json()["room"]
    assert room["players"][0]["avatarUrl"] == url


def test_new_upload_changes_the_url(client, make_user):
    alice = make_user("alice")
    first = _upload(client, alice, PNG).get_json()["user"]["avatarUrl"]
    second = _upload(client, alice, JPEG).get_json()["user"]["avatarUrl"]
    assert first != second
    assert client.get(second).mimetype == "image/jpeg"


def test_rejects_what_isnt_a_picture(client, make_user):
    alice = make_user("alice")
    assert _upload(client, alice, b"<svg onload=alert(1)>").status_code == 400
    bad = client.put(
        "/api/v1/auth/me/avatar", json={"image": "not base64!"}, headers=alice["headers"]
    )
    assert bad.status_code == 400
    assert _upload(client, alice, PNG + b"\x00" * 400_000).status_code == 413
    assert client.put("/api/v1/auth/me/avatar", json={"image": ""}).status_code == 401


def test_remove_goes_back_to_the_letter(client, make_user):
    alice = make_user("alice")
    url = _upload(client, alice, PNG).get_json()["user"]["avatarUrl"]
    res = client.delete("/api/v1/auth/me/avatar", headers=alice["headers"])
    assert res.get_json()["user"]["avatarUrl"] is None
    assert client.get(url).status_code == 404


def test_deleting_the_account_deletes_the_picture(client, make_user):
    alice = make_user("alice")
    url = _upload(client, alice, PNG).get_json()["user"]["avatarUrl"]
    client.delete(
        "/api/v1/auth/me", json={"password": "secret123"}, headers=alice["headers"]
    )
    assert client.get(url).status_code == 404
