from flask import Flask

from app.config import Config
from app.extensions import cors, db, migrate, socketio


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app)
    socketio.init_app(app)

    # Models must be imported so Alembic can see them
    from app import models  # noqa: F401

    from app.routes.auth import auth_bp
    from app.routes.health import health_bp
    from app.routes.games import games_bp
    from app.routes.rooms import rooms_bp

    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(health_bp, url_prefix="/api/v1")
    app.register_blueprint(games_bp, url_prefix="/api/v1/games")
    app.register_blueprint(rooms_bp, url_prefix="/api/v1/rooms")

    # JSON error envelope for framework-raised errors (404, 405, ...)
    from werkzeug.exceptions import HTTPException

    @app.errorhandler(HTTPException)
    def handle_http_exception(err):
        return {
            "error": {"code": err.name.lower().replace(" ", "_"), "message": err.description}
        }, err.code

    # Socket event handlers register themselves on import
    from app.sockets import events  # noqa: F401

    return app
