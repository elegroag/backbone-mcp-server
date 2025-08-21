# Capítulo 6. Almacenar datos en el navegador

Backbone fue diseñado principalmente para funcionar con servidores API RESTful; sin embargo, no siempre se desea almacenar los datos en un servidor para aplicaciones fuera de línea o interrumpir la carga de aplicaciones al almacenar datos de caché en el navegador.
Tenemos dos opciones para almacenar datos en el navegador del usuario: usar localStorage o la nueva API IndexedDB. Si bien localStorage tiene un amplio soporte en los principales navegadores, IndexedDB es la nueva especificación que aún no será compatible en un futuro próximo. Otra opción que está disponible actualmente; sin embargo, en estado obsoleto está Web SQL. Si está desarrollando aplicaciones web modernas, debe evitar el uso de Web SQL.
En este capítulo, aprenderá los siguientes temas:

Conceptos básicos del almacenamiento local
Conceptos básicos de IndexedDB
Usar localStorage en lugar de un servidor RESTful para almacenar información
Usando IndexedDB en lugar de un servidor RESTful para almacenar información

## El almacenamiento local

El localStorage es el almacén de datos del navegador más simple y compatible. En el momento de escribir este libro, es compatible con casi todos los principales navegadores. Como se muestra en la siguiente figura, el único navegador que no admite almacenamiento local es Opera Mini:

El almacenamiento local es una base de datos clave/valor simple que solo puede almacenar texto. En localStorage, tiene tres métodos principales para acceder a los datos: setItem(), getItem() y removeItem(). Con estas tres funciones, puedes administrar bastante bien los datos en la tienda.
La desventaja de localStorage es que no tiene tablas ni colecciones, por lo tanto, todos los datos están mezclados; Otro problema con localStorage es que está limitado a 5 Mb de información. Si sus requisitos de almacenamiento son mayores que eso, necesitará IndexedDB.

### Comenzando con almacenamiento local

Almacenar los datos en el almacén localStorage, debe llamar al setItem()método en el localStorage objeto global:

```js
localStorage.setItem('myKey', 'myValue');
localStorage.setItem('name', 'John Doe');
```

Eso es todo, esto almacenaría la información en el navegador. Podemos explorar el resultado de estas instrucciones en Google Chrome como se ve en la siguiente figura:

Los datos almacenados En localStorage está organizado por sitio, lo que significa que solo puede acceder a los datos almacenados en su sitio. En elhttp://localhost:4000) en el lado izquierdo. En el lado derecho, puede explorar los datos que hemos almacenado con el setItem()método para el sitio determinado.
Para recuperar la información de localStorage, debe utilizar el getItem()método:

```js
localStorage.getItem('myKey'); // myValue
localStorage.getItem('name'); // John Doe
localStorage.getItem('notExists'); // null
```

Para eliminar un artículo de la tienda, podemos utilizar el removeItem()método:

```js
localStorage.removeItem('name');
localStorage.getItem('name'); // null
```

Como se mencionó anteriormente, localStorage solo almacena cadenas. Sin embargo, queremos almacenar objetos, ¿cómo lo hacemos?

```js
var myObj = { name: 'John Doe', age: 26 };
localStorage.setItem('object', myObj);
localStorage.getItem('object'); // [Object object]
```

Ups... eso no es lo que esperábamos. localStorage convierte automáticamente el objeto en una cadena antes de almacenarlo. Puedes serializar objetos con la JSON.stringify() función para que localStorage reciba una cadena en lugar de un objeto:

```js
var myObj = { name: 'John Doe', age: 26 };
var serialized = JSON.stringify(myObj);

localStorage.setItem('object', serialized);
```

Para recuperar el objeto almacenado, puedes usar la JSON.parse() función inversa que convierte una cadena en un objeto:

```js
var data = localStorage.getItem('object');
var obj = JSON.parse(data);
```

Así es como puedes almacenar y recuperar objetos de localStorage. Necesitará codificar y decodificar objetos sobre la marcha. No se recomienda almacenar objetos grandes en localStorage debido al uso intensivo de funciones JSON; Cada vez que codifica o decodifica un objeto, el hilo de JavaScript bloqueará ese objeto.

### Backbone y almacenamiento local

Almacenar En los modelos backbone en localStorage, puede utilizar el ID atributo como clave y los datos serializados como valor. Sin embargo, recuerde que todos los datos en localStorage están mezclados y esta estrategia dará lugar a colisiones de identificadores.
Considera que tienes dos modelos diferentes (contactos y facturas) con el mismo ID; cuando almacena uno de ellos en el almacenamiento local, sobrescribirá el otro.
Otro problema con localStorage es que cuando desea recuperar datos de la tienda antes de obtener un artículo de la tienda, necesita saber qué clave tiene. Sin embargo, en localStorage, no tenemos idea de qué ID están actualmente en la tienda, por lo tanto, necesitamos una forma de realizar un seguimiento de las ID que están en la tienda en un momento determinado.
Para solucionar estos problemas, puede crear una clave conocida en la tienda como índice de los ID que están disponibles para una colección determinada. Vea cómo funciona a continuación:

```js
var data = localStorage.get('contacts'); // index name
var availableIds = data.split(',');
const contactList = [];

// Get all contacts
for (let i = 0; i < availableIds.length; i++) {
  let id = availableIds[i];
  let contact = JSON.parse(localStorage.getItem(id));
  contactList.push(contact);
}
//...
```

Para prevenir colisión entre colecciones de modelos con la misma ID, puede generar claves con prefijo para los elementos de la colección de modo que, en lugar de tener claves numéricas como 1, pueda usar claves como contacts-1:

```js
var data = localStorage.get('contacts'); // 1, 5, 6
var availableIds = data.split(',');
const contactList = [];

// Get all contacts
for (let i = 0; i < availableIds.length; i++) {
	let id = 'contacts-' + availableIds[i];
	let contact = JSON.parse(localStorage.getItem(id));
	contactList.push(contact);
}
```

### Almacenar modelos en localStorage

Ahora que tu si sabe cómo almacenar y recuperar datos de localStorage, es hora de almacenar sus modelos. En la siguiente figura, puede ver cómo realizar el almacenamiento de datos en un servidor local en lugar de en un servidor remoto.
De forma predeterminada, cuando llama al save() método en un modelo Backbone, transforma la acción en una solicitud HTTP para un servidor RESTFul. Para almacenar los datos en local, debe cambiar el comportamiento predeterminado para poder utilizar localStorage en lugar de realizar solicitudes HTTP; Aprenderá cómo hacer esto en la siguiente sección.
Para que la capa de almacenamiento sea mantenible, primero deberá crear un controlador Backbone para el almacenamiento local. La responsabilidad del controlador es almacenar y recuperar datos de localStorage para que la conexión entre Backbone y localStorage sea más sencilla:

En el próximo En la sección, le mostraré cómo construir el DataStore controlador para almacenar los modelos de Backbone en localStorage.

## Almacenar modelos de Backbone en localStorage

Es tiempo de Utilice lo que ha aprendido para localStorage almacenar y recuperar objetos. El DataStore objeto es responsable de transformar los modelos en cadenas para almacenarse en localStorage:

```js
class DataStore {
	constructor(name) {
		this.name = name;

		// Keep track of all ids stored for a particular collection

		this.index = this.getIndex();
	}

	getIndex() {
		var index = localStorage.getItem(this.name);
		return (index && index.split(',')) || [];
	}
}
```

El objeto DataStore necesita un nombre para usarse como prefijo de índice de colección. El primer caso de uso es crear un nuevo elemento:

```js
class DataStore {
	// ...

	create(model) {
		// Assign an id to new models
		if (!model.id && model.id !== 0) {
			model.id = generateId();
			model.set(model.idAttribute, model.id);
		}

		// Save model in the store with an unique name,
		// e.g. collectionName-modelId

		localStorage.setItem(this.itemName(model.id), this.serialize(model));

		// Keep track of stored id

		this.index.push(model.get(model.idAttribute));
		this.updateIndex();

		// Return stored model
		return this.find(model);
	}
}
```

cuando un nuevo Se crea el modelo, le asigna una nueva ID con una generateId()función:

```js
var crispy = require('crispy-string');

const ID_LENGTH = 10;

function generateId() {
	return crispy.base32String(ID_LENGTH);
}
```

La itemName() función genera una clave que se utilizará en localStorage dada la ID del modelo; el serialize()método transforma un modelo en una cadena JSON que está lista para almacenarse en localStorage. Finalmente, el index atributo en DataStore rastrea todos los ID disponibles, por lo que debemos incluir el ID del modelo en el índice.
Para el método de actualización, sobre escribiremos el valor actual del modelo:

```js
class DataStore {
	// ...

	update(model) {
		// Overwrite the data stored in the store,
		// actually makes the update
		localStorage.setItem(this.itemName(model.id), this.serialize(model));

		// Keep track of the model id in the collection

		var modelId = model.id.toString();
		if (!this.index.includes(modelId)) {
			this.index.push(modelId);
			this.updateIndex();
		}

		// Return stored model
		return this.find(model);
	}
}
```

Si llama al setItem() método con una clave existente en localStorage, el valor anterior se sobrescribe con el nuevo, el efecto neto es una operación de actualización.
Cuando busca un modelo, debe configurar el ID del modelo y llamar al fetch()método para recuperar los datos de un servidor. En nuestro DataStore, podemos llamar a esta operación find:

```js
class DataStore {
	// ...

	find(model) {
		return this.deserialize(localStorage.getItem(this.itemName(model.id)));
	}
}
```

el find() métodos muy simple, intenta obtener los datos de localStorege con un ID creado con el itemName()método; si no se encuentra el modelo, devolverá un nullvalor. Si bien devolver un único modelo es muy sencillo, recuperar una lista de ellos es una operación más compleja:

```js
class DataStore {
	// ...

	findAll() {
		var result = [];

		// Get all items with the id tracked for the given collection
		for (let i = 0, id, data; i < this.index.length; i++) {
			id = this.index[i];
			data = this.deserialize(localStorage.getItem(this.itemName(id)));

			if (data) {
				result.push(data);
			}
		}

		return result;
	}
}
```

Este método recorre todas las claves disponibles para la colección determinada; para cada elemento de la lista, lo convierte de una cadena a un objeto JSON. Todos los elementos se agregan en una única matriz que devuelve como resultado.
Para eliminar unelemento de DataStore, deberá eliminar su valor de localStorage y eliminar el índice relacionado con él:

```js
class DataStore {
	// ...

	destroy(model) {
		// Remove item from the store
		localStorage.removeItem(this.itemName(model.id));

		// Rmoeve id from tracked ids

		var modelId = model.id.toString();
		for (let i = 0; i < this.index.length; i++) {
			if (this.index[i] === modelId) {
				this.index.splice(i, 1);
			}
		}
		this.updateIndex();

		return model;
	}
}
```

Usamos el updateIndex() método cuando la colección de modelos se modifica en localStorage; debería almacenar una lista de ID como cadenas:

```js
class DataStore {
// ...

// Save the ids comma separated for a given collection
updateIndex() {
localStorage.setItem(this.name, this.index.join(','));
}
}

Los ID de modelo se generan con el nombre de la colección y su ID:
class DataStore {
// ...
itemName(id) {
return this.name + '-' + id;
}
}
```

La DataStoreclase, poren sí mismo, puede almacenar y recuperar modelos de localStorage; sin embargo, no está completamente integrado con Backbone. En la siguiente sección, examinaremos cómo Backbone almacena y recupera modelos de una API RESTful y cómo cambiar este comportamiento para usar el DataStore controlador.

### Backbone.sync

Este es responsable de manejar conexiones entre un servidor RESTful y la aplicación Backbone es el módulo Backbone.sync. Transforma las operaciones fetch()y save()en solicitudes HTTP:

fetch() es mapeado como una read operación. Esto creará GETel urlRoot atributo con el ID de modelo para un modelo o el url atributo para una colección.
save() se mapea como un create u update operación; depende del isNew()método: Esto se asignará como create si el modelo no tuviera una ID ( isNew() método return true). Se ejecuta una solicitud POST. Esto se asignará como update si el modelo ya tuviera una ID ( isNew() el método devuelve false). Se ejecuta una solicitud PUT.
destroy() es mapeado como una delete operación. Esto eliminará el urlRoot atributo con el ID de modelo para un modelo o el url atributo para una colección.

Para comprender mejor cómo hace su trabajo Backbone.sync, considere los siguientes ejemplos:

```js
// read operation will issue a GET /contacts/1
var john = new Contact({ id: 1 });
john.fetch();

// update operation will issue a PUT /contacts/1
john.set('name', 'Johnson');
john.save();

// delete operation will issue a DELETE /contacts/1
john.destroy();
var jane = new Contact({ name: 'Jane' });
// create operation will issue a POST /contacts
jane.save();
```

Como puedes leer en la documentación de Backbone, Backbone.sync tiene la siguiente firma:

```js
sync(method, model, [options]);
```

Aquí, el método es la operación que se va a emitir ( read, create, update o delete). Puede sobrescribir fácilmente esta función para redirigir las solicitudes a localStorage en lugar de a un servidor RESTful:

```js
Backbone.sync = function (method, model, options) {
	var response;
	var store = model.dataStore || (model.collection && model.collection.dataStore);
	var defer = Backbone.$.Deferred();

	if (store) {
		// Use localstorage in the model to execute the query
		switch (method) {
			case 'read':
				response = model.id ? store.find(model) : store.findAll();
				break;

			case 'create':
				response = store.create(model);
				break;

			case 'update':
				response = store.update(model);
				break;

			case 'delete':
				response = store.destroy(model);
				break;
		}
	}

	// Respond as promise and as options callbacks
	if (response) {
		defer.resolve(response);
		if (options && options.success) {
			options.success(response);
		}
	} else {
		defer.reject('Not found');
		if (options && options.error) {
			options.error(response);
		}
	}

	return defer.promise();
};
```

Mientras que laLa API localStorage es sincrónica y no necesita utilizar devoluciones de llamada ni promesas; sin embargo, para ser compatible con la implementación predeterminada, necesitamos crear un Deferredobjeto y devolver un archivo promise.
Si no sabe qué Deferredson una promesa u objetos, consulte la documentación de jQuery para obtener más información al respecto. La explicación de cómo funcionan las promesas está fuera del alcance de este libro.
La Backbone.syncimplementación anterior busca un dataStoreatributo en los modelos/colecciones. El atributo debe incluirse en estos objetos para que se almacene correctamente. Como puedes adivinar, debería ser una instancia de nuestro controlador DataStore:

```js
// apps/contacts/models/contact.js
class Contact extends Backbone.Model {
	constructor(options) {
		super(options);

		this.validation = {
			name: {
				required: true,
				minLength: 3,
			},
		};

		this.dataStore = new DataStore('contacts');
	}
	// ...
}

// apps/contacts/collections/contactCollection.js
class ContactCollection extends Backbone.Collection {
	constructor(options) {
		super(options);
		this.dataStore = new DataStore('contacts');
	}

	// ...
}
```

ElLa implementación que hicimos anteriormente para localStorage está inspirada en el complemento Backbone.localStorage. Si desea almacenar todos sus modelos en el navegador, utilice el complemento que cuenta con el apoyo de la comunidad.
Debido a las limitaciones del almacenamiento local, no es adecuado almacenar imágenes de avatar en él, ya que alcanzaremos los límites con solo unos pocos registros.

### Usando localStorage como caché

El controlador del almacén de datos Es útil para desarrollar pequeñas aplicaciones que no necesitan buscar y almacenar los datos en un servidor remoto. Puede ser suficiente crear prototipos de pequeñas aplicaciones web o almacenar datos de configuración en el navegador.
Sin embargo, otro uso del controlador puede ser la respuesta del servidor de caché para acelerar el rendimiento de la aplicación:

```js
// cachedSync.js
var _ = require('underscore');
var Backbone = require('backbone');

function getStore(model) {
	return model.dataStore;
}

module.exports = _.wrap(Backbone.sync, (sync, method, model, options) => {
	var store = getStore(model);

	// Try to read from cache store
	if (method === 'read') {
		let cachedModel = getCachedModel(model);

		if (cachedModel) {
			let defer = Backbone.$.Deferred();

			defer.resolve(cachedModel);

			if (options && options.success) {
				options.success(cachedModel);
			}

			return defer.promise();
		}
	}

	return sync(method, model, options).then((data) => {
		// When getting a collection data is an array, if is a
		// model is a single object. Ensure that data is always
		// an array
		if (!_.isArray(data)) {
			data = [data];
		}

		data.forEach((item) => {
			let model = new Backbone.Model(item);
			cacheResponse(method, store, model);
		});
	});
});
```

Cuando elLa aplicación necesita leer los datos, primero intenta leer los datos del almacenamiento local. Si no se encuentra ningún modelo, utilizará la función Backbone.sync original para recuperar los datos del servidor.
Cuando el servidor responda, almacenará la respuesta en localStorage para uso futuro. Para almacenar en caché una respuesta del servidor, debe almacenar la respuesta del servidor o eliminar el modelo del caché cuando se elimina el modelo:

```js
// cachedSync
function cacheResponse(method, store, model) {
	if (method !== 'delete') {
		updateCache(store, model);
	} else {
		dropCache(store, model);
	}
}

// Goteanteel modelo del caché es bastante simple:
function dropCache(store, model) {
	// Ignore if cache is not supported for the model
	if (store) {
		store.destroy(model);
	}
}
```

Almacenar y recuperar los datos en el caché es más complejo; debe tener una política de caducidad de caché. Para este proyecto, expiraremos las respuestas almacenadas en caché después de 15 minutos, lo que significa que eliminaremos los datos almacenados en caché y luego realizaremos fetch:

```js
// cachedSync.js
// ...

const SECONDS = 1000;
const MINUTES = 60 * SECONDS;
const TTL = 15 * MINUTES;

function cacheExpire(data) {
	if (data && data.fetchedAt) {
		let now = new Date();
		let fetchedAt = new Date(data.fetchedAt);
		let difference = now.getTime() - fetchedAt.getTime();
		return difference > TTL;
	}
	return false;
}
```

el fetchedAtatributose utiliza para mostrar la hora a la que obtuvimos los datos del servidor. Cuando el caché caduca, elimina el modelo del caché y regresa nullpara forzar un servidor fetch.
Cuando un modelo se almacena en caché, debe establecer el fetchedAtatributo por primera vez cuando se recupera:

```js
// cachedSync.js
function updateCache(store, model) {
	// Ignore if cache is not supported for the model
	if (store) {
		var cachedModel = store.find(model);

		// Use fetchedAt attribute model is already cached
		if (cachedModel && cachedModel.fetchedAt) {
			model.set('fetchedAt', cachedModel.fetchedAt);
		} else {
			model.set('fetchedAt', new Date());
		}

		store.update(model);
	}
}

// Finalmente, necesitamos reemplazar la función Backbone.sync original:
// app.js
var cachedSync = require('./cachedSync');

// ...

Backbone.sync = cachedSync;
```

### IndexedDB

Como tuComo hemos visto en las secciones anteriores, localStorage es muy sencillo; sin embargo, tiene la limitación de 5 MB de capacidad de almacenamiento. IndexedDB, por otro lado, no tiene esta limitación; sin embargo, tiene una API compleja. La principal desventaja de IndexedDB es que no es totalmente compatible con todos los navegadores principales:

Al momento de escribir este libro, IndexedDB es totalmente compatible con Chrome y Firefox, mientras que Safari e IE tienen soporte parcial.
Una gran diferencia entre localStorage e IndexedDB es que IndexedDB no es un almacén de claves/valores; IndexedDB tiene colecciones (tablas) y una API de consulta. Si ha trabajado con MongoDB, estará familiarizado con la forma en que IndexedDB almacena datos.

### Comenzando con IndexedDB

Una base de datos IndexedDB está compuesto por una o más tiendas. Una tienda es como un contenedor JSON, contiene una colección de JSON. Si ha trabajado con SQL, entonces una tienda es como una mesa. Si ha trabajado con MongoDB, una tienda es como una colección. Al igual que MongoDB, IndexedDB no tiene esquema, lo que significa que no es necesario definir el esquema de los registros (JSON).
Una de las consecuencias de la tecnología sin esquema es que los datos de las colecciones no son heterogéneos, puede tener diferentes tipos de objetos JSON en el mismo almacén. Por ejemplo, puedes almacenar datos de contacto y factura en la misma tienda.
IndexedDB es más flexible y potente que localStorage; sin embargo, un gran poder conlleva una gran responsabilidad. Tendrás que lidiar con tiendas, cursores, índices, transacciones, migraciones y API asincrónicas:

### Versiones de bases de datos

Bases de datos suele cambiar con el tiempo; tal vez una nueva característica necesite una nueva tienda o agregue un índice. Todas las bases de datos IndexedDB tienen un número de versión. La primera vez que crea una nueva base de datos, comienza con la versión 1. Con la ayuda de cada número de versión, puede definir las tiendas y los índices que necesite.
IndexedDB no le permite crear nuevas tiendas o índices, a menos que haya cambiado el número de versión. Cuando se detecta un nuevo número de versión, IndexedDB ingresa a un versionchangeestado y llama a la onupgradedneeded()devolución de llamada, que puede usar para modificar la base de datos.
Cada vez que cambia el número de versión, tiene la oportunidad de ejecutar migraciones de bases de datos en la onupgradedneeded()devolución de llamada. Cada vez que abre una conexión con IndexedDB, puede especificar un número de versión:
indexedDB.open(`<database name>`, `<version number>`)

La primera vez que abre una base de datos, IndexedDB ingresa al versionchangeestado y llama a la onupgradedneeded()devolución de llamada.

### Creando tiendas

APara crear tiendas en IndexedDB, debe poner la base de datos en el estado de cambio de versión, lo que puede hacer de las dos maneras siguientes:
Crea una nueva base de datos.
Cambie el número de versión de la base de datos.

En el siguiente ejemplo, estamos creando una nueva base de datos llamada biblioteca:

```js
const request = indexedDB.open('library');

// In this callback the database is in the versionchange state
request.onupgradeneeded = function () {
	// The database did not previously exist, so that
	// we can create object stores and indexes.
	const db = request.result;
	const store = db.createObjectStore('books', { keyPath: 'isbn' });

	// Populate with initial data.
	store.put({
		title: 'Quarry Memories',
		author: 'Fred',
		isbn: 123456,
	});
	store.put({
		title: 'Water Buffaloes',
		author: 'Fred',
		isbn: 234567,
	});
	store.put({
		title: 'Bedrock Nights',
		author: 'Barney',
		isbn: 345678,
	});
};

request.onsuccess = function () {
	window.db = request.result;
};
```

Cuando open()se llama al método, devuelve un objeto de solicitud que podemos usar para registrar la onscuccess() devolución de llamada llamada cuando la base de datos se abre con éxito y está lista para ser utilizada. Mientras creamos una nueva base de datos, onupgradeneeded() se llama a la devolución de llamada.
La base de datos El controlador está en el result atributo del request objeto. Puede utilizar el createObjectStore()método del controlador de base de datos para crear una nueva tienda:

createObjectStore(name, options)

El primer argumento del createObjectStore()método es el nombre de la tienda, en nuestro ejemplo es biblioteca. Los options argumentos deben ser un objeto simple donde los campos disponibles sean los siguientes:

Nombre de la opción
Descripción
Valor por defecto
autoincremento
Este auto incrementa el primary key atributo.
false
ruta clave
Este es el nombre del atributo en los objetos que se utilizará como primary key
null

Después de la creación del almacén de objetos, se devuelve un controlador de tienda, que puede utilizar para insertar nuevos registros en el almacén de objetos creado recientemente. El put()método se utiliza para insertar nuevos registros en el almacén y acepta como argumento el JSON a almacenar:

Como puedes ver en la imagen anterior, el almacén de objetos tiene los objetos que insertamos con el put()método en el onupgradeneeded evento.

Eliminar una base de datos

Puede Elimine siempre una base de datos con el método deleteDatabase(). Si hiciste algo mal y quieres empezar de nuevo, simplemente elimina la base de datos:

```js
indexedDB.deleteDatabase('library');
```

#### Agregar elementos a un almacén de objetos

Tienes He visto cómo crear y eliminar tiendas. Ahora verá cómo conectarse a una base de datos y agregar registros a un almacén de objetos fuera de la onupgradeneeded()devolución de llamada:

```js
const tx = db.transaction('books', 'readwrite');
const store = tx.objectStore('books');

store.put({
	title: 'Quarry Memories',
	author: 'Fred',
	isbn: 123456,
});
store.put({
	title: 'Water Buffaloes',
	author: 'Fred',
	isbn: 234567,
});
store.put({
	title: 'Bedrock Nights',
	author: 'Barney',
	isbn: 345678,
});

tx.oncomplete = function () {
	console.log('Records added!');
};
```

Tenga en cuenta que estamos creando una transacción IndexedDB. La especificación IndexedDB del W3C define una transacción de la siguiente manera:
Una transacción se utiliza para interactuar con los datos de una base de datos. Siempre que se leen o escriben datos en la base de datos, se realiza mediante una transacción.
Las transacciones ofrecen cierta protección contra fallas de aplicaciones y sistemas. Se puede utilizar una transacción para almacenar múltiples registros de datos o para modificar condicionalmente ciertos registros de datos. Una transacción representa un conjunto atómico y duradero de operaciones de mutación y acceso a datos.
el transaction()metododel indexedDBobjeto tiene dos argumentos: alcance y modo, como se muestra en la siguiente tabla:

Argumento
Descripción
Ejemplos
alcance
La tienda o tiendas donde interactúa la transacción.
'libros',['contactos', 'facturas']
modo
Esto indica qué tipo de interacción se realizará.
'solo lectura', 'lectura y escritura'

Cuando se crea la transacción, puede acceder a las tiendas con el objectStore()método del objeto de transacción, que devuelve un controlador de tienda de objetos que puede usar para agregar o eliminar registros.
El put()método se utiliza para insertar objetos en la tienda; sin embargo, el método es asincrónico, lo que significa que los registros no se almacenan inmediatamente como en localStorage. Debe registrar una oncomplete()devolución de llamada en el objeto de transacción que se llamará cuando finalicen las operaciones.

### Realizar consultas

Para consultarlos datos en un almacén de objetos, es necesario abrir una readonly transacción:

```js
const tx = db.transaction('books', 'readonly');
const store = tx.objectStore('books');

const request = store.openCursor(IDBKeyRange.only(123456));
request.onsuccess = function () {
	const cursor = request.result;
	if (cursor) {
		// Called for each matching record.
		console.log(cursor.value);
		cursor.continue();
	} else {
		// No more matching records, cursor === null
		console.log('Done!');
	}
};
```

Las consultas se deben realizar abriendo cursores con el openCursor()método. El primer argumentodel openCursor()método es una consulta que debería ser un IDBKeyRangeobjeto:

only(value): Busca el valor, como una operación ==
lower(value): Busca los valores menores o iguales al valor, como por ejemplo una operación <=
lowerOpen(value): Busca valores inferiores al valor, como una operación <
upper(value): Busca valores mayores o iguales al valor, como una operación >=
upperOpen(value): Busca valores mayores que el valor, como una > operación

Estas son algunas de las consultas que están disponibles; consulte la especificación IndexedDB para obtener una lista completa de todas las consultas disponibles. IndexedDB usa la consulta para comparar los valores que se pasan como argumento con los objetos en la tienda; Sin embargo, ¿qué atributo de la tienda se compara? La respuesta es la clave que se especifica en keyPath. En nuestro ejemplo, isbnse utilizará el atributo.

El cursor llamará a la onsuccess()devolución de llamada repetidamente para cada objeto encontrado; debe llamar al continue()método en el objeto del cursor para buscar el siguiente objeto. El resultado será nullcuando no se encuentren más objetos.
Si desea consultar los objetos por un atributo diferente, debe crear índices en la tienda para los atributos que necesita. Utilice un número de versión diferente para agregar nuevos índices a los almacenes de objetos:

```js
const request = indexedDB.open('library', 2);

request.onupgradeneeded = function () {
	const db = request.result;
	const store = db.createObjectStore('books', { keyPath: 'isbn' });
	const titleIndex = store.createIndex('by_title', 'title', {
		unique: true,
	});
	const authorIndex = store.createIndex('by_author', 'author');

	// ...
};

request.onsuccess = function () {
	db = request.result;

	const tx = db.transaction('books', 'readonly');
	const store = tx.objectStore('books');
	const index = store.index('by_title');

	const request = index.get('Bedrock Nights');
	request.onsuccess = function () {
		// ...
	};
};
```

Como puedes ver en elEn el ejemplo anterior, puede utilizar un índice para consultar objetos. Se invoca el mismo onsuccess()método cada vez que el índice encuentra un resultado.

Eliminar objetos en la tienda.

Borrar Objetos, debe llamar al delete()método en el almacén de objetos con un argumento de consulta para estos objetos que desea eliminar:

```js
const tx = db.transaction('books', 'readwrite');
const store = tx.objectStore('books');

store.delete(123456); // deletes book with isbn == 123456
store.delete(IDBKeyRange.lowerBound(456789)); // deletes books with isbn >= 456789
```

### IndexedDB en Backbone

Como La API IndexedDB es más compleja que localStorage, será más difícil crear un controlador IndexedDB para Backbone como lo hicimos con localStorage; En esta sección, utilizará lo que ha aprendido sobre IndexedDB para crear un controlador para Backbone.
El controlador debe abrir una base de datos e inicializar las tiendas cuando se crea por primera vez:

```js
// indexedDB/dataStore.js
'use strict';

var Backbone = require('backbone');

const ID_LENGTH = 10;

var contacts = [
	// ...
];

class DataStore {
	constructor() {
		this.databaseName = 'contacts';
	}

	openDatabase() {
		var defer = Backbone.$.Deferred();

		// If a database connection is already active use it,
		// otherwise open a new connection
		if (this.db) {
			defer.resolve(this.db);
		} else {
			let request = indexedDB.open(this.databaseName, 1);

			request.onupgradeneeded = () => {
				let db = request.result;
				this.createStores(db);
			};

			request.onsuccess = () => {
				// Cache recently opened connection
				this.db = request.result;
				defer.resolve(this.db);
			};
		}

		return defer.promise();
	}

	createStores(db) {
		var store = db.createObjectStore('contacts', { keyPath: 'id' });

		// Create the first records

		contacts.forEach((contact) => {
			store.put(contact);
		});
	}
}
```

Cuando elSe abre la conexión, crea la tienda de contactos y coloca los primeros registros en la tienda. Después de eso, almacena en caché el controlador de la base de datos en el dbatributo para reutilizar la conexión para futuras solicitudes.
Ahora, debemos crear el método necesario para crear, actualizar, eliminar y leer los datos de la tienda:

```js
// indexedDB/dataStore.js

var crispy = require('crispy-string');

// ...

class DataStore {
	create(model) {
		var defer = Backbone.$.Deferred();

		// Assign an id to new models
		if (!model.id && model.id !== 0) {
			let id = this.generateId();

			model.set(model.idAttribute, id);
		}

		// Get the database connection

		this.openDatabase()
			.then((db) => this.store(db, model))
			.then((result) => defer.resolve(result));

		return defer.promise();
	}

	generateId() {
		return crispy.base32String(ID_LENGTH);
	}
	// ...
}
```

Cuando unSe crea el registro, debemos asegurarnos de que el modelo tenga una identificación. Podemos generarlo para los modelos que no tienen ID asignado. El store()método colocará el registro en la base de datos indexedDB:

```js
// indexedDB/dataStore.js

var crispy = require('crispy-string');

// ...

class DataStore {
	// ...

	store(db, model) {
		var defer = Backbone.$.Deferred();

		// Get the name of the object store

		var storeName = model.store;

		// Get the object store handler

		var tx = db.transaction(storeName, 'readwrite');
		var store = tx.objectStore(storeName);

		// Save the model in the store

		var obj = model.toJSON();
		store.put(obj);

		tx.oncomplete = function () {
			defer.resolve(obj);
		};

		tx.onerror = function () {
			defer.reject(obj);
		};

		return defer.promise();
	}

	// ...
}
```

El store()método obtiene el nombre de la tienda del modelstoreatributo y luego crea una readwritetransacción para el nombre de la tienda dado para ponerle el registro. El update()método utiliza el mismo store()método para guardar el registro:

```js
// indexedDB/dataStore.js
class DataStore {
	// ...

	update(model) {
		var defer = Backbone.$.Deferred();

		// Get the database connection

		this.openDatabase()
			.then((db) => this.store(db, model))
			.then((result) => defer.resolve(result));

		return defer.promise();
	}

	// ...
}
```

El método de actualizaciónno asigna una ID al modelo, reemplaza completamente el registro anterior con los datos del nuevo modelo. Para eliminar un registro, puede utilizar el delete()método del controlador del almacén de objetos:

```js
// indexedDB/dataStore.js
class DataStore {
	// ...

	destroy(model) {
		var defer = Backbone.$.Deferred();

		// Get the database connection

		this.openDatabase().then(function (db) {
			// Get the name of the object store
			let storeName = model.store;

			// Get the store handler

			var tx = db.transaction(storeName, 'readwrite');
			var store = tx.objectStore(storeName);

			// Delete object from the database
			let obj = model.toJSON();

			store.delete(model.id);

			tx.oncomplete = function () {
				defer.resolve(obj);
			};

			tx.onerror = function () {
				defer.reject(obj);
			};
		});

		return defer.promise();
	}

	// ...
}
```

para obtener todos losmodelos almacenados en un almacén de objetos, debe abrir un cursor y colocar todos los elementos en una matriz, de la siguiente manera:

```js
// indexedDB/dataStore.js
class DataStore {
	// ...

	findAll(model) {
		var defer = Backbone.$.Deferred();

		// Get the database connection

		this.openDatabase().then((db) => {
			let result = [];

			// Get the name of the object store
			let storeName = model.store;

			// Get the store handler
			let tx = db.transaction(storeName, 'readonly');
			let store = tx.objectStore(storeName);

			// Open the query cursor
			let request = store.openCursor();

			// onsuccesscallback will be called for each record
			// found for the query

			request.onsuccess = function () {
				let cursor = request.result;

				// Cursor will be null at the end of the cursor
				if (cursor) {
					result.push(cursor.value);

					// Go to the next record

					cursor.continue();
				} else {
					defer.resolve(result);
				}
			};
		});

		return defer.promise();
	}

	// ...
}
```

Tenga en cuenta cómoesta vez la transacción abierta está en readonlymodo. Se puede obtener un solo objeto consultando el ID del modelo:

```js
// indexedDB/dataStore.js
class DataStore {
	// ...

	find(model) {
		var defer = Backbone.$.Deferred();

		// Get the database connection

		this.openDatabase().then((db) => {
			// Get the name of the collection/store
			let storeName = model.store;

			// Get the store handler
			let tx = db.transaction(storeName, 'readonly');
			let store = tx.objectStore(storeName);

			// Open the query cursor
			let request = store.openCursor(IDBKeyRange.only(model.id));

			request.onsuccess = function () {
				let cursor = request.result;

				// Cursor will be null if record was not found
				if (cursor) {
					defer.resolve(cursor.value);
				} else {
					defer.reject();
				}
			};
		});

		return defer.promise();
	}

	// ...
}
```

En el mismoDe la misma manera que lo hicimos con localStorage, este controlador IndexedDB se puede usar para sobrescribir la Backbone.syncfunción:

```js
// app.js
var store = new DataStore();

// ...

Backbone.sync = function (method, model, options) {
	var response;
	var defer = Backbone.$.Deferred();

	switch (method) {
		case 'read':
			if (model.id) {
				response = store.find(model);
			} else {
				response = store.findAll(model);
			}
			break;

		case 'create':
			response = store.create(model);
			break;

		case 'update':
			response = store.update(model);
			break;

		case 'delete':
			response = store.destroy(model);
			break;
	}

	response.then(function (result) {
		if (options && options.success) {
			options.success(result);
			defer.resolve(result);
		}
	});

	return defer.promise();
};
```

Entonces, modelosSe debe agregar el storeatributo para indicar en qué almacén de objetos se guardará el modelo:

```js
class Contact extends Backbone.Model {
	constructor(options) {
		// ,,,
		this.store = 'contacts';
	}

	// ...
}

class ContactCollection extends Backbone.Collection {
	constructor(options) {
		// ...
		this.store = 'contacts';
	}

	// ...
}
```

IndexedDB permiteusted debe almacenar más datos que localStorage; por lo tanto, también puedes usarlo para almacenar la imagen del avatar. Solo asegúrese de que el avataratributo esté configurado para que siempre se seleccione una imagen:

```js
class ContactPreview extends ModelView {
	// ...

	fileSelected(event) {
		event.preventDefault();

		var $img = this.$('img');

		// Get a blob instance of the file selected

		var $fileInput = this.$('#avatar')[0];
		var fileBlob = $fileInput.files[0];

		// Render the image selected in the img tag

		var fileReader = new FileReader();
		fileReader.onload = (event) => {
			$img.attr('src', event.target.result);

			this.model.set({
				avatar: {
					url: event.target.result,
				},
			});
		};
		fileReader.readAsDataURL(fileBlob);

		this.trigger('avatar:selected', fileBlob);
	}
}

// No intentessube la imagen:
class ContactEditor {
	// ...

	showEditor(contact) {
		// ...
		// When avatar is selected, we can save it inmediatly if the
		// contact already exists on the server, otherwise just
		// remember the file selected
		//this.listenTo(contactPreview, 'avatar:selected', blob => {
		//  this.avatarSelected = blob;
		//  if (!contact.isNew()) {
		//    this.uploadAvatar(contact);
		//  }
		//});
	}
	saveContact(contact) {
		// ...
		// The avatar attribute is read-only
		//if (contact.has('avatar')) {
		//  contact.unset('avatar');
		//}
		// ...
	}

	// ...
}
```

### Arquitectura Offline-first con ES Modules y Vite (híbrida: local + remoto)

Además de usar `localStorage` o `IndexedDB` como reemplazo del servidor, una estrategia moderna es un enfoque híbrido: trabajar siempre con una copia local (rápida y disponible offline) y sincronizar con la API cuando sea posible. Beneficios:

- __Velocidad__: lecturas desde IndexedDB/localStorage al instante.
- __Resiliencia__: operaciones mutativas se encolan cuando no hay red y se reintentan luego.
- __Experiencia__: UI optimista con resolución de conflictos simple (`updatedAt`).

A continuación se muestra un conjunto de utilidades y un `sync` personalizado que integran Backbone con IndexedDB, soportan cola de operaciones, reintentos y reasignación de IDs temporales.

#### Utilidades IndexedDB con Promesas (ESM)

```js
// src/offline/db.js
// Pequeño wrapper de IndexedDB con Promesas y 2 stores: 'entities' y 'pending'
const DB_NAME = 'app-offline';
const DB_VERSION = 1;

export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('entities')) {
        const s = db.createObjectStore('entities', { keyPath: 'key' });
        s.createIndex('byType', 'type');
      }
      if (!db.objectStoreNames.contains('pending')) {
        db.createObjectStore('pending', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putEntity(type, id, data) {
  const db = await openDB();
  return txPromise(db, 'entities', 'readwrite', (store) => store.put({ key: `${type}:${id}`, type, id, data }));
}

export async function getEntity(type, id) {
  const db = await openDB();
  const rec = await txPromise(db, 'entities', 'readonly', (s) => s.get(`${type}:${id}`));
  return rec && rec.data;
}

export async function putCollection(type, list) {
  // Guarda cada item individualmente para lecturas rápidas y compón una lista en meta
  const db = await openDB();
  await txPromise(db, 'entities', 'readwrite', async (s) => {
    for (const it of list) s.put({ key: `${type}:${it.id}`, type, id: it.id, data: it });
  });
  await txPromise(db, 'meta', 'readwrite', (m) => m.put({ key: `list:${type}`, ids: list.map((x) => x.id), ts: Date.now() }));
}

export async function getCollection(type) {
  const db = await openDB();
  const meta = await txPromise(db, 'meta', 'readonly', (m) => m.get(`list:${type}`));
  if (!meta) return [];
  const out = [];
  await txPromise(db, 'entities', 'readonly', async (s) => {
    for (const id of meta.ids) {
      const rec = await requestToPromise(s.get(`${type}:${id}`));
      if (rec) out.push(rec.data);
    }
  });
  return out;
}

export async function enqueue(op) {
  const db = await openDB();
  return txPromise(db, 'pending', 'readwrite', (s) => s.add({ ...op, enqueuedAt: Date.now() }));
}

export async function readQueue() {
  const db = await openDB();
  const items = [];
  await txPromise(db, 'pending', 'readonly', (s) => new Promise((res) => {
    const r = s.openCursor();
    r.onsuccess = () => { const c = r.result; if (c) { items.push(c.value); c.continue(); } else res(); };
  }));
  return items;
}

export async function dequeue(id) {
  const db = await openDB();
  return txPromise(db, 'pending', 'readwrite', (s) => s.delete(id));
}

function txPromise(db, store, mode, fn) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const s = tx.objectStore(store);
    const ret = fn(s);
    tx.oncomplete = () => resolve(ret instanceof IDBRequest ? undefined : ret);
    tx.onerror = () => reject(tx.error);
  });
}

function requestToPromise(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
```

#### `offlineSync`: Backbone.sync híbrido con cola y reintentos

```js
// src/offline/offlineSync.js
import Backbone from 'backbone';
import { enqueue, readQueue, dequeue, putEntity, putCollection, getEntity, getCollection } from '@/offline/db.js';

export function installOfflineSync({ apiBase = '/api', staleMs = 60_000 } = {}) {
  const originalSync = Backbone.sync;

  async function flushQueue() {
    if (!navigator.onLine) return;
    const items = await readQueue();
    for (const item of items) {
      try {
        const res = await sendToServer(item);
        await applyServerResult(item, res);
        await dequeue(item.id);
      } catch (_) {
        // mantener en cola; siguiente intento cuando vuelva online
        break;
      }
    }
  }

  window.addEventListener('online', () => flushQueue());

  async function sendToServer({ type, method, url, body }) {
    const res = await fetch(url.startsWith('http') ? url : `${apiBase}${url}` , {
      method: mapMethod(method),
      headers: { 'content-type': 'application/json' },
      body: method === 'read' ? undefined : JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function applyServerResult(item, json) {
    const { type, method, body } = item;
    if (method === 'create') {
      // reasignación de IDs temporales a definitivos
      const serverId = json.id ?? json.data?.id;
      await putEntity(type, serverId, { ...body, id: serverId });
    } else if (method === 'update') {
      await putEntity(type, body.id, { ...body, ...json });
    } else if (method === 'delete') {
      await putEntity(type, body.id, undefined); // opcional: limpiar cache
    } else if (method === 'read') {
      if (Array.isArray(json)) await putCollection(type, json);
      else await putEntity(type, json.id, json);
    }
  }

  function mapMethod(m) {
    switch (m) { case 'create': return 'POST'; case 'update': return 'PUT'; case 'delete': return 'DELETE'; default: return 'GET'; }
  }

  Backbone.sync = async function (method, model, options = {}) {
    const type = model.store || model.urlRoot || (model.collection && model.collection.url) || 'items';
    const isCollection = !model.id && method === 'read' && model.models;
    const url = (typeof model.url === 'function' ? model.url() : model.url) || options.url;

    // 1) Lecturas: intenta cache primero (SWr: stale-while-revalidate)
    if (method === 'read') {
      try {
        const cached = isCollection ? await getCollection(type) : await getEntity(type, model.id);
        if (cached && options.success) options.success(cached);
      } catch {}
      try {
        const data = await sendToServer({ type, method, url });
        await applyServerResult({ type, method }, data);
        if (options.success) options.success(data);
      } catch (err) {
        if (!navigator.onLine) {
          // offline: ya devolvimos cache si existía
          if (options.error) options.error(err);
        } else {
          if (options.error) options.error(err);
        }
      }
      return Promise.resolve();
    }

    // 2) Mutaciones: enviar si online; encolar si offline o fallo de red
    const body = model.toJSON();
    if (method === 'create' && !body.id) body.id = `tmp_${model.cid}`;

    const op = { type, method, url, body };

    if (!navigator.onLine) {
      await optimisticLocal(type, method, body);
      await enqueue(op);
      if (options.success) options.success(body);
      return Promise.resolve();
    }

    try {
      const data = await sendToServer(op);
      await applyServerResult(op, data);
      if (options.success) options.success(data);
    } catch (err) {
      // Encolar para reintento (p. ej., servidor caído)
      await optimisticLocal(type, method, body);
      await enqueue(op);
      if (options.success) options.success(body); // UI optimista
    }
    // Disparar flush asíncrono
    flushQueue();
    return Promise.resolve();
  };

  async function optimisticLocal(type, method, body) {
    if (method === 'create' || method === 'update') await putEntity(type, body.id, { ...body, updatedAt: body.updatedAt || new Date().toISOString() });
  }

  // expose para pruebas
  Backbone.offline = { flushQueue };

  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      window.removeEventListener('online', flushQueue);
    });
  }

  return () => (Backbone.sync = originalSync);
}
```

Notas:

- __Reasignación de ID__: al crear offline, se usa `tmp_<cid>`; al sincronizar, se persiste el ID del servidor en cache. Si la vista depende del ID, escucha un evento y actualiza rutas/URL.
- __Conflictos__: utiliza `updatedAt` y una política simple LWW (last-write-wins). Para mayor robustez, puedes pedir ETags/If-Match.
- __SWr__: las lecturas devuelven cache primero y luego actualizan en background.

#### Indicador de conectividad y experiencia de usuario

```js
// src/offline/connectivity.js
import Backbone from 'backbone';

export const NetBus = Object.assign({}, Backbone.Events);
function emit() { NetBus.trigger(navigator.onLine ? 'online' : 'offline'); }
window.addEventListener('online', emit);
window.addEventListener('offline', emit);
emit();
```

En tus vistas, muestra un banner cuando `NetBus` emita `offline` y bloquea acciones sensibles o infórmalas como “pendientes de sincronización”.

#### Pruebas: Vitest + MSW + fake-indexeddb

```js
// tests/offline-sync.test.js
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import Backbone from 'backbone';
import { installOfflineSync } from '@/offline/offlineSync.js';

const server = setupServer(
  rest.post('http://localhost:3000/api/contacts', async (req, res, ctx) => {
    const body = await req.json();
    return res(ctx.status(201), ctx.json({ ...body, id: 101 }));
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
afterAll(() => server.close());
afterEach(() => server.resetHandlers());

describe('offlineSync', () => {
  it('enqueue create cuando está offline y sincroniza al volver online', async () => {
    // Fuerza offline
    Object.defineProperty(window.navigator, 'onLine', { value: false, configurable: true });
    installOfflineSync({ apiBase: 'http://localhost:3000/api' });

    const Contact = Backbone.Model.extend({ urlRoot: '/contacts', store: 'contacts' });
    const c = new Contact({ name: 'Ada' });

    await new Promise((r) => c.save(null, { success: r }));
    expect(c.get('id')).toMatch(/^tmp_/);

    // Ahora online y el server asigna id=101
    Object.defineProperty(window.navigator, 'onLine', { value: true });
    window.dispatchEvent(new Event('online'));

    // Espera a que flush complete
    await new Promise((r) => setTimeout(r, 50));
    // En app real, se obtendría por un fetch posterior o un evento; aquí validamos que no falle
  });
});
```

Sugerencias:

- Usa `fake-indexeddb` para que las APIs `indexedDB` existan en Vitest (Node).
- En MSW, define handlers para `POST/PUT/DELETE/GET` y prueba reintentos y reasignación de IDs.

#### Service Worker (opcional)

Para mejorar el modo offline, añade un Service Worker con Vite (por ejemplo, Workbox) para cachear assets y peticiones GET. Mantén las mutaciones en la cola del `offlineSync`.

#### Limpieza con HMR

Si reinstalas módulos en desarrollo, elimina listeners (`online/offline`) en `dispose` como se muestra en `installOfflineSync`.

#### Compatibilidad con localStorage

Para escenarios simples o prototipos, puedes implementar los mismos conceptos sobre `localStorage` con un adaptador con la misma interfaz `getEntity/putEntity/readQueue/enqueue`.

#### Resolución de conflictos con ETags/If-Match

Para robustecer la sincronización, añade control de concurrencia condicional:

- __Servidor__: responde `ETag` en `POST/PUT` y valida `If-Match` en `PUT` devolviendo `412 Precondition Failed` en caso de conflicto.
- __Cliente__: guarda `etag` junto al recurso y envía `If-Match` en actualizaciones.

Extensión de `offlineSync` (sólo fragmentos relevantes):

```js
// sendToServer ahora entrega { json, etag }
async function sendToServer({ type, method, url, body, etag }) {
  const res = await fetch(url.startsWith('http') ? url : `${apiBase}${url}`, {
    method: mapMethod(method),
    headers: {
      'content-type': 'application/json',
      ...(etag ? { 'if-match': etag } : {}),
    },
    body: method === 'read' ? undefined : JSON.stringify(body),
  });
  if (res.status === 412) {
    const latest = await fetch(`${apiBase}${url}`).then((r) => r.json());
    const err = new Error('Precondition Failed');
    err.code = 412; err.latest = latest; return Promise.reject(err);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return { json, etag: res.headers.get('etag') };
}

async function applyServerResult(item, result) {
  const { type, method, body } = item;
  const { json, etag } = result.json ? result : { json: result, etag: undefined };
  if (method === 'create' || method === 'update') {
    const id = method === 'create' ? (json.id ?? json.data?.id) : body.id;
    await putEntity(type, id, { ...body, ...json, etag });
  } else if (method === 'delete') {
    await putEntity(type, body.id, undefined);
  } else if (method === 'read') {
    if (Array.isArray(json)) await putCollection(type, json);
    else await putEntity(type, json.id, { ...json, etag });
  }
}

// En mutaciones, pasa etag si existe
const op = { type, method, url, body, etag: body.etag };
```

Manejo de `412` en UI: muestra un diff con `err.latest`, ofrece “Conservar mío”, “Aceptar servidor” o “Combinar”. Puedes volver a intentar `PUT` tras aplicar una estrategia de merge y actualizando `If-Match` con el nuevo `etag`.

#### Pruebas adicionales (conflictos, update/delete)

```js
// tests/offline-conflict.test.js
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import Backbone from 'backbone';
import { installOfflineSync } from '@/offline/offlineSync.js';

const server = setupServer(
  rest.put('http://localhost:3000/api/contacts/:id', async (req, res, ctx) => {
    if (req.headers.get('if-match') !== 'v2') {
      return res(ctx.status(412), ctx.json({ message: 'conflict' }));
    }
    const body = await req.json();
    return res(ctx.status(200), ctx.set('ETag', 'v3'), ctx.json({ ...body }));
  })
);

beforeAll(() => server.listen());
afterAll(() => server.close());

describe('conflictos con ETag', () => {
  it('recibe 412 y permite resolver', async () => {
    installOfflineSync({ apiBase: 'http://localhost:3000/api' });
    const Contact = Backbone.Model.extend({ urlRoot: '/contacts', store: 'contacts' });
    const c = new Contact({ id: 1, name: 'Ada', etag: 'v1' });
    // Simula cambio remoto a v2
    // Primer intento: 412
    await expect(c.save({ name: 'Ada L.' })).resolves.toBeUndefined();
    // La app debería capturar 412 y guiar al usuario a reintentar con etag actualizado
  });
});
```

Agrega también casos de `DELETE` offline (se encola y aplica al volver online) y `PUT` sin cambios (idempotencia básica).

#### Adaptador localStorage equivalente

```js
// src/offline/localAdapter.js
const P = (k) => `offline:${k}`;

function read(k, d = null) { try { return JSON.parse(localStorage.getItem(P(k))) ?? d; } catch { return d; } }
function write(k, v) { localStorage.setItem(P(k), JSON.stringify(v)); }

export async function putEntity(type, id, data) {
  const key = `entity:${type}:${id}`;
  if (data === undefined) localStorage.removeItem(P(key));
  else write(key, data);
  const meta = read(`list:${type}`, { ids: [], ts: 0 });
  if (!meta.ids.includes(id)) meta.ids.push(id);
  meta.ts = Date.now(); write(`list:${type}`, meta);
}

export async function getEntity(type, id) { return read(`entity:${type}:${id}`); }

export async function putCollection(type, list) {
  list.forEach((it) => write(`entity:${type}:${it.id}`, it));
  write(`list:${type}`, { ids: list.map((x) => x.id), ts: Date.now() });
}

export async function getCollection(type) {
  const meta = read(`list:${type}`); if (!meta) return [];
  return meta.ids.map((id) => read(`entity:${type}:${id}`)).filter(Boolean);
}

export async function enqueue(op) {
  const q = read('pending', []); q.push({ ...op, enqueuedAt: Date.now(), id: q.length ? q[q.length - 1].id + 1 : 1 }); write('pending', q);
}

export async function readQueue() { return read('pending', []); }
export async function dequeue(id) { write('pending', read('pending', []).filter((x) => x.id !== id)); }
```

Puedes inyectar este adaptador en lugar del de IndexedDB en entornos donde IndexedDB no esté disponible.

#### Service Worker con Workbox (GET cacheable)

```js
// sw.js
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';

registerRoute(
  ({ url, request }) => request.method === 'GET' && url.pathname.startsWith('/api/'),
  new StaleWhileRevalidate({ cacheName: 'api-get' })
);
```

Con Vite, usa `vite-plugin-pwa` para registrar el SW y generar el manifiesto. Mantén las mutaciones fuera del SW; el `offlineSync` gestiona la cola.

#### Migraciones de IndexedDB

- Incrementa `DB_VERSION` y usa `onupgradeneeded` para crear stores/índices.
- Para mover datos, abre cursores del store antiguo y reescribe en el nuevo.

```js
req.onupgradeneeded = (ev) => {
  const db = req.result; const old = ev.oldVersion;
  if (old < 2) {
    const s = db.transaction ? db.transaction(['entities'], 'readwrite').objectStore('entities') : null;
    // ejemplo: crear índice nuevo sin pérdida
    if (!db.objectStoreNames.contains('entities')) {
      db.createObjectStore('entities', { keyPath: 'key' });
    }
    const store = ev.currentTarget.result.transaction('entities', 'readwrite').objectStore('entities');
    if (!store.indexNames.contains('byUpdatedAt')) store.createIndex('byUpdatedAt', 'data.updatedAt');
  }
};
```

#### Resumen

Ha aprendido dos formas de almacenar datos en el navegador y utilizarlos como reemplazo de un servidor API RESTful. El método localStorage tiene una API simple y es ampliamente compatible con los principales navegadores; esta será su primera opción si desea admitir navegadores antiguos; sin embargo, tiene la limitación de que sólo puedes almacenar cinco megas.
IndexedDB es poderoso; sin embargo, su API es más complicada que localStorage. Necesita aprender algunos conceptos antes de comenzar a trabajar con él. Una vez que sepas cómo funciona, debes escribir tu aplicación de forma asincrónica.

Cuando se crea un registro, debemos asegurarnos de que el modelo tenga una identificación. Podemos generarla para los modelos que no tienen ID asignado. El método store() colocará el registro en la base de datos IndexedDB:

```js
class DataStore {
	// ...

	create(model) {
		// Assign an id to new models
		if (!model.id && model.id !== 0) {
			let id = this.generateId();

			model.set(model.idAttribute, id);
		}

		// Get the database connection

		this.openDatabase()
			.then((db) => this.store(db, model))
			.then((result) => defer.resolve(result));

		return defer.promise();
	}

	generateId() {
		return crispy.base32String(ID_LENGTH);
	}
	// ...
}
```

Cuando unSe crea el registro, debemos asegurarnos de que el modelo tenga una identificación. Podemos generarla para los modelos que no tienen ID asignado. El store()método colocará el registro en la base de datos IndexedDB:

```js
class DataStore {
	// ...

	store(db, model) {
		var defer = Backbone.$.Deferred();

		// Get the name of the object store

		var storeName = model.store;

		// Get the object store handler

		var tx = db.transaction(storeName, 'readwrite');
		var store = tx.objectStore(storeName);

		// Save the model in the store

		var obj = model.toJSON();
		store.put(obj);

		tx.oncomplete = function () {
			defer.resolve(obj);
		};

		tx.onerror = function () {
			defer.reject(obj);
		};

		return defer.promise();
	}

	// ...
}
```

El store()método obtiene el nombre de la tienda del modelstoreatributo y luego crea una readwritetransacción para el nombre de la tienda dado para ponerle el registro. El update()método utiliza el mismo store()método para guardar el registro:

```js
class DataStore {
	// ...

	update(model) {
		var defer = Backbone.$.Deferred();

		// Get the database connection

		this.openDatabase()
			.then((db) => this.store(db, model))
			.then((result) => defer.resolve(result));

		return defer.promise();
	}

	// ...
}
```

El método de actualizaciónno asigna una ID al modelo, reemplaza completamente el registro anterior con los datos del nuevo modelo. Para eliminar un registro, puede utilizar el delete()método del controlador del almacén de objetos:

```js
class DataStore {
	// ...

	destroy(model) {
		var defer = Backbone.$.Deferred();

		// Get the database connection

		this.openDatabase().then(function (db) {
			// Get the name of the object store
			let storeName = model.store;

			// Get the store handler

			var tx = db.transaction(storeName, 'readwrite');
			var store = tx.objectStore(storeName);

			// Delete object from the database
			let obj = model.toJSON();

			store.delete(model.id);

			tx.oncomplete = function () {
				defer.resolve(obj);
			};

			tx.onerror = function () {
				defer.reject(obj);
			};
		});

		return defer.promise();
	}

	// ...
}
```

Para obtener todos losmodelos almacenados en un almacén de objetos, debe abrir un cursor y colocar todos los elementos en una matriz, de la siguiente manera:

```js
class DataStore {
	// ...

	findAll(model) {
		var defer = Backbone.$.Deferred();

		// Get the database connection

		this.openDatabase().then((db) => {
			let result = [];

			// Get the name of the object store
			let storeName = model.store;

			// Get the store handler
			let tx = db.transaction(storeName, 'readonly');
			let store = tx.objectStore(storeName);

			// Open the query cursor
			let request = store.openCursor();

			// onsuccesscallback will be called for each record
			// found for the query

			request.onsuccess = function () {
				let cursor = request.result;

				// Cursor will be null at the end of the cursor
				if (cursor) {
					result.push(cursor.value);

					// Go to the next record

					cursor.continue();
				} else {
					defer.resolve(result);
				}
			};
		});

		return defer.promise();
	}

	// ...
}
```

Tenga en cuenta cómoesta vez la transacción abierta está en readonlymodo. Se puede obtener un solo objeto consultando el ID del modelo:

```js
class DataStore {
	// ...

	find(model) {
		var defer = Backbone.$.Deferred();

		// Get the database connection

		this.openDatabase().then((db) => {
			// Get the name of the collection/store
			let storeName = model.store;

			// Get the store handler
			let tx = db.transaction(storeName, 'readonly');
			let store = tx.objectStore(storeName);

			// Open the query cursor
			let request = store.openCursor(IDBKeyRange.only(model.id));

			request.onsuccess = function () {
				let cursor = request.result;

				// Cursor will be null if record was not found
				if (cursor) {
					defer.resolve(cursor.value);
				} else {
					defer.reject();
				}
			};
		});

		return defer.promise();
	}

	// ...
}
```

En el mismoDe la misma manera que lo hicimos con localStorage, este controlador IndexedDB se puede usar para sobrescribir la Backbone.syncfunción:

```js
// app.js
var store = new DataStore();

// ...

Backbone.sync = function (method, model, options) {
	var response;
	var defer = Backbone.$.Deferred();

	switch (method) {
		case 'read':
			if (model.id) {
				response = store.find(model);
			} else {
				response = store.findAll(model);
			}
			break;

		case 'create':
			response = store.create(model);
			break;

		case 'update':
			response = store.update(model);
			break;

		case 'delete':
			response = store.destroy(model);
			break;
	}
```

Entonces, modelosSe debe agregar el storeatributo para indicar en qué almacén de objetos se guardará el modelo:

```js
class Contact extends Backbone.Model {
	constructor(options) {
		// ,,,
		this.store = 'contacts';
	}

	// ...
}

class ContactCollection extends Backbone.Collection {
	constructor(options) {
		// ...
		this.store = 'contacts';
	}

	// ...
}
```

IndexedDB permiteusted debe almacenar más datos que localStorage; por lo tanto, también puedes usarlo para almacenar la imagen del avatar. Solo asegúrese de que el avataratributo esté configurado para que siempre se seleccione una imagen:

```js
class ContactPreview extends ModelView {
	// ...

	fileSelected(event) {
		event.preventDefault();

		var $img = this.$('img');

		// Get a blob instance of the file selected

		var $fileInput = this.$('#avatar')[0];
		var fileBlob = $fileInput.files[0];

		// Render the image selected in the img tag

		var fileReader = new FileReader();
		fileReader.onload = (event) => {
			$img.attr('src', event.target.result);

			this.model.set({
				avatar: {
					url: event.target.result,
				},
			});
		};
		fileReader.readAsDataURL(fileBlob);

		this.trigger('avatar:selected', fileBlob);
	}
}

// No intentessube la imagen:
class ContactEditor {
	// ...

	showEditor(contact) {
		// ...
		// When avatar is selected, we can save it inmediatly if the
		// contact already exists on the server, otherwise just
		// remember the file selected
		//this.listenTo(contactPreview, 'avatar:selected', blob => {
		//  this.avatarSelected = blob;
		//  if (!contact.isNew()) {
		//    this.uploadAvatar(contact);
		//  }
		//});
	}
	saveContact(contact) {
		// ...
		// The avatar attribute is read-only
		//if (contact.has('avatar')) {
		//  contact.unset('avatar');
		//}
		// ...
	}

	// ...
}
```
