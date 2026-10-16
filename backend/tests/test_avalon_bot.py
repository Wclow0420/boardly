"""Double Agent bots (app/games/avalon/bot.py): whole games played by
bots alone, driven the way app/bots.py drives them, plus the rules a
bot must keep in every phase."""

import random
from collections import Counter

import pytest

from app.games.avalon.game import QUEST_SIZES, ROLE_SETS, Avalon, is_evil

game = Avalon()
MOVE_CAP = 600


def waiting(state):
    rng = random.Random(0)
    n = state["numPlayers"]
    return [s for s in range(n) if game.bot_move(game.view_for(state, s), s, rng) is not None]


def play(n, seed, check=None):
    """A game with a bot in every seat. Like app/bots.py: ask every
    seat, then move each one that's waiting (asking again just before),
    until the game is over. `check(state, seat, move)` sees every move."""
    rng = random.Random(seed)
    state = game.initial_state(n, random.Random(seed * 31 + n))
    moves = 0
    while state["phase"] != "finished":
        ready = [
            s for s in range(n) if game.bot_move(game.view_for(state, s), s, rng) is not None
        ]
        assert ready, f"stalled in {state['phase']}"
        for seat in ready:
            move = game.bot_move(game.view_for(state, seat), seat, rng)
            if move is None:
                continue
            assert move["type"] != "pick"
            if check:
                check(state, seat, move)
            state = game.apply_move(state, seat, move)  # GameError fails the test
            moves += 1
            assert moves < MOVE_CAP, "game never ended"
            if state["phase"] == "finished":
                break
    return state


@pytest.mark.parametrize("n", sorted(ROLE_SETS))
def test_all_bot_games_finish_at_every_table_size(n):
    reasons = Counter()
    for seed in range(40):
        state = play(n, seed)
        assert state["winner"] in ("good", "evil")
        reasons[state["winReason"]] += 1
    # Neither side walks it
    good = reasons["quests"]
    assert 4 <= good <= 36, reasons


def test_good_never_fails_and_teams_are_the_right_size():
    def check(state, seat, move):
        role = state["roles"][seat]
        if move["type"] == "quest" and not is_evil(role):
            assert move["card"] == "success"
        if move["type"] == "propose":
            team = move["team"]
            assert seat == state["leader"]
            assert len(team) == len(set(team)) == QUEST_SIZES[state["numPlayers"]][state["quest"]]
            if not is_evil(role):
                assert seat in team
        if move["type"] == "assassinate":
            assert role == "assassin" and not is_evil(state["roles"][move["target"]])

    for n in sorted(ROLE_SETS):
        for seed in range(15):
            play(n, 1000 + seed, check)


def test_bots_answer_only_when_the_game_waits_on_them():
    state = game.initial_state(7, random.Random(3))
    assert waiting(state) == [state["leader"]]
    state = game.apply_move(state, state["leader"], {"type": "propose", "team": [0, 1]})
    assert waiting(state) == list(range(7))
    for seat in (0, 4):
        state = game.apply_move(state, seat, {"type": "vote", "approve": True})
    assert waiting(state) == [1, 2, 3, 5, 6]
    for seat in (1, 2, 3, 5, 6):
        state = game.apply_move(state, seat, {"type": "vote", "approve": True})
    assert state["phase"] == "quest"
    assert waiting(state) == [0, 1]
    state = game.apply_move(state, 0, {"type": "quest", "card": "success"})
    assert waiting(state) == [1]
    # A spectator never moves
    assert game.bot_move(game.view_for(state, -1), -1, random.Random()) is None


def start(roles, leader=0):
    state = game.initial_state(len(roles), random.Random(1))
    return {**state, "roles": list(roles), "leader": leader}


ROLES_5 = ["merlin", "percival", "servant", "assassin", "morgana"]


def move_for(state, seat, seed=0):
    return game.bot_move(game.view_for(state, seat), seat, random.Random(seed))


def test_the_last_team_before_five_rejections_is_always_approved_by_agents():
    state = {**start(ROLES_5), "rejections": 4}
    state = game.apply_move(state, 0, {"type": "propose", "team": [3, 4]})
    for seed in range(30):
        for seat in (0, 1, 2):
            assert move_for(state, seat, seed) == {"type": "vote", "approve": True}


def test_a_proven_mole_is_kept_off_teams_and_voted_down():
    # Seats 2 and 3 went on a mission and it failed: the agent in 2
    # knows 3 is a mole
    state = start(ROLES_5, leader=2)
    state = game.apply_move(state, 2, {"type": "propose", "team": [2, 3]})
    for seat in range(5):
        state = game.apply_move(state, seat, {"type": "vote", "approve": True})
    state = game.apply_move(state, 2, {"type": "quest", "card": "success"})
    state = game.apply_move(state, 3, {"type": "quest", "card": "fail"})
    assert state["leader"] == 3
    state = {**state, "leader": 2}
    for seed in range(20):
        assert 3 not in move_for(state, 2, seed)["team"]
    state = game.apply_move(state, 2, {"type": "propose", "team": [0, 2, 3]})
    approvals = sum(move_for(state, 2, seed)["approve"] for seed in range(40))
    assert approvals <= 8


def test_the_handler_steers_clear_of_moles_he_can_see():
    state = start(ROLES_5, leader=0)
    teams = [move_for(state, 0, seed)["team"] for seed in range(200)]
    dirty = sum(bool({3, 4} & set(t)) for t in teams)
    # Not every time (he hides it), but far less than chance (1/2)
    assert dirty < 60


def test_the_bodyguard_knows_one_candidate_is_the_decoy():
    # Bodyguard (1) sees 0 and 4; one of them is a mole, so a team of
    # the two is never as safe as one with neither
    from app.games.avalon import bot

    view = game.view_for(start(ROLES_5), 1)
    worlds = bot._worlds(view, 1)
    assert all(len(moles & {0, 4}) == 1 for moles, _ in worlds)
    assert bot._clean_chance(worlds, [0, 4]) == 0


def test_moles_sabotage_together_only_when_it_takes_two():
    # Seven players: the fourth mission takes two sabotages
    roles = ["merlin", "percival", "servant", "servant", "assassin", "morgana", "oberon"]
    state = {**start(roles), "quest": 3, "phase": "quest", "team": [0, 1, 4, 5],
             "questCards": [None] * 7}
    for seed in range(20):
        assert move_for(state, 4, seed)["card"] == "fail"
        assert move_for(state, 5, seed)["card"] == "fail"
    # Alone on it (Oberon can't be seen), a mole mostly keeps quiet
    state = {**state, "team": [0, 1, 2, 4]}
    fails = sum(move_for(state, 4, seed)["card"] == "fail" for seed in range(100))
    assert fails < 70
    # One sabotage is enough on the first mission: only one of two moles plays it
    state = {**state, "quest": 1, "team": [0, 4, 5], "questResults": [
        {"team": [0, 1], "fails": 0, "success": True}]}
    for seed in range(20):
        assert move_for(state, 5, seed)["card"] == "success"


def test_moles_sabotage_when_it_decides_the_game():
    state = {**start(ROLES_5), "quest": 3, "phase": "quest", "team": [0, 1, 3],
             "questCards": [None] * 5, "questResults": [
                 {"team": [0, 1], "fails": 0, "success": True},
                 {"team": [0, 1, 2], "fails": 0, "success": True},
                 {"team": [0, 3], "fails": 1, "success": False}]}
    for seed in range(20):
        assert move_for(state, 3, seed)["card"] == "fail"


def test_a_mole_leader_puts_a_mole_on_the_team():
    for seed in range(30):
        state = start(ROLES_5, leader=4)
        team = move_for(state, 4, seed)["team"]
        assert 4 in team and 3 not in team


def test_the_hitman_names_the_agent_who_dodged_the_moles():
    state = start(ROLES_5, leader=0)
    # Merlin (0) leads clean teams and votes down dirty ones; the rest
    # wave everything through
    history = []
    for team, leader in (([0, 1], 0), ([1, 3], 1), ([2, 4, 1], 2), ([0, 2], 0)):
        dirty = bool({3, 4} & set(team))
        votes = [not dirty, True, True, True, True]
        history.append({"quest": 0, "leader": leader, "team": team, "votes": votes,
                        "approved": False})
    state = {**state, "phase": "assassinate", "history": history}
    for seed in range(10):
        assert move_for(state, 3, seed) == {"type": "assassinate", "target": 0}
    assert move_for(state, 4, 0) is None


def test_a_team_of_non_numbers_is_refused_not_a_crash():
    from app.games.base import GameError

    state = start(ROLES_5)
    with pytest.raises(GameError):
        game.apply_move(state, 0, {"type": "propose", "team": [[1], [2]]})
