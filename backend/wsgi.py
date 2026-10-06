from app import create_app, socketio

app = create_app()

if __name__ == "__main__":
    # Development server only (auto-reload + debugger). Production runs
    # gunicorn against `wsgi:app` — see the Dockerfile.
    if app.config["APP_ENV"] == "production":
        raise SystemExit("Refusing to run the development server in production")
    socketio.run(app, host="0.0.0.0", port=5005, debug=True, allow_unsafe_werkzeug=True)
