"""Bot players from the lobby (development only).

The host of a waiting table can ask for bots instead of running
scripts/bots.py by hand: the backend starts that same script for the
table, and the bots join, ready up and play like any other player. It is
off in production (BOTS_ENABLED, see config.py).
"""

import os
import subprocess
import sys
from pathlib import Path

from flask import current_app

# Games scripts/bots.py has a policy for
BOT_GAMES = {"nightwatch"}

SCRIPT = Path(__file__).resolve().parent.parent / "scripts" / "bots.py"


def bots_available(room) -> bool:
    """Whether this table can be filled with bots from the lobby."""
    return bool(current_app.config.get("BOTS_ENABLED")) and room.game_type in BOT_GAMES


def spawn_bots(code: str, count: int) -> None:
    """Start `count` bots for the table with this code. They run as their
    own process and stop when the game ends or the table closes; their
    output goes to the backend's log."""
    api = f"http://127.0.0.1:{os.environ.get('PORT', '5005')}"
    subprocess.Popen(
        [sys.executable, "-u", str(SCRIPT), code, "-n", str(count), "--api", api],
        cwd=SCRIPT.parent.parent,
        start_new_session=True,
    )
