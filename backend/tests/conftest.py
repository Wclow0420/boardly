"""Shared fixtures. Database-backed tests run against a throwaway
Postgres database (default: boardly_test on the docker-compose db) and
are skipped when Postgres isn't reachable."""

import os

import pytest
import sqlalchemy as sa

from app import create_app, presence
from app.config import Config
from app.extensions import db

TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL", "postgresql://boardly:boardly@localhost:5439/boardly_test"
)


class TestConfig(Config):
    TESTING = True
    # make_user registers faster than the per-IP auth limits allow
    RATELIMIT_ENABLED = False
    SQLALCHEMY_DATABASE_URI = TEST_DATABASE_URL


def _ensure_database():
    url = sa.engine.make_url(TEST_DATABASE_URL)
    admin = sa.create_engine(
        url.set(database="postgres"), isolation_level="AUTOCOMMIT"
    )
    try:
        with admin.connect() as conn:
            exists = conn.execute(
                sa.text("SELECT 1 FROM pg_database WHERE datname = :name"),
                {"name": url.database},
            ).scalar()
            if not exists:
                conn.execute(sa.text(f'CREATE DATABASE "{url.database}"'))
    finally:
        admin.dispose()


@pytest.fixture()
def app():
    try:
        _ensure_database()
    except sa.exc.OperationalError:
        pytest.skip("Postgres not reachable — run `docker compose up -d db`")

    app = create_app(TestConfig)
    with app.app_context():
        db.drop_all()
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()
    presence._sid_user.clear()
    presence._user_sids.clear()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def make_user(client):
    """Registers a user; returns {"id", "username", "token", "headers"}."""

    def _make(username):
        res = client.post(
            "/api/v1/auth/register",
            json={"username": username, "password": "secret123"},
        )
        assert res.status_code == 201, res.get_json()
        body = res.get_json()
        return {
            "id": body["user"]["id"],
            "username": username,
            "token": body["accessToken"],
            "headers": {"Authorization": f"Bearer {body['accessToken']}"},
        }

    return _make
