from flask import Flask

from werkzeug.middleware.proxy_fix import ProxyFix

from app.config import Config, validate_production
from app.extensions import cors, db, limiter, migrate, socketio


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    validate_production(app.config)
    if app.config.get("TRUST_PROXY"):
        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_proto=1)

    db.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app)
    limiter.init_app(app)
    # Socket event handlers register themselves on import — before
    # init_app, so they attach to every app instance (tests build several)
    from app.sockets import events  # noqa: F401

    socketio.init_app(app)

    # Models must be imported so Alembic can see them
    from app import models  # noqa: F401

    from app.routes.auth import auth_bp
    from app.routes.friends import friends_bp
    from app.routes.health import health_bp
    from app.routes.games import games_bp
    from app.routes.rooms import rooms_bp

    app.register_blueprint(auth_bp, url_prefix="/api/v1/auth")
    app.register_blueprint(health_bp, url_prefix="/api/v1")
    app.register_blueprint(games_bp, url_prefix="/api/v1/games")
    app.register_blueprint(rooms_bp, url_prefix="/api/v1/rooms")
    app.register_blueprint(friends_bp, url_prefix="/api/v1/friends")

    # JSON error envelope for framework-raised errors (404, 405, ...)
    from werkzeug.exceptions import HTTPException

    @app.errorhandler(HTTPException)
    def handle_http_exception(err):
        return {
            "error": {"code": err.name.lower().replace(" ", "_"), "message": err.description}
        }, err.code

    return app
