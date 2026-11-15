#!/usr/bin/env bash
set -euo pipefail

echo "============================================================"
echo " Starting Mingler Production Deployment"
echo " Time: $(date -u)"
echo "============================================================"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

if [ ! -f .env.production ]; then
    echo "ERROR: .env.production file not found in $PROJECT_DIR"
    echo "Please copy .env.production.example to .env.production and configure credentials."
    exit 1
fi

echo "[1/6] Pulling latest code changes from origin/main..."
git pull origin main

echo "[2/6] Building production Docker containers..."
docker compose -f compose.yaml build --pull

echo "[3/6] Starting database and cache services..."
docker compose -f compose.yaml up -d db redis

echo "Waiting for PostgreSQL to be ready..."
docker compose -f compose.yaml exec -T db sh -c 'until pg_isready; do sleep 1; done'

echo "[4/6] Executing Django database migrations..."
docker compose -f compose.yaml run --rm backend python manage.py migrate --no-input

echo "[5/6] Collecting static assets into volume..."
docker compose -f compose.yaml run --rm backend python manage.py collectstatic --no-input

echo "[6/6] Launching all application containers..."
docker compose -f compose.yaml up -d --remove-orphans

echo "Performing health check verification..."
sleep 5
docker compose -f compose.yaml exec -T backend curl -sf http://localhost:8000/health/ || {
    echo "WARNING: Health check failed! Inspect logs with: docker compose -f compose.yaml logs backend"
    exit 1
}

echo "============================================================"
echo " Mingler Production Deployment Completed Successfully! 🚀"
echo " Live at: https://mingler.co.uk"
echo "============================================================"
