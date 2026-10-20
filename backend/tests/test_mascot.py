"""The mascot: dressing in what you own, buying the rest with coins, and
everyone seeing it."""

import json
from pathlib import Path

from tests.test_friends import _befriend

AUTH = "/api/v1/auth"
STARTER = {"skin": "glossy", "colour": "#F5922E", "wear": {"eyes": "dots", "mouth": "smile"}}


def _coins(app, user, amount):
    import uuid

    from app.extensions import db
    from app.models import User

    with app.app_context():
        u = db.session.get(User, uuid.UUID(user["id"]))
        u.coins = amount
        db.session.commit()


def test_a_new_player_wears_the_starter(client, make_user):
    alice = make_user("alice")
    me = client.get(f"{AUTH}/me", headers=alice["headers"]).get_json()["user"]
    assert me["mascot"]["skin"] == "glossy"
    assert me["ownedMascot"] == []


def test_free_items_can_be_worn_paid_ones_cannot(client, make_user):
    alice = make_user("alice")
    free = {**STARTER, "colour": "#3A78D8", "wear": {"eyes": "googly", "top": "tee"}}
    res = client.put(f"{AUTH}/me/mascot", json={"look": free}, headers=alice["headers"])
    assert res.status_code == 200
    assert res.get_json()["user"]["mascot"]["wear"]["top"] == "tee"

    crowned = {**STARTER, "wear": {"hat": "crown"}}
    res = client.put(f"{AUTH}/me/mascot", json={"look": crowned}, headers=alice["headers"])
    assert res.status_code == 403


def test_unknown_items_and_colours_are_refused(client, make_user):
    alice = make_user("alice")
    for look in (
        {**STARTER, "wear": {"hat": "no-such-hat"}},
        {**STARTER, "wear": {"tail": "fox"}},
        {**STARTER, "colour": "#123456"},
        {**STARTER, "skin": "dragon"},
        "crown",
    ):
        res = client.put(f"{AUTH}/me/mascot", json={"look": look}, headers=alice["headers"])
        assert res.status_code == 400


def test_buying_takes_the_coins_once_and_puts_it_on(app, client, make_user):
    alice = make_user("alice")
    _coins(app, alice, 4000)
    look = {**STARTER, "skin": "gingerbread", "wear": {"hat": "beanie", "top": "tee"}}
    res = client.post(f"{AUTH}/me/mascot/buy", json={"look": look}, headers=alice["headers"])
    assert res.status_code == 200
    me = res.get_json()["user"]
    # gingerbread 3000 + beanie 300; the tee is free
    assert me["coins"] == 700
    assert set(me["ownedMascot"]) == {"skin:gingerbread", "hat:beanie"}
    assert me["mascot"]["skin"] == "gingerbread"

    # buying the same look again costs nothing
    res = client.post(f"{AUTH}/me/mascot/buy", json={"look": look}, headers=alice["headers"])
    assert res.get_json()["user"]["coins"] == 700


def test_too_few_coins_buys_nothing(app, client, make_user):
    alice = make_user("alice")
    _coins(app, alice, 1000)
    look = {**STARTER, "wear": {"hat": "crown", "hand": "balloon"}}
    res = client.post(f"{AUTH}/me/mascot/buy", json={"look": look}, headers=alice["headers"])
    assert res.status_code == 402
    me = client.get(f"{AUTH}/me", headers=alice["headers"]).get_json()["user"]
    assert me["coins"] == 1000
    assert me["ownedMascot"] == []


def test_others_see_the_mascot_but_not_what_was_bought(app, client, make_user):
    alice = make_user("alice")
    bob = make_user("bob")
    look = {**STARTER, "colour": "#E0403A", "wear": {"eyes": "googly"}}
    client.put(f"{AUTH}/me/mascot", json={"look": look}, headers=alice["headers"])
    _befriend(client, alice, bob)
    card = client.get(
        f"/api/v1/friends/{alice['id']}/card", headers=bob["headers"]
    ).get_json()["card"]
    seen = card["user"]
    assert seen["mascot"]["colour"] == "#E0403A"
    assert "ownedMascot" not in seen


def test_the_catalog_matches_the_app():
    """mascot_catalog.json is written from the app; it must parse and
    price every skin and slot."""
    catalog = json.loads(
        (Path(__file__).parents[1] / "app" / "mascot_catalog.json").read_text()
    )
    assert catalog["items"]["skin:glossy"] == 0
    assert all(isinstance(p, int) and p >= 0 for p in catalog["items"].values())
