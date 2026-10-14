"""Bot players: the host fills empty seats from the lobby, and the
server plays them.

Bots are accounts with is_bot set. They have no password and can never
sign in, so nobody can look at the game through a bot's eyes. A bot
sits at one table at a time; free ones are reused, and new ones are
made when every bot is busy.

Bot moves come from the game's own bot_move (only games with has_bots
offer bots), made on the server: after anything changes at a table with
bots, nudge() starts a background task that keeps making whichever bot
move the game is waiting on — one at a time, a short pause apart, so
players can follow — until the game waits on a person or ends. Any
request that loads the table nudges it again, so bots carry on after a
server restart. The app runs as one process (see README), so the
bookkeeping of which tables have a task running lives in memory.
"""

import logging
import random
import threading
import time

from flask import current_app
from sqlalchemy.exc import IntegrityError

from app.extensions import db, socketio
from app.games import GameError, get_game
from app.models import GameSession, Room, RoomPlayer, User
from app.play import announce_move, apply_move

log = logging.getLogger(__name__)

ACTIVE_STATUSES = ("waiting", "playing")
BOT_PREFIX = "🤖 "
BOT_NAMES = [
    "Ada", "Ben", "Cleo", "Dev", "Eli", "Fay", "Gus", "Hana", "Ivo", "Jin",
    "Kai", "Lea", "Max", "Nia", "Omar", "Pia", "Quin", "Rio", "Sami", "Tess",
]
# A bot driver gives up after this many illegal moves in a row (a bug in
# a game's bot_move); the next nudge tries again.
MAX_ERRORS = 20

_rng = random.SystemRandom()
_lock = threading.Lock()
_running: set = set()  # tables with a driver at work
_again: set = set()  # ...that changed while it was looking


def bots_available(room) -> bool:
    """Whether the host can fill this table's seats with bots."""
    game = get_game(room.game_type)
    return bool(current_app.config.get("BOTS_ENABLED")) and game.has_bots


def has_bots(room) -> bool:
    return any(p.user is not None and p.user.is_bot for p in room.players)


# ------------------------------------------------------------- seating


def _free_bots(count: int, prefer=()) -> list:
    """Up to `count` bots not at a waiting or playing table, locked so
    two tables filling at once never take the same one. Bots in
    `prefer` (by id) come first."""
    busy = (
        db.session.query(RoomPlayer.user_id)
        .join(Room)
        .filter(Room.status.in_(ACTIVE_STATUSES))
    )
    free = (
        User.query.filter(User.is_bot.is_(True), User.id.not_in(busy))
        .order_by(User.created_at)
        .with_for_update(skip_locked=True)
        .all()
    )
    rank = {user_id: i for i, user_id in enumerate(prefer)}
    free.sort(key=lambda bot: rank.get(bot.id, len(rank)))
    return free[:count]


def _new_bot() -> User:
    """A new bot account, named after the first free bot name."""
    taken = {
        name
        for (name,) in db.session.query(User.username).filter(
            User.username.startswith(BOT_PREFIX)
        )
    }
    names = [f"{BOT_PREFIX}{name}" for name in BOT_NAMES]
    names += [f"{BOT_PREFIX}{name} {n}" for n in range(2, 100) for name in BOT_NAMES]
    for username in names:
        if username in taken:
            continue
        try:
            # A savepoint: a table filling at the same moment may have
            # just taken this name
            with db.session.begin_nested():
                bot = User(username=username, password_hash="", is_bot=True)
                db.session.add(bot)
            return bot
        except IntegrityError:
            continue
    raise RuntimeError("Out of bot names")


def seat_bots(room, count: int, prefer=()) -> list:
    """Seat `count` bots (ready) at a waiting table. The caller checks
    the seats are free and commits."""
    bots = _free_bots(count, prefer)
    while len(bots) < count:
        bots.append(_new_bot())
    seated = []
    for bot in bots:
        player = RoomPlayer(
            room_id=room.id, user_id=bot.id, seat=len(room.players), ready=True
        )
        room.players.append(player)
        seated.append(player)
    db.session.flush()
    return seated


# -------------------------------------------------------------- playing


def nudge(room) -> None:
    """Make sure a table with bots gets its bot moves. Call after a
    commit that may have handed the game to a bot."""
    if room.status != "playing" or not has_bots(room):
        return
    app = current_app._get_current_object()
    if app.config.get("BOTS_INLINE"):
        # Tests: play the bots right here, before the request returns
        _drive(app, room.id)
        return
    with _lock:
        if room.id in _running:
            _again.add(room.id)
            return
        _running.add(room.id)
    socketio.start_background_task(_run, app, room.id)


def _run(app, room_id) -> None:
    with app.app_context():
        try:
            _drive(app, room_id, done=_done)
        except Exception:  # noqa: BLE001 - a bot must never take the server down
            log.exception("Bot driver for table %s stopped", room_id)
            with _lock:
                _running.discard(room_id)
                _again.discard(room_id)
        finally:
            db.session.remove()


def _done(room_id) -> bool:
    """Whether the driver may stop: nothing changed while it looked."""
    with _lock:
        if room_id in _again:
            _again.discard(room_id)
            return False
        _running.discard(room_id)
        return True


def _drive(app, room_id, done=lambda room_id: True) -> None:
    """Make bot moves until the game waits on a person or ends."""
    errors = 0
    while True:
        moved = _step(app, room_id)
        if moved is None:
            errors += 1
            if errors >= MAX_ERRORS:
                log.error("Bots at table %s keep making illegal moves", room_id)
                done(room_id)
                return
            continue
        errors = 0
        if not moved and done(room_id):
            return


def _bot_move(room, session):
    """(seat, move) of the first bot in seat order the game waits on."""
    game = get_game(session.game_type)
    for player in sorted(room.players, key=lambda p: p.seat):
        if player.user is None or not player.user.is_bot:
            continue
        move = game.bot_move(game.view_for(session.state, player.seat), player.seat, _rng)
        if move is not None:
            return player.seat, move
    return None


def _session(room, lock=False):
    query = GameSession.query.filter_by(room_id=room.id, status="in_progress").order_by(
        GameSession.started_at.desc()
    )
    return (query.with_for_update() if lock else query).first()


def _step(app, room_id):
    """Make one bot move. True when one was made, False when the game
    isn't waiting on a bot, None when the move was refused."""
    db.session.rollback()  # see what other requests committed
    room = db.session.get(Room, room_id)
    if room is None or room.status != "playing":
        return False
    session = _session(room)
    if session is None or _bot_move(room, session) is None:
        return False

    # Think for a moment, like a player would
    low, high = app.config.get("BOT_DELAY", (0.6, 1.4))
    if high > 0:
        db.session.rollback()
        time.sleep(_rng.uniform(low, high))

    room = db.session.get(Room, room_id)
    session = _session(room, lock=True)
    choice = _bot_move(room, session) if session is not None else None
    if choice is None:
        db.session.rollback()
        return True  # someone moved meanwhile: look again
    seat, move = choice
    try:
        result = apply_move(room, session, seat, move)
    except GameError as err:
        db.session.rollback()
        log.warning("Bot move %s at table %s refused: %s", move, room_id, err)
        return None
    db.session.commit()
    announce_move(room, result)
    return True
