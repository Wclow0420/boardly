import os

DEV_SECRET_KEY = "dev-secret-change-me"


def _database_url() -> str:
    url = os.environ.get(
        "DATABASE_URL",
        # Host-machine default: docker-compose maps the db to localhost:5439
        "postgresql://boardly:boardly@localhost:5439/boardly",
    )
    # Some hosts hand out the old "postgres://" scheme, which SQLAlchemy
    # no longer accepts.
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://") :]
    return url


def cors_origins():
    """Web origins allowed to call the API and open sockets. CORS_ORIGINS
    is a comma-separated list; unset means any origin (fine for the
    mobile apps, which send none — set it once the web app has a home)."""
    raw = os.environ.get("CORS_ORIGINS", "").strip()
    if not raw or raw == "*":
        return "*"
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", DEV_SECRET_KEY)
    SQLALCHEMY_DATABASE_URI = _database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    APP_ENV = os.environ.get("APP_ENV", "development")
    # Set to 1 when running behind one reverse proxy / load balancer so
    # rate limits see the real client IP (X-Forwarded-For).
    TRUST_PROXY = os.environ.get("TRUST_PROXY", "") == "1"
    RATELIMIT_HEADERS_ENABLED = True
    # RATELIMIT_ENABLED=0 turns the per-IP auth limits off — for a LAN
    # session behind Docker's NAT, where every player shares one IP.
    RATELIMIT_ENABLED = os.environ.get("RATELIMIT_ENABLED", "1") != "0"


def validate_production(config) -> None:
    """Refuse to boot production with a guessable signing key —
    anyone who knows it can mint tokens for any account."""
    if config.get("APP_ENV") != "production":
        return
    secret = config.get("SECRET_KEY") or ""
    if secret == DEV_SECRET_KEY or len(secret) < 32:
        raise RuntimeError(
            "SECRET_KEY must be set to a random value of at least 32 "
            "characters in production "
            "(python -c 'import secrets; print(secrets.token_urlsafe(48))')"
        )
