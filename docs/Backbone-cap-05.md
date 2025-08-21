## Capítulo 5. Manejo de archivos

Cuando crea una aplicación Backbone, consumirá recursos de un servicio web RESTful; sin embargo, la mayoría de los servicios RESTful utilizan el formato JSON para codificar información, pero JSON no es adecuado para enviar y recibir archivos. ¿Cómo podemos enviar archivos a un servidor RESTful?
Si está desarrollando una aplicación que no requiere mucho JavaScript, puede enviar archivos a través de un formulario HTML, pero en aplicaciones de una sola página (SPA) esta no es la mejor manera de hacerlo. Otro problema es que Backbone no proporciona un mecanismo sencillo para enviar archivos porque no es compatible con la especificación RESTful.
Pero las aplicaciones web necesitan funcionar con archivos. Existen algunos enfoques para abordar este problema común. Por ejemplo, podría utilizar un formulario POST tradicional en recursos donde se pueden incluir archivos; sin embargo, esa no es una buena opción. En este capítulo aprenderá lo siguiente:

Manejar cargas de archivos desde un servidor Express
Adopte estrategias para enviar archivos a un servidor RESTful
Subir archivos
Crear un recurso que incluya un archivo

Comenzaremos agregando soporte para cargar archivos a un servidor Express porque es importante saber cómo un servidor puede responder a las solicitudes de carga.

### Servidor Express

Para demostrar cómo enviar archivos a un servidor, en este capítulo trabajaremos con la última versión de Express (la última versión disponible al momento de escribir este artículo es Express 4.x). El servidor será responsable de almacenar los recursos REST y manejar la carga de archivos. Consulte el repositorio de GitHub de este libro para obtener la implementación del servidor de los capítulos anteriores.
Por ahora, el servidor actual puede crear, obtener, actualizar y eliminar recursos de contacto; necesitamos agregar un mecanismo para cargar una imagen de avatar para un contacto. Para simplificar, la aplicación no utiliza una base de datos para almacenar sus datos; en su lugar usa una tabla hash en memoria. Por ejemplo, el siguiente fragmento muestra cómo almacenar un contacto:

```javascript
// Insert a new contact JSON into the contacts array
function createContact(req, res) {
	const contact = extractContactData(req);
	// Assign a random id
	contact.id = makeId();
	contacts.push(contact);
	res.status(201).json(contact);
}
```

### Configuración con Vite: frontend + backend (Express)

En desarrollo, lo más práctico es que Vite sirva el frontend con HMR y reenvíe (proxy) las llamadas de API a Express. En producción, Vite genera `dist/` y Express sirve tanto los estáticos como la API.

- **Dependencias (dev)**:

   - `concurrently` y `nodemon` para levantar ambos servicios en desarrollo.
   - Instala: `pnpm add -D concurrently nodemon` (o npm/yarn equivalente).

- **vite.config.ts** (proxy a Express en desarrollo):

```ts
import { defineConfig } from 'vite';

export default defineConfig({
	server: {
		port: 5173,
		strictPort: true,
		proxy: {
			'/api': {
				target: 'http://localhost:3000',
				changeOrigin: true,
				secure: false,
			},
			'/avatar': {
				target: 'http://localhost:3000',
				changeOrigin: true,
				secure: false,
			},
		},
	},
});
```

- **Scripts de desarrollo/producción (package.json)**:

```json
{
	"scripts": {
		"dev": "concurrently -k \"vite\" \"nodemon --watch server --ext js,ts --exec node server/index.js\"",
		"build": "vite build",
		"preview": "NODE_ENV=production node server/index.js"
	}
}
```

- **Servidor Express** (ESM, sirve API y estáticos en producción):

```javascript
// server/index.js (ESM)
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { uploadAvatar } from './controller.js';

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// ... aquí van tus rutas /api y el endpoint de subida de avatar
app.post('/api/contacts/:contactId/avatar', upload.single('avatar'), uploadAvatar);

if (process.env.NODE_ENV === 'production') {
	const distPath = path.resolve(__dirname, '../dist');
	app.use(express.static(distPath));
	app.get('*', (_req, res) => {
		res.sendFile(path.join(distPath, 'index.html'));
	});
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Express API escuchando en http://localhost:${PORT}`));
```

- **Notas**:
   - Con el proxy de Vite no necesitas CORS en desarrollo; si decides no usar proxy, habilita CORS en Express.
   - Mantén las rutas de subida consistentes (`/api/...` y `/avatar`) para que el proxy funcione sin cambios en el código del cliente.
   - En producción, sirve `dist/` con Express para una app SPA y deja la API bajo `/api`.

#### Requisitos ESM en Node

Para ejecutar Express y tus módulos en formato ES Modules:

- En `package.json` añade:

```json
{
	"type": "module"
}
```

- Usa extensiones `.js` con `import/export`, o `.mjs` si no defines `type`.
- Requiere Node 18+ recomendado. Si usas variables globales de CommonJS (`__dirname`, `__filename`), recrea con `fileURLToPath` como en los ejemplos.

### Adjuntar un archivo a un recurso

Antes de que empecemos a recibir archivos en el servidor Express, necesitamos configurar una estrategia para ello. Todavía queremos utilizar los servicios RESTful, por lo que cambiar el formato de los datos de transmisión no es una opción.

Respetando el estándar RESTful (para obtener más información sobre el diseño REST para cargas de archivos, consulte http://bit.ly/1GXqPNY), podemos adjuntar un punto final de subrecurso debajo del recurso de destino para manejar las cargas, de modo que no perturbe el original. recurso. Sin embargo, este enfoque tiene una limitación: el recurso debe existir primero, lo que significa que no se puede crear un contacto y su foto de avatar al mismo tiempo.
Siguiendo este enfoque, el punto final para la carga del archivo de avatar se puede ubicar en:

http://example.com/api/contacts/10/avatar

Esto es porque esa es la única forma de cargar archivos utilizando el protocolo HTTP. Tenga en cuenta que en el punto final se incluye la identificación del contacto; de esta forma, una vez subido el archivo podremos asociar el archivo con el recurso. Aunque el punto final no acepta un JSON como entrada, puede devolver un JSON para informar sobre el proceso:

```json
{
	"success": true,
	"avatar": {
		"file": "something.jpg",
		"url": "http://example.com/avatar/something.jpg"
	}
}
```

En el resultado de este ejemplo, el servidor nos dice que podemos acceder al avatar a través de la URL http://example.com/avatar/something.jpg. Necesitamos modificar el recurso de contacto para incluir esta nueva información en él:

```json
{
	"name": "John Doe",
	"email": "john.doe@example.com",
	"avatar": {
		"file": "something.jpg",
		"url": "http://example.com/avatar/something.jpg"
	}
}
```

El recurso de contacto ahora incluye la información del avatar para que pueda usarse para mostrar el avatar donde sea necesario, por ejemplo, en la lista de contactos. Para mostrar la imagen del avatar, lo único que necesitas hacer es incluir la URL del avatar en una etiqueta img.

El servidor también debería poder servir estos archivos. En el flujo de trabajo más simple, puede colocar todas las imágenes de avatar en una ruta común y servir esa ruta como recursos regulares; la desventaja de este enfoque es que cualquiera puede ver los archivos si tiene el nombre del archivo.

### Subir la foto del avatar a los contactos

Empecemos por creando el punto final para cargar fotos de avatar (ESM + Express + multer):

```javascript
// server/index.js (fragmento)
import express from 'express';
import multer from 'multer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { uploadAvatar } from './controller.js';

const app = express();
const upload = multer();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.post('/api/contacts/:contactId/avatar', upload.single('avatar'), uploadAvatar);
app.use('/avatar', express.static(path.resolve(__dirname, 'avatar')));
```

Express no procesa archivos automáticamente; necesita un middleware que transforme la solicitud sin formato en una API más fácil de usar. Este middleware se llama multer; procesa multipart/form-data, guarda el archivo en una ruta temporal o crea un objeto de búfer y luego proporciona un objeto JSON con información de metadatos:

```javascript
// Avatar endpoints (complemento; asume imports y app inicializados arriba)
const upload = multer();
app.post('/api/contacts/:contactId/avatar', upload.single('avatar'), uploadAvatar);
app.use('/avatar', express.static(path.resolve(__dirname, 'avatar')));
```

Con la configuración predeterminada, guardará todos los archivos cargados en la ruta temporal de su sistema operativo, que se encuentra /tmp en los sistemas Unix; multer adjuntará un atributo file en el objeto req, que podemos inspeccionar para recuperar información sobre el archivo cargado:

```javascript
// server/controller.js (ESM)
import fs from 'node:fs';
// utilidades referenciadas (implementación del libro)
import {
	isValidImage,
	getExtension,
	generateFilename,
	generateFullPath,
	removeAvatar,
	generateURLForAvatar,
	AVATAR_PATH,
} from './utils.js';

export function uploadAvatar(req, res, next) {
	const contactId = req.params.contactId;
	let filename, fullpath;

	// Ensure that user has sent the file
	if (!req.file) {
		return res.status(400).json({ error: 'Please upload a file in the avatar field' });
	}

	// File should be in a valid format
	const metadata = req.file;
	if (!isValidImage(metadata.mimetype)) {
		res.status(400).json({ error: 'Invalid format, please use jpg, png or gif files' });
		return next();
	}

	// Get target contact from database
	const contact = contacts.find((c) => c.id === contactId);
	if (!contact) {
		res.status(404).json({ error: 'contact not found' });
		return next();
	}

	// Ensure that avatar path exists
	if (!fs.existsSync(AVATAR_PATH)) {
		fs.mkdirSync(AVATAR_PATH);
	}

	// Ensure unique filename to prevent name collisions
	const extension = getExtension(metadata.originalname);
	do {
		filename = generateFilename(25, extension);
		fullpath = generateFullPath(filename);
	} while (fs.existsSync(fullpath));

	// Remove previous avatar if any
	removeAvatar(contact);

	// Save the file in disk
	const wstream = fs.createWriteStream(fullpath);
	wstream.write(metadata.buffer);
	wstream.end();

	// Update contact by assigning the url of the uploaded file
	contact.avatar = {
		file: filename,
		url: generateURLForAvatar(filename),
	};

	res.json({ success: true, avatar: contact.avatar });
}
```

En los primeros pasos, validamos que el usuario haya subido un archivo válido y luego obtenemos el usuario objetivo de la base de datos y, si no existe, devolvemos un 404 error Http. El middleware multer almacena el archivo cargado en la memoria y puede procesarse antes de guardar el archivo en la ruta final; por ejemplo, tal vez queramos generar un archivo en miniatura o procesar la imagen para ahorrar espacio en el disco.

Nos aseguramos de que la ruta del avatar exista; si no es así, creamos el camino. En los siguientes pasos, generamos un nombre de archivo para asignarlo al archivo cargado para evitar colisiones de nombres de archivo; la función generateFilename() genera ese nombre de archivo y luego verifica si ya existe; si es así, generamos otro nombre de archivo y así sucesivamente.

Una vez que tenemos un nombre de archivo único para el archivo cargado, almacenamos el archivo desde el búfer en memoria a la ruta generada. Ahora que el archivo está en la ruta del avatar, podemos crear la URL donde podemos obtener la imagen desde el navegador y, finalmente, asignar la URL al campo avatar en el recurso de contacto.

### Mostrando el avatar

Ahora que podemos cargar imágenes y el recurso de contacto tiene la información sobre dónde se encuentra el avatar, podemos mostrar el avatar en nuestras vistas apuntando una etiqueta img a la propiedad avatar.url en el modelo Contact:

```javascript
<% if (avatar && avatar.url) { %>
<img src="<%= avatar.url %>" alt="Contact photo" />
<% } else { %>
<img src="https://via.placeholder.com/250" alt="Contact photo" />
<% } %>
```

Esto mostrará la imagen, si la hay; de lo contrario, mostrará una imagen predeterminada. Deberíamos modificar el modelo de Contacto para incluir un avatar predeterminado:

```javascript
// apps/contacts/models/contact.js
import Backbone from 'backbone';

export default class Contact extends Backbone.Model {
	// ...
	get defaults() {
		return {
			name: '',
			phone: '',
			email: '',
			address1: '',
			address2: '',
			facebook: '',
			twitter: '',
			google: '',
			github: '',
			avatar: null,
		};
	}
	// ...
}
```

Si no hay imagen de avatar se recupera del servidor, luego usamos una imagen nula. La siguiente captura de pantalla muestra cómo se ve cuando carga una imagen. Esto es suficiente para mostrar una imagen de avatar cuando sea necesario. Es muy fácil mostrar imágenes. En el resto del capítulo veremos cómo realizar la carga:

### Subir imágenes desde Backbone

Para permitirnos cargar archivos desde nuestra aplicación Backbone, debemos crear un archivo de entrada para poder mostrar un cuadro de diálogo Elegir archivo. Este se podría hacer en la ContactEditor subaplicación cambiando la ContactPreview clase para agregar esta funcionalidad. Así que cambiemos la plantilla actual y agreguemos la entrada:

```javascript
<div class="box thumbnail">
    <div class="photo">
        <% if (avatar && avatar.url) { %>
            <img src="<%= avatar.url %>" alt="Contact photo" />
        <% } else { %>
            <img src="https://via.placeholder.com/250" alt="Contact photo" />
        <% } %>
        <input id="avatar" name="avatar" type="file"
            style="display: none" />
    </div>
    <!-- ... -->
</div>
```

Tenga en cuenta que hemos creado un campo de archivo de entrada oculto; no queremos mostrar el campo de entrada, pero queremos que el control abra un cuadro de diálogo Seleccionar archivo. Como la entrada está oculta, cuando el usuario haga clic en la imagen actual, le mostraremos el selector de archivos:

```javascript
// apps/contacts/views/contactPreview.js
class ContactPreview extends ModelView {
	// ...
	get events() {
		return {
			'click img': 'showSelectFileDialog',
		};
	}
	showSelectFileDialog() {
		$('#avatar').trigger('click');
	}
	// ...
}
```

Cuando el usuario hace clic en la imagen, se activa un evento de clic en la entrada; esto abrirá el cuadro de diálogo Abrir archivo y permitirá al usuario seleccionar un archivo de su disco duro. Después de que el usuario selecciona el archivo, el navegador activa un change evento en la entrada del archivo que podemos usar para procesar la selección:

```javascript
// apps/contacts/views/contactPreview.js
class ContactPreview extends ModelView {
	// ...

	get events() {
		return {
			'click img': 'showSelectFileDialog',
			'change #avatar': 'fileSelected',
		};
	}

	// ...
}
```

El change evento llamará al fileSelected() método que es responsable de procesar el archivo seleccionado. Como puede suponer, success y error se llamarán devoluciones de llamada si el servidor acepta el archivo o si ocurre un error, respectivamente. Los archivos grandes se dividen y cargan en el servidor en trozos; la progress() devolución de llamada se llama cuando los fragmentos se reciben en el servidor. Con la información proporcionada en el progress() controlador, podemos actualizar una barra de progreso para mostrar el progreso al usuario:

```javascript
// apps/contacts/views/contactPreview.js
class ContactPreview extends ModelView {
	constructor(options) {
		super(options);
		this.template = template;

		this.model.on('change', this.render, this);

		if (options.controller) {
			this.listenTo(
				options.controller,
				'avatar:uploading:start',
				this.uploadingAvatarStart,
				this,
			);

			this.listenTo(options.controller, 'avatar:uploading:done', this.uploadingAvatarDone, this);

			this.listenTo(
				options.controller,
				'avatar:uploading:error',
				this.uploadingAvatarError,
				this,
			);
		}
	}

	uploadingAvatarStart() {
		this.originalAvatarMessage = this.$('span.info').html();
		this.$('span.notice').html('Uploading avatar...');
	}

	uploadingAvatarDone() {
		this.$('span.notice').html(this.originalAvatarMessage || '');
	}

	uploadingAvatarError() {
		this.$('span.notice').html("Can't upload image, try again later");
	}
}
```

Como los eventos son activados por el controlador, la vista se actualiza el mensaje que se muestra al usuario, para que el usuario pueda ver si se produce un error, o proporciona un mensaje de carga para mostrar lo que está haciendo la aplicación.

Deberíamos pasar la instancia del controlador a la vista en el momento de la creación:

```javascript
class ContactEditor {
	// ...

	showEditor(contact) {
		// ...
		const contactPreview = new ContactPreview({
			controller: this,
			model: contact,
		});
	}
}
```

### Subiendo un archivo con AJAX

El modelo Contact recibe el objeto blob, crea la dirección URL al endpoint avatar y realiza las llamadas apropiadas a los objetos de devolución de llamada:

```javascript
// apps/contacts/models/contact.js
class Contact extends Backbone.Model {
	// ...

	uploadAvatar(imageBlob, options = {}) {
		// Create a form object to emulate a multipart/form-data
		const formData = new FormData();
		formData.append('avatar', imageBlob);

		const ajaxOptions = {
			url: `/api/contacts/${this.get('id')}/avatar`,
			type: 'POST',
			data: formData,
			cache: false,
			contentType: false,
			processData: false,
		};

		// Attach callbacks if provided
		if (options.success) ajaxOptions.success = options.success;
		if (options.error) ajaxOptions.error = options.error;

		// Attach a progress handler only if defined
		if (options.progress) {
			ajaxOptions.xhr = function () {
				const xhr = $.ajaxSettings.xhr();
				if (xhr.upload) {
					// For handling the progress of the upload
					xhr.upload.addEventListener(
						'progress',
						(event) => {
							const length = event.total;
							const uploaded = event.loaded;
							const percent = uploaded / length;

							options.progress(length, uploaded, percent);
						},
						false,
					);
				}

				return xhr;
			};
		}

		$.ajax(ajaxOptions);
	}
	// ...
}
```

Vea cómo el modelo construye el punto final a partir de sus propios datos para que la vista esté desacoplada de cualquier conexión al servidor. Como multipart/form-data POST el navegador no lo administra de forma nativa, debemos crear un FormData objeto que represente una estructura de datos de formulario y agregar un avatar campo (el nombre del campo que espera el servidor).

El atributo clave en la llamada $.ajax() es processData, que está configurado en false; puedes leer lo siguiente en la documentación de jQuery:
De forma predeterminada, los datos pasados ​​a la opción de datos como un objeto (técnicamente, cualquier cosa que no sea una cadena) se procesarán y transformarán en una cadena de consulta, ajustándose al tipo de contenido predeterminado "application/x-www-form-urlencoded". Si desea enviar un DOMDocument u otros datos no procesados, configure esta opción en falso.

Si no establece este atributo en false o lo deja en el valor predeterminado, jQuery intentará transformar el formData objeto y el archivo no se enviará.

Si se establece un atributo de progreso en el options objeto, sobreescribimos la xhr() función original llamada por jQuery para obtener una XMLHttpRequest instancia de objeto; esto nos permite escuchar el progress evento desencadenado por el navegador mientras cargamos el archivo.

### Subir la imagen del avatar en el momento de la creación

Como hemos visto hasta ahora, para cargar y adjuntar un archivo a un recurso, ya debe existir. ¿Cómo podemos crear un recurso con un archivo adjunto? ¿Cómo podemos crear un contacto que incluya una imagen de avatar?

Para hacerlo, necesitaremos crear el recurso en dos pasos. En el primer paso, creamos el recurso en sí y luego, en un segundo paso, podemos cargar todos los archivos que queramos en ese recurso. Sí, no es posible hacer esto en una única conexión de servidor, al menos sin codificar los archivos que deseas enviar.

La gestión de errores. Como hemos visto anteriormente, ContactEditor desencadena varios eventos que la vista puede usar para mostrarle al usuario lo que está sucediendo.

Las vistas pueden ser dejado como está; solo debemos modificar el ContactEditor controlador cambiando el saveContact() comportamiento del método. Sin embargo, queremos mantener la función de cargar la imagen a medida que el usuario realiza la selección. Si el modelo de contacto es nuevo, esta función interrumpirá la aplicación porque no existe un punto final válido para cargar el avatar:

```javascript
class ContactEditor {
	// ...

	showEditor(contact) {
		// ...

		// When avatar is selected, we can save it immediately if the
		// contact already exists on the server, otherwise just
		// remember the file selected
		this.listenTo(contactPreview, 'avatar:selected', (blob) => {
			this.avatarSelected = blob;

			if (!contact.isNew()) {
				this.uploadAvatar(contact);
			}
		});
	}
}
```

Cuando se selecciona un avatar, en lugar de subir inmediatamente el archivo al servidor, comprobamos si el contacto es nuevo o no. Si el modelo no es nuevo, podemos realizar la carga llamando al uploadAvatar() método; de lo contrario, mantenemos una referencia al objeto blob en el avatarSelected atributo que uploadAvatar() utilizará el método cuando se llame.

El saveContact() método se encarga de orquestar el algoritmo descrito en la sección anterior:

```javascript
// apps/contacts/contactEditor.js
class ContactEditor {
	saveContact(contact) {
		const phonesData = this.phones.toJSON();
		const emailsData = this.emails.toJSON();

		contact.set({
			phones: phonesData,
			emails: emailsData,
		});

		if (!contact.isValid(true)) {
			return;
		}

		const wasNew = contact.isNew();

		// The avatar attribute is read-only
		if (contact.has('avatar')) {
			contact.unset('avatar');
		}

		function notifyAndRedirect() {
			// Redirect user to contact list after save
			App.notifySuccess('Contact saved');
			App.router.navigate('contacts', true);
		}

		contact.save(null, {
			success: () => {
				// If we are not creating an user it's done
				if (!wasNew) {
					notifyAndRedirect();
					return;
				}

				// On user creation send the avatar to the server too
				this.uploadAvatar(contact, {
					success: notifyAndRedirect,
				});
			},
			error() {
				// Show error message if something goes wrong
				App.notifyError('Something goes wrong');
			},
		});
	}
	// ...
}
```

Antes de llamar al método save() en el modelo Contact, es necesario guardar si el modelo es nuevo o no; si llamamos a este método después de guardar, el método isNew() devolverá false.

Si el modelo no era nuevo, entonces el controlador de eventos ya cargó todos los cambios en la imagen del avatar 'avatar:selected', por lo que no es necesario volver a cargar la imagen. Pero si la imagen fuera nueva, entonces deberíamos subir el avatar llamando al uploadAvatar() método; tenga en cuenta que el método acepta un options objeto para registrar devoluciones de llamada. Esto es necesario para proporcionar retroalimentación al usuario; cuando finaliza la carga, llama a la notifyAndRedirect() función para mostrar un mensaje de notificación y regresa a la lista de contactos.

Necesitaremos cambiar la implementación de uploadAvatar() para incluir las devoluciones de llamada descritas anteriormente y, en su lugar, recibir el blob tan pronto como use el avatarSelected atributo:

```javascript
// apps/contacts/contactEditor.js
uploadAvatar(contact, options) {
	// Tell to others that upload will start
	this.trigger('avatar:uploading:start');

	contact.uploadAvatar(this.avatarSelected, {
		progress: (length, uploaded, percent) => {
			// Tell to others that upload is in progress
			this.trigger('avatar:uploading:progress', length, uploaded, percent);
		},
		success: () => {
			// Tell to others that upload was done successfully
			this.trigger('avatar:uploading:done');
			if (options && typeof options.success === 'function') {
				options.success();
			}
		},
		error: (err) => {
			// Tell to others that upload was error
			this.trigger('avatar:uploading:error', err);
		},
	});
}
```

El método es básicamente el mismo; simplemente agregamos las options devoluciones de llamada y cambiamos la fuente del objeto blob.

### Codificando el archivo cargado

Otro enfoque para cargar archivos es codificar el archivo en base64. Cuando codifica un archivo binario base64, el resultado es una cadena que podemos usar como atributo en el objeto de solicitud.

Aunque puede resultar útil crear objetos con el archivo adjunto en el recurso o utilizarlo como otro recurso en el servidor, este no es un enfoque recomendado. Este enfoque tiene algunas limitaciones:

Si el servidor backend es un nodo, el hilo se bloqueará hasta que el servidor decodifique la base64 cadena. Esto dará lugar a una aplicación de bajo rendimiento.
No puede cargar grandes cantidades de datos.
Si el archivo es grande, la aplicación Backbone se congelará hasta que el archivo esté codificado en base64.

Si estás cargando cantidades muy pequeñas de datos y no tienes una gran cantidad de tráfico, puedes utilizar esta técnica; de lo contrario, te animo a que lo evites. En lugar de subir el archivo podemos codificarlo:

```javascript
class ContactEditor {
	// ...

	showEditor(contact) {
		// ...
		this.listenTo(contactPreview, 'avatar:selected', (blob) => {
			this.setAvatar(contact, blob);
		});
	}

	setAvatar(contact, blob) {
		const fileReader = new FileReader();

		fileReader.onload = (event) => {
			const parts = event.target.result.split(',');
			contact.set('avatarImage', parts[1]);
		};

		fileReader.readAsDataURL(blob);
	}
}
```

Por supuesto, la implementación del servidor debería poder decodificar avatarImage y almacenarlo como un archivo de imagen.

### Resumen

En este capítulo, hemos visto cómo cargar archivos al servidor; ésta no es la única forma de hacerlo, pero es el enfoque más amplio y flexible. Otro método posible es serializar la imagen en base64 en el navegador y luego configurar la cadena de salida como un atributo en el modelo; cuando se guarden los modelos, el archivo codificado base64 será parte de la carga útil.

Vimos cómo desacoplar la vista de la lógica empresarial. La vista solo debe procesar eventos DOM y activar eventos de nivel de lógica empresarial; entonces un controlador puede manejar objetos blob en lugar de nodos DOM de bajo nivel. Este enfoque nos ayudó a trasladar el procesamiento de carga de la vista al modelo, que es la forma ideal de hacerlo.

Finalmente, nos ocupamos del proceso de creación; no podemos crear un recurso y adjuntar archivos al mismo tiempo. Primero debemos crear el recurso y luego enviar todos los archivos al servidor según sea necesario.

En el siguiente capítulo, aprenderá cómo almacenar información directamente en el navegador. En lugar de utilizar un servidor RESTful, sería bueno ejecutar aplicaciones web independientes que no necesiten un servidor para ejecutarse.
