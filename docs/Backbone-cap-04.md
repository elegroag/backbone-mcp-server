## Capítulo 4. Código Modular

A medida que el código de su proyecto crece, la cantidad de scripts en el proyecto será cada vez mayor, lo que aumentará la complejidad de la carga de scripts. La forma clásica de cargar archivos JavaScript es escribir <script>etiquetas para cada script que tenga, pero debe hacerlo en el orden correcto; Si no lo hace, su código podría dejar de funcionar. Esa no es una forma eficiente para proyectos de tamaño mediano.

¿Qué pasa si olvidas el orden de carga? ¿Qué pasa si realizas una refactorización en el código y cambia el orden del script? Será complicado solucionarlo y realizar un seguimiento de todo el código y sus dependencias.
Este problema se ha abordado de diferentes maneras. Una es crear una sintaxis de módulo para crear, cargar y declarar explícitamente las dependencias de los módulos; la sintaxis se llama AMD ( Definición de módulo asíncrono ). Los módulos AMD definen una lista de dependencias del módulo y el código dentro del módulo se ejecutará solo después de que las dependencias estén completamente cargadas.
Las dependencias se cargan de forma asincrónica; eso significa que no necesita cargar todos los scripts en la página HTML a través de <script> etiquetas. Los módulos AMD son mejores que JavaScript simple porque definen dependencias explícitamente y se pueden cargar automáticamente.

Aunque los módulos AMD son mejores que <script>las etiquetas, trabajar con módulos AMD puede ser complicado cuando llegan las pruebas unitarias porque es necesario conocer las complejidades de cómo la biblioteca carga los módulos; Cuando desea realizar pruebas unitarias, necesita aislar las piezas de código bajo prueba, pero es difícil hacerlo en RequireJS, e incluso si lo hace, el resultado puede tener errores.

Recientemente llegó otro cargador de módulos y administrador de dependencias; Vite parece ser el más popular en este momento. Sin embargo, no es el único; Hay muchas otras opciones potencialmente sólidas, como jspm y Steal.js.
En este libro, trabajaremos con Vite debido a su popularidad, por lo que puede encontrar mucha información y documentación al respecto en la Web; Otra buena razón es que se han construido muchos proyectos con él, lo que demuestra su madurez y que está listo para producción. Vite utiliza ES Modules para definir módulos y dependencias, de modo que si ya conoce Node puede ir directamente a la sección Vite.

### Módulos: CommonJS vs ES Modules (ESM)

Nota: Node usa históricamente CommonJS (`require`/`module.exports`), pero en el navegador trabajaremos con ES Modules (`import`/`export`) mediante Vite. Cuando veas ejemplos CommonJS, puedes traducirlos a su equivalente ESM.

En los últimos años, Node ha ido ganando popularidad en la industria del software; de hecho se está volviendo muy popular elección para el desarrollo backend en una pila de tecnología JavaScript completa. Si no conoce Node, puede considerarse como JavaScript utilizado en el servidor en lugar de un navegador.
Node utiliza la sintaxis del módulo CommonJS para sus módulos; un módulo CommonJS es un archivo que exporta un valor único para usarlo en otros módulos. Es útil utilizar CommonJS porque proporciona una forma limpia de administrar módulos y dependencias de JavaScript.

Para admitir CommonJS, Node utiliza el require() función. Con require()puedes cargar archivos JavaScript sin la necesidad de usar <script>etiquetas, en lugar de llamar require() con el nombre del módulo/dependencia que necesitas y asignarlo a una variable.
Para ilustrar cómo funcionan los módulos CommonJS, escribamos un módulo Node y veamos cómo usar la require() función. El siguiente código muestra un módulo simple que expone un objeto simple con el método sayHello():

```js
const hello = {
	sayHello(name) {
		name = name || 'world';
		console.log('hello', name);
	},
};
module.exports = hello;
```

Este script se puede colocar en un archivo llamado hello.js, por ejemplo. El módulo hello se puede cargar desde otro módulo llamando a la require()función, como se muestra en el siguiente código:

```js
var hello = require('./hello');
hello.sayHello('world');
// prints "hello world"
```

Cuando requerimos un script con la require()función que no necesitamos agregar la extensión .js, Node lo hará por nosotros automáticamente. Tenga en cuenta que, si agrega la extensión al nombre del script, Node agregará la extensión de todos modos y obtendrá un error porque el hello.js.js archivo no existe.

Esa es la forma en que puedes definir módulos CommonJS para tus proyectos: simplemente exportamos la variable que queremos exponer al exterior del módulo y module.exports luego cargamos el módulo donde sea necesario con require().
Los módulos de CommonJS son singletons, lo que significa que cada vez que cargues un módulo obtendrás el mismo instancia del objeto. Node almacenará en caché el valor devuelto cuando se llame por primera vez y lo reutilizará para las próximas llamadas.

### NPM y paquete.json

Con Vite, podemos usar ES Modules nativos en el navegador y también consumir paquetes de npm. Vite resuelve y optimiza las dependencias, de modo que no necesitas definir require() en el navegador.
Con Vite y npm puedes instalar y definir dependencias para tus proyectos usando package.json y scripts de desarrollo/compilación.

El package.json archivo en un proyecto de Node es un archivo JSON que se utiliza para definir, instalar y administrar la versión de las bibliotecas de las que depende su proyecto. Un package.json archivo puede contener muchas opciones de configuración; Puede ver la documentación completa en el sitio web de Node en https://docs.npmjs.com/ . A continuación se muestra una lista de los valores principales.

Name - El nombre del proyecto sin espacios
Description - Un corto descripción del proyecto
Version – Un número de versión para el proyecto, normalmente comenzando con 0.0.1
Dependencies - Una lista de bibliotecas con el número de versión del que depende el proyecto
devDependencies - Igual que dependencias, pero esta lista se utiliza sólo para entornos de desarrollo, útil para poner bibliotecas a prueba, por ejemplo
licence – Un nombre de licencia para el código del proyecto

Podemos comenzar con un package.json archivo muy simple que contenga solo algunos campos básicos y luego podemos ampliarlo según sea necesario:

```json
{
	"name": "backbone-contacts ",
	"version": "0.0.1",
	"description": "Example code for the book Mastering Backbone.js",
	"author": "Abiee Alejandro <abiee.alejandro@gmail.com>",
	"license": "ISC",
	"dependencies": {},
	"devDependencies": {}
}
```

Como puede ver, todavía no tenemos ninguna dependencia. Podemos instalar nuestra primera dependencia con npm:

```bash
$ npm install --save underscore jquery backbone bootstrap
```

Este comando instalará las dependencias básicas con las que trabajar backbone; la bandera de guardar actualizará automáticamente el package.json archivo, agregando la biblioteca nombres y sus versiones actuales:

```json
{
	"dependencies": {
		"backbone": "^1.2.1",
		"bootstrap": "^3.3.5",
		"jquery": "^2.1.4",
		"underscore": "^1.8.3"
	}
}
```

El formato de la versión de la biblioteca sigue el semver estándar; Puedes ver más sobre este formato en el semver sitio web oficial.
Una ventaja de usar el package.json archivo en tu proyecto es que, la próxima vez que quieras instalar las dependencias, no necesitas recordar las bibliotecas y sus versiones; simplemente puede presionar Instalar sin ningún argumento y Node leerá el package.json archivo y realizará las instalaciones por usted:

```bash
$ npm install
```

Con npm puede instalar paquetes de desarrollo como la biblioteca de pruebas mocha, pero en lugar de usar el uso de la bandera de guardar save-dev:

```bash
$ npm install --save-dev mocha
```

Ahora que sabes cómo instalar dependencias y guardarlas en el package.json archivo, podemos comenzar usando Vite en la aplicación Contactos.

Navegar

Con Vite podemos usar ES Modules y paquetes de npm directamente en el navegador. Esto significa que puedes construir tus proyectos con el poder del administrador de paquetes npm y la sintaxis de módulos moderna expuesta en las secciones anteriores. Vite toma tu código fuente, resuelve el grafo de dependencias y lo sirve/compila para el entorno del navegador.
Un módulo muy simple que expone un objeto con un método que imprime un mensaje de saludo se puede escribir como un módulo de Nodo:

```js
// hello.js
export default {
	sayHello(name) {
		name = name || 'world';
		console.log('hello', name);
	},
};
```

Este sencillo fragmento de código se puede cargar desde otro script como se muestra a continuación:

```js
// main.js
import hello from './hello';
hello.sayHello(); // hello world
hello.sayHello('abiee'); // hello abiee
```

Este código funciona perfectamente con Node. Puedes ejecutarlo de la siguiente manera:

```bash
$ node main.js
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

### Configuración de Vite para proyectos modulares (ES Modules, ES2024)

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
async startApp() {
  const { default: App } = await import('../../app');
  const { default: ContactsApp } = await import('./app');
  return App.startSubApplication(ContactsApp);
}
```

Con esta configuración tendrás:

- Servidor de desarrollo con HMR (`npm run dev`).
- Build optimizado moderno (`npm run build`) adecuado para ES Modules/ES2024 mediante `target: 'esnext'`.
- Manejo simple de plantillas con `?raw` y `_.template`.
- Integración de Backbone con jQuery y Underscore sin depender de globals implícitos.

#### Resumen

En este capítulo, hemos aprendido qué es Vite y cómo puede organizar sus proyectos en módulos de Node para administrar su código y dependencias de una manera más limpia. Para que el proyecto Contactos fuera compatible con npm, tuvimos que modificar el código del proyecto; sin embargo, los cambios son mínimos.

También existen otras alternativas a Vite; Es bueno trabajar con require.js y la definición del módulo AMD. Sin embargo, probar con require.js puede resultar muy difícil; No recomiendo su uso require.js si desea probar módulos aislados (pruebas unitarias).
Webpack es otra opción popular para agrupar y organizar su base de código. Su objetivo principal es trabajar con dependencias frontend; Puede cargar módulos CommonJS y módulos AMD. Sin embargo, el paquete web es más complicado de configurar y administrar.
Vite es la opción más popular para agrupar proyectos de JavaScript y es más fácil de configurar y mantener que webpack; Es útil utilizar las mismas herramientas que utiliza Node para gestionar sus dependencias y hace un gran trabajo.

En el próximo capítulo, exploraremos cómo manejar archivos en un proyecto Backbone; El manejo de archivos a través de una API RESTful es un problema común, por lo que descubriremos cuáles son los patrones y estrategias comunes.
En el Capítulo 7, exploraremos cómo crear aplicaciones con herramientas de automatización; en lugar de ejecutar manualmente el comando Vite cada vez que cambiemos el código, crearemos los scripts necesarios que lo harán por nosotros.
