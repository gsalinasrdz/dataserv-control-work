# OpsCore — Plan de Despliegue a Producción en VPS Hetzner

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Desplegar OpsCore en el VPS Hetzner (157.90.242.249) con PM2 + Nginx, accesible en HTTP (y HTTPS si hay dominio), sin túnel SSH.

**Architecture:** El build standalone de Next.js corre en el VPS como proceso Node.js administrado por PM2. Nginx hace reverse proxy del puerto 80/443 al 3000. PostgreSQL sigue en localhost sin exposición externa.

**Tech Stack:** Next.js 15 standalone, PM2, Nginx, ufw, Let's Encrypt (opcional si hay dominio), Ubuntu 22.04 en Hetzner.

---

## Prerrequisitos

- Acceso SSH root al VPS: `ssh root@157.90.242.249`
- Repo clonado en `/opt/opscore`
- PostgreSQL corriendo en localhost:5432 con DB `opscore`, usuarios `opscore_owner` y `app_user`
- Datos iniciales ya insertados (organización + usuario Guillermo Salinas)

---

### Task 1: Verificar Node.js, npm y herramientas en el VPS

**Files:** ninguno (solo comandos de verificación)

- [ ] **Step 1: Conectarse al VPS**

```bash
ssh root@157.90.242.249
```

- [ ] **Step 2: Verificar Node.js ≥ 18**

```bash
node --version
```

Si no está instalado o es menor a 18:
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
node --version   # debe ser v22.x
```

- [ ] **Step 3: Verificar npm**

```bash
npm --version    # debe ser 10+
```

- [ ] **Step 4: Instalar PM2 globalmente**

```bash
npm install -g pm2
pm2 --version
```

- [ ] **Step 5: Verificar Nginx**

```bash
nginx -v
```

Si no está instalado:
```bash
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx
nginx -v
```

- [ ] **Step 6: Verificar que el repo está actualizado**

```bash
cd /opt/opscore
git pull origin master
git log --oneline -3
```

Expected output: los 3 commits más recientes, incluyendo `fix: split auth config for edge runtime`.

---

### Task 2: Configurar variables de entorno de producción

**Files:**
- Create: `/opt/opscore/.env.production.local`

- [ ] **Step 1: Crear el archivo de entorno de producción**

```bash
cat > /opt/opscore/.env.production.local << 'EOF'
DATABASE_URL=postgres://app_user:HEmome2026++@localhost:5432/opscore
DATABASE_URL_OWNER=postgres://opscore_owner:HEmome2026++@localhost:5432/opscore
AUTH_SECRET=c6OckRrk8kwFfJ0k1y/WYL+ExN/9ML8I8YXUsCt9M8k=
AUTH_URL=http://157.90.242.249
EOF
```

> **Nota:** Si tienes dominio (ej. `opscore.tudominio.com`), cambia `AUTH_URL` a `https://opscore.tudominio.com`.

- [ ] **Step 2: Verificar el archivo**

```bash
cat /opt/opscore/.env.production.local
```

Expected: 4 líneas con las variables correctas. `DATABASE_URL` usa `localhost` (no la IP pública).

- [ ] **Step 3: Restringir permisos**

```bash
chmod 600 /opt/opscore/.env.production.local
```

---

### Task 3: Instalar dependencias y hacer build de producción

**Files:**
- Create: `/opt/opscore/.next/` (generado por build)
- Create: `/opt/opscore/.next/standalone/` (output standalone)

- [ ] **Step 1: Instalar dependencias en el VPS**

```bash
cd /opt/opscore
npm ci --omit=dev
```

> `npm ci` usa el `package-lock.json` exacto. `--omit=dev` excluye devDependencies para ahorrar espacio.

- [ ] **Step 2: Construir la app**

```bash
cd /opt/opscore
NODE_ENV=production npm run build
```

Expected output (últimas líneas):
```
✓ Compiled successfully
Route (app)                Size    First Load JS
┌ ○ /login                 ...
├ ○ /proyectos             ...
...
● (Static)   prerendered as static content
○ (Dynamic)  server-rendered on demand
```

Si hay errores de TypeScript, revisar con `npm run typecheck`.

- [ ] **Step 3: Copiar archivos estáticos al directorio standalone**

```bash
cp -r /opt/opscore/.next/static /opt/opscore/.next/standalone/.next/static
cp -r /opt/opscore/public /opt/opscore/.next/standalone/public 2>/dev/null || true
```

- [ ] **Step 4: Verificar que el servidor standalone arranca**

```bash
cd /opt/opscore/.next/standalone
DATABASE_URL="postgres://app_user:HEmome2026++@localhost:5432/opscore" \
DATABASE_URL_OWNER="postgres://opscore_owner:HEmome2026++@localhost:5432/opscore" \
AUTH_SECRET="c6OckRrk8kwFfJ0k1y/WYL+ExN/9ML8I8YXUsCt9M8k=" \
AUTH_URL="http://localhost:3000" \
node server.js &
```

Esperar 3 segundos y probar:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Expected: `307` o `200` (redirect al login o la página de login).

```bash
kill %1   # detener el proceso de prueba
```

---

### Task 4: Configurar PM2 para administrar el proceso

**Files:**
- Create: `/opt/opscore/ecosystem.config.js`

- [ ] **Step 1: Crear archivo de configuración PM2**

```bash
cat > /opt/opscore/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'opscore',
      script: '/opt/opscore/.next/standalone/server.js',
      cwd: '/opt/opscore/.next/standalone',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '127.0.0.1',
        DATABASE_URL: 'postgres://app_user:HEmome2026++@localhost:5432/opscore',
        DATABASE_URL_OWNER: 'postgres://opscore_owner:HEmome2026++@localhost:5432/opscore',
        AUTH_SECRET: 'c6OckRrk8kwFfJ0k1y/WYL+ExN/9ML8I8YXUsCt9M8k=',
        AUTH_URL: 'http://157.90.242.249',
      },
    },
  ],
};
EOF
```

> **Nota:** `HOSTNAME: '127.0.0.1'` hace que Next.js escuche solo en localhost. Nginx es el punto de entrada externo.

- [ ] **Step 2: Iniciar la app con PM2**

```bash
cd /opt/opscore
pm2 start ecosystem.config.js
pm2 status
```

Expected:
```
┌─────┬──────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name     │ namespace   │ version │ mode    │ status   │
├─────┼──────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ opscore  │ default     │ 0.1.0   │ fork    │ online   │
└─────┴──────────┴─────────────┴─────────┴─────────┴──────────┘
```

- [ ] **Step 3: Verificar logs**

```bash
pm2 logs opscore --lines 20
```

Expected: sin errores, líneas como `- Local: http://localhost:3000`.

- [ ] **Step 4: Probar acceso local**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

Expected: `307` (redirect a /login).

- [ ] **Step 5: Configurar PM2 para iniciar al arrancar el servidor**

```bash
pm2 startup
```

Copiar y ejecutar el comando que PM2 imprime (algo como):
```bash
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
```

```bash
pm2 save
```

---

### Task 5: Configurar Nginx como reverse proxy

**Files:**
- Create: `/etc/nginx/sites-available/opscore`
- Create (symlink): `/etc/nginx/sites-enabled/opscore`

- [ ] **Step 1: Crear configuración de Nginx**

```bash
cat > /etc/nginx/sites-available/opscore << 'EOF'
server {
    listen 80;
    server_name 157.90.242.249;

    # Tamaño máximo de upload (para XMLs de facturas)
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
EOF
```

> **Nota con dominio:** reemplaza `157.90.242.249` con `opscore.tudominio.com`.

- [ ] **Step 2: Activar el sitio**

```bash
ln -sf /etc/nginx/sites-available/opscore /etc/nginx/sites-enabled/opscore
rm -f /etc/nginx/sites-enabled/default
```

- [ ] **Step 3: Verificar configuración de Nginx**

```bash
nginx -t
```

Expected:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

- [ ] **Step 4: Recargar Nginx**

```bash
systemctl reload nginx
```

- [ ] **Step 5: Probar acceso desde el VPS**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:80
```

Expected: `307` o `200`.

---

### Task 6: Configurar firewall (ufw)

**Files:** ninguno (comandos del sistema)

- [ ] **Step 1: Verificar estado de ufw**

```bash
ufw status
```

- [ ] **Step 2: Configurar reglas**

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw deny 5432/tcp    # PostgreSQL solo accesible desde localhost
```

- [ ] **Step 3: Activar firewall**

```bash
ufw --force enable
ufw status numbered
```

Expected: SSH (22), HTTP (80) y HTTPS (443) permitidos. Puerto 5432 denegado.

- [ ] **Step 4: Verificar que la app sigue corriendo**

```bash
pm2 status
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
```

---

### Task 7 (opcional): SSL con Let's Encrypt

> Solo si tienes un dominio apuntando al VPS. Omitir si usas IP directa.

**Prerequisito:** El DNS del dominio debe apuntar a `157.90.242.249` antes de ejecutar este task.

- [ ] **Step 1: Instalar Certbot**

```bash
apt-get install -y certbot python3-certbot-nginx
```

- [ ] **Step 2: Obtener certificado**

```bash
certbot --nginx -d opscore.tudominio.com --non-interactive --agree-tos -m gsalinasrdz@gmail.com
```

Expected: Certbot modifica el Nginx config automáticamente y agrega el bloque `listen 443 ssl`.

- [ ] **Step 3: Actualizar AUTH_URL en PM2**

Editar `/opt/opscore/ecosystem.config.js` cambiando:
```javascript
AUTH_URL: 'https://opscore.tudominio.com',
```

```bash
pm2 restart opscore
```

- [ ] **Step 4: Verificar renovación automática**

```bash
certbot renew --dry-run
```

Expected: `Congratulations, all simulated renewals succeeded`.

---

### Task 8: Script de deploy para actualizaciones futuras

**Files:**
- Create: `/opt/opscore/deploy.sh`

- [ ] **Step 1: Crear script de deploy**

```bash
cat > /opt/opscore/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "=== OpsCore Deploy ==="
cd /opt/opscore

echo "1. Pull cambios..."
git pull origin master

echo "2. Instalar dependencias..."
npm ci --omit=dev

echo "3. Build producción..."
NODE_ENV=production npm run build

echo "4. Copiar estáticos..."
cp -r .next/static .next/standalone/.next/static
cp -r public .next/standalone/public 2>/dev/null || true

echo "5. Reiniciar app..."
pm2 reload opscore

echo "6. Estado:"
pm2 status

echo "=== Deploy completado ==="
EOF
chmod +x /opt/opscore/deploy.sh
```

- [ ] **Step 2: Probar el script**

```bash
/opt/opscore/deploy.sh
```

Expected: todo el proceso completa sin errores, `pm2 status` muestra `online`.

- [ ] **Step 3: Verificar acceso final**

Desde tu computadora local (sin túnel SSH):
```bash
curl -s -o /dev/null -w "%{http_code}" http://157.90.242.249
```

Expected: `307` (redirect al login) o `200`.

Abrir en navegador: **http://157.90.242.249** y hacer login con `gsalinasrdz@gmail.com` / `HEmome2026++user`.

---

## Verificación final completa

```bash
# En el VPS:
pm2 status                          # opscore: online
systemctl status nginx              # active (running)
systemctl status postgresql         # active (running)
curl http://localhost:3000          # responde
curl http://localhost:80            # responde vía nginx
ufw status                          # 22, 80, 443 permitidos; 5432 denegado
```

## Notas de mantenimiento

| Acción | Comando |
|---|---|
| Ver logs en tiempo real | `pm2 logs opscore` |
| Reiniciar app | `pm2 restart opscore` |
| Deploy de nueva versión | `/opt/opscore/deploy.sh` |
| Recargar Nginx | `systemctl reload nginx` |
| Ver errores Nginx | `tail -f /var/log/nginx/error.log` |
| Backup DB | `pg_dump -U opscore_owner opscore > backup.sql` |
