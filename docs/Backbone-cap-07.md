## Capítulo 7. Construya como un profesional

Hace algunos años, podías crear un sitio web con PHP, cargar tus archivos fuente a través de FTP a un servidor y luego conectarse. En aquellos días, JavaScript era una parte integral de todo el sistema, utilizado para tareas de interfaz de usuario, como validar formularios o pequeñas partes de funcionalidad.
Hoy en día, la web requiere más JavaScript, estamos creando aplicaciones web en lugar de sitios web, esto significa que JavaScript ya no es una pieza trivial de aplicaciones, ahora es una pieza central. Por esta razón, es importante empaquetar nuestra aplicación JavaScript antes de implementarla en producción.
Aprenderá lo siguiente en este capítulo:

- Creación de un flujo de trabajo para procesar automáticamente sus archivos fuente
- Minimizar el tamaño del script de la aplicación
- Minimizar el número de solicitudes al servidor cuando se carga la aplicación
- Minimizando las imágenes
- Optimización de los archivos CSS
- Cableando todo en un archivo HTML
- Configurar un entorno de desarrollo para recargar automáticamente la aplicación

> Nota histórica: Este capítulo reemplaza el flujo basado en Browserify/Gulp/BrowserSync por un enfoque moderno con Vite y ES Modules (ES2024). Si usas Gulp, puedes mantener tareas específicas (por ejemplo, imágenes), pero la recomendación es centralizar el desarrollo y build en Vite.

---

### Flujo de trabajo de desarrollo con Vite (HMR + ES Modules)

Durante el desarrollo no necesitas reagrupar manualmente tu código; Vite sirve los módulos nativos del navegador y aplica HMR (Hot Module Replacement) automáticamente.

- **Scripts en `package.json`**

```json
{
	"scripts": {
		"dev": "vite",
		"build": "vite build",
		"preview": "vite preview",
		"dev:server": "nodemon server/index.js",
		"dev:all": "concurrently -k -n VITE,API -c green,cyan \"npm:dev\" \"npm:dev:server\""
	}
}
```

- **Servidor de desarrollo**
   - `npm run dev` levanta Vite con HMR.
   - `npm run dev:server` levanta tu API (Express) con `nodemon`.
   - `npm run dev:all` ejecuta ambos en paralelo con `concurrently`.

Instala utilidades si las necesitas:

```bash
npm i -D nodemon concurrently
```

---

### Configuración recomendada de Vite (ES2024)

Crea `vite.config.js` en la raíz:

```js
// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'src'),
		},
	},
	optimizeDeps: {
		include: ['backbone', 'underscore', 'jquery', 'backbone-validation'],
	},
	server: {
		port: 5173,
		open: false,
		// Redirige llamadas a tu API local
		proxy: {
			'^/(api|avatar)/.*': {
				target: 'http://localhost:8000',
				changeOrigin: true,
			},
		},
	},
	build: {
		target: 'esnext', // ES Modules modernos (ES2024)
		sourcemap: true,
		outDir: 'dist',
	},
});
```

- **index.html** (entrypoint único)

```html
<!doctype html>
<html>
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>Backbone + Vite</title>
	</head>
	<body>
		<div id="main"></div>
		<script type="module" src="/src/main.js"></script>
	</body>
</html>
```

- **src/vendor/backbone-setup.js** (integración Backbone/jQuery/Underscore)

```js
import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import 'backbone-validation';

Backbone.$ = $; // Backbone usará jQuery
// Exponer globales mínimos si hay código legado
window.$ = $;
window.jQuery = $;
window._ = _;

export { Backbone, $, _ };
```

- **src/main.js** (inicio de la app)

```js
import './vendor/backbone-setup';
import App from './app';

App.start();
```

---

### Mapas fuente y recarga automática

- **Mapas fuente**: Vite habilita sourcemaps en desarrollo. Para producción, activa `build.sourcemap: true` si deseas facilitar diagnósticos (`vite.config.js`).
- **HMR**: Vite actualiza módulos sin recargar toda la página. No necesitas BrowserSync.

---

### Optimización para producción

Ejecuta:

```bash
npm run build
```

- **Minificación**: JS y CSS se minifican automáticamente (esbuild/rollup).
- **Code splitting**: Vite/rollup separa automáticamente chunks comunes.
- **Assets hashing**: nombres con hash para caché.

Sirve el build para verificar:

```bash
npm run preview
```

---

### CSS, fuentes y assets estáticos

- **CSS**: importa archivos `.css`/`.scss` desde tus módulos. Vite procesa y minifica en build. Puedes añadir PostCSS según requieras.
- **Fuentes/Imágenes**: coloca recursos en `src` y `import`-álos o ponlos en `public/` para servirlos sin transformación.
   - Ejemplo fuentes de Bootstrap: importa CSS desde `node_modules/bootstrap/dist/css/bootstrap.css` y deja que Vite resuelva las URLs de fuentes.
- **Límite inline**: ajusta `build.assetsInlineLimit` si deseas inline en base64 para recursos pequeños.

---

### Optimización de imágenes (opcional)

Para optimizar imágenes en el build, puedes usar `vite-plugin-imagemin`:

```bash
npm i -D vite-plugin-imagemin
```

```js
// vite.config.js
import { defineConfig } from 'vite';
import viteImagemin from 'vite-plugin-imagemin';

export default defineConfig({
	plugins: [
		viteImagemin({
			gifsicle: { optimizationLevel: 3 },
			optipng: { optimizationLevel: 5 },
			mozjpeg: { quality: 80 },
			svgo: { plugins: [{ name: 'removeViewBox', active: false }] },
		}),
	],
});
```

Si prefieres, también puedes optimizar imágenes en una tarea separada o en tu pipeline de CI.

---

### Estructura modular y plantillas

- **ES Modules (ES2024)**: organiza vistas, modelos y colecciones con `import/export`.
- **Plantillas Underscore**: importa como texto con `?raw` y compila en runtime con `_.template()`.

```js
import _ from 'underscore';
import tpl from '@/templates/view.tpl?raw';

export default class MyView extends Backbone.View {
	initialize() {
		this.template = _.template(tpl);
	}
}
```

- **Dependencias cíclicas**: usa `import()` dinámico para romper ciclos entre `Router` y `App`.

```js
async startApp() {
  const { default: App } = await import('@/app');
  const { default: ContactsApp } = await import('./app');
  return App.startSubApplication(ContactsApp);
}
```

---

### Resumen

- Usar Vite simplifica el flujo de desarrollo (HMR, sourcemaps) y la compilación a producción (minificación, splitting, hashing) sin Browserify/Gulp/BrowserSync.
- Configura `vite.config.js` con `server.proxy` para redirigir `/api` u otros prefijos hacia tu API local.
- Maneja CSS, imágenes y fuentes como assets del proyecto; usa `public/` para estáticos sin transformación o impórtalos desde módulos.
- Para imágenes, puedes integrar `vite-plugin-imagemin` o usar optimización en CI.

En el próximo capítulo, veremos cómo probar las aplicaciones Backbone en este contexto moderno de módulos ES y bundling con Vite.
