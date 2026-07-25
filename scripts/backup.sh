#!/bin/bash
# Script de respaldo diario para OpsCore
# Cron: 0 2 * * * /opt/opscore/scripts/backup.sh >> /var/log/opscore/backup.log 2>&1
# Requiere: restic configurado con RESTIC_REPOSITORY y RESTIC_PASSWORD en entorno
set -euo pipefail

FECHA=$(date +%Y-%m-%d)
LOG_DIR="/var/log/opscore"
mkdir -p "$LOG_DIR"

echo "[$(date -Iseconds)] Iniciando respaldo ${FECHA}"

# 1. Dump lógico de Postgres → restic
pg_dump -Fc "${DATABASE_URL_OWNER}" \
  | restic backup --stdin --stdin-filename "opscore-${FECHA}.dump"

# 2. Archivos binarios: XMLs CFDI y fotos de remisiones desde MinIO
restic backup /mnt/datos/minio

# 3. Política de retención
# 14 diarios: recuperación rápida de errores recientes
# 8 semanales: ventana de un mes para detectar problemas tardíos
# 24 mensuales: obligación fiscal de 5 años (se amplía manualmente al año 2)
restic forget \
  --keep-daily 14 \
  --keep-weekly 8 \
  --keep-monthly 24 \
  --prune

echo "[$(date -Iseconds)] Respaldo completado"
