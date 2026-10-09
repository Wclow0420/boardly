from abc import ABC, abstractmethod


class GameError(Exception):
    """Raised for invalid moves / illegal game actions. Maps to HTTP 400."""


class BaseGame(ABC):
    """Contract every game engine must implement.

    A game engine is stateless: it receives the current `state` dict
    (stored in GameSession.state as JSONB) and returns the new state.
    Players are referred to by seat index (0-based), matching
    RoomPlayer.seat.
    """

    # Unique key, also the folder name (e.g. "tictactoe")
    key: str
    # Human-readable name shown in the app
    name: str
    min_players: int = 2
    max_players: int = 2

    # Coins each player earns when a game finishes (see app/rewards.py)
    coins_win: int = 10
    coins_play: int = 3

    # Display metadata consumed by the app's catalogue/lobby UI
    emoji: str = "🎲"
    tile_color: str = "#FFF2D6"  # pastel behind the emoji tile
    category: str = "classic"  # strategy | party | classic | custom
    tag: str = "classic"  # tag chip: classic | card | strategy | party

    # Settings the host picks in the lobby, as {name: [choices]}; the
    # first choice is the default. E.g. {"mode": ["knockout", "endless"]}.
    options: dict[str, list[str]] = {}

    @abstractmethod
    def initial_state(self, num_players: int) -> dict:
        """Return the starting state for a new session."""

    @abstractmethod
    def apply_move(self, state: dict, seat: int, move: dict) -> dict:
        """Validate and apply a move; return the new state.
        Raise GameError for illegal moves."""

    @abstractmethod
    def get_result(self, state: dict) -> dict | None:
        """Return None while the game is running, otherwise a dict like
        {"winnerSeat": 0}, {"winnerSeats": [0, 3]} (a winning team) or
        {"draw": True}."""

    def default_options(self) -> dict:
        return {name: choices[0] for name, choices in self.options.items()}

    def clean_options(self, raw, current: dict | None = None) -> dict:
        """Lobby settings merged over `current` (or the defaults).
        Raises GameError for an unknown setting or choice."""
        merged = {**self.default_options(), **(current or {})}
        if raw is None:
            return merged
        if not isinstance(raw, dict):
            raise GameError("Options must be an object")
        for name, choice in raw.items():
            if choice not in self.options.get(name, []):
                raise GameError(f"Unknown option {name}={choice}")
            merged[name] = choice
        return merged

    def new_state(self, num_players: int, options: dict) -> dict:
        """Start a game with the lobby's settings. Games with options
        override this; the rest ignore them."""
        return self.initial_state(num_players)

    def view_for(self, state: dict, seat: int) -> dict:
        """State as seen by one player. Override for games with hidden
        information (hands of cards, secret roles). `seat` is -1 for
        someone who is not at the table. Defaults to full state.
        Clients only ever receive this view, never the raw state."""
        return state

    def on_abandon(self, state: dict, seat: int) -> dict:
        """A player left mid-game and the table is ending. Return the
        state to store (e.g. reveal hidden roles). Defaults to no change."""
        return state

    def to_dict(self):
        return {
            "key": self.key,
            "name": self.name,
            "minPlayers": self.min_players,
            "maxPlayers": self.max_players,
            "emoji": self.emoji,
            "tileColor": self.tile_color,
            "category": self.category,
            "tag": self.tag,
            "options": self.options,
        }
