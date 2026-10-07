#!/bin/sh
# Production start: bring the database schema up to date, then serve.
# Running migrations here (rather than as a separate deploy step) is
# safe because the app runs as a single instance.
set -e

flask --app wsgi db upgrade

# ONE worker on purpose: Socket.IO rooms, presence and rate-limit
# counters live in process memory. Threads carry the concurrent requests
# and WebSocket connections (simple-websocket). Hosts such as Render
# tell the app which port to listen on through $PORT.
exec gunicorn \
  --worker-class gthread --workers 1 --threads 100 \
  --bind "0.0.0.0:${PORT:-5005}" \
  --access-logfile - \
  wsgi:app
