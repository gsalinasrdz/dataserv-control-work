#!/bin/bash
# health-check.sh — Verificar estado de OpsCore + dataserv-api en el VPS
# Ejecutar en el VPS: bash /opt/opscore/scripts/health-check.sh

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║         VPS Health Check                 ║"
echo "╚══════════════════════════════════════════╝"
echo ""

ERRORS=0

# PM2 / OpsCore
echo "[ PM2 ]"
if pm2 list 2>/dev/null | grep -q "opscore.*online"; then
  echo "  ✅ opscore online en PM2"
else
  echo "  ❌ opscore NO está online en PM2"
  ERRORS=$((ERRORS+1))
fi

# Docker / dataserv-api
echo ""
echo "[ Docker ]"
if ss -tlnp 2>/dev/null | grep -q ":3001"; then
  echo "  ✅ Proceso escuchando en :3001"
else
  echo "  ⚠️  Nada en :3001 (dataserv-api puede no estar corriendo)"
fi

# Nginx
echo ""
echo "[ Nginx ]"
if systemctl is-active --quiet nginx; then
  echo "  ✅ nginx activo"
else
  echo "  ❌ nginx NO está activo"
  ERRORS=$((ERRORS+1))
fi

OPSCORE_PROXY=$(grep -A20 "listen 80" /etc/nginx/sites-enabled/opscore 2>/dev/null | grep proxy_pass | head -1 | awk '{print $2}' | tr -d ';')
API_PROXY=$(grep -A20 "listen 8080" /etc/nginx/sites-enabled/dataserv-api 2>/dev/null | grep proxy_pass | head -1 | awk '{print $2}' | tr -d ';')

if [[ "$OPSCORE_PROXY" == "http://127.0.0.1:3000" ]]; then
  echo "  ✅ OpsCore  :80   → $OPSCORE_PROXY"
else
  echo "  ❌ OpsCore  :80   → '$OPSCORE_PROXY' (esperado: http://127.0.0.1:3000)"
  ERRORS=$((ERRORS+1))
fi

if [[ "$API_PROXY" == "http://127.0.0.1:3001" ]]; then
  echo "  ✅ API      :8080 → $API_PROXY"
else
  echo "  ❌ API      :8080 → '$API_PROXY' (esperado: http://127.0.0.1:3001)"
  ERRORS=$((ERRORS+1))
fi

# HTTP end-to-end
echo ""
echo "[ HTTP end-to-end ]"
OPSCORE_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 2>/dev/null || echo "error")
API_HTTP=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 2>/dev/null || echo "error")

if [[ "$OPSCORE_HTTP" =~ ^(200|307|308|302)$ ]]; then
  echo "  ✅ OpsCore  :80   → HTTP $OPSCORE_HTTP"
else
  echo "  ❌ OpsCore  :80   → HTTP $OPSCORE_HTTP (esperado: 307)"
  ERRORS=$((ERRORS+1))
fi

if [[ "$API_HTTP" =~ ^(200|201|401|403|404)$ ]]; then
  echo "  ✅ API      :8080 → HTTP $API_HTTP"
else
  echo "  ⚠️  API      :8080 → HTTP $API_HTTP"
fi

# Resumen
echo ""
if [[ $ERRORS -eq 0 ]]; then
  echo "╔══════════════════════════════════════════╗"
  echo "║  ✅ Todo OK                              ║"
  echo "║  OpsCore:  http://157.90.242.249         ║"
  echo "║  API:      http://157.90.242.249:8080    ║"
  echo "╚══════════════════════════════════════════╝"
else
  echo "╔══════════════════════════════════════════╗"
  echo "║  ❌ $ERRORS problema(s) detectado(s)        ║"
  echo "║  Fix: bash /opt/opscore/scripts/setup-nginx.sh ║"
  echo "╚══════════════════════════════════════════╝"
  exit 1
fi
