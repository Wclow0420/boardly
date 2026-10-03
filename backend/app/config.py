import os


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-change-me")
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        # Host-machine default: docker-compose maps the db to localhost:5439
        "postgresql://boardly:boardly@localhost:5439/boardly",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    APP_ENV = os.environ.get("APP_ENV", "development")
