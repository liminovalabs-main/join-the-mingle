#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "==> Upgrading pip..."
pip install --upgrade pip

echo "==> Installing production dependencies..."
pip install -r requirements/production.txt

echo "==> Collecting static files with WhiteNoise..."
python manage.py collectstatic --no-input

echo "==> Running database migrations..."
python manage.py migrate

echo "==> Seeding London demo venues & mingles..."
python manage.py seed_demo_data

echo "==> Checking superuser initialization..."
python manage.py initadmin

echo "==> Render build complete!"
