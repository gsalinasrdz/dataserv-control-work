#!/bin/bash
set -e
cd /opt/opscore
echo "=== OpsCore Redeploy ==="
git pull origin master
npm ci --quiet
NODE_ENV=production npm run build 2>&1 | tail -3
cp -r .next/static .next/standalone/.next/static
[ -d public ] && cp -r public .next/standalone/public || true
pm2 reload opscore
pm2 status

echo ""
echo "=== Verificando nginx ==="
bash /opt/opscore/scripts/setup-nginx.sh

echo "=== Listo ==="
