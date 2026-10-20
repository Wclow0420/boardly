"""Midnight Manor's bots: whole all-bot games played the way app/bots.py
drives them (ask every seat, every bot with an answer moves), plus a few
checks of the policy itself."""

import random
from collections import Counter

import pytest

from app.games.manor.game import HALL, ROLE_SETS, SECURITY, Manor

KITCHEN, LIBRARY, BEDROOM, STUDY = 3, 1, 2, 0
MOVE_CAP = 300  # moves; a night is at most ~8 hours x 3 phases x 8 seats
COUNTS = sorted(ROLE_SETS)


def play(n, seed):
    """One all-bot game; returns the final state and the moves made."""
    game = Manor(random.Random(seed))
    rng = random.Random(seed + 10_000)
    state = game.initial_state(n)
    moves = 0
    while state["phase"] != "finished":
        waiting = [s for s in range(n)
                   if game.bot_move(game.view_for(state, s), s, rng) is not None]
        assert waiting, f"stalled: n={n} seed={seed} phase={state['phase']}"
        for seat in waiting:
            # Asked again on the state as it is now, as the driver does
            move = game.bot_move(game.view_for(state, seat), seat, rng)
            if move is None:
                continue
            state = game.apply_move(state, seat, move)  # GameError fails the test
            moves += 1
            if state["phase"] == "finished":
                break
        assert moves < MOVE_CAP, f"never ended: n={n} seed={seed}"
    return state, moves


@pytest.mark.parametrize("n", COUNTS)
def test_all_bot_games_finish_with_only_legal_moves(n):
    reasons = Counter()
    for seed in range(40):
        state, _ = play(n, seed)
        assert state["winner"] in ("good", "evil")
        reasons[state["winReason"]] += 1
    # Every way a night can end is reachable
    assert set(reasons) <= {"dawn", "caught", "killed", "butlerFound"}


def test_neither_side_runs_away_with_it():
    games, evil = 0, 0
    by_count = {}
    for n in COUNTS:
        wins = Counter(play(n, seed)[0]["winner"] for seed in range(60))
        by_count[n] = wins["evil"] / 60
        evil += wins["evil"]
        games += 60
    print("\nMidnight Manor all-bot games, intruders' win rate:",
          {n: f"{rate:.0%}" for n, rate in by_count.items()},
          f"overall {evil / games:.0%}")
    assert 0.3 <= evil / games <= 0.7
    assert all(0.2 <= rate <= 0.8 for rate in by_count.values())


# ------------------------------------------------------------- policy

game = Manor(random.Random(0))
ROLES_5 = ["butler", "guard", "guest", "intruder", "intruder"]


def start(roles=ROLES_5, rooms=None, owner=BEDROOM, phase="move"):
    state = game.initial_state(len(roles), random.Random(1))
    n = len(roles)
    return {**state, "roles": list(roles), "phase": phase,
            "positions": list(rooms or [HALL] * n),
            "carrying": [None] * n,
            "owner": {**state["owner"], "room": owner, "startRoom": owner}}


def bot(state, seat, seed=0):
    return game.bot_move(game.view_for(state, seat), seat, random.Random(seed))


def test_no_answer_unless_the_game_waits_on_that_seat():
    state = start()
    state = game.apply_move(state, 0, {"type": "move", "room": HALL})
    assert bot(state, 0) is None  # already chose this hour
    assert bot(state, 1) is not None
    locked = {**start(), "positions": [None, HALL, HALL, HALL, HALL]}
    assert bot(locked, 0) is None  # locked up
    dawn = {**start(), "phase": "guess"}
    assert [bot(dawn, s) is not None for s in range(5)] == [False, False, False, True, False]
    assert bot({**start(), "phase": "finished"}, 1) is None


def test_the_ringleader_never_names_an_intruder():
    dawn = {**start(), "phase": "guess"}
    for seed in range(50):
        assert bot(dawn, 3, seed)["target"] in (0, 1, 2)


def test_the_butler_heads_for_the_old_man():
    # The old man is in the Library, next to the Hall
    state = start(owner=LIBRARY)
    rooms = Counter(bot(state, 0, seed)["room"] for seed in range(100))
    assert rooms[LIBRARY] >= 90


def test_an_armed_intruder_alone_with_him_strikes():
    state = start(rooms=[HALL, HALL, HALL, BEDROOM, STUDY], phase="act")
    state["carrying"][3] = "knife"
    for seed in range(20):
        assert bot(state, 3, seed)["action"] == "attack"


def test_an_unarmed_intruder_goes_for_a_weapon_and_takes_it():
    state = start()
    targets = {bot(state, s)["room"] for s in (3, 4)}
    assert targets <= {KITCHEN, LIBRARY, 6} and len(targets) == 2  # one each
    state = start(rooms=[HALL, HALL, HALL, KITCHEN, HALL], phase="act")
    assert bot(state, 3) == {"type": "act", "action": "take", "item": "knife"}


def test_the_household_guards_him_when_someone_is_near():
    state = start(rooms=[BEDROOM, HALL, HALL, BEDROOM, HALL], phase="act")
    assert bot(state, 0)["action"] == "guard"
    alone = start(rooms=[BEDROOM, HALL, HALL, HALL, HALL], phase="act")
    assert bot(alone, 0)["action"] == "escort"


def test_a_good_bot_accuses_whoever_the_flashlight_caught():
    state = start(phase="gathering")
    state["logs"][1] = [{
        "hour": 0, "room": BEDROOM, "company": True, "owner": True,
        "action": {"action": "flashlight"},
        "seen": [{"seat": 4, "action": "attack"}, {"seat": 0, "action": "guard"}],
    }]
    for seed in range(20):
        assert bot(state, 1, seed) == {"type": "accuse", "target": 4}


def test_intruders_never_accuse_each_other():
    state = start(phase="gathering")
    state["events"] = [
        {"hour": 0, "kind": "scream", "room": BEDROOM},
        {"hour": 0, "kind": "gathering", "votes": [3, 3, None, None, None],
         "locked": None},
    ]
    targets = {bot(state, s, seed)["target"] for s in (3, 4) for seed in range(30)}
    assert targets <= {0, 1, 2, None}
    # ...and both go after the same accuser
    assert targets - {None} in ({0}, {1})


def test_the_household_follows_a_voting_bloc():
    # Seats 3 and 4 voted together against seat 2: the table saw it
    state = start(phase="gathering")
    state["events"] = [{"hour": 2, "kind": "gathering",
                        "votes": [None, None, None, 2, 2], "locked": None}]
    for s in (0, 1, 2):
        assert bot(state, s)["target"] == 3


def test_no_one_stays_in_the_security_room():
    rooms = [SECURITY] * 5
    state = start(rooms=rooms)
    for s in range(5):
        for seed in range(20):
            assert bot(state, s, seed)["room"] != SECURITY


def test_bots_play_a_whole_game_with_a_person(client, make_user):
    rooms = "/api/v1/rooms"
    alice = make_user("alice")
    room = client.post(rooms, json={"gameType": "manor"},
                       headers=alice["headers"]).get_json()["room"]
    assert room["botsAvailable"] is True
    client.post(f"{rooms}/{room['id']}/bots", json={"count": 4},
                headers=alice["headers"])
    assert client.post(f"{rooms}/{room['id']}/start",
                       headers=alice["headers"]).status_code == 201
    rng = random.Random(3)
    for _ in range(200):
        session = client.get(f"{rooms}/code/{room['code']}",
                             headers=alice["headers"]).get_json()["room"]["session"]
        if session["status"] != "in_progress":
            break
        move = game.bot_move(session["state"], 0, rng)
        assert move is not None, "the game waits on neither Alice nor a bot"
        res = client.post(f"{rooms}/{room['id']}/move", json={"move": move},
                          headers=alice["headers"])
        assert res.status_code == 200, res.get_json()
    assert session["status"] == "finished"
