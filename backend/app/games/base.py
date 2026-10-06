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

    # Display metadata consumed by the app's catalogue/lobby UI
    emoji: str = "🎲"
    tile_color: str = "#FFF2D6"  # pastel behind the emoji tile
    category: str = "classic"  # strategy | party | classic | custom
    tag: str = "classic"  # tag chip: classic | card | strategy | party

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
        }
