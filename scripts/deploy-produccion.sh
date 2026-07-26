#!/bin/bash
# OpsCore — Deploy completo a producción
# Ejecutar como root en el VPS: bash /opt/opscore/scripts/deploy-produccion.sh
set -e

REPO_DIR="/opt/opscore"
AUTH_URL="http://157.90.242.249"   # Cambiar a https://tudominio.com si tienes dominio
AUTH_SECRET="c6OckRrk8kwFfJ0k1y/WYL+ExN/9ML8I8YXUsCt9M8k="
DB_PASS="HEmome2026++"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   OpsCore — Deploy a Producción      ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ─── TASK 1: Verificar y instalar prerequisitos ───────────────────────────────
echo "[ Task 1 ] Verificando prerequisitos..."

# Node.js
if ! command -v node &>/dev/null || [[ $(node --version | cut -d'.' -f1 | tr -d 'v') -lt 18 ]]; then
  echo "  → Instalando Node.js 22..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash - 2>/dev/null
  apt-get install -y nodejs 2>/dev/null
fi
echo "  ✓ Node.js $(node --version)"

# PM2
if ! command -v pm2 &>/dev/null; then
  echo "  → Instalando PM2..."
  npm install -g pm2 --quiet
fi
echo "  ✓ PM2 $(pm2 --version)"

# Nginx
if ! command -v nginx &>/dev/null; then
  echo "  → Instalando Nginx..."
  apt-get install -y nginx 2>/dev/null
  systemctl enable nginx
  systemctl start nginx
fi
echo "  ✓ Nginx $(nginx -v 2>&1 | grep -oP 'nginx/\K[0-9.]+')"

# ─── TASK 2: Variables de entorno de producción ───────────────────────────────
echo ""
echo "[ Task 2 ] Configurando variables de entorno..."

cat > "$REPO_DIR/.env.production.local" << EOF
DATABASE_URL=postgres://app_user:${DB_PASS}@localhost:5432/opscore
DATABASE_URL_OWNER=postgres://opscore_owner:${DB_PASS}@localhost:5432/opscore
AUTH_SECRET=${AUTH_SECRET}
AUTH_URL=${AUTH_URL}
EOF
chmod 600 "$REPO_DIR/.env.production.local"
echo "  ✓ .env.production.local creado"

# ─── TASK 3: Pull + build de producción ───────────────────────────────────────
echo ""
echo "[ Task 3 ] Actualizando repo y construyendo..."

cd "$REPO_DIR"
git pull origin master
echo "  ✓ Repo actualizado: $(git log --oneline -1)"

npm ci --quiet
echo "  ✓ Dependencias instaladas"

rm -rf .next
NODE_ENV=production npm run build
echo "  ✓ Build completado"

# Copiar archivos estáticos al directorio standalone
cp -r "$REPO_DIR/.next/static" "$REPO_DIR/.next/standalone/.next/static"
[ -d "$REPO_DIR/public" ] && cp -r "$REPO_DIR/public" "$REPO_DIR/.next/standalone/public" || true
echo "  ✓ Archivos estáticos copiados"

# ─── TASK 4: Configurar PM2 ───────────────────────────────────────────────────
echo ""
echo "[ Task 4 ] Configurando PM2..."

cat > "$REPO_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [
    {
      name: 'opscore',
      script: '${REPO_DIR}/.next/standalone/server.js',
      cwd: '${REPO_DIR}/.next/standalone',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '127.0.0.1',
        DATABASE_URL: 'postgres://app_user:${DB_PASS}@localhost:5432/opscore',
        DATABASE_URL_OWNER: 'postgres://opscore_owner:${DB_PASS}@localhost:5432/opscore',
        AUTH_SECRET: '${AUTH_SECRET}',
        AUTH_URL: '${AUTH_URL}',
      },
    },
  ],
};
EOF

# Detener instancia anterior si existe
pm2 delete opscore 2>/dev/null || true

pm2 start "$REPO_DIR/ecosystem.config.js"
pm2 save

# Configurar startup automático
pm2 startup systemd -u root --hp /root 2>/dev/null | grep "sudo" | bash 2>/dev/null || true
pm2 save
echo "  ✓ PM2 configurado y app iniciada"

# ─── TASK 5: Configurar Nginx ─────────────────────────────────────────────────
echo ""
echo "[ Task 5 ] Configurando Nginx..."

cat > /etc/nginx/sites-available/opscore << 'NGINX'
server {
    listen 80;
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
NGINX

ln -sf /etc/nginx/sites-available/opscore /etc/nginx/sites-enabled/opscore
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx
echo "  ✓ Nginx configurado y recargado"

# ─── TASK 6: Firewall ─────────────────────────────────────────────────────────
echo ""
echo "[ Task 6 ] Configurando firewall..."

ufw allow OpenSSH 2>/dev/null
ufw allow 'Nginx Full' 2>/dev/null
ufw deny 5432/tcp 2>/dev/null
ufw --force enable 2>/dev/null
echo "  ✓ Firewall configurado (SSH + HTTP/HTTPS permitidos, 5432 bloqueado)"

# ─── TASK 8: Script de deploy futuro ──────────────────────────────────────────
echo ""
echo "[ Task 8 ] Creando script de deploy para actualizaciones..."

cat > "$REPO_DIR/scripts/redeploy.sh" << 'REDEPLOY'
#!/bin/bash
set -e
cd /opt/opscore
echo "=== OpsCore Redeploy ==="
git pull origin master
npm ci --omit=dev --quiet
NODE_ENV=production npm run build 2>&1 | tail -3
cp -r .next/static .next/standalone/.next/static
[ -d public ] && cp -r public .next/standalone/public || true
pm2 reload opscore
pm2 status
echo "=== Listo ==="
REDEPLOY
chmod +x "$REPO_DIR/scripts/redeploy.sh"
echo "  ✓ Script /opt/opscore/scripts/redeploy.sh creado"

# ─── VERIFICACIÓN FINAL ───────────────────────────────────────────────────────
echo ""
echo "[ Verificación Final ]"
sleep 3

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "error")
NGINX_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80 2>/dev/null || echo "error")

echo "  App en :3000 → HTTP $HTTP_CODE"
echo "  Nginx en :80  → HTTP $NGINX_CODE"
echo ""
pm2 status
echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  ✅ Deploy completado                                ║"
echo "║                                                      ║"
echo "║  Acceso: http://157.90.242.249                       ║"
echo "║  Login:  gsalinasrdz@gmail.com / HEmome2026++user   ║"
echo "║                                                      ║"
echo "║  Próximo deploy: bash /opt/opscore/scripts/redeploy.sh ║"
echo "╚══════════════════════════════════════════════════════╝"
