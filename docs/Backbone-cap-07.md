# Capítulo 7. Construya como un profesional

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

---

## Flujo de trabajo de desarrollo con Vite (HMR + ES Modules)

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

Dependencias base de Backbone/legado:

```bash
pnpm add backbone underscore jquery backbone-validation
# o con npm
npm i backbone underscore jquery backbone-validation
```

---

### Configuración recomendada de Vite (ESNext)

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
			'/api': {
				target: 'http://localhost:8000',
				changeOrigin: true,
			},
			'/avatar': {
				target: 'http://localhost:8000',
				changeOrigin: true,
			},
		},
	},
	build: {
		target: 'esnext', // ES Modules modernos (ESNext)
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
import { startApp } from './app';

startApp();
```

---

### Stub mínimo de Region/App

Para que los ejemplos de routers/vistas funcionen sin depender de un framework de layout externo (por ejemplo, Marionette), puedes usar una `Region` mínima que monte vistas en un contenedor del DOM. Ubica este stub donde prefieras (p. ej., `src/ui/common/Region.js`) y asegúrate de haber fijado `Backbone.$` en el bootstrap (`src/vendor/backbone-setup.js`).

```js
// src/ui/common/Region.js
import Backbone from 'backbone';

export default class Region {
  constructor({ el }) {
    const $ = Backbone.$;
    this.$el = el && el.jquery ? el : ($ ? $(el) : el);
    this.currentView = null;
  }
  show(view) {
    if (this.currentView && this.currentView.remove) {
      this.currentView.remove();
    }
    this.currentView = view;
    this.$el.empty().append(view.render().el);
    return view;
  }
}
```

Uso básico en tu aplicación:

```js
// src/app.js
import Backbone from 'backbone';
import Region from './ui/common/Region';

export function startApp() {
  window.App = window.App || {};
  App.mainRegion = new Region({ el: '#main' });
  
  // Configura tu router y arranca el historial
  // App.router = new AppRouter();
  Backbone.history.start();
}
```

### Montaje rápido de los ejemplos (Router + Región)

Ejemplo mínimo de rutas para probar `ModalExampleView`, `TabsView`, `UsersPage` y `ContactsTableView`.

```js
// src/router.js
import Backbone from 'backbone';

export default class AppRouter extends Backbone.Router {
  get routes() {
    return {
      'modal': 'showModal',
      'tabs': 'showTabs',
      'users': 'showUsers',
      'contacts': 'showContacts',
      '*path': 'home',
    };
  }

  async showModal() {
    const { default: View } = await import('@/ui/components/ModalExampleView');
    App.mainRegion.show(new View());
  }
  async showTabs() {
    const { default: View } = await import('@/ui/components/TabsView');
    App.mainRegion.show(new View());
  }
  async showUsers() {
    const { default: View } = await import('@/apps/users/UsersPage');
    App.mainRegion.show(new View());
  }
  async showContacts() {
    const { default: View } = await import('@/ui/contacts/ContactsTableView');
    const { default: Contacts } = await import('@/apps/contacts/collection');
    App.mainRegion.show(new View({ collection: new Contacts() }));
  }
  home() { this.navigate('users', { trigger: true }); }
}
```

Y arráncalo en tu `startApp()`:

```js
// src/app.js
import Backbone from 'backbone';
import Region from '@/ui/common/Region';
import AppRouter from '@/router';
export function startApp() {
  window.App = window.App || {};
  App.mainRegion = new Region({ el: '#main' });
  App.router = new AppRouter();
  Backbone.history.start();
}
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

### Bootstrap 5: modales, pestañas (tabs) y estilos con Backbone (Vite + ESM)

- **Instalación** (si aún no lo tienes):

```bash
pnpm add bootstrap
```

- **Imports recomendados** (una vez, por ejemplo en `src/main.js`):

```js
// src/main.js
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap'; // habilita JS de componentes (modal, tab, collapse, etc.)
import './vendor/backbone-setup';
import { startApp } from './app';
startApp();
```

Nota: si usas dropdowns, tooltips o popovers de Bootstrap, instala Popper (peer dependency de Bootstrap para estos componentes):

```bash
pnpm add @popperjs/core
```

- **Modal en Backbone**

```html
<!-- src/ui/components/modalExample.tpl -->
<div class="modal fade" id="myModal" tabindex="-1" aria-hidden="true">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title">Título</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <p>Contenido del modal</p>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
      </div>
    </div>
  </div>
  </div>
```

```js
// src/ui/components/ModalExampleView.js
import _ from 'underscore';
import Backbone from 'backbone';
import Modal from 'bootstrap/js/dist/modal';
import tpl from '@/ui/components/modalExample.tpl?raw';

export default class ModalExampleView extends Backbone.View {
  get className() { return 'p-3'; }

  initialize() {
    this.template = _.template(tpl);
  }

  events() {
    return { 'click [data-action="open-modal"]': 'openModal' };
  }

  render() {
    this.$el.html('<button class="btn btn-primary" data-action="open-modal">Abrir modal</button>' + this.template());
    // Inicializa el modal cuando el nodo exista en el DOM real
    _.defer(() => { this.modal = new Modal(this.$('#myModal')[0], { backdrop: 'static' }); });
    return this;
  }

  openModal() {
    if (!this.modal) return;
    this.modal.show();
  }

  remove() {
    if (this.modal) { this.modal.hide(); this.modal.dispose(); this.modal = null; }
    return super.remove();
  }
}
```

- **Tabs (pestañas) con data attributes o API JS**

```html
<!-- src/ui/components/tabs.tpl -->
<ul class="nav nav-tabs" role="tablist">
  <li class="nav-item" role="presentation">
    <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#tab-home" type="button" role="tab">Home</button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#tab-profile" type="button" role="tab">Profile</button>
  </li>
</ul>
<div class="tab-content border-start border-end border-bottom p-3">
  <div class="tab-pane fade show active" id="tab-home" role="tabpanel">Contenido Home</div>
  <div class="tab-pane fade" id="tab-profile" role="tabpanel">Contenido Profile</div>
 </div>
```

```js
// src/ui/components/TabsView.js
import Backbone from 'backbone';
import Tab from 'bootstrap/js/dist/tab';
import tpl from '@/ui/components/tabs.tpl?raw';

export default class TabsView extends Backbone.View {
  render() {
    this.$el.html(tpl);
    return this;
  }

  // Ejemplo de activación programática
  activateProfile() {
    const btn = this.$('[data-bs-target="#tab-profile"]')[0];
    if (btn) new Tab(btn).show();
  }
}
```

- **Estilos**
- Usa utilidades de Bootstrap (espaciado, tipografía, colores) y la grilla para layout.
- Si quieres personalizar variables (SCSS), puedes importar `bootstrap/scss/bootstrap.scss` y definir overrides con Vite + sass.

---

### Integración de Bootstrap 5 + DataTables en vistas Backbone (ESM + Vite)

- **Objetivo**: renderizar tablas ricas (paginación, búsqueda, responsive, exportar) con el tema Bootstrap 5.
- **Stack**: ES Modules + Vite + jQuery (ya presente) + Backbone Views.

- **Instalación**

 ```bash
 pnpm add bootstrap datatables.net datatables.net-bs5 datatables.net-responsive datatables.net-responsive-bs5 datatables.net-buttons datatables.net-buttons-bs5
 # o npm/yarn equivalente
 ```

- **Imports globales de estilos y bootstrap (una vez, por ejemplo en `src/main.js`)**

 ```js
 // src/main.js
 import 'bootstrap/dist/css/bootstrap.css';
 import 'datatables.net-bs5/css/dataTables.bootstrap5.css';
 import 'datatables.net-responsive-bs5/css/responsive.bootstrap5.css';
 import 'datatables.net-buttons-bs5/css/buttons.bootstrap5.css';
 import 'bootstrap'; // JS de Bootstrap (opcional si usas componentes)
 import './vendor/backbone-setup';
 import { startApp } from './app';
 startApp();
 ```

- **Vista Backbone con DataTables**

 ```js
 // src/ui/contacts/ContactsTableView.js
 import _ from 'underscore';
 import Backbone from 'backbone';
 import DataTable from 'datatables.net';
 import 'datatables.net-bs5';
 import 'datatables.net-responsive';
 import 'datatables.net-responsive-bs5';
 import 'datatables.net-buttons';
 import 'datatables.net-buttons-bs5';
 import 'datatables.net-buttons/js/buttons.html5';
 import 'datatables.net-buttons/js/buttons.print';
 import tpl from '@/ui/contacts/contactsTable.tpl?raw';

export default class ContactsTableView extends Backbone.View {
  get tagName() { return 'div'; }

  initialize(options) {
    this.template = _.template(tpl);
    this.listenTo(this.collection, 'update reset change', this.updateTable);
  }

  render() {
    const rows = this.collection.toJSON();
    this.$el.html(this.template({ rows }));
    // Inicializa DataTable cuando el nodo esté en DOM real
    _.defer(() => this.initDataTable());
    return this;
  }
   

   initDataTable() {
     if (this.dt) return;
     const tableEl = this.$('table')[0];
     if (!tableEl) return;
     this.dt = new DataTable(tableEl, {
       responsive: true,
       pageLength: 10,
       dom: 'Bfrtip',
       buttons: ['copy', 'csv', 'print'],
       language: { url: 'https://cdn.datatables.net/plug-ins/2.0.3/i18n/es-ES.json' },
       columnDefs: [
         { targets: -1, orderable: false } // columna de acciones
       ],
     });
   }

   updateTable = () => {
     if (!this.dt) return; // aún no montado
     const data = this.collection.toJSON().map(r => [r.name, r.email, r.phone, '']);
     this.dt.clear();
     this.dt.rows.add(data).draw();
   }

   remove() {
     if (this.dt) { this.dt.destroy(); this.dt = null; }
     return super.remove();
   }
 }
 ```

- **Plantilla de tabla**

 ```html
 <!-- src/ui/contacts/contactsTable.tpl -->
 <div class="container-fluid">
   <table class="table table-striped table-hover" style="width:100%">
     <thead>
       <tr>
         <th>Nombre</th>
         <th>Email</th>
         <th>Teléfono</th>
         <th>Acciones</th>
       </tr>
     </thead>
     <tbody>
       <% rows.forEach(function(r){ %>
         <tr>
           <td><%- r.name %></td>
           <td><%- r.email %></td>
           <td><%- r.phone %></td>
           <td>
             <button class="btn btn-sm btn-outline-primary" data-id="<%- r.id %>">Ver</button>
           </td>
         </tr>
       <% }); %>
     </tbody>
   </table>
 </div>
 ```

- **Uso desde un router/controlador**

 ```js
 // src/apps/contacts/controller.js
 import ContactsTableView from '@/ui/contacts/ContactsTableView';
 import Contacts from '@/apps/contacts/collection';

 export function showList() {
   const col = new Contacts();
   col.fetch({ reset: true }).finally(() => {
     const view = new ContactsTableView({ collection: col });
     App.mainRegion.show(view);
   });
 }
 ```

- **Notas**
- Inicializa DataTable tras `render()` con `_.defer` para asegurar que el nodo esté adjunto al DOM (según tu `Region`).
- Destruye el DataTable en `remove()` para evitar fugas de memoria.
- Para datos dinámicos, escucha `update/reset/change` en la colección y usa `dt.clear().rows.add(...).draw()`.

### Problemas comunes (Troubleshooting) y compatibilidad

- **Múltiples copias de jQuery/Backbone**: asegúrate de fijar `Backbone.$ = $` en `src/vendor/backbone-setup.js` y evitar incluir jQuery por CDN además del bundle.
- **Orden de imports**: importa primero CSS (Bootstrap/DataTables) y luego el JS necesario (`bootstrap`, DataTables y extensiones) antes de inicializar vistas.
- **DataTables 2.x vs 1.x**: en 2.x, la importación ESM típica es `import DataTable from 'datatables.net'` y se instancia con `new DataTable(el, options)`. No uses el plugin jQuery (`$(el).DataTable()`) si trabajas 100% ESM.
- **i18n de DataTables**: usa una URL de la misma serie de tu versión (p.ej. `2.0.3`). Si no carga la traducción, revisa la consola y la URL.
- **Bootstrap Popper**: dropdowns/tooltips/popovers requieren `@popperjs/core`. Instálalo si ves errores de "Popper not found".
- **Montaje de DOM**: inicializa componentes tras `render()` con `_.defer` o cuando el nodo esté en el DOM real (tu `Region.show()` ya lo hace). Destruye en `remove()`.

### Cargas diferidas (code-splitting) con `import()`

- **Bootstrap Modal bajo demanda**

```js
// Dentro de ModalExampleView
async openModal() {
  if (!this.modal) {
    const { default: Modal } = await import('bootstrap/js/dist/modal');
    this.modal = new Modal(this.$('#myModal')[0], { backdrop: 'static' });
  }
  this.modal.show();
}
```

- **DataTables bajo demanda**

```js
// Dentro de ContactsTableView
async initDataTable() {
  if (this.dt) return;
  const tableEl = this.$('table')[0];
  if (!tableEl) return;
  const { default: DataTable } = await import('datatables.net');
  await import('datatables.net-bs5');
  await import('datatables.net-responsive');
  await import('datatables.net-responsive-bs5');
  await import('datatables.net-buttons');
  await import('datatables.net-buttons-bs5');
  this.dt = new DataTable(tableEl, { responsive: true, dom: 'Bfrtip' });
}
```

### Accesibilidad (a11y) e i18n

- **Modales**: Bootstrap maneja foco y `aria-` por defecto; cierra con `dispose()` en `remove()` para restaurar correctamente el foco.
- **Tabs**: usa la estructura `role="tablist"`/`role="tabpanel"` (la plantilla ya la incluye) y activa con la API (`new Tab(btn).show()`) para mantener estados accesibles.
  - **DataTables**: revisa textos de botones y traducciones; personaliza `language` según tus necesidades.

---

### Integración con Electron 37 (Escritorio) + Backbone + Vite

Objetivo: empaquetar tu frontend Backbone (renderizador) como una app de escritorio con Electron v37, manteniendo DX moderna con Vite en desarrollo y un build de producción empaquetado.

- **Requisitos**
  - Node 18+.
  - Electron 37.
  - Vite ya configurado (ver secciones anteriores).

- **Estructura sugerida**

```text
project/
  electron/
    main.js       # Proceso principal (ESM)
    preload.js    # Bridge seguro (contextBridge)
  src/            # Renderizador: Backbone + Vite (ya existente)
  index.html      # Entrada del renderizador
  vite.config.js
  package.json
```

- **Instalación**

```bash
pnpm add -D electron@^37 concurrently wait-on cross-env electron-builder
# o npm/yarn equivalente
```

Nota (ESM): si usas `import` en `electron/main.js` (ES Modules), añade `"type": "module"` en tu `package.json` o usa extensiones `.mjs` para los archivos del proceso principal/preload.

- **Scripts en `package.json`** (dev con HMR + Electron, build y distribución)

```json
{
  "main": "electron/main.js",
  "scripts": {
    "dev:renderer": "vite",
    "dev:main": "wait-on tcp:5173 && cross-env VITE_DEV_SERVER_URL=http://localhost:5173 electron .",
    "dev": "concurrently -k -n VITE,MAIN -c green,cyan \"npm:dev:renderer\" \"npm:dev:main\"",
    "build:renderer": "vite build",
    "build": "npm run build:renderer",
    "dist": "npm run build && electron-builder -l"
  },
  "build": {
    "appId": "com.ejemplo.backboneapp",
    "files": ["dist/**/*", "electron/**/*"],
    "extraMetadata": { "main": "electron/main.js" },
    "linux": { "target": "AppImage" }
  }
}
```

- **electron/main.js** (ESM, seguridad por defecto, dev/prod auto)

```js
// electron/main.js
import { app, BrowserWindow, ipcMain } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: true,
    },
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL; // p.ej. http://localhost:5173
  if (devUrl) {
    win.loadURL(devUrl);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexPath = path.join(process.cwd(), 'dist', 'index.html');
    win.loadFile(indexPath);
  }
}

// Ejemplo de manejador IPC (invocations)
ipcMain.handle('app:getVersion', () => app.getVersion());
ipcMain.handle('ping', () => 'pong');

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
```

- **electron/preload.js** (aislar y exponer una API mínima)

```js
// electron/preload.js
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  ping: () => ipcRenderer.invoke('ping'),
});
```

- **Uso desde una Vista Backbone** (renderer)

```js
// src/ui/components/ElectronInfoView.js
import Backbone from 'backbone';

export default class ElectronInfoView extends Backbone.View {
  get className() { return 'p-3'; }
  events() { return { 'click [data-action="version"]': 'showVersion' }; }
  render() {
    this.$el.html('<button class="btn btn-outline-primary" data-action="version">Ver versión de la app</button>\n<div id="out" class="mt-2 text-muted"></div>');
    return this;
  }
  async showVersion() {
    if (!window.electronAPI) return;
    const v = await window.electronAPI.getAppVersion();
    this.$('#out').text(`Versión: ${v}`);
  }
}
```

- **Notas de seguridad**
  - Mantén `contextIsolation: true`, `sandbox: true` y evita `nodeIntegration` en el renderizador.
  - Exponer sólo lo necesario por `preload` usando `contextBridge`.
  - Valida inputs y canales IPC; nombra canales con prefijos (p. ej. `app:*`).

- **Build de producción**
  - Ejecuta `npm run build` para generar `dist/` (renderer).
  - Luego `npm run dist` empaqueta la app (ejemplo objetivo Linux AppImage). Ajusta targets según tu SO.
  - En producción, `main.js` cargará `dist/index.html` automáticamente.

  - Pantalla en blanco en prod: verifica ruta a `dist/index.html` y permisos del `files` en `electron-builder`.
  - APIs no disponibles en el renderer: confirma que `preload.js` existe, la ruta es correcta y `contextIsolation` está activo.
  - HMR no carga en dev: confirma `VITE_DEV_SERVER_URL` y que `wait-on tcp:5173` espera antes de lanzar Electron.

#### Empaquetado con electron-builder

- **Config en `package.json`** (sección `build`):

```json
{
  "build": {
    "appId": "com.ejemplo.backboneapp",
    "directories": { "output": "release" },
    "asar": true,
    "files": [
      "dist/**/*",
      "electron/**/*",
      "!**/*.map",
      "!**/*.test.*",
      "!tests/**"
    ],
    "extraMetadata": { "main": "electron/main.js" },
    "mac": {
      "target": ["dmg", "zip"],
      "category": "public.app-category.developer-tools",
      "icon": "build/icon.icns"
    },
    "win": {
      "target": ["nsis"],
      "icon": "build/icon.ico"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "category": "Utility",
      "icon": "build/icons/png"
    },
    "artifactName": "${productName}-${version}-${os}-${arch}.${ext}"
  }
}
```

- **Scripts por plataforma** (opcional):

```json
 {
   "scripts": {
     "dist": "npm run build && electron-builder -l",
     "dist:linux": "npm run build && electron-builder -l AppImage deb",
     "dist:win": "npm run build && electron-builder -w nsis",
     "dist:mac": "npm run build && electron-builder -m dmg zip"
   }
}
```

- **Íconos**:
  - macOS: `build/icon.icns`
  - Windows: `build/icon.ico`
  - Linux: carpeta `build/icons/png` con tamaños 256x256, 512x512, etc.

- **Firma/Notarización (resumen)**:
  - macOS: para distribuir fuera de desarrollo, configura certificados y `APPLE_ID`/`APPLE_APP_SPECIFIC_PASSWORD` si vas a notarizar.
  - Windows: usa un certificado de firma de código (opcional) para evitar advertencias de SmartScreen.

- **Ejecutar empaquetado**:
  - Linux: `npm run dist:linux`
  - Windows: `npm run dist:win`
  - macOS: `npm run dist:mac`

- **Notas**:
  - Asegúrate de que el `main` en `extraMetadata` apunte a `electron/main.js` y que `preload.js` esté dentro de `files`.
  - Si usas módulos nativos, necesitas toolchains de cada SO (Xcode en macOS; Build Tools en Windows).
  - Los assets estáticos públicos deben quedar en `dist/` tras `vite build` (Vite copia automáticamente lo de `public/`).

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
Consulta también la guía de producción: Cap. 9, sección 1.1 “Optimización de imágenes (opcional)” para detalles de build, caché y CDN: [enlace](./Backbone-cap-09.md#cap9-imagenes).

### Estructura modular y plantillas

- **ES Modules (ESNext)**: organiza vistas, modelos y colecciones con `import/export`.
- **Plantillas Underscore**: importa como texto con `?raw` y compila en runtime con `_.template()`.

```js
import _ from 'underscore';
import Backbone from 'backbone';
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

### Componentes en Backbone: flujo orientado a eventos (sin envidiar a React/Angular)

Backbone permite construir “componentes” a su manera: vistas autocontenidas con entradas (opciones/props), estado interno (modelo local) y salidas (eventos). El flujo unidireccional se logra pasando datos de padre a hijo y recibiendo eventos del hijo para actualizar el estado en el padre o colección.

- **Patrón**
  - Entradas: `new MyComponent({ props })` o asignando `this.model`/`this.collection`.
  - Estado interno: `this.state = new Backbone.Model({ ... })` y `this.listenTo(this.state, 'change', this.render)`.
  - Salidas: `this.trigger('evento:nombre', payload)`; el padre hace `listenTo(hijo, 'evento:nombre', handler)`.

- **Ejemplo: SearchBox componible + vista contenedora**

```js
// src/ui/components/SearchBox.js
import _ from 'underscore';
import Backbone from 'backbone';
import tpl from '@/ui/components/searchBox.tpl?raw';

export default class SearchBox extends Backbone.View {
  get className() { return 'input-group'; }

  initialize(options) {
    this.template = _.template(tpl);
    this.state = new Backbone.Model({ query: options?.query || '' });
    this.debouncedEmit = _.debounce(() => {
      this.trigger('search:change', this.state.get('query'));
    }, 250);
  }

  events() {
    return { 'input input[type="search"]': 'onInput', 'click .btn-clear': 'onClear' };
  }

  render() {
    this.$el.html(this.template(this.state.toJSON()));
    return this;
  }

  onInput(e) {
    this.state.set('query', e.currentTarget.value);
    this.debouncedEmit();
  }

  onClear() {
    this.state.set('query', '');
    this.$('input[type="search"]').val('');
    this.trigger('search:change', '');
  }
}
```

```html
<!-- src/ui/components/searchBox.tpl -->
<input type="search" class="form-control" placeholder="Buscar..." value="<%- query %>" />
<button class="btn btn-outline-secondary btn-clear" type="button">Limpiar</button>
```

```js
// src/apps/users/UsersPage.js
import Backbone from 'backbone';
import _ from 'underscore';
import SearchBox from '@/ui/components/SearchBox';
import Users from '@/apps/users/collection';

export default class UsersPage extends Backbone.View {
  get className() { return 'container py-3'; }

  initialize() {
    this.collection = this.collection || new Users();
    this.listenTo(this.collection, 'reset', this.renderList);
  }

  render() {
    this.$el.html('<h3>Usuarios</h3><div class="mb-3" id="search"></div><ul class="list-group" id="list"></ul>');
    this.search = new SearchBox({ query: '' });
    this.listenTo(this.search, 'search:change', (q) => this.applyFilter(q));
    this.$('#search').append(this.search.render().el);
    this.collection.fetch({ reset: true });
    return this;
  }

  renderList = () => {
    const items = this.collection.toJSON();
    const html = items.map(u => `<li class="list-group-item d-flex justify-content-between align-items-center">
      <span>${_.escape(u.name)} <small class="text-muted">${_.escape(u.email)}</small></span>
    </li>`).join('');
    this.$('#list').html(html);
  }

  applyFilter(query) {
    const url = new URL(this.collection.url, window.location.origin);
    if (query) url.searchParams.set('q', query); else url.searchParams.delete('q');
    this.collection.url = url.pathname + (url.search || '');
    this.collection.fetch({ reset: true });
  }

  remove() {
    if (this.search) this.search.remove();
    return super.remove();
  }
}
```

Puntos clave:

- **Composición**: el padre crea hijos y hace `listenTo(hijo, evento, handler)`.
- **Aislamiento de estado**: el componente maneja su `state` interno; el padre decide efectos (fetch/filtrado).
- **Reutilizable**: `SearchBox` puede usarse en cualquier página que requiera búsqueda.

### Pruebas con Vitest (jsdom)

- **Instalación**

```bash
pnpm add -D vitest @testing-library/dom @testing-library/user-event
```

- **Test de SearchBox** (evento `search:change` con debounce):

```js
// tests/SearchBox.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SearchBox from '@/ui/components/SearchBox';

describe('SearchBox', () => {
  beforeEach(() => { document.body.innerHTML = '<div id="root"></div>'; });
  it('emite search:change con debounce', async () => {
    vi.useFakeTimers();
    const view = new SearchBox({ query: '' }).render();
    document.querySelector('#root').append(view.el);
    const handler = vi.fn();
    view.on('search:change', handler);
    view.$('input[type="search"]').val('abc').trigger('input');
    vi.advanceTimersByTime(300);
    expect(handler).toHaveBeenCalledWith('abc');
  });
});
```

- **Test de DataTables (init/teardown)**: montar un `<table>` en jsdom, importar dinámicamente `datatables.net`, crear y destruir la instancia.

```js
// tests/ContactsTableView.test.js (esqueleto)
import { describe, it, expect } from 'vitest';

describe('ContactsTableView', () => {
  it('inicializa y destruye DataTable', async () => {
    document.body.innerHTML = '<table><thead><tr><th>A</th></tr></thead><tbody><tr><td>x</td></tr></tbody></table>';
    const { default: DataTable } = await import('datatables.net');
    const el = document.querySelector('table');
    const dt = new DataTable(el, {});
    expect(dt).toBeTruthy();
    dt.destroy();
  });
});
```

---

### Resumen

- Usar Vite simplifica el flujo de desarrollo (HMR, sourcemaps) y la compilación a producción (minificación, splitting, hashing) sin Browserify/Gulp/BrowserSync.
- Configura `vite.config.js` con `server.proxy` para redirigir `/api` u otros prefijos hacia tu API local.
- Maneja CSS, imágenes y fuentes como assets del proyecto; usa `public/` para estáticos sin transformación o impórtalos desde módulos.
- Para imágenes, puedes integrar `vite-plugin-imagemin` o usar optimización en CI.

En el próximo capítulo, veremos cómo probar las aplicaciones Backbone en este contexto moderno de módulos ES y bundling con Vite.
