"""Coup engine tests (pure) plus a check that the API hides hands."""

import json
import random

import pytest

from app.games.base import GameError
from app.games.coup.game import ROLES, Coup, alive, hand

game = Coup()


def table(hands, coins=None, deck=None, turn=0):
    """A game in a known position. `hands` is one "role,role" per seat."""
    n = len(hands)
    return {
        "numPlayers": n,
        "players": [
            {
                "coins": (coins or [2] * n)[seat],
                "cards": [{"role": r, "revealed": False} for r in cards.split(",")],
            }
            for seat, cards in enumerate(hands)
        ],
        "deck": list(deck or ["duke", "assassin", "captain", "ambassador", "contessa"]),
        "turn": turn,
        "phase": "action",
        "action": None,
        "block": None,
        "passed": [],
        "pending": None,
        "exchange": None,
        "log": [],
        "winner": None,
    }


def act(state, seat, action, target=None):
    return game.apply_move(state, seat, {"type": "action", "action": action, "target": target})


def do(state, seat, kind, **extra):
    return game.apply_move(state, seat, {"type": kind, **extra})


def all_pass(state, seats):
    for seat in seats:
        state = do(state, seat, "pass")
    return state


def coins(state):
    return [p["coins"] for p in state["players"]]


THREE = ["duke,captain", "assassin,contessa", "ambassador,captain"]


# ---------------------------------------------------------------- setup


@pytest.mark.parametrize("n", range(2, 7))
def test_setup(n):
    state = game.initial_state(n, random.Random(n))
    cards = [c["role"] for p in state["players"] for c in p["cards"]] + state["deck"]
    assert sorted(cards) == sorted(ROLES * 3)
    assert len(state["deck"]) == 15 - 2 * n
    assert all(len(p["cards"]) == 2 for p in state["players"])
    expected = [2] * n
    if n == 2:
        expected[state["turn"]] = 1
    assert coins(state) == expected
    assert game.get_result(state) is None


def test_rejects_bad_player_counts():
    for n in (1, 7):
        with pytest.raises(GameError):
            game.initial_state(n)


# -------------------------------------------------------- plain actions


def test_income_and_turn_order():
    state = act(table(THREE), 0, "income")
    assert coins(state) == [3, 2, 2]
    assert (state["turn"], state["phase"]) == (1, "action")
    with pytest.raises(GameError, match="Not your turn"):
        act(state, 0, "income")


def test_coup_costs_seven_and_cannot_be_stopped():
    state = table(THREE, coins=[7, 2, 2])
    with pytest.raises(GameError, match="Not enough cash"):
        act(table(THREE, coins=[6, 2, 2]), 0, "coup", 1)
    for bad in (0, 5, None, "1"):
        with pytest.raises(GameError):
            act(state, 0, "coup", bad)

    state = act(state, 0, "coup", 1)
    assert coins(state)[0] == 0
    assert state["phase"] == "loseInfluence" and state["pending"]["seat"] == 1
    with pytest.raises(GameError):
        do(state, 2, "reveal", card=0)
    state = do(state, 1, "reveal", card=1)
    assert state["players"][1]["cards"][1]["revealed"] is True
    assert (state["turn"], state["phase"]) == (1, "action")


def test_ten_coins_forces_a_coup():
    state = table(THREE, coins=[10, 2, 2])
    with pytest.raises(GameError, match="must shut someone down"):
        act(state, 0, "income")
    assert act(state, 0, "coup", 2)["phase"] == "loseInfluence"


def test_unknown_and_malformed_moves():
    state = table(THREE)
    for move in ({}, {"type": "nope"}, {"type": "action", "action": "fly"},
                 {"type": "action", "action": ["tax"]}, None, "pass"):
        with pytest.raises(GameError):
            game.apply_move(state, 0, move)
    for kind in ("pass", "challenge", "reveal", "exchange"):
        with pytest.raises(GameError):
            do(state, 1, kind)
    with pytest.raises(GameError):
        do(state, 1, "block", role="duke")


# ----------------------------------------------------------- foreign aid


def test_foreign_aid_goes_through_when_everyone_allows():
    state = act(table(THREE), 0, "foreignAid")
    assert state["phase"] == "block"
    with pytest.raises(GameError):
        do(state, 0, "pass")  # the actor doesn't respond to their own action
    state = do(state, 1, "pass")
    with pytest.raises(GameError, match="already"):
        do(state, 1, "pass")
    assert coins(state) == [2, 2, 2]
    state = do(state, 2, "pass")
    assert coins(state) == [4, 2, 2]
    assert state["turn"] == 1


def test_anyone_can_block_foreign_aid_with_duke():
    state = act(table(THREE), 0, "foreignAid")
    with pytest.raises(GameError, match="can't block"):
        do(state, 2, "block", role="contessa")
    state = do(state, 2, "block", role="duke")  # a bluff: seat 2 has no duke
    assert state["phase"] == "challengeBlock"
    assert state["block"] == {"seat": 2, "role": "duke"}
    state = all_pass(state, [0, 1])
    assert coins(state) == [2, 2, 2]  # blocked
    assert state["turn"] == 1


def test_challenging_a_bluffed_block_lets_the_action_through():
    state = act(table(THREE), 0, "foreignAid")
    state = do(state, 2, "block", role="duke")
    state = do(state, 0, "challenge")
    # seat 2 lied and must give up a card
    assert state["pending"]["seat"] == 2
    state = do(state, 2, "reveal", card=0)
    assert coins(state) == [4, 2, 2]
    assert state["turn"] == 1


def test_challenging_an_honest_block_costs_the_challenger():
    hands = ["duke,captain", "duke,contessa", "ambassador,captain"]
    state = act(table(hands, deck=["assassin"]), 0, "foreignAid")
    state = do(state, 1, "block", role="duke")
    state = do(state, 2, "challenge")
    assert state["pending"]["seat"] == 2
    # the blocker showed the duke and drew a replacement
    assert [c["role"] for c in state["players"][1]["cards"]].count("contessa") == 1
    assert sorted(state["deck"] + [state["players"][1]["cards"][0]["role"]]) == [
        "assassin", "duke",
    ]
    state = do(state, 2, "reveal", card=1)
    assert coins(state) == [2, 2, 2]  # still blocked
    assert state["turn"] == 1


# ------------------------------------------------------------------ tax


def test_tax_unchallenged():
    state = act(table(THREE), 0, "tax")
    assert state["phase"] == "challengeAction"
    assert state["action"]["claim"] == "duke"
    state = all_pass(state, [1, 2])
    assert coins(state) == [5, 2, 2]


def test_caught_bluffing_tax():
    state = act(table(THREE, turn=1), 1, "tax")  # seat 1 has no duke
    state = do(state, 2, "challenge")
    assert state["log"][-1] == {
        "t": "challenge", "challenger": 2, "claimant": 1, "role": "duke", "caught": True,
    }
    state = do(state, 1, "reveal", card=0)
    assert coins(state) == [2, 2, 2]
    assert state["turn"] == 2


def test_wrongly_challenged_tax_still_pays():
    state = act(table(THREE, deck=["contessa"]), 0, "tax")
    state = do(state, 1, "pass")
    with pytest.raises(GameError, match="already let it through"):
        do(state, 1, "challenge")
    state = do(state, 2, "challenge")
    assert state["pending"]["seat"] == 2
    state = do(state, 2, "reveal", card=0)
    assert coins(state) == [5, 2, 2]
    assert state["turn"] == 1


# ---------------------------------------------------------- assassinate


def assassinate(hands=None, deck=None):
    hands = hands or ["assassin,captain", "duke,contessa", "ambassador,captain"]
    return act(table(hands, coins=[3, 2, 2], deck=deck), 0, "assassinate", 1)


def test_assassination_succeeds():
    state = assassinate()
    assert coins(state)[0] == 0
    state = all_pass(state, [1, 2])  # nobody challenges
    assert state["phase"] == "block"
    with pytest.raises(GameError, match="can't block"):
        do(state, 2, "block", role="contessa")  # only the target may block
    state = do(state, 1, "pass")
    assert state["pending"] == {"seat": 1, "next": "end", "why": "assassinate"}
    assert game.view_for(state, 2)["losing"] == {"seat": 1, "why": "assassinate"}
    state = do(state, 1, "reveal", card=0)
    assert len(hand(state, 1)) == 1 and state["turn"] == 1


def test_contessa_blocks_assassination_and_the_coins_are_gone():
    state = all_pass(assassinate(), [1, 2])
    state = do(state, 1, "block", role="contessa")
    state = all_pass(state, [0, 2])
    assert len(hand(state, 1)) == 2
    assert coins(state)[0] == 0
    assert state["log"][-1] == {"t": "blocked", "seat": 1}


def test_caught_bluffing_assassin_gets_the_coins_back():
    state = assassinate(hands=["duke,captain", "duke,contessa", "ambassador,captain"])
    state = do(state, 2, "challenge")
    state = do(state, 0, "reveal", card=0)
    assert coins(state)[0] == 3
    assert len(hand(state, 1)) == 2 and state["turn"] == 1


def test_bluffing_contessa_costs_both_cards():
    hands = ["assassin,captain", "duke,duke", "ambassador,captain"]
    state = all_pass(assassinate(hands), [1, 2])
    state = do(state, 1, "block", role="contessa")
    state = do(state, 0, "challenge")
    state = do(state, 1, "reveal", card=0)  # for the lie...
    # ...and the assassination takes the last one, no choice needed
    assert not alive(state, 1)
    assert coins(state)[1] == 0
    assert {"t": "out", "seat": 1} in state["log"]
    assert state["turn"] == 2  # skips the eliminated player


def test_target_wrongly_challenging_the_assassin_can_lose_everything():
    state = assassinate(deck=["duke"])
    state = do(state, 1, "challenge")
    state = do(state, 1, "reveal", card=0)  # lost the challenge
    assert state["phase"] == "block"  # may still try a contessa
    state = do(state, 1, "pass")
    assert not alive(state, 1)


# ---------------------------------------------------------------- steal


def test_steal():
    state = act(table(THREE, coins=[2, 1, 2]), 0, "steal", 1)
    state = all_pass(state, [1, 2])
    state = do(state, 1, "pass")
    assert coins(state) == [3, 0, 2]  # only what they had


@pytest.mark.parametrize("role", ["captain", "ambassador"])
def test_steal_is_blocked_by_captain_or_ambassador(role):
    state = all_pass(act(table(THREE), 0, "steal", 2), [1, 2])
    with pytest.raises(GameError):
        do(state, 2, "block", role="duke")
    state = all_pass(do(state, 2, "block", role=role), [0, 1])
    assert coins(state) == [2, 2, 2]


# ------------------------------------------------------------- exchange


def test_exchange():
    hands = ["ambassador,captain", "duke,contessa", "assassin,captain"]
    state = act(table(hands, deck=["duke", "contessa", "assassin"]), 0, "exchange")
    state = all_pass(state, [1, 2])
    assert state["phase"] == "exchange"
    assert state["exchange"] == ["ambassador", "captain", "assassin", "contessa"]
    assert game.view_for(state, 0)["exchange"] == state["exchange"]
    assert game.view_for(state, 1)["exchange"] is None

    for bad in ([0], [0, 0], [0, 9], [0, 1, 2], "01", None):
        with pytest.raises(GameError):
            do(state, 0, "exchange", keep=bad)
    with pytest.raises(GameError):
        do(state, 1, "exchange", keep=[0, 1])

    state = do(state, 0, "exchange", keep=[2, 3])
    assert [c["role"] for c in state["players"][0]["cards"]] == ["assassin", "contessa"]
    assert sorted(state["deck"]) == ["ambassador", "captain", "duke"]
    assert state["turn"] == 1


def test_exchange_with_one_card_left_keeps_one():
    state = table(["ambassador,captain", "duke,contessa"], deck=["duke", "assassin"])
    state["players"][0]["cards"][1]["revealed"] = True
    state = all_pass(act(state, 0, "exchange"), [1])
    assert len(state["exchange"]) == 3
    with pytest.raises(GameError):
        do(state, 0, "exchange", keep=[0, 1])
    state = do(state, 0, "exchange", keep=[1])
    assert state["players"][0]["cards"][0]["role"] == "assassin"
    assert state["players"][0]["cards"][1] == {"role": "captain", "revealed": True}


# ------------------------------------------------------------- the end


def test_last_player_standing_wins():
    state = table(["duke,captain", "duke,contessa"], coins=[7, 2])
    state["players"][1]["cards"][0]["revealed"] = True
    state = act(state, 0, "coup", 1)
    assert state["phase"] == "finished"
    assert state["winner"] == 0
    assert game.get_result(state) == {"winnerSeat": 0}
    with pytest.raises(GameError, match="already over"):
        act(state, 0, "income")


def test_abandoned_game_has_no_winner():
    state = game.on_abandon(act(table(THREE), 0, "tax"), 1)
    assert state["phase"] == "finished"
    assert game.get_result(state) == {"draw": True}


def test_card_count_is_conserved_through_a_random_game():
    """Play random legal moves to the end: nothing crashes, the 15 cards
    never duplicate or vanish, and someone wins."""
    rng = random.Random(7)
    for _ in range(40):
        state = game.initial_state(rng.randint(2, 6), rng)
        for _step in range(2000):
            if state["phase"] == "finished":
                break
            view = game.view_for(state, -1)
            seat = rng.choice(view["waitingOn"])
            phase = state["phase"]
            if phase == "action":
                others = [s for s in range(state["numPlayers"]) if s != seat and alive(state, s)]
                options = [("income", None), ("foreignAid", None), ("tax", None),
                           ("exchange", None), ("steal", rng.choice(others)),
                           ("assassinate", rng.choice(others)), ("coup", rng.choice(others))]
                rng.shuffle(options)
                for kind, target in options:
                    try:
                        state = act(state, seat, kind, target)
                        break
                    except GameError:
                        continue
            elif phase == "loseInfluence":
                state = do(state, seat, "reveal", card=rng.choice(hand(state, seat)))
            elif phase == "exchange":
                keep = rng.sample(range(len(state["exchange"])), len(hand(state, seat)))
                state = do(state, seat, "exchange", keep=keep)
            else:
                roll = rng.random()
                try:
                    if roll < 0.25 and phase != "block":
                        state = do(state, seat, "challenge")
                    elif roll < 0.5 and phase == "block":
                        role = rng.choice(["duke", "contessa", "captain", "ambassador"])
                        state = do(state, seat, "block", role=role)
                    else:
                        state = do(state, seat, "pass")
                except GameError:
                    state = do(state, seat, "pass")

            cards = [c["role"] for p in state["players"] for c in p["cards"]]
            cards += state["deck"] + (state["exchange"] or [])
            if state["exchange"]:
                # options include the actor's own face-down cards
                actor = state["action"]["actor"]
                for i in hand(state, actor):
                    cards.remove(state["players"][actor]["cards"][i]["role"])
            assert sorted(cards) == sorted(ROLES * 3)
            assert all(p["coins"] >= 0 for p in state["players"])
        assert state["phase"] == "finished"
        assert state["winner"] is not None and alive(state, state["winner"])


# ----------------------------------------------------------------- view


def test_view_hides_other_hands_and_the_deck():
    state = act(table(THREE), 0, "tax")
    view = game.view_for(state, 1)
    assert [c["role"] for c in view["players"][1]["cards"]] == ["assassin", "contessa"]
    assert [c["role"] for c in view["players"][0]["cards"]] == [None, None]
    assert "deck" not in view and view["deckCount"] == 5
    assert view["waitingOn"] == [1, 2]
    assert view["action"] == {"type": "tax", "actor": 0, "target": None, "claim": "duke"}

    spectator = json.dumps(game.view_for(state, -1)["players"])
    assert all(role not in spectator for role in ROLES)


def test_revealed_cards_are_public():
    state = do(act(table(THREE, coins=[7, 2, 2]), 0, "coup", 1), 1, "reveal", card=0)
    card = game.view_for(state, 2)["players"][1]["cards"][0]
    assert card == {"revealed": True, "role": "assassin"}


def test_api_serves_only_my_own_hand(client, make_user):
    alice, bob = make_user("alice"), make_user("bob")
    room = client.post(
        "/api/v1/rooms", json={"gameType": "coup"}, headers=alice["headers"]
    ).get_json()["room"]
    client.post("/api/v1/rooms/join", json={"code": room["code"]}, headers=bob["headers"])
    client.post(f"/api/v1/rooms/{room['id']}/ready", json={"ready": True}, headers=bob["headers"])
    assert client.post(
        f"/api/v1/rooms/{room['id']}/start", headers=alice["headers"]
    ).status_code == 201

    for seat, user in enumerate((alice, bob)):
        state = client.get(
            f"/api/v1/rooms/code/{room['code']}", headers=user["headers"]
        ).get_json()["room"]["session"]["state"]
        mine, theirs = state["players"][seat], state["players"][1 - seat]
        assert all(c["role"] in ROLES for c in mine["cards"])
        assert all(c["role"] is None for c in theirs["cards"])
        assert "deck" not in state


# ------------------------------------------------- why a card is lost


def test_the_table_sees_why_a_card_is_turned_over():
    # a caught bluff: the loser chooses, everyone sees it's a challenge
    state = do(act(table(THREE), 0, "steal", 1), 1, "challenge")
    assert state["log"][-1] == {
        "t": "challenge", "challenger": 1, "claimant": 0, "role": "captain", "caught": False,
    }
    state = do(state, 1, "reveal", card=0)
    assert state["log"][-1] == {"t": "lose", "seat": 1, "role": "assassin", "why": "challenge"}
    assert game.view_for(state, 0)["losing"] is None


def test_a_coup_on_a_last_card_is_logged_as_a_coup():
    hands = ["duke,captain", "assassin,contessa", "ambassador,captain"]
    state = table(hands, coins=[7, 2, 2])
    state["players"][1]["cards"][0]["revealed"] = True
    state = act(state, 0, "coup", 1)
    assert {"t": "lose", "seat": 1, "role": "contessa", "why": "coup"} in state["log"]
    assert state["log"][-1] == {"t": "out", "seat": 1}


def test_a_coup_on_two_cards_shows_who_is_choosing():
    state = act(table(THREE, coins=[7, 2, 2]), 0, "coup", 2)
    view = game.view_for(state, 1)
    assert view["phase"] == "loseInfluence"
    assert view["losing"] == {"seat": 2, "why": "coup"}
    state = do(state, 2, "reveal", card=1)
    assert state["log"][-1] == {"t": "lose", "seat": 2, "role": "captain", "why": "coup"}


# --------------------------------------------------------------- badges


def _row(state, seat, won=None):
    """The outcome row a finished game would store for `seat`."""
    from types import SimpleNamespace

    facts = game.player_outcome(state, seat)["facts"]
    won = state["winner"] == seat if won is None else won
    return SimpleNamespace(won=won, abandoned=False, side=None, role=None, facts=facts)


def _badge(key):
    return next(b for b in game.badges if b.key == key)


def test_hustle_has_a_full_badge_set():
    keys = [b.key for b in game.badges]
    assert keys == ["coup.kingpin", "coup.untouchable", "coup.smooth", "coup.sharpEye"]


def test_an_unchallenged_bluff_is_counted_but_never_shown():
    state = act(table(THREE, turn=1), 1, "tax")  # seat 1 has no duke
    state = all_pass(state, [0, 2])
    assert state["bluffs"] == [0, 1, 0]
    assert "bluffs" not in game.view_for(state, 1)
    # an honest claim that goes through is no bluff
    state = all_pass(act(state, 2, "exchange"), [0, 1])
    assert state["bluffs"] == [0, 1, 0]


def test_a_bluffed_block_nobody_doubts_is_counted():
    state = act(table(THREE), 0, "foreignAid")
    state = do(state, 2, "block", role="duke")  # seat 2 has no duke
    state = all_pass(state, [0, 1])
    assert state["bluffs"] == [0, 0, 1]


def test_outcome_facts_count_cards_bluffs_and_callouts():
    state = act(table(THREE, turn=1), 1, "tax")
    state = do(state, 2, "challenge")  # caught
    state = do(state, 1, "reveal", card=0)
    assert game.player_outcome(state, 1)["facts"] == {
        "cardsLeft": 1, "bluffs": 0, "caught": 1, "callouts": 0,
    }
    assert game.player_outcome(state, 2)["facts"]["callouts"] == 1
    # the test table, like older games, has no bluff count: still fine
    assert "bluffs" not in state
    assert game.player_outcome(state, 0)["facts"]["bluffs"] == 0


def test_untouchable_and_smooth_talker():
    # seat 0 bluffs a Boss, gets away with it, then shuts the last player down
    state = table(["captain,captain", "duke,contessa"], coins=[5, 2])
    state["players"][1]["cards"][0]["revealed"] = True
    state = all_pass(act(state, 0, "tax"), [1])  # +$3, a bluff
    state = act(state, 1, "income")
    state = act(state, 0, "coup", 1)
    assert state["winner"] == 0
    winner = _row(state, 0)
    assert _badge("coup.kingpin").match(winner)
    assert _badge("coup.untouchable").match(winner)
    assert _badge("coup.smooth").match(winner)
    assert not _badge("coup.sharpEye").match(winner)
    loser = _row(state, 1)
    assert not any(_badge(k).match(loser) for k in ("coup.kingpin", "coup.untouchable", "coup.smooth"))


def test_caught_once_is_no_smooth_talker_and_the_catcher_has_a_sharp_eye():
    state = act(table(THREE, turn=1), 1, "tax")
    state = do(state, 2, "challenge")
    state = do(state, 1, "reveal", card=0)
    state["bluffs"] = [0, 2, 0]
    assert not _badge("coup.smooth").match(_row(state, 1, won=True))
    assert not _badge("coup.untouchable").match(_row(state, 1, won=True))
    assert _badge("coup.sharpEye").match(_row(state, 2, won=False))
    walked_out = _row(state, 2, won=False)
    walked_out.abandoned = True
    assert not _badge("coup.sharpEye").match(walked_out)
