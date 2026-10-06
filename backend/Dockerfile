FROM python:3.12-slim

WORKDIR /srv/app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd --system --no-create-home boardly
USER boardly

EXPOSE 5005

# Production server. ONE worker on purpose: Socket.IO rooms, presence
# and rate-limit counters live in process memory. Threads carry the
# concurrent requests and WebSocket connections (simple-websocket).
# docker-compose.yml overrides this with the development server.
CMD ["gunicorn", "--worker-class", "gthread", "--workers", "1", "--threads", "100", "--bind", "0.0.0.0:5005", "--access-logfile", "-", "wsgi:app"]
