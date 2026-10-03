# Boardly

Play board games with friends — React Native (Expo) frontend + Flask backend.

```
Boardly/
├── backend/          Flask API + Socket.IO (port 5005)
│   ├── app/
│   │   ├── models/           # SQLAlchemy models (User, Room, GameSession)
│   │   ├── routes/           # REST endpoints (rooms, games, health)
│   │   ├── sockets/          # Socket.IO events (join/leave room channels)
│   │   └── games/            # ⭐ one folder per game
│   │       ├── base.py       #   BaseGame contract (stateless engines)
│   │       ├── __init__.py   #   game registry
│   │       └── tictactoe/    #   example game (logic in game.py)
│   ├── migrations/           # Alembic (via Flask-Migrate)
│   ├── docker-compose.yml    # backend :5005 + postgres :5439
│   └── Dockerfile
└── boardly/          Expo app (SDK 57, expo-router, TypeScript)
    ├── app.config.js         # dynamic config (replaces app.json)
    ├── eas.json              # build profiles: development / preview / production
    └── src/
        ├── app/              # expo-router routes (thin screens)
        ├── theme/            # design tokens + semantic light/dark + ThemeProvider
        ├── i18n/             # i18next + locales (en / zh / ms) + LocaleProvider
        ├── components/       # ui/ kit · icons/ (svg) · navigation/ (TabBar)
        ├── features/         # per-screen folders (hooks.ts = data seam)
        ├── context/          # SessionContext etc.
        ├── api/              # REST client + socket.io client
        ├── data/             # domain types + mock data
        └── games/            # ⭐ one folder per game
            ├── types.ts      #   GameDefinition / GameBoardProps contracts
            ├── registry.ts   #   game registry (mirrors backend)
            └── tictactoe/    #   logic.ts (rules) + TicTacToeBoard.tsx (UI)
```

New-app conventions (theme, i18n, folder standards, checklists):
see [NEW_PROJECT_PLAYBOOK.md](NEW_PROJECT_PLAYBOOK.md).

## Backend

```bash
cd backend
docker compose up --build
```

- API: http://localhost:5005/api/v1/health
- Postgres: localhost:5439 (user/pass/db: `boardly`)
- Errors use one envelope: `{"error": {"code": "...", "message": "..."}}`

First run — create the initial migration and apply it:

```bash
docker compose exec backend flask db migrate -m "initial tables"
docker compose exec backend flask db upgrade
```

After changing models: `flask db migrate -m "..."` then `flask db upgrade` (same `docker compose exec backend` prefix).

## Frontend

```bash
cd boardly
npm run start          # Expo dev server
```

Config is dynamic: `app.config.js` switches name / bundle id / scheme by
`APP_ENV` (set per profile in `eas.json`). The API base URL comes from
`EXPO_PUBLIC_API_URL` (defaults to `http://localhost:5005`).

EAS builds:

```bash
eas build --profile development --platform ios      # simulator dev client
eas build --profile development-device --platform ios
eas build --profile preview --platform android      # internal APK
eas build --profile production --platform all
```

## Adding a new game

Backend:
1. Create `backend/app/games/<key>/game.py` with a `BaseGame` subclass
   (implement `initial_state`, `apply_move`, `get_result`; override
   `view_for` for hidden-information games).
2. Register it in `backend/app/games/__init__.py` (`GAMES` dict).

Frontend:
1. Create `boardly/src/games/<key>/` with `logic.ts` (client-side rules
   for instant feedback) and a `Board` component.
2. Export a `GameDefinition` from `index.ts` and register it in
   `src/games/registry.ts`.

The rooms/lobby/session plumbing (REST + Socket.IO broadcasts) is
game-agnostic — game state lives in a JSONB column and only the two
registries know about individual games.

## Game flow (API, base `/api/v1`)

Auth: `POST /auth/register` / `POST /auth/login` `{username, password}` →
`{user, accessToken, refreshToken}`; `POST /auth/refresh`
`{refreshToken}`; `GET /auth/me`. All room endpoints require
`Authorization: Bearer <accessToken>` — identity always comes from the
token.

1. `POST /rooms` `{gameType}` → room + 6-char invite code (caller = host)
2. Friend: `POST /rooms/join` `{code}`
3. Clients: socket `join_room {roomId}` → receive `room_updated`, `game_started`, `game_updated`
4. Host only: `POST /rooms/<id>/start`
5. Turns: `POST /rooms/<id>/move` `{move}` — mover is the caller, validated by the game engine, broadcast to the room

Also: `GET /rooms/mine`, `GET /rooms/code/<code>`, `GET /games`,
`GET /auth/me/stats`.

Friends (`/friends`): `GET ""` (friends with presence, incoming /
outgoing requests, recent players), `GET /search?q=`, `POST /requests`
`{userId}`, `POST /requests/<id>/accept`, `DELETE /requests/<id>`
(decline or cancel), `DELETE /<userId>` (unfriend),
`POST /<userId>/invite` (invite an online friend to your open table).
Presence is socket-based: the client emits `authenticate {token}` after
connecting and then receives `friends_updated` and `table_invite` on its
own channel. It is tracked in process memory, so run a single worker.

Backend tests: `pytest` inside `backend/` — the friends tests need the
compose Postgres running (`docker compose up -d db`) and use a separate
`boardly_test` database; they are skipped when it is unreachable.
The app is wired to all of this (Quick Play / tap a game → create table;
Join with a code → bottom sheet; lobby updates live over Socket.IO).
Testing on a real phone: set `EXPO_PUBLIC_API_URL` to your Mac's LAN IP
(e.g. `http://192.168.x.x:5005`) when starting Expo.
