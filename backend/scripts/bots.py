"""Bot players for trying a game on your own (development only).

Create a table in the app, then run this with its code: bots log in
(registering bot1, bot2, ... the first time), join, ready up and play
whenever the game asks them for a move. You play your own seat in the
app as usual and start the game when everyone is in.

    python scripts/bots.py ABC123                  # fill to the minimum
    python scripts/bots.py ABC123 -n 6             # add 6 bots
    python scripts/bots.py ABC123 --api http://192.168.1.5:5005
    python scripts/bots.py ABC123 --verbose        # print every bot move

Inside Docker:  docker compose exec backend python scripts/bots.py ABC123

Bots are plain accounts (password "botbot123"): to see the game through
a bot's eyes, sign in as it in a private browser window.

Only uses the standard library. Bots play Seal the Manor (nightwatch);
other games can be added to POLICIES.
"""

import argparse
import json
import random
import time
import urllib.error
import urllib.request

PASSWORD = "botbot123"


class ApiError(Exception):
    def __init__(self, status, body):
        super().__init__(f"{status}: {body}")
        self.status = status
        self.body = body

    @property
    def code(self):
        try:
            return self.body["error"]["code"]
        except (TypeError, KeyError):
            return None


class Bot:
    def __init__(self, api, name, verbose):
        self.api = api.rstrip("/") + "/api/v1"
        self.name = name
        self.verbose = verbose
        self.access = None
        self.refresh = None
        self.user_id = None

    # ------------------------------------------------------------ http

    def _call(self, method, path, body=None, auth=True):
        data = json.dumps(body).encode() if body is not None else None
        req = urllib.request.Request(self.api + path, data=data, method=method)
        req.add_header("Content-Type", "application/json")
        if auth:
            req.add_header("Authorization", f"Bearer {self.access}")
        try:
            with urllib.request.urlopen(req, timeout=15) as res:
                return json.loads(res.read() or b"{}")
        except urllib.error.HTTPError as err:
            try:
                payload = json.loads(err.read() or b"{}")
            except ValueError:
                payload = None
            raise ApiError(err.code, payload) from None

    def call(self, method, path, body=None):
        try:
            return self._call(method, path, body)
        except ApiError as err:
            if err.status != 401 or not self.refresh:
                raise
            # Access tokens last an hour: rotate and try once more
            tokens = self._call("POST", "/auth/refresh",
                                {"refreshToken": self.refresh}, auth=False)
            self._take(tokens)
            return self._call(method, path, body)

    def _take(self, body):
        self.access = body["accessToken"]
        self.refresh = body["refreshToken"]
        self.user_id = body["user"]["id"]

    # ----------------------------------------------------------- setup

    def sign_in(self):
        creds = {"username": self.name, "password": PASSWORD}
        while True:
            try:
                try:
                    body = self._call("POST", "/auth/login", creds, auth=False)
                except ApiError as err:
                    if err.status != 401:
                        raise
                    body = self._call("POST", "/auth/register", creds,
                                      auth=False)
                    print(f"  registered {self.name}")
                self._take(body)
                return
            except ApiError as err:
                if err.status != 429:
                    raise
                # Sign-ups are rate limited per IP (5 a minute)
                print(f"  {self.name}: rate limited, waiting 20s… "
                      "(RATELIMIT_ENABLED=0 on the backend skips this)")
                time.sleep(20)

    def join(self, code):
        try:
            room = self.call("POST", "/rooms/join", {"code": code})["room"]
        except ApiError as err:
            if err.code != "already_in_room":
                raise
            # Left over at an old table from an earlier run: leave it
            for old in self.call("GET", "/rooms/mine").get("rooms", []):
                if old["code"] != code:
                    self.call("POST", f"/rooms/{old['id']}/leave")
            room = self.call("POST", "/rooms/join", {"code": code})["room"]
        if room["hostId"] != self.user_id and room["status"] == "waiting":
            self.call("POST", f"/rooms/{room['id']}/ready", {"ready": True})
        return room

    def room(self, code):
        return self.call("GET", f"/rooms/code/{code}")["room"]

    def move(self, room_id, move):
        return self.call("POST", f"/rooms/{room_id}/move", {"move": move})


# ------------------------------------------------------------- policies
#
# A policy looks at one bot's view of the game and returns the move it
# wants to make now, or None when the game isn't waiting on it.

LETTERS = [
    "I saw nobody suspicious tonight.",
    "Don't trust the last leader.",
    "The Prophet is closer than you think.",
    "Check who was really in the Hall.",
    "昨晚的失败牌不是我出的。",
    "我在书房什么都没看到。",
]


def _steps(view, start, goal):
    """Rooms between two rooms tonight (walls, doors and locks counted)."""
    def links(room):
        row, col = divmod(room, 3)
        out = {r * 3 + c for r, c in ((row - 1, col), (row + 1, col),
                                      (row, col - 1), (row, col + 1))
               if 0 <= r < 3 and 0 <= c < 3}
        out |= {b for a, b in view["doors"] if a == room}
        out |= {a for a, b in view["doors"] if b == room}
        if view["lockedDoor"] and room in view["lockedDoor"]:
            out -= set(view["lockedDoor"])
        return out - set(view["collapsed"])

    seen, frontier, dist = {start}, {start}, 0
    while frontier:
        if goal in frontier:
            return dist
        frontier = {n for r in frontier for n in links(r)} - seen
        seen |= frontier
        dist += 1
    return 99


def nightwatch(view, seat, rng):
    phase = view["phase"]
    n = view["numPlayers"]
    others = [s for s in range(n) if s != seat]
    role = view["myRole"]
    evil = role in ("double", "hermit", "possessed")
    known_evil = {k["seat"] for k in view["known"] if k["as"] == "evil"}
    if evil:
        known_evil.add(seat)

    if phase in ("announce", "patrol", "room") and view["ready"][seat]:
        return None
    if phase == "announce":
        move = {"type": "ready"}
        if view["doorOptions"] and rng.random() < 0.25:
            move["lock"] = rng.choice(view["doorOptions"])
        return move
    if phase == "patrol":
        rooms = view["patrolRooms"]
        if (role == "tracker" and view["abilityLeft"] > 0
                and view["event"] != "storm" and rng.random() < 0.3):
            return {"type": "patrol", "track": rng.choice(others)}
        # Like a sensible player: usually stay in reach of the mission
        reach = 1 if view["event"] == "fog" else 2
        near = [r for r in rooms
                if _steps(view, r, view["missionRoom"]) <= reach]
        room = rng.choice(near if near and rng.random() < 0.8 else rooms)
        move = {"type": "patrol", "room": room}
        fakes = [r for r in rooms if r != room]
        if role == "double" and view["abilityLeft"] > 0 and fakes \
                and rng.random() < 0.4:
            move["fake"] = rng.choice(fakes)
        return move
    if phase == "room":
        fn = view["myFn"]
        if fn == "study" and view["studyOptions"]:
            return {"type": "room", "target": rng.choice(view["studyOptions"])}
        if fn == "kitchen":
            return {"type": "room", "target": rng.choice(others)}
        if fn == "gallery" and rng.random() < 0.7:
            return {"type": "room", "letters": [rng.choice(LETTERS)]}
        if fn == "chapel" and rng.random() < 0.6:
            return {"type": "room", "pray": True}
        return {"type": "room"}
    if phase == "team" and view["leader"] == seat:
        size = view["missionSizes"][view["round"]]
        pool = [s for s in others if evil or s not in known_evil]
        if len(pool) < size - 1:
            pool = others
        return {"type": "propose",
                "team": sorted([seat] + rng.sample(pool, size - 1))}
    if phase == "vote" and not view["voted"][seat]:
        team = set(view["team"])
        if evil:
            approve = bool(team & known_evil) or rng.random() < 0.3
        else:
            approve = not (team & known_evil) and rng.random() < 0.75
        return {"type": "vote", "approve": approve}
    if phase == "mission" and seat in view["team"] \
            and seat not in view["missionPlayed"]:
        fail = evil and rng.random() < 0.7
        return {"type": "mission", "card": "fail" if fail else "success"}
    if phase == "assassinate" and view["assassinSeat"] == seat:
        evil_seats = set(view["evilSeats"] or [])
        return {"type": "assassinate",
                "target": rng.choice([s for s in range(n)
                                      if s not in evil_seats])}
    return None


POLICIES = {"nightwatch": nightwatch}

MIN_PLAYERS = {"nightwatch": 5}


# ---------------------------------------------------------------- main


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    parser.add_argument("code", help="table code shown in the app's lobby")
    parser.add_argument("-n", "--count", type=int,
                        help="bots to add (default: fill to the minimum)")
    parser.add_argument("--api", default="http://localhost:5005",
                        help="backend URL (default %(default)s)")
    parser.add_argument("--delay", type=float, default=1.0,
                        help="seconds a bot waits before each move")
    parser.add_argument("--seed", type=int, help="seed the bots' choices")
    parser.add_argument("-v", "--verbose", action="store_true",
                        help="print every bot move (and the bots' roles)")
    args = parser.parse_args()
    code = args.code.strip().upper()
    rng = random.Random(args.seed)

    # Look at the table through bot1 to size the crew
    scout = Bot(args.api, "bot1", args.verbose)
    scout.sign_in()
    room = scout.room(code)
    game = room["gameType"]
    if game not in POLICIES:
        raise SystemExit(f"No bot policy for {game!r} yet "
                         f"(have: {', '.join(POLICIES)})")
    seated = len(room["players"])
    count = args.count or max(1, MIN_PLAYERS.get(game, 2) - seated)

    # Bots already at the table (added earlier) keep playing there: take
    # the next free names, so no bot is played twice
    seated_names = {p["username"] for p in room["players"]}
    names = [f"bot{i}" for i in range(1, 100) if f"bot{i}" not in seated_names][:count]
    print(f"Table {code} ({game}): adding {count} bot(s)…")
    bots = [scout if name == "bot1" else Bot(args.api, name, args.verbose)
            for name in names]
    for bot in bots:
        if bot is not scout:
            bot.sign_in()
        bot.join(code)
        print(f"  {bot.name} joined and is ready")
    print("Start the game in the app when you're ready. Ctrl+C to stop.")

    while True:
        time.sleep(0.5)
        try:
            for bot in bots:
                room = bot.room(code)
                session = room.get("session")
                if room["status"] == "closed":
                    print(f"Table {code} was closed.")
                    return
                if room["status"] == "waiting" or session is None:
                    continue
                view = session["state"]
                seat = next(p["seat"] for p in room["players"]
                            if p["userId"] == bot.user_id)
                if session["status"] != "in_progress":
                    print(f"Game over: {view.get('winner')} "
                          f"({view.get('winReason')})")
                    return
                if args.verbose and not getattr(bot, "told", False):
                    bot.told = True
                    print(f"  {bot.name} is seat {seat}: {view.get('myRole')}")
                move = POLICIES[game](view, seat, rng)
                if move is None:
                    continue
                time.sleep(args.delay)
                try:
                    bot.move(room["id"], move)
                    if args.verbose:
                        print(f"  {bot.name}: {json.dumps(move, ensure_ascii=False)}")
                except ApiError as err:
                    # Someone moved first, or the phase changed: look again
                    if args.verbose:
                        print(f"  {bot.name}: {move} refused ({err})")
        except ApiError as err:
            if err.code == "room_not_found":
                raise SystemExit("The table is gone.")
            print(f"  ({err}) — retrying")
            time.sleep(2)
        except urllib.error.URLError as err:
            print(f"  can't reach the backend ({err.reason}) — retrying")
            time.sleep(3)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nBots stopped.")
