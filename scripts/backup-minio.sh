#!/bin/bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups/minio}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
VOLUME="${MINIO_VOLUME:-manexa_minio_data}"

mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
ARCHIVE="$BACKUP_DIR/minio_${TIMESTAMP}.tar.gz"

docker run --rm \
  -v "${VOLUME}:/data:ro" \
  -v "$BACKUP_DIR:/backup" \
  alpine tar -czf "/backup/minio_${TIMESTAMP}.tar.gz" -C /data .

find "$BACKUP_DIR" -name "minio_*.tar.gz" -mtime +"$RETENTION_DAYS" -delete

echo "MinIO backup OK: $ARCHIVE"
