from app import create_app, socketio

app = create_app()

if __name__ == "__main__":
    # socketio.run wraps app.run and enables WebSocket support
    socketio.run(app, host="0.0.0.0", port=5005, debug=True, allow_unsafe_werkzeug=True)
