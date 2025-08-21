## Capítulo 10. Autenticación (ES2024 + ESM + Vite)

Este capítulo moderniza la autenticación en aplicaciones Backbone con un enfoque sin estado y ejemplos listos para Vite (bundler) y Express (API), usando módulos ES (ESM) y JavaScript 2024.

- Objetivo: entender y aplicar Basic Auth y OAuth2 en un entorno SPA + API stateless.
- Stack: Vite para frontend, Express ESM para API, `fetch` nativo en el navegador.
- Requisitos: Node >= 18, proyecto con `"type": "module"` y Vite.

---

### 1) APIs sin estado y dónde guardar la sesión

- En REST, el servidor no guarda estado de tu sesión. Cada request debe incluir credenciales/tokens.
- El cliente (navegador) debe persistir datos mínimos: token de acceso y tipo de token.
- Opciones de almacenamiento: `sessionStorage` (caduca al cerrar la pestaña) o `localStorage` (persistente). Para este capítulo usaremos `sessionStorage`.

---

### 2) Autenticación HTTP Basic

Basic Auth envía en cada petición un encabezado `Authorization: Basic <base64(user:pass)>`.

- Sólo debe usarse sobre HTTPS.
- Útil para demos o entornos controlados; no para producción con usuarios reales.

#### 2.1 Servidor Express (ESM) – middleware de Basic Auth

```js
// server/basicAuthMiddleware.mjs (ESM)
export function basicAuthRequired(req, res, next) {
	const header = req.headers.authorization || '';
	// Espera: "Basic base64(user:pass)"
	const [type, payload] = header.split(' ');
	if (type !== 'Basic' || !payload) return res.sendStatus(401);

	try {
		const [user, pass] = Buffer.from(payload, 'base64').toString('utf8').split(':');
		// Demo: credenciales fijas
		if (user === 'john' && pass === 'doe') return next();
		return res.sendStatus(401);
	} catch {
		return res.sendStatus(401);
	}
}
```

Rutas protegidas:

```js
// server/routes.mjs (ESM)
import express from 'express';
import { basicAuthRequired } from './basicAuthMiddleware.mjs';
import * as controller from './controller.mjs';

export const router = express.Router();

router.post('/api/contacts', basicAuthRequired, controller.createContact);
router.get('/api/contacts', basicAuthRequired, controller.showContacts);
router.get('/api/contacts/:contactId', basicAuthRequired, controller.findContactById);
router.put('/api/contacts/:contactId', basicAuthRequired, controller.updateContact);
router.delete('/api/contacts/:contactId', basicAuthRequired, controller.deleteContact);
router.post('/api/contacts/:contactId/avatar', basicAuthRequired, controller.uploadAvatar);
```

Si usas `WWW-Authenticate`, el navegador puede mostrar un diálogo nativo. Para un flujo personalizado (SPA), evita ese header y muestra tu propio formulario.

#### 2.2 Cliente Backbone (ESM) – vista de Login con fetch

Creamos una vista de login y un servicio de autenticación reutilizable. Usa `fetch` y guarda el token en `sessionStorage`.

Servicio de autenticación:

```js
// src/ui/services/Auth.js (ESM)
const KEY = 'auth';

export function save(type, token) {
	sessionStorage.setItem(KEY, `${type}:${token}`);
}

export function load() {
	const raw = sessionStorage.getItem(KEY);
	if (!raw) return null;
	const [type, token] = raw.split(':');
	return { type, token };
}

export function drop() {
	sessionStorage.removeItem(KEY);
}

export function buildBasic(username, password) {
	// btoa es suficiente en el navegador para ASCII
	return btoa(`${username}:${password}`);
}
```

Inyección del header en todas las sync de Backbone:

```js
// src/ui/common/setupAuth.js (ESM)
import Backbone from 'backbone';
import { load } from '../services/Auth.js';

export function setupGlobalAuth() {
	const auth = load();
	// Sobrescribimos sync para añadir Authorization si existe
	const originalSync = Backbone.sync;
	Backbone.sync = function (method, model, options = {}) {
		const headers = { ...(options.headers || {}) };
		const a = load();
		if (a?.type && a?.token) headers.Authorization = `${a.type} ${a.token}`;
		return originalSync.call(this, method, model, { ...options, headers });
	};
}
```

Vista de Login:

```js
// src/ui/modules/auth/view/LoginView.js (ESM)
import Backbone from 'backbone';
import { buildBasic, save } from '../../../services/Auth.js';

export default class LoginView extends Backbone.View {
	get events() {
		return { 'submit form': 'makeLogin' };
	}

	makeLogin(e) {
		e.preventDefault();
		const username = this.$('#username').val();
		const password = this.$('#password').val();
		const token = buildBasic(username, password);

		fetch('/api/contacts', {
			headers: { Authorization: `Basic ${token}` },
		})
			.then((res) => {
				if (res.status === 401) throw new Error('UNAUTHORIZED');
				save('Basic', token);
				Backbone.history.navigate('contacts', { trigger: true });
			})
			.catch((err) => {
				const msg =
					err.message === 'UNAUTHORIZED' ? 'Usuario/Clave inválidos' : 'Error desconocido';
				this.$('#message').text(msg);
			});
	}
}
```

Router de Login:

```js
// src/ui/modules/auth/AuthRouter.js (ESM)
import Backbone from 'backbone';
import LoginView from './view/LoginView.js';

export default class AuthRouter extends Backbone.Router {
	initialize() {
		this.route('login', 'showLogin');
	}
	showLogin() {
		const App = window.App; // o importa tu controlador/layout principal
		App.mainRegion.show(new LoginView());
	}
}
```

Arranque de la App: cargar sesión si existe y montar router global que soporte `logout`.

```js
// src/ui/App.js (ESM)
import Backbone from 'backbone';
import { load, drop } from './services/Auth.js';
import { setupGlobalAuth } from './common/setupAuth.js';

export class DefaultRouter extends Backbone.Router {
	initialize() {
		this.route('', 'home');
		this.route('logout', 'logout');
	}
	home() {
		this.navigate('contacts', { trigger: true, replace: true });
	}
	logout() {
		drop();
		this.navigate('login', { trigger: true, replace: true });
	}
}

export function startApp() {
	window.App = window.App || {};
	// App.mainRegion = new Region({ el: '#main' }); // usa tu Region existente
	setupGlobalAuth();

	const auth = load();
	if (!auth) window.location.replace('/#login');

	App.router = new DefaultRouter();
	Backbone.history.start();
}
```

---

### 3) OAuth2 (Resource Owner Password Credentials)

Para una SPA propia (frontend + backend controlados), el flujo de “password” puede servir en entornos controlados. Para producción pública, considera Authorization Code con PKCE.

#### 3.1 Endpoint de token (ESM)

```js
// server/oauth/token.mjs (ESM)
import crypto from 'node:crypto';

const DEFAULT_EXPIRATION = 3600; // 1h
const validTokens = new Map();
const refreshTokens = new Map();

function generateToken(bytes = 30) {
	return crypto.randomBytes(bytes).toString('base64url');
}

export function authorize(body) {
	const { grant_type, username, password } = body || {};
	if (grant_type !== 'password') return { error: 'invalid_grant' };
	if (!username || !password) return { error: 'invalid_request' };

	// Demo: usuario fijo
	if (username !== 'john' || password !== 'doe') return { error: 'invalid_grant' };

	const access_token = generateToken();
	const refresh_token = generateToken();
	const token = {
		access_token,
		token_type: 'Bearer',
		expires_in: DEFAULT_EXPIRATION,
		refresh_token,
		username,
	};

	validTokens.set(access_token, token);
	refreshTokens.set(refresh_token, token);
	setTimeout(() => validTokens.delete(access_token), DEFAULT_EXPIRATION * 1000);
	return token;
}

export function requireAuthorization(req, res, next) {
	const header = req.headers.authorization || '';
	const [type, token] = header.split(' ');
	if (type !== 'Bearer' || !token) return res.sendStatus(401);
	if (!validTokens.has(token)) return res.sendStatus(401);
	return next();
}
```

Rutas:

```js
// server/routes.mjs (añadir OAuth)
import express from 'express';
import { authorize, requireAuthorization } from './oauth/token.mjs';
import * as controller from './controller.mjs';

export const router = express.Router();

router.post('/api/oauth/token', express.urlencoded({ extended: false }), (req, res) => {
	const result = authorize(req.body);
	if (result.error) return res.status(400).json(result);
	return res.json(result);
});

router.get('/api/contacts', requireAuthorization, controller.showContacts);
// ... resto de rutas protegidas
```

#### 3.2 Cliente – Login con `fetch` a `/api/oauth/token`

```js
// src/ui/modules/auth/view/LoginView.js (variante OAuth2)
import Backbone from 'backbone';
import { save } from '../../../services/Auth.js';

export default class LoginView extends Backbone.View {
	get events() {
		return { 'submit form': 'makeLogin' };
	}

	makeLogin(e) {
		e.preventDefault();
		const username = this.$('#username').val();
		const password = this.$('#password').val();

		const body = new URLSearchParams();
		body.set('grant_type', 'password');
		body.set('username', username);
		body.set('password', password);

		fetch('/api/oauth/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body,
		})
			.then(async (res) => {
				if (!res.ok) throw new Error(res.status === 401 ? 'UNAUTHORIZED' : 'BAD');
				const data = await res.json();
				save(data.token_type, data.access_token);
				Backbone.history.navigate('contacts', { trigger: true });
			})
			.catch((err) => {
				const msg =
					err.message === 'UNAUTHORIZED' ? 'Usuario/Clave inválidos' : 'Error desconocido';
				this.$('#message').text(msg);
			});
	}
}
```

---

### 4) Integración con Vite (proxy de API y build)

- Durante desarrollo, Vite puede proxyear `/api` al servidor Express:

```ts
// vite.config.ts (extracto)
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		proxy: {
			'/api': {
				target: 'http://localhost:3000',
				changeOrigin: true,
			},
		},
	},
});
```

- En producción, sirve el frontend estático (carpeta de build) y expón la API desde el mismo Express o detrás de Nginx (ver Cap. 9).

---

### 5) Seguridad y buenas prácticas

- Usa siempre HTTPS para evitar exponer credenciales en claro.
- Evita “Implicit Grant” en SPAs modernas; usa Authorization Code con PKCE si necesitas OAuth2 con terceros.
- No guardes contraseñas ni tokens largos en `localStorage` sin expiración; prefiere expiraciones cortas y refresh tokens con rotación.
- No ejecutes Node como root y registra logs de 401/403.

---

### 6) Resumen

- Vimos Basic Auth y OAuth2 en un backend Express ESM y un frontend Backbone ESM con Vite.
- Centralizamos la sesión en un servicio `Auth` y añadimos el header a todas las llamadas sobrescribiendo `Backbone.sync`.
- Con Vite, el flujo local es simple con `server.proxy` y, en producción, puedes usar Nginx + PM2 (ver Cap. 9).
