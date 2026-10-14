"""Shelter engine tests (pure)."""

import random

import pytest

from app.games.base import GameError
from app.games.shelter.game import COUNTS, Shelter, places_for


class Fixed(random.Random):
    """Draws take the first option (or a set card), shuffles leave things be."""

    def __init__(self, card="f1", pick=0):
        super().__init__(0)
        self.card = card
        self.pick = pick

    def choice(self, seq):
        return seq[min(self.pick, len(seq) - 1)]

    def choices(self, population, weights=None, k=1):
        return [self.card] * k

    def shuffle(self, x):
        pass


def make(n=4, card="f1", turns=None, pick=0):
    game = Shelter(Fixed(card, pick))
    state = game.initial_state(n)
    if turns is not None:
        state = {**state, "turnNights": turns}
    return game, state


def search_all(game, state, places=None, plays=None):
    places = places or {}
    for s in game.searchers(state):
        state = game.apply_move(state, s, {"type": "search", "place": places.get(s, "farm")})
    plays = plays or {}
    for s in game.searchers(state):
        state = game.apply_move(state, s, {"type": "play", "card": plays.get(s, 0)})
    return state


def night_all(game, state, posts=None, stealth=()):
    posts = posts or {}
    for s in game.standing(state):
        move = {"type": "night", "post": posts.get(s, "sleep")}
        if s in stealth:
            move["stealth"] = True
        state = game.apply_move(state, s, move)
    return state


def vote_all(game, state, votes=None):
    votes = votes or {}
    for s in game.standing(state):
        state = game.apply_move(state, s, {"type": "vote", "target": votes.get(s, -1)})
    return state


def notes(state, seat, kind):
    return [n for n in state["logs"][seat] if n["kind"] == kind]


def test_player_counts():
    game = Shelter()
    for n in range(4, 9):
        state = game.initial_state(n)
        assert state["store"] == n
        assert len(state["turnNights"]) == COUNTS[n][0]
        assert state["turnNights"][0] in (1, 2)
    for bad in (3, 9):
        with pytest.raises(GameError):
            game.initial_state(bad)
    assert places_for(4) == ["farm", "market"]
    assert "hospital" in places_for(5)


def test_a_quiet_first_day_feeds_everyone():
    game, state = make(4, card="f2", turns=[2])
    state = search_all(game, state)
    assert state["phase"] == "night"
    # four players, two food each
    assert state["store"] == 4 + 8
    assert state["searches"][0]["places"]["farm"]["food"] == 8
    state = night_all(game, state)
    assert state["store"] == 12 - 4
    assert state["day"] == 1 and state["phase"] == "search"


def test_the_cough_turns_one_survivor_and_starts_the_votes():
    game, state = make(4, turns=[1], pick=2)
    state = night_all(game, search_all(game, state))
    state = search_all(game, state)
    assert state["phase"] == "night"
    assert state["roles"] == ["survivor", "survivor", "infected", "survivor"]
    assert notes(state, 2, "turned")
    assert game.view_for(state, 0)["coughs"] == 1
    assert game.view_for(state, 0)["roles"] == [None] * 4
    state = night_all(game, state)
    assert state["phase"] == "vote"


def test_sabotage_is_hidden_in_the_shuffled_haul():
    game, state = make(4, card="f2", turns=[0], pick=1)
    state = night_all(game, search_all(game, state))
    state = vote_all(game, state)
    assert state["roles"][1] == "infected"
    with pytest.raises(GameError):
        game.apply_move({**state, "phase": "play", "hands": [["f1"]] * 4}, 0,
                        {"type": "play", "card": "sabotage"})
    before = state["store"]
    state = search_all(game, state, plays={1: "sabotage"})
    farm = state["searches"][-1]["places"]["farm"]
    # it turns over as mould, like any other
    assert sorted(farm["cards"]) == ["f2", "f2", "f2", "mold2"]
    assert notes(state, 1, "played")[-1]["card"] == "sabotage"
    assert farm["food"] == 6 - 2
    assert state["store"] == before + 4


def test_a_guard_catches_the_thief_and_is_tired():
    game, state = make(4, card="f2", turns=[0], pick=1)
    state = search_all(game, state)
    before = state["store"]
    state = night_all(game, state, posts={0: "store", 1: "store"})
    seen = notes(state, 0, "guarded")[-1]
    assert seen["saw"] == [1]
    assert notes(state, 1, "caught")
    assert state["store"] == before - 4
    assert state["tired"] == [True, True, False, False]


def test_an_unguarded_theft_and_an_opened_door():
    game, state = make(4, card="f2", turns=[0], pick=1)
    state = search_all(game, state)
    before = state["store"]
    state = night_all(game, state, posts={1: "store"})
    # two stolen; the thief eats from it, the other three from the store
    assert state["nights"][-1]["stolen"] == 2
    assert state["store"] == before - 2 - 3


def test_the_door_lets_a_zombie_in():
    game, state = make(4, card="f2", turns=[0], pick=1)
    state = search_all(game, state)
    state = night_all(game, state, posts={1: "door"})
    night = state["nights"][-1]
    assert night["opened"]
    assert len(night["injured"]) == 1
    hurt = night["injured"][0]
    assert state["sitOut"][hurt] == 1
    state = vote_all(game, state)
    assert hurt not in game.searchers(state)


def test_stealth_slips_past_a_guard_once():
    game, state = make(5, card="f2", turns=[0], pick=1)
    state = search_all(game, state)
    infected = state["roles"].index("infected")
    assert state["stealth"][infected] == 1
    guard = 0 if infected != 0 else 2
    state = night_all(game, state, posts={guard: "store", infected: "store"},
                      stealth=(infected,))
    assert state["nights"][-1]["stolen"] == 2
    assert notes(state, guard, "guarded")[-1]["saw"] == []
    assert state["stealth"][infected] == 0


def test_hunger_weakens_then_fells():
    game, state = make(4, card="none", turns=[5])
    state = {**state, "store": 0}
    state = night_all(game, search_all(game, state))
    assert state["phase"] == "finished"
    assert state["winReason"] == "famine"
    assert state["winner"] is None


def test_famine_after_the_cough_wins_for_the_infected():
    game, state = make(4, card="none", turns=[0], pick=1)
    state = {**state, "store": 1}
    state = night_all(game, search_all(game, state))
    assert state["winner"] == "infected" and state["winReason"] == "famine"


def test_exiling_the_infected_wins_and_a_wrong_exile_goes_on():
    game, state = make(4, card="f3", turns=[0], pick=1)
    state = night_all(game, search_all(game, state))
    assert state["phase"] == "vote"
    wrong = vote_all(game, state, {0: 3, 1: 3, 2: 3})
    assert wrong["status"][3] == "exiled"
    assert wrong["exiles"][-1]["role"] == "survivor"
    assert game.view_for(wrong, 0)["roles"][3] == "survivor"
    assert wrong["phase"] == "search"
    right = vote_all(game, state, {0: 1, 2: 1, 3: 1})
    assert right["winner"] == "survivors" and right["winReason"] == "exiled"
    split = vote_all(game, state, {0: 1, 2: 3})
    assert split["exiles"][-1]["exiled"] is None


def test_outnumbered():
    game, state = make(4, card="f3", turns=[0], pick=1)
    state = night_all(game, search_all(game, state))
    state = vote_all(game, state, {0: 3, 1: 3, 2: 3})
    state = night_all(game, search_all(game, state))
    state = vote_all(game, state, {0: 2, 1: 2, 2: 0})
    assert state["winner"] == "infected" and state["winReason"] == "outnumbered"


def test_rescue_on_the_sixth_night():
    game, state = make(4, card="f3", turns=[0], pick=1)
    for _ in range(6):
        state = search_all(game, state)
        state = night_all(game, state)
        if state["phase"] == "vote":
            state = vote_all(game, state)
    assert state["winner"] == "survivors" and state["winReason"] == "rescue"
    assert game.get_result(state)["winnerSeats"] == [0, 2, 3]


def test_view_hides_others_choices_and_roles():
    game, state = make(4, turns=[0], pick=1)
    state = game.apply_move(state, 0, {"type": "search", "place": "market"})
    view = game.view_for(state, 1)
    assert view["myPlace"] is None
    assert 0 not in view["waiting"] and 1 in view["waiting"]
    assert "places" not in view or view["places"] == ["farm", "market"]
    assert view["roles"] == [None] * 4


def test_bots_finish_games_at_every_size():
    """The lobby bots' policy plays legal moves until the game ends."""
    import importlib.util
    import pathlib

    path = pathlib.Path(__file__).resolve().parent.parent / "scripts" / "bots.py"
    spec = importlib.util.spec_from_file_location("bots_script", path)
    bots = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(bots)
    for n in range(4, 9):
        for seed in range(15):
            game = Shelter(random.Random(seed))
            rng = random.Random(seed)
            state = game.initial_state(n)
            for _ in range(500):
                if state["phase"] == "finished":
                    break
                for seat in range(n):
                    move = bots.shelter(game.view_for(state, seat), seat, rng)
                    if move is not None:
                        state = game.apply_move(state, seat, move)
                        break
            assert state["phase"] == "finished", (n, seed)
            assert game.get_result(state) is not None
