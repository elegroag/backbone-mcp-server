# Capítulo 9. Implementación en producción (ESNext + ESM + Vite)

Has creado un gran proyecto modular con ES Modules, Vite y pruebas modernas. Ahora toca llevarlo a producción de forma fiable y reproducible. En este capítulo verás:

- Cómo construir el frontend con Vite.
- Cómo servir los estáticos con un servidor Node/Express en ESM.
- Cómo ponerlo detrás de Nginx (reverse proxy).
- Cómo ejecutar y mantener el proceso con PM2 y systemd.
- Opciones PaaS (Heroku/Render/Fly) y consideraciones rápidas.

Este capítulo reemplaza el flujo antiguo (Gulp/Browserify, Ubuntu 14.04, init.d) por un stack actual (Ubuntu 22.04+, Vite, systemd).

---

## Construir el frontend con Vite

Prepara la compilación optimizada del cliente:

```sh
# usa tu gestor (pnpm recomendado en este repo)
pnpm run build
```

- La salida se genera en `dist/` según `vite.config.ts`.
- Vite hace splitting, minificación y hashing (si lo configuras). Mantén los assets estáticos ahí.

Opcional: previsualizar el build localmente

```sh
pnpm run preview
```

```html
<a id="cap9-imagenes"></a>
```

### Optimización de imágenes (opcional)

Para reducir el peso de `png/jpg/svg/gif` en el build de producción, puedes integrar `vite-plugin-imagemin`.

Instalación:

```sh
pnpm add -D vite-plugin-imagemin
```

Configuración mínima:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import viteImagemin from 'vite-plugin-imagemin';

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    viteImagemin({
      gifsicle: { optimizationLevel: 3 },
      optipng: { optimizationLevel: 5 },
      mozjpeg: { quality: 80 },
      svgo: { plugins: [{ name: 'removeViewBox', active: false }] },
    }),
  ],
});
```

Nota: también puedes optimizar imágenes en una tarea separada o en tu pipeline de CI si prefieres mantener el build de Vite más rápido.

---

### 2) Servir los estáticos con Express (ESM)

Crea un pequeño servidor Express en ESM que sirva `dist/` y exponga tu API (si aplica). Ejemplo `server/index.js` (el proyecto usa `"type": "module"` en `package.json`):

```js
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Sirve estáticos del build de Vite
const distPath = path.resolve(__dirname, '../dist');
app.use(express.static(distPath, { maxAge: '1y', etag: true }));

// API opcional (ejemplo)
// app.use('/api', apiRouter)

// Fallback SPA (si tu app es SPA)
app.get('*', (req, res) => {
	res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
	console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
```

Recomendaciones:

- Define `NODE_ENV=production` y `PORT` en el entorno (no hardcodees valores).
- Si estás detrás de un proxy (Nginx), añade `app.set('trust proxy', 1)` para cookies/seguridad.
- Protege Express con `helmet` y `compression`:

```js
import helmet from 'helmet';
import compression from 'compression';

app.use(helmet());
app.use(compression());
```

#### 2.1) Endurecimiento adicional: CSP, HSTS y cookies seguras

Activa una política de seguridad de contenido (CSP), HSTS y cabeceras adicionales. Ajusta los orígenes según tu app (APIs, CDNs, S3, etc.). Recuerda habilitar `trust proxy` si estás detrás de Nginx para que `secure: true` en cookies funcione.

```js
import helmet from 'helmet';

app.set('trust proxy', 1); // cookies Secure detrás de proxy

app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", 'https:', "'unsafe-inline'"], // evita inline si puedes usar hashes
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", 'https://api.example.com'], // ajusta orígenes de API
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: { maxAge: 15552000, includeSubDomains: true, preload: true }, // ~180 días
    referrerPolicy: { policy: 'no-referrer' },
  })
);

// Ejemplo de cookie segura (si optas por cookies en lugar de Bearer tokens)
app.get('/login-demo', (req, res) => {
  res.cookie('session', 'opaque_token', {
    httpOnly: true,
    secure: true, // requiere HTTPS
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 1000, // 1h
  });
  res.sendStatus(204);
});
```

---

### 3) Nginx como reverse proxy

Instala Nginx (Ubuntu 22.04+):

```sh
sudo apt update && sudo apt install -y nginx
```

Crea un sitio en `/etc/nginx/sites-available/webapp` y habilítalo con un symlink a `sites-enabled/`.

Configuración base con headers y soporte WebSocket:

```nginx
upstream webapp {
  server 127.0.0.1:3000;
}

server {
  listen 80;
  server_name www.example.com example.com; # cambia por tu dominio

  # Logs
  access_log /var/log/nginx/webapp.access.log;
  error_log  /var/log/nginx/webapp.error.log;

  # Archivos estáticos directos (opcional si tienes CDN)
  location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff2?|ttf|ico)$ {
    root /home/production/app/dist;  # ajusta ruta
    access_log off;
    expires 1y;
    add_header Cache-Control "public, immutable";
    try_files $uri @app;
  }

  location / {
    try_files $uri @app;
  }

  location @app {
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Host $host;

    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";

    proxy_pass http://webapp;
  }
}
```

Alternativa SPA simplificada (sirviendo todo como estático y fallback a index.html):

```nginx
server {
  listen 80;
  server_name www.example.com example.com; # cambia por tu dominio

  root /home/production/app/dist; # carpeta de build de Vite

  location / {
    try_files $uri /index.html;
  }
}
```

Habilita y recarga:

```sh
sudo ln -s /etc/nginx/sites-available/webapp /etc/nginx/sites-enabled/webapp
sudo nginx -t && sudo systemctl reload nginx
```

Sugerencia: configura TLS (Let’s Encrypt con `certbot`) y redirección 80→443.

---

### 4) PM2 como gestor de procesos (systemd)

Instala PM2 globalmente y crea un usuario sin privilegios:

```sh
sudo npm i -g pm2
sudo useradd -m production || true
sudo su - production
```

Clona el repo, instala dependencias y compila el frontend:

```sh
git clone <repo>
cd <repo>
pnpm i --prod=false
pnpm run build
```

Define un `ecosystem.config.cjs` (PM2 lee CommonJS sin fricción ESM):

```js
module.exports = {
	apps: [
		{
			name: 'webapp',
			script: './server/index.js',
			cwd: __dirname,
			instances: 'max', // o un número, p.ej. 2
			exec_mode: 'cluster', // balanceo entre CPUs
			watch: false,
			env: {
				NODE_ENV: 'production',
				PORT: 3000,
			},
		},
	],
};
```

Arranca, verifica y persiste con systemd:

```sh
pm2 start ecosystem.config.cjs
pm2 status
pm2 logs webapp

# Arranque automático (systemd)
pm2 save
pm2 startup systemd -u production --hp /home/production
# sigue las instrucciones que imprime PM2 (sudo ...)
```

Notas:

- Usa `pm2 reload webapp` para despliegues sin downtime.
- Mantén `pm2 save` actualizado tras cambiar config/procesos.

---

### 5) PaaS (Heroku/Render/Fly) con ESM + Vite

Si prefieres PaaS, el patrón es similar: construir con Vite y ejecutar un servidor Node/Express que sirva `dist/`.

- `Procfile` (Heroku):

```Procfile
web: node server/index.js
```

- `package.json` (scripts ya presentes):

```json
{
	"scripts": {
		"build": "vite build"
	},
	"engines": {
		"node": ">=18"
	}
}
```

- En Heroku configura variables y Node LTS:

```sh
heroku buildpacks:set heroku/nodejs
heroku config:set NODE_ENV=production
heroku config:set NPM_CONFIG_PRODUCTION=true
# push del código a Heroku/Git y despliega
```

Nota: Heroku cambió modelos de planes; alternativas modernas: Render, Fly.io, Railway. Todas siguen el patrón “build + start el servidor ESM que sirve dist”.

---

### 6) Checklist de despliegue

- [ ] `pnpm run build` genera `dist/` sin warnings.
- [ ] `server/index.js` (ESM) sirve estáticos y fallback SPA.
- [ ] `NODE_ENV=production` y `PORT` definidos (PM2/env/systemd).
- [ ] Nginx configurado (proxy headers, WebSocket, cache estáticos, TLS).
- [ ] Headers de seguridad activos: CSP/HSTS en Express (y equivalentes en Nginx si sirve estáticos).
- [ ] PM2 en modo `cluster`, con `pm2 save` y `pm2 startup systemd`.
- [ ] Logs en `pm2 logs` y en Nginx (`/var/log/nginx/...`).

---

#### Resumen

- Construimos el frontend con Vite y servimos `dist/` desde un Express ESM.
- Pusimos Nginx delante como reverse proxy.
- Orquestamos el proceso con PM2 y systemd para alta disponibilidad.
- Dejamos una guía rápida para PaaS modernas (Heroku/Render/Fly) sin Gulp ni herramientas legacy.
