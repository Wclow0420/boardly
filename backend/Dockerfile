FROM python:3.12-slim

WORKDIR /srv/app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN chmod +x start.sh && useradd --system --no-create-home boardly
USER boardly

EXPOSE 5005

# Production server: applies database migrations, then runs gunicorn
# (see start.sh). docker-compose.yml overrides this with the
# development server.
CMD ["./start.sh"]
