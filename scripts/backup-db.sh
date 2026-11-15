#!/usr/bin/env bash
set -euo pipefail

BACKUP_DIR="/var/backups/mingler"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
BACKUP_FILE="${BACKUP_DIR}/mingler_db_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

if [ ! -f .env.production ]; then
    echo "ERROR: .env.production file not found in $PROJECT_DIR"
    exit 1
fi

POSTGRES_USER=$(grep -E '^POSTGRES_USER=' .env.production | cut -d '=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r')
POSTGRES_DB=$(grep -E '^POSTGRES_DB=' .env.production | cut -d '=' -f2- | tr -d '"' | tr -d "'" | tr -d '\r')

POSTGRES_USER="${POSTGRES_USER:-mingler_admin}"
POSTGRES_DB="${POSTGRES_DB:-mingler_prod}"

echo "[$(date -u)] Starting database backup for database: ${POSTGRES_DB}..."
docker compose -f compose.yaml exec -T db pg_dump -U "${POSTGRES_USER}" "${POSTGRES_DB}" | gzip > "${BACKUP_FILE}"

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date -u)] Database backup successfully created: ${BACKUP_FILE} (${FILE_SIZE})"

# Retain backups for 14 days
echo "[$(date -u)] Purging backups older than 14 days..."
find "${BACKUP_DIR}" -name "mingler_db_*.sql.gz" -type f -mtime +14 -delete

echo "[$(date -u)] Backup rotation completed."
