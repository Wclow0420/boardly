import os

from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from flask_migrate import Migrate
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
migrate = Migrate()
cors = CORS()
# Per-IP limits on the auth endpoints. Counters live in process memory,
# which matches the single-worker deployment (see Dockerfile).
limiter = Limiter(key_func=get_remote_address, storage_uri="memory://")
# threading + simple-websocket, in development (python wsgi.py) and in
# production (gunicorn gthread, one worker — see Dockerfile).
socketio = SocketIO(
    cors_allowed_origins="*",
    async_mode=os.environ.get("SOCKETIO_ASYNC_MODE", "threading"),
)
