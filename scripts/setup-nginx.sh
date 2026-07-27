#!/bin/bash
# setup-nginx.sh — Configuración idempotente de nginx para OpsCore + dataserv-api
# Ejecutar en el VPS como root: bash /opt/opscore/scripts/setup-nginx.sh
set -e

echo "=== Configurando nginx: OpsCore (:80) + dataserv-api (:8080) ==="

# 1. Limpiar todos los sites-enabled
rm -f /etc/nginx/sites-enabled/*
echo "  ✓ sites-enabled limpiado"

# 2. Escribir config OpsCore (puerto 80 → app en 3000)
cat > /etc/nginx/sites-available/opscore << 'NGINX_OPSCORE'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
    }
}
NGINX_OPSCORE
echo "  ✓ Config OpsCore escrita (80 → 3000)"

# 3. Escribir config dataserv-api (puerto 8080 → app en 3001)
cat > /etc/nginx/sites-available/dataserv-api << 'NGINX_API'
server {
    listen 8080;
    listen [::]:8080;
    server_name _;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
    }
}
NGINX_API
echo "  ✓ Config dataserv-api escrita (8080 → 3001)"

# 4. Activar ambos sites
ln -sf /etc/nginx/sites-available/opscore /etc/nginx/sites-enabled/opscore
ln -sf /etc/nginx/sites-available/dataserv-api /etc/nginx/sites-enabled/dataserv-api
echo "  ✓ Symlinks creados en sites-enabled"

# 5. Verificar y recargar
nginx -t
systemctl restart nginx
echo "  ✓ nginx reiniciado"

# 6. Abrir puertos en firewall
ufw allow OpenSSH 2>/dev/null || true
ufw allow 80/tcp 2>/dev/null || true
ufw allow 8080/tcp 2>/dev/null || true
ufw --force enable 2>/dev/null || true
echo "  ✓ Firewall: 22, 80, 8080 abiertos"

# 7. Verificar que ambas apps responden
sleep 2
echo ""
echo "=== Verificación ==="
OPSCORE_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 || echo "error")
API_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 || echo "error")

echo "  OpsCore  :80   → HTTP $OPSCORE_CODE"
echo "  API      :8080 → HTTP $API_CODE"

if [[ "$OPSCORE_CODE" == "307" || "$OPSCORE_CODE" == "200" || "$OPSCORE_CODE" == "308" ]]; then
  echo "  ✅ OpsCore OK"
else
  echo "  ❌ OpsCore no responde correctamente (esperado: 307)"
  echo "     Verificar: pm2 status && pm2 logs opscore --lines 20"
fi

if [[ "$API_CODE" == "200" || "$API_CODE" == "404" || "$API_CODE" == "401" || "$API_CODE" == "403" ]]; then
  echo "  ✅ dataserv-api OK"
else
  echo "  ⚠️  dataserv-api no responde en :8080 — verificar Docker"
fi

echo ""
echo "=== nginx activo ==="
nginx -T 2>/dev/null | grep -E "listen [0-9]|proxy_pass"
