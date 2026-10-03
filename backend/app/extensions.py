import os

from flask_cors import CORS
from flask_migrate import Migrate
from flask_socketio import SocketIO
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()
migrate = Migrate()
cors = CORS()
# threading + simple-websocket for development; production runs
# gunicorn + eventlet (set SOCKETIO_ASYNC_MODE=eventlet there).
socketio = SocketIO(
    cors_allowed_origins="*",
    async_mode=os.environ.get("SOCKETIO_ASYNC_MODE", "threading"),
)
