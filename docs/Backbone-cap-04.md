# Capítulo 4. Código Modular

A medida que el código de su proyecto crece, la cantidad de scripts en el proyecto será cada vez mayor, lo que aumentará la complejidad de la carga de scripts. La forma clásica de cargar archivos JavaScript es escribir etiquetas `<script>` para cada script que tenga, pero debe hacerlo en el orden correcto. Si no lo hace, su código podría dejar de funcionar. Esa no es una forma eficiente para proyectos de tamaño mediano.

¿Qué pasa si olvidas el orden de carga? ¿Qué pasa si realizas una refactorización en el código y cambia el orden del script? Será complicado solucionarlo y realizar un seguimiento de todo el código y sus dependencias.

Este problema se ha abordado de diferentes maneras. Una es crear una sintaxis de módulo para crear, cargar y declarar explícitamente las dependencias de los módulos; la sintaxis se llama AMD (Definición de módulo asíncrono). Los módulos AMD definen una lista de dependencias del módulo y el código dentro del módulo se ejecutará solo después de que las dependencias estén completamente cargadas.

Las dependencias se cargan de forma asincrónica; eso significa que no necesita cargar todos los scripts en la página HTML a través de etiquetas `<script>`. Los módulos AMD son mejores que JavaScript simple porque definen dependencias explícitamente y se pueden cargar automáticamente.

Aunque los módulos AMD son mejores que las etiquetas `<script>`, trabajar con módulos AMD puede ser complicado cuando llegan las pruebas unitarias porque es necesario conocer las complejidades de cómo la biblioteca carga los módulos. Cuando desea realizar pruebas unitarias, necesita aislar las piezas de código bajo prueba, pero es difícil hacerlo en RequireJS, e incluso si lo hace, el resultado puede tener errores.

Recientemente llegó otro cargador de módulos y administrador de dependencias; Vite parece ser el más popular en este momento. Sin embargo, no es el único; hay muchas otras opciones potencialmente sólidas, como jspm y Steal.js.

En este libro, trabajaremos con Vite debido a su popularidad, por lo que puede encontrar mucha información y documentación al respecto en la Web. Otra buena razón es que se han construido muchos proyectos con él, lo que demuestra su madurez y que está listo para producción. Vite utiliza ES Modules para definir módulos y dependencias, de modo que si ya conoce Node puede ir directamente a la sección Vite.

## Módulos: CommonJS vs ES Modules (ESM)

**Nota:** Node usa históricamente CommonJS (`require`/`module.exports`), pero en el navegador trabajaremos con ES Modules (`import`/`export`) mediante Vite. Cuando veas ejemplos CommonJS, puedes traducirlos a su equivalente ESM.

En los últimos años, Node ha ido ganando popularidad en la industria del software; de hecho, se está volviendo una elección muy popular para el desarrollo backend en una pila de tecnología JavaScript completa. Si no conoce Node, puede considerarse como JavaScript utilizado en el servidor en lugar de un navegador.

Node utiliza la sintaxis del módulo CommonJS para sus módulos; un módulo CommonJS es un archivo que exporta un valor único para usarlo en otros módulos. Es útil utilizar CommonJS porque proporciona una forma limpia de administrar módulos y dependencias de JavaScript.

Para admitir CommonJS, Node utiliza la función `require()`. Con `require()` puedes cargar archivos JavaScript sin la necesidad de usar etiquetas `<script>`. Simplemente llamas a `require()` con la ruta del módulo/dependencia que necesitas y asignas el resultado a una variable.

Para ilustrar cómo funcionan los módulos CommonJS, escribamos un módulo Node y veamos cómo usar la función `require()`. El siguiente código muestra un módulo simple que expone un objeto con el método `sayHello()`:

```js
// hello.js
const hello = {
  sayHello(name) {
    name = name || 'world';
    console.log('hello', name);
    return 'hello ' + name;
  }
};

module.exports = hello;
```

Para usar el módulo anterior, puedes cargarlo usando la función `require()`, como se muestra en el siguiente código:

```js
const hello = require('./hello');
hello.sayHello('Marionette'); // 'hello Marionette'
```

En el ejemplo anterior, la función `require()` carga el módulo `hello.js` y devuelve el valor que se exporta en el módulo. Una vez que se carga el módulo, puedes llamar a los métodos expuestos por el módulo.

## Módulos ES (ESM)

ES Modules (también conocidos como módulos ECMAScript o módulos ES) es la sintaxis de módulos nativa de JavaScript, definida en la especificación ECMAScript 2015 (ES6). A diferencia de CommonJS, que es específico de Node.js, los módulos ES son estándar en JavaScript y funcionan tanto en navegadores como en entornos Node.js modernos.

### Exportación en ESM

```js
// hello.js
const hello = {
  sayHello(name = 'world') {
    console.log('hello', name);
    return `hello ${name}`;
  }
};

export default hello;
```

### Importación en ESM

```js
import hello from './hello.js';
hello.sayHello('Marionette'); // 'hello Marionette'
```

## Diferencias clave entre CommonJS y ESM

1. **Sintaxis**:
   - CommonJS usa `require()` y `module.exports`
   - ESM usa `import`/`export`

2. **Carga**:
   - CommonJS: carga síncrona
   - ESM: carga asíncrona

3. **Ámbito**:
   - CommonJS: módulos cargados en tiempo de ejecución
   - ESM: módulos estáticos, analizados en tiempo de compilación

4. **Compatibilidad**:
   - CommonJS: nativo en Node.js
   - ESM: soporte nativo en navegadores modernos y Node.js 12+ con flag `"type": "module"` en package.json

## Uso con Vite

Vite está diseñado para trabajar con módulos ES de forma nativa. Cuando trabajas con Vite:

1. Usa `import`/`export` en tu código fuente
2. Vite maneja la transformación a formatos compatibles con el navegador
3. Soporta tanto módulos ES como CommonJS (aunque se prefiere ESM)

## Migración de CommonJS a ESM

Si estás migrando de CommonJS a ESM, estos son los cambios principales:

1. Reemplazar `require()` con `import`
2. Reemplazar `module.exports` con `export`
3. Actualizar la extensión de archivos a `.mjs` o configurar `"type": "module"` en package.json
4. Actualizar referencias a módulos para incluir la extensión (`.js` en navegadores, `.js` o `.mjs` en Node)

## Conclusión

Aunque este libro se centra en Vite y ESM, es útil entender CommonJS ya que muchos paquetes de Node.js aún lo utilizan. Vite maneja automáticamente la interoperabilidad entre ambos sistemas de módulos, lo que te permite usar paquetes de npm sin problemas.

## NPM y package.json

Con Vite, podemos usar ES Modules nativos en el navegador y también consumir paquetes de npm. Vite resuelve y optimiza las dependencias, de modo que no necesitas definir `require()` en el navegador.

Con Vite y npm puedes instalar y definir dependencias para tus proyectos usando `package.json` y scripts de desarrollo/compilación.

El archivo `package.json` en un proyecto de Node es un archivo JSON que se utiliza para definir, instalar y administrar la versión de las bibliotecas de las que depende tu proyecto. Un archivo `package.json` puede contener muchas opciones de configuración; puedes ver la documentación completa en el [sitio web de npm](https://docs.npmjs.com/).

### Campos principales de package.json

- **name**: El nombre del proyecto (sin espacios, en minúsculas)
- **description**: Una descripción corta del proyecto
- **version**: Número de versión (sigue [SemVer](https://semver.org/), por ejemplo, 0.0.1)
- **dependencies**: Lista de bibliotecas necesarias para producción
- **devDependencies**: Bibliotecas solo para desarrollo (pruebas, compilación, etc.)
- **scripts**: Comandos ejecutables con `npm run` o `yarn`
- **license**: Tipo de licencia del código (MIT, ISC, etc.)
- **type**: `"module"` para usar ESM por defecto

### Ejemplo básico de package.json

Aquí tienes un ejemplo básico de `package.json` para un proyecto Vite + Backbone:

```json
{
  "name": "backbone-contacts",
  "version": "0.0.1",
  "description": "Example code for the book Mastering Backbone.js",
  "author": "Abiee Alejandro <abiee.alejandro@gmail.com>",
  "license": "ISC",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "backbone": "^1.4.1",
    "jquery": "^3.6.0",
    "underscore": "^1.13.1"
  },
  "devDependencies": {
    "vite": "^4.0.0"
  }
}
```

### Instalación de dependencias

Para instalar las dependencias necesarias para un proyecto Backbone con Vite, ejecuta:

```bash
# Usando npm
npm install --save underscore jquery backbone

# O usando pnpm (más rápido y eficiente)
pnpm add underscore jquery backbone
```

Este comando instalará las dependencias básicas para trabajar con Backbone. La bandera `--save` actualizará automáticamente el archivo `package.json` con las bibliotecas y sus versiones correspondientes.

```json
{
  "dependencies": {
    "backbone": "^1.4.1",
    "jquery": "^3.6.0",
    "underscore": "^1.13.1"
  }
}
```

### Gestión de versiones

El formato de versión sigue el estándar [SemVer](https://semver.org/), donde:

- `^1.2.3` permite actualizaciones de parche y menores (1.2.3 a 1.9.9, pero no a 2.0.0)
- `~1.2.3` permite solo actualizaciones de parche (1.2.3 a 1.2.9)
- `1.2.3` versión exacta

### Instalación de dependencias del equipo

Una de las principales ventajas de usar `package.json` es que los miembros del equipo pueden instalar todas las dependencias con un solo comando:

```bash
# Instalar dependencias de producción y desarrollo
npm install

# O con pnpm (recomendado)
pnpm install
```

Esto es especialmente útil al:

- Clonar un repositorio por primera vez
- Actualizar dependencias después de un `git pull`
- Reconstruir el proyecto en un nuevo entorno

### Actualización de dependencias

Para actualizar las dependencias a sus últimas versiones compatibles:

```bash
# Verificar actualizaciones disponibles
npm outdated

# Actualizar dependencias
npm update

# O actualizar paquetes específicos
npm update paquete1 paquete2
```

### Dependencias de desarrollo

Para instalar paquetes que solo son necesarios durante el desarrollo (como herramientas de pruebas o construcción), usa la bandera `--save-dev`:

```bash
# Instalar Mocha para pruebas
npm install --save-dev mocha

# O con pnpm
pnpm add -D mocha
```

Estas dependencias se guardarán en la sección `devDependencies` de tu `package.json` y no se instalarán en producción.

## Configuración de Vite para Backbone

Con Vite, podemos usar ES Modules y paquetes de npm directamente en el navegador. Esto te permite aprovechar el ecosistema de paquetes de npm junto con la sintaxis moderna de módulos que hemos visto en secciones anteriores. Vite se encarga de:

1. Resolver el grafo de dependencias
2. Servir los módulos en desarrollo
3. Compilar y optimizar para producción

### Ejemplo básico de módulo

Un módulo simple que expone un objeto con un método de saludo se vería así:

```js
// hello.js
export default {
  sayHello(name = 'world') {
    const message = `Hola, ${name}!`;
    console.log(message);
    return message;
  }
};
```

### Uso del módulo

Puedes importar y usar este módulo en otro archivo de la siguiente manera:

```js
// main.js
import hello from './hello.js';

// Usar el módulo
hello.sayHello('Mundo'); // Muestra: "Hola, Mundo!"
hello.sayHello();        // Usa el valor por defecto: "Hola, world!"
hello.sayHello('abiee'); // Muestra: "Hola, abiee!"
```

### Ejecutando el código

Para ejecutar este código en Node.js, necesitarás:

1. Asegurarte de que el archivo `package.json` tenga `"type": "module"`
2. Ejecutar el archivo principal con Node:

```bash
node main.js
```

### Configuración de Vite

Para usar este código en el navegador con Vite, sigue estos pasos:

1. **Instalar Vite** (si aún no lo has hecho):

   ```bash
   npm install --save-dev vite
   ```

2. **Crear archivo de entrada HTML**:

   Crea un archivo `index.html` en la raíz de tu proyecto:

   ```html
   <!DOCTYPE html>
   <html lang="es">
   <head>
     <meta charset="UTF-8">
     <title>Mi Aplicación Backbone</title>
   </head>
   <body>
     <script type="module" src="./main.js"></script>
   </body>
   </html>
   ```

3. **Iniciar el servidor de desarrollo**:

   ```bash
   npx vite
   ```

   Esto iniciará un servidor de desarrollo con recarga en caliente (HMR) en `http://localhost:5173`.

4. **Scripts recomendados en package.json**:

   Agrega estos scripts a tu `package.json` para facilitar los comandos comunes:

   ```json
   {
     "scripts": {
       "dev": "vite",
       "build": "vite build",
       "preview": "vite preview"
     }
   }
   ```

   Luego podrás usar:

   ```bash
   # Iniciar servidor de desarrollo
   npm run dev

   # Crear build de producción
   npm run build

   # Previsualizar build de producción localmente
   npm run preview
   ```

Sin embargo, este código no se ejecutará en el navegador porque la importación de módulos no está definida. Vite toma el código de entrada de tu proyecto y rastrea todas las dependencias para crear un único archivo con todos los scripts concatenados:

```bash
npm run dev      # servidor de desarrollo con HMR
npm run build    # build de producción (salida en dist/)
npm run preview  # servir build de producción
```

Dependencia de la aplicación

Cuando la aplicación se carga en el navegador, cargar manualmente todos los archivos JavaScript con etiquetas `<script>` exige un orden específico (cadena de dependencias). Con Vite evitamos mantener ese orden a mano usando un único entrypoint `type="module"` y dejando que Vite resuelva el grafo de dependencias.

```html
<script type="module" src="/src/main.js"></script>
```

El objeto de la aplicación es responsable de cargar todos los enrutadores de subaplicaciones y luego iniciar el módulo de historial:

```js
'use strict';

import _ from 'underscore';
import Backbone from 'backbone';
import BackboneValidation from 'backbone-validation';
import swal from 'sweetalert';
import noty from 'noty';
import Region from './common';

// Initialize all available routes
import './apps/contacts/router';

class App {
  start() {
    // The common place where sub-applications will be showed
    this.mainRegion = new Region({ el: '#main' });
    // Create a global router to enable sub-applications to
    // redirect to other URLs
    this.router = new DefaultRouter();
    Backbone.history.start();
  },
	// ...
}

// ...
export default App;
```

El siguiente paso es iniciar la aplicación llamando al start()método en el objeto App; esto se hace desde el index.html archivo:

```html
<html>
  <head>
    // ...
  </head>
  <body>
    // ...
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

Mientras volvemos a empaquetar la aplicación con Vite, es mejor crear un nuevo archivo en el punto de entrada principal:

```js
// main.js
import App from './app';
App.start();
```

Una vez que nuestra aplicación esté escrita como módulos de Nodo, podemos usar Vite para agrupar el código en un solo script:

```bash
$ mkdir –p .tmp/js
$ cd app/js
$ npm run build
```

Esto creará un archivo incluido con todas las dependencias del mismo. Para usar la versión incluida del código, tenemos que cambiar el index.htm archivo para cargarlo en lugar de cargar todos los archivos individuales:

```html
<html>
  <head>
    // ...
  </head>
  <body>
    // ...
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

Eso debería ser suficiente; sin embargo, la aplicación no se inicia porque tenemos un problema de dependencia cíclica.

Resolver la dependencia cíclica

Tener dos módulos que dependen uno del otro es llamada dependencia cíclica . En nuestros contactos aplicación, la aplicación de infraestructura depende de los enrutadores de subaplicaciones, y los enrutadores dependen de la infraestructura de aplicaciones para cargar las fachadas y los controladores de subaplicaciones. La

No es posible ejecute la aplicación correctamente debido a la dependencia cíclica. Esto es lo que sucede en detalle.
La aplicación el módulo se ejecuta
La aplicación requiere ContactsRouter:

```js
import ContactsRouter from './apps/contacts/router';
```

ContactsRouter requiere el módulo de aplicación pero el módulo de aplicación aún no se ha exportado:

```js
import App from '../../app'; // returns undefined
```

ContactsRouter recibe un undefined valor para la variable de la aplicación
El módulo de la aplicación continúa la ejecución y finalmente expone el valor de la aplicación:

```js
class App {
  // ...
}

export default App;
```

ContactsRouter coincide con una ruta, pero como el valor de la aplicación no está definido, genera un error:

```js
startApp() {
  // App = undefined
  return App.startSubApplication(ContactsApp);
}
```

Deberíamos romper el ciclo de alguna manera. Una forma sencilla de hacerlo es solicitar el módulo de la aplicación después de exportarlo. En lugar de requerir el App módulo desde ContactsRouter la parte superior del archivo, podemos hacerlo sólo cuando sea necesario:

```js
// apps/contacts/router.js
class ContactsRouter extends Backbone.Router {
  // ...
  async startApp() {
    const { default: App } = await import('../../app');
    const { default: ContactsApp } = await import('./app');
    return App.startSubApplication(ContactsApp);
  }
}
```

Este es un simple pero forma eficaz de romper una dependencia cíclica. Ahora puede volver a empaquetar la aplicación y ejecutarla nuevamente. Debería de funcionar:

```bash
$ mkdir –p .tmp/js
$ cd app/js
$ npm run build
```

Plantillas modularizadoras

Hasta ahora, las plantillas se declaraban como etiquetas de script en el index.html archivo. Si bien este es un buen enfoque para proyectos pequeños, no es una buena idea colocar todas las plantillas directamente en el archivo HTML.
Con Vite, puedes extraer todos tus archivos de plantilla en archivos individuales, con la ventaja de la modularización y un index.html archivo más limpio. Otro beneficio de modularizar templates es que puedes compilar las plantillas en tiempo de ejecución con Underscore o precompilarlas si lo prefieres.
Con Vite, puedes modularizar casi cualquier formato de plantilla: jade, handlebars, underscore, etc. Para el caso de Underscore, la opción más sencilla es importar el archivo como texto con el sufijo `?raw` y compilarlo con `_.template()` en la vista, sin plugins adicionales.

No necesitas instalar transformadores como jstify para este flujo. Basta con importar el `.tpl` como texto y compilarlo:

```js
// apps/contacts/views/contactListLayout.js
import { Layout } from '../../../common';
import _ from 'underscore';
import tpl from '../templates/contactListLayout.tpl?raw';

export default class ContactListLayout extends Layout {
  constructor(options) {
    super(options);
    this.template = _.template(tpl);
    this.regions = {
      actions: '.actions-bar-container',
      list: '.list-container',
    };
  }

  get className() {
    return 'row page-container';
  }
}
```

Ahora `contactListLayout.tpl` contiene el texto de la plantilla de diseño para la lista de contactos y lo convertimos a función con `_.template`. Dado que las vistas comunes admiten tanto selectores CSS como funciones de plantilla compiladas, funciona correctamente.

### Configuración de Vite para proyectos modulares (ES Modules, ESNext)

A continuación se muestra una configuración mínima y práctica de Vite para un proyecto Backbone modular basado en ES Modules (EMAScript 2024) con jQuery y Underscore.

- **Scripts en `package.json`**

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

- **`vite.config.js`** (puedes usar `.ts` si prefieres TypeScript)

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
    // Pre-empaca dependencias tradicionales de Backbone
    include: ['backbone', 'underscore', 'jquery', 'backbone-validation'],
  },
  build: {
    // Mantener JS moderno (apto para navegadores modernos)
    target: 'esnext',
    sourcemap: true,
    outDir: 'dist',
  },
  server: {
    port: 5173,
    open: false,
  },
});
```

- **`index.html`** (entrypoint único)

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

- **`src/vendor/backbone-setup.js`** (adaptación para Backbone/jQuery/Underscore)

```js
import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import 'backbone-validation';

// Integrar jQuery en Backbone y exponer globales si hay código legado
Backbone.$ = $;
window.$ = $;
window.jQuery = $;
window._ = _;

export { Backbone, $, _ };
```

- **`src/main.js`** (punto de entrada de la app)

```js
import './vendor/backbone-setup';
import App from './app';

App.start();
```

- **Plantillas Underscore** (sin plugins extra)

Con Vite puedes importar texto de plantillas y compilarlo en tiempo de ejecución:

```js
import _ from 'underscore';
import tpl from './templates/view.tpl?raw';

const template = _.template(tpl);
export default class MyView extends Backbone.View {
  // ... usar this.template = template;
}
```

- **Dependencias cíclicas**

Si aparece una dependencia cíclica (por ejemplo entre `App` y un `Router`), usa importación dinámica para romper el ciclo:

```js
class MyRouter extends Backbone.Router {
  //..

  async startApp() {
    const { default: App } = await import('../../app');
    const { default: ContactsApp } = await import('./app');
    return App.startSubApplication(ContactsApp);
  }
  //..
}
```

Con esta configuración tendrás:

- Servidor de desarrollo con HMR (`npm run dev`).
- Build optimizado moderno (`npm run build`) adecuado para ES Modules/ESNext mediante `target: 'esnext'`.
- Manejo simple de plantillas con `?raw` y `_.template`.
- Integración de Backbone con jQuery y Underscore sin depender de globals implícitos.

### Routing avanzado (carga perezosa, query params, subaplicaciones)

- **Carga perezosa de módulos**: usa `import()` dentro de handlers para dividir el bundle y romper ciclos.

```js
// src/apps/contacts/router.js
import Backbone from 'backbone';

export class ContactsRouter extends Backbone.Router {
  get routes() {
    return {
      'contacts': 'list',
      'contacts/new': 'create',
      'contacts/:id': 'show',
    };
  }
  async list() {
    const { ContactListApp } = await import('./list/app');
    return new ContactListApp().start();
  }
  async create() {
    const { ContactCreateApp } = await import('./create/app');
    return new ContactCreateApp().start();
  }
  async show(id) {
    const { ContactShowApp } = await import('./show/app');
    return new ContactShowApp({ id }).start();
  }
}
```

- **Query params**: lee/escribe parámetros para filtros/paginación con `URLSearchParams` y `navigate`.

```js
function getQuery() {
  const frag = window.location.hash || '';
  const idx = frag.indexOf('?');
  const qs = idx >= 0 ? frag.slice(idx + 1) : '';
  return new URLSearchParams(qs);
}

function setQuery(params) {
  const base = (window.location.hash || '').split('?')[0];
  const qs = params.toString();
  Backbone.history.navigate(`${base}${qs ? '?' + qs : ''}`, { replace: true });
}
```

- **Subaplicaciones**: cada ruta arranca una app con su propio `Layout` y regiones, montada en `#main` o región equivalente.

### Paginación y filtros en `CollectionView`

```js
// src/ui/modules/contacts/list/app.js
import Backbone from 'backbone';
import _ from 'underscore';

export class ContactListApp {
  constructor() {
    this.state = new Backbone.Model({ page: 1, size: 20, q: '' });
    this.collection = new (Backbone.Collection.extend({ url: '/api/contacts' }))();
  }
  start() {
    // Sincronizar estado -> URL
    this.state.on('change', _.debounce(() => {
      const p = new URLSearchParams(this.state.toJSON());
      const base = 'contacts';
      Backbone.history.navigate(`#${base}?${p.toString()}`, { replace: true });
      // Fetch con params
      this.collection.fetch({ reset: true, data: this.state.toJSON() });
    }, 150));

    // Inicial desde URL
    const params = new URLSearchParams((window.location.hash.split('?')[1] || ''));
    const init = Object.fromEntries(params.entries());
    this.state.set({ ...this.state.attributes, ...init }, { silent: true });
    this.state.trigger('change');
  }
}
```

En UI, los inputs de búsqueda actualizan `state.q` con debounce y los controles de paginación cambian `state.page`.

### Caché ligera de colecciones (TTL + invalidación)

```js
// src/core/cache.js
class CacheStore {
  constructor(ttlMs = 30000) { this.ttl = ttlMs; this.map = new Map(); }
  key(url, params) { return `${url}?${new URLSearchParams(params || {}).toString()}`; }
  get(url, params) {
    const k = this.key(url, params), v = this.map.get(k);
    if (!v) return null; if (Date.now() > v.exp) { this.map.delete(k); return null; }
    return v.data;
  }
  set(url, params, data) { this.map.set(this.key(url, params), { data, exp: Date.now() + this.ttl }); }
  invalidate(prefix) { [...this.map.keys()].forEach(k => { if (k.startsWith(prefix)) this.map.delete(k); }); }
}
export const cache = new CacheStore(15000);

// Decorador para fetch de colección
export async function fetchWithCache(col, params) {
  const cached = cache.get(col.url, params);
  if (cached) { col.reset(cached); return col; }
  await col.fetch({ reset: true, data: params });
  cache.set(col.url, params, col.toJSON());
  return col;
}
```

Inválida caché tras mutaciones (`create/save/destroy`) con `cache.invalidate('/api/contacts')`.

### Code-splitting con `import.meta.glob`

```js
// src/apps/routes.js
const modules = import.meta.glob('./**/app.js'); // mapea rutas -> módulos

export async function startApp(path, props) {
  const mod = modules[`./${path}/app.js`];
  if (!mod) throw new Error('Ruta no encontrada');
  const { default: App } = await mod();
  return new App(props).start();
}
```

Puedes pre-cargar vistas críticas con `rel=prefetch` en `index.html` o cargarlas al pasar el mouse usando `requestIdleCallback`.

### Pruebas de navegación y paginación (Vitest + jsdom)

```js
import { describe, it, expect, vi } from 'vitest';
import Backbone from 'backbone';

describe('router + paginación', () => {
  it('actualiza URL y hace fetch con params', async () => {
    const fetchSpy = vi.spyOn(Backbone.Collection.prototype, 'fetch').mockResolvedValue();
    const app = new (class { /* usa ContactListApp de arriba */ })();
    app.collection = new Backbone.Collection();
    app.state = new Backbone.Model({ page: 1, size: 20, q: '' });
    app.start = eval('(' + (function start(){
      const _ = { debounce: (fn)=>fn };
      this.state.on('change', () => {
        const p = new URLSearchParams(this.state.toJSON());
        Backbone.history.navigate(`#contacts?${p.toString()}`, { replace: true });
        this.collection.fetch({ reset: true, data: this.state.toJSON() });
      });
      this.state.trigger('change');
    }).toString() + ')');
    app.start();
    expect(fetchSpy).toHaveBeenCalledWith({ reset: true, data: { page: 1, size: 20, q: '' } });
    fetchSpy.mockRestore();
  });
});
```

#### Resumen

En este capítulo, hemos aprendido qué es Vite y cómo puede organizar sus proyectos en módulos de Node para administrar su código y dependencias de una manera más limpia. Para que el proyecto Contactos fuera compatible con npm, tuvimos que modificar el código del proyecto; sin embargo, los cambios son mínimos.

También existen otras alternativas a Vite; Es bueno trabajar con require.js y la definición del módulo AMD. Sin embargo, probar con require.js puede resultar muy difícil; No recomiendo su uso require.js si desea probar módulos aislados (pruebas unitarias).
Webpack es otra opción popular para agrupar y organizar su base de código. Su objetivo principal es trabajar con dependencias frontend; Puede cargar módulos CommonJS y módulos AMD. Sin embargo, el paquete web es más complicado de configurar y administrar.
Vite es la opción más popular para agrupar proyectos de JavaScript y es más fácil de configurar y mantener que webpack; Es útil utilizar las mismas herramientas que utiliza Node para gestionar sus dependencias y hace un gran trabajo.

En el próximo capítulo, exploraremos cómo manejar archivos en un proyecto Backbone; El manejo de archivos a través de una API RESTful es un problema común, por lo que descubriremos cuáles son los patrones y estrategias comunes.
En el Capítulo 7, exploraremos cómo crear aplicaciones con herramientas de automatización; en lugar de ejecutar manualmente el comando Vite cada vez que cambiemos el código, crearemos los scripts necesarios que lo harán por nosotros.
