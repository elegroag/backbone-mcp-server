# Capítulo 2. Gestión de vistas (ESM + Vite)

Como hemos visto en el capítulo anterior, las vistas Backbone son responsables de gestionar las interacciones DOM (Document Object Model) entre usuarios y aplicaciones. Una aplicación Backbone típica se compone de muchas vistas con un comportamiento muy específico; por ejemplo, podemos tener una vista para mostrar datos de contacto y otra vista para editarlos. Renderizar una única vista es trivial, pero orquestar un diseño complejo con múltiples vistas puede ser complicado.

En este capítulo modernizamos los ejemplos a ES Modules (ESNext) y un flujo con Vite. Usaremos:

- Imports ESM (`import/export`).
- Plantillas como archivos `.tpl` o `.hbs` importadas con `?raw` y compiladas con `_.template`.
- Backbone + jQuery + Underscore importados como módulos.
- Un enfoque modular por carpetas (`views/`, `templates/`, `modules/`).

En este capítulo aprenderá a:

- Identificar tipos de vistas comunes
- Implementar vistas reutilizables para tipos comunes
- Componer vistas complejas con regiones y diseños

---

## Identificar tipos de vistas

Después de trabajar un tiempo con Backbone se observan casos de uso comunes para las vistas. Definiremos un conjunto reutilizable y modular:

- Vista con modelo: renderiza una plantilla con datos del modelo.
- Vista con colección: renderiza una lista de vistas hija y reacciona a cambios en la colección.
- Región: contenedor que gestiona qué vista se muestra en un nodo destino.
- Diseño (Layout): vista que define estructura y regiones donde se insertarán otras vistas.

Con estas piezas, evitará implementar manualmente `render()` en cada vista, estandarizando el flujo.

---

### Vista de modelo

Implementaremos una vista base que encapsula el algoritmo común: serializar datos del modelo, compilar plantilla y pintar en el DOM.

```js
// src/ui/common/ModelView.js
import Backbone from 'backbone';
import _ from 'underscore';
import $ from 'jquery';

Backbone.$ = $; // Backbone usará jQuery

export class ModelView extends Backbone.View {
	render() {
		const data = this.serializeData();
		const compiled = this.compileTemplate();
		const html = compiled(data);
		this.$el.html(html);
		if (this.onRender) this.onRender();
		return this;
	}

	serializeData() {
		return this.model ? this.model.toJSON() : {};
	}

	// Por defecto compila con underscore. La propiedad `template` debe ser
	// el contenido de la plantilla (string) o una función compilada.
	compileTemplate() {
		if (_.isFunction(this.template)) return this.template;
		return _.template(this.template || '');
	}
}
```

Uso con una plantilla modular (sin `<script type="text/template">` en HTML). Creamos un archivo de plantilla y lo importamos con `?raw`:

```js
// src/ui/modules/contacts/views/ContactView.js
import { ModelView } from '@/common/ModelView';
import tpl from '@/modules/contacts/templates/contact.tpl?raw';

export class ContactView extends ModelView {
	constructor(options) {
		super(options);
		this.template = tpl; // string: se compila en runtime con _.template
		this.className = 'contact-card';
	}
}
```

Ejemplo de plantilla `src/ui/modules/contacts/templates/contact.tpl`:

```tpl
<div class="box thumbnail">
  <div class="caption-container">
    <div class="caption">
      <h5><%= name %></h5>
      <% if (phone) { %>
        <p class="phone no-margin"><%= phone %></p>
      <% } %>
      <% if (email) { %>
        <p class="email no-margin"><%= email %></p>
      <% } %>
    </div>
  </div>
</div>
```

---

### Vista de colección

Renderiza una vista hija por cada modelo y reacciona a `add`, `remove` y `reset`. Mantiene un índice `children` para mapear modelo→vista y facilitar limpieza.

```js
// src/ui/common/CollectionView.js
import Backbone from 'backbone';
import _ from 'underscore';

export class CollectionView extends Backbone.View {
	initialize() {
		this.children = {};
		if (this.collection) {
			this.listenTo(this.collection, 'add', this.modelAdded);
			this.listenTo(this.collection, 'remove', this.modelRemoved);
			this.listenTo(this.collection, 'reset', this.render);
		}
	}

	render() {
		this.closeChildren();
		const html = this.collection.map((model) => {
			const view = this.renderModel(model);
			return view.el;
		});
		this.$el.empty().append(html);
		if (this.onRender) this.onRender();
		return this;
	}

	renderModel(model) {
		const view = new this.modelView({ model });
		this.children[model.cid] = view;
		this.listenTo(view, 'all', (eventName, ...args) => {
			this.trigger(`item:${eventName}`, view, model, ...args);
		});
		view.render();
		return view;
	}

	modelAdded = (model) => {
		const view = this.renderModel(model);
		this.$el.append(view.el);
	};

	modelRemoved = (model) => {
		const view = this.children[model.cid];
		this.closeChildView(view);
	};

	remove() {
		Backbone.View.prototype.remove.call(this);
		this.closeChildren();
	}

	closeChildren() {
		const children = this.children || {};
		_.each(children, (child) => this.closeChildView(child));
	}

	closeChildView(view) {
		if (!view) return;
		if (typeof view.remove === 'function') view.remove();
		this.stopListening(view);
		if (view.model) this.children[view.model.cid] = undefined;
	}

	onShow() {
		// Propaga onShow a hijas (útil para plugins que requieren DOM real)
		const children = this.children || {};
		_.each(children, (child) => child?.onShow?.());
	}
}
```

Uso:

```js
// src/ui/modules/contacts/views/ContactListView.js
import { CollectionView } from '@/common/CollectionView';
import { ContactListItemView } from '@/modules/contacts/views/ContactListItemView';

export class ContactListView extends CollectionView {
	constructor(options) {
		super(options);
		this.modelView = ContactListItemView;
		this.className = 'contact-list';
	}
}
```

Y un `ContactListItemView` basado en `ModelView` con su plantilla modular:

```js
// src/ui/modules/contacts/views/ContactListItemView.js
import { ModelView } from '@/common/ModelView';
import tpl from '@/modules/contacts/templates/contact-list-item.tpl?raw';

export class ContactListItemView extends ModelView {
	constructor(options) {
		super(options);
		this.template = tpl;
		this.className = 'col-xs-12 col-sm-6 col-md-3';
		this.listenTo(this.model, 'change', this.render);
	}

	get events() {
		return {
			'click #delete': 'deleteContact',
			'click #view': 'viewContact',
		};
	}

	deleteContact() {
		this.trigger('contact:delete', this.model);
	}

	viewContact() {
		const id = this.model.get('id');
		// Navegación según tu router
		// App.router.navigate(`contacts/view/${id}`, true);
	}
}
```

---

### Región (Region)

Una región gestiona el intercambio de vistas sobre un mismo nodo destino, limpiando memoria y eventos.

```js
// src/ui/common/Region.js
import $ from 'jquery';

export class Region {
	constructor(options) {
		this.el = options.el; // selector CSS o HTMLElement
	}

	show(view) {
		this.closeView(this.currentView);
		this.currentView = view;
		this.openView(view);
	}

	openView(view) {
		this.ensureEl();
		view.render();
		this.$el.html(view.el);
		view.onShow?.(); // la vista ya está en el DOM real
	}

	closeView(view) {
		if (view?.remove) view.remove();
	}

	ensureEl() {
		if (this.$el) return;
		this.$el = this.el instanceof HTMLElement ? $(this.el) : $(this.el);
	}

	remove() {
		this.closeView(this.currentView);
	}
}
```

---

### Diseño (Layout)

Un Layout define estructura y expone regiones nombradas para insertar vistas.

```js
// src/ui/common/Layout.js
import { ModelView } from '@/common/ModelView';
import { Region } from '@/common/Region';

export class Layout extends ModelView {
	constructor(options) {
		super(options);
		this.regions = this.regions || {}; // { header: 'header', main: '#main' }
	}

	// Tras renderizar, materializa las regiones como instancias Region
	onRender() {
		this._regions = Object.fromEntries(
			Object.entries(this.regions).map(([name, selector]) => [
				name,
				new Region({ el: this.$(selector)[0] || selector }),
			]),
		);
	}

	getRegion(name) {
		return this._regions?.[name];
	}
}
```

Uso de un Layout con plantilla modular:

```js
// src/ui/modules/contacts/views/ContactListLayout.js
import { Layout } from '@/common/Layout';
import tpl from '@/modules/contacts/templates/contact-list-layout.tpl?raw';

export class ContactListLayout extends Layout {
	constructor(options) {
		super(options);
		this.template = tpl;
		this.className = 'row page-container';
		this.regions = {
			actions: '.actions-bar-container',
			list: '.list-container',
		};
	}
}
```

Plantilla `contact-list-layout.tpl`:

```tpl
<div class="actions-bar-container"></div>
<div class="list-container"></div>
<div class="footer text-muted">&copy; 2025</div>
```

Composición:

```js
// src/ui/modules/contacts/ContactList.js
import { Region } from '@/common/Region';
import { ContactListLayout } from '@/modules/contacts/views/ContactListLayout';
import { ContactListView } from '@/modules/contacts/views/ContactListView';
import { ContactListActionBar } from '@/modules/contacts/views/ContactListActionBar';

export function showList(contacts) {
	const region = new Region({ el: '#main' });
	const layout = new ContactListLayout();
	const actionBar = new ContactListActionBar();
	const contactList = new ContactListView({ collection: contacts });

	region.show(layout);
	layout.getRegion('actions').show(actionBar);
	layout.getRegion('list').show(contactList);

	// Escuchar eventos burbujeados desde ítems
	layout.listenTo?.(contactList, 'item:contact:delete', (view, model) => {
		// eliminar contacto
	});
}
```

Acción-bar sencilla:

```js
// src/ui/modules/contacts/views/ContactListActionBar.js
import { ModelView } from '@/common/ModelView';
import tpl from '@/modules/contacts/templates/contact-list-action-bar.tpl?raw';

export class ContactListActionBar extends ModelView {
	constructor(options) {
		super(options);
		this.template = tpl;
		this.className = 'options-bar col-xs-12';
	}
	get events() {
		return { 'click button': 'createContact' };
	}
	createContact() {
		// App.router.navigate('contacts/new', true);
	}
}
```

Plantilla `contact-list-action-bar.tpl`:

```tpl
<button class="btn btn-lg btn-success">Create a new contact</button>
```

---

### Editar información (Formulario)

Formulario basado en `ModelView` con valores por defecto y eventos:

```js
// src/ui/modules/contacts/views/ContactForm.js
import { ModelView } from '@/common/ModelView';
import _ from 'underscore';
import tpl from '@/modules/contacts/templates/contact-form.tpl?raw';

export class ContactForm extends ModelView {
	constructor(options) {
		super(options);
		this.template = tpl;
		this.className = 'form-horizontal';
	}

	get events() {
		return { 'click #save': 'saveContact', 'click #cancel': 'cancel' };
	}

	serializeData() {
		return _.defaults(this.model?.toJSON?.() || {}, {
			name: '',
			birthdate: '',
			phone: '',
			email: '',
			address1: '',
			address2: '',
		});
	}

	saveContact(e) {
		e.preventDefault();
		this.model.set({
			name: this.getInput('#name'),
			birthdate: this.getInput('#birthdate'),
			phone: this.getInput('#phone'),
			email: this.getInput('#email'),
			address1: this.getInput('#address1'),
			address2: this.getInput('#address2'),
		});
		this.trigger('form:save', this.model);
	}

	getInput(selector) {
		return this.$(selector).val();
	}

	cancel() {
		this.trigger('form:cancel');
	}
}
```

Plantilla `contact-form.tpl` (extracto):

```tpl
<div class="panel panel-simple">
  <div class="panel-heading">Edit contact</div>
  <div class="panel-body">
    <form class="form-horizontal">
      <div class="form-group">
        <label for="name" class="col-sm-2 control-label">Name</label>
        <div class="col-sm-10">
          <input id="name" type="text" class="form-control" placeholder="Full name" value="<%= name %>" />
        </div>
      </div>
      <!-- ... resto del formulario ... -->
    </form>
  </div>
  <div class="panel-footer clearfix">
    <div class="panel-buttons">
      <button id="cancel" class="btn btn-default">Cancel</button>
      <button id="save" class="btn btn-success">Save</button>
    </div>
  </div>
</div>
```

---

### Representación de complementos de terceros (con flatpickr)

Muchos plugins requieren que el elemento exista en el DOM; por ello, inicialícelos en `onShow()`, que se ejecuta cuando la vista ya está montada en el DOM vía `Region`.

```js
// src/ui/modules/contacts/views/ContactForm.js
import flatpickr from 'flatpickr';

export class ContactForm extends ModelView {
	// ...
	onShow() {
		const input = this.$('#birthdate')[0];
		if (input) {
			flatpickr(input, { dateFormat: 'Y-m-d' });
		}
	}
}
```

Si usa `CollectionView`, su `onShow()` propaga la llamada a las vistas hijas.

---

### Ciclo de vida y limpieza avanzada

Para evitar fugas de memoria y manejadores de eventos, estandarice la destrucción de vistas.

```js
// src/ui/common/SafeView.js
import Backbone from 'backbone';

export class SafeView extends Backbone.View {
  remove() {
    this.beforeRemove?.(); // Desuscribir timers, observers, listeners manuales
    super.remove();        // Quita del DOM y hace stopListening()
    this.$?.off?.();       // Si unió eventos jQuery manuales
    this.afterRemove?.();
    return this;
  }
}
```

- Use `listenTo` en lugar de `on` para autolimpieza.
- En listas, cierre hijas (ver `CollectionView#closeChildren()`).
- Para recursos externos (maps, pickers), libere en `beforeRemove()`.

### Event bus / PubSub con Backbone.Events

Desacople comunicación entre vistas/controladores con un bus global.

```js
// src/core/eventBus.js
import { Events } from 'backbone';
export const eventBus = {};
Object.assign(eventBus, Events);
```

Uso:

```js
// Emisor
import { eventBus } from '@/core/eventBus';
eventBus.trigger('contacts:create');

// Oyente
eventBus.on('contacts:create', () => {
  // navegar o abrir formulario
});
```

### Estados de UI: loading / empty / error

Gestione estados comunes para una mejor UX.

```js
// src/ui/common/StatefulCollectionView.js
import { CollectionView } from '@/common/CollectionView';

export class StatefulCollectionView extends CollectionView {
  initialize() {
    super.initialize();
    this.loading = false; this.error = null;
  }
  setLoading(v) { this.loading = v; this.render(); }
  setError(err) { this.error = err; this.render(); }
  render() {
    this.$el.empty();
    if (this.loading) { this.$el.html('<div class="state loading">Loading…</div>'); return this; }
    if (this.error)   { this.$el.html(`<div class="state error">${this.error}</div>`); return this; }
    if (!this.collection?.length) { this.$el.html('<div class="state empty">No data</div>'); return this; }
    return super.render();
  }
}
```

Integre con `collection.fetch()` para alternar estados (`request`, `sync`, `error`).

### Renderizado eficiente

- Combine `listenTo(model, 'change', ...)` con `_.debounce` si hay renders frecuentes.
- Render de colecciones en lote: `DocumentFragment` + una sola inserción en DOM.
- Para animaciones/pintados caros, use `requestAnimationFrame`.

```js
// Debounce de render
this.listenTo(this.model, 'change', _.debounce(() => this.render(), 0));

// Batching en CollectionView.render()
const frag = document.createDocumentFragment();
this.collection.each((m) => { const v = this.renderModel(m); frag.appendChild(v.el); });
this.$el.empty().append(frag);

// Programar trabajo pesado
requestAnimationFrame(() => { /* medir, scroll, etc. */ });
```

### HMR con Vite (gotchas y buenas prácticas)

- Plantillas `?raw` se recompilan al guardar; evite cache global.
- Si mantiene vistas vivas durante HMR, acepte/disponibilice el módulo:

```js
let view;
export function start() {
  view = new RootLayout();
  region.show(view);
}

if (import.meta.hot) {
  import.meta.hot.accept();
  import.meta.hot.dispose(() => view?.remove()); // liberar DOM y eventos
}
```

---

### Ejemplo end-to-end: Event Bus + Router + Región

Conectemos la barra de acciones, el bus de eventos y el router para abrir el formulario en la región principal.

```js
// src/ui/modules/contacts/views/ContactListActionBar.js
import { ModelView } from '@/common/ModelView';
import { eventBus } from '@/core/eventBus';
import tpl from '@/modules/contacts/templates/contact-list-action-bar.tpl?raw';

export class ContactListActionBar extends ModelView {
  constructor(options) { super(options); this.template = tpl; this.className = 'options-bar col-xs-12'; }
  get events() { return { 'click button': 'createContact' }; }
  createContact() { eventBus.trigger('contacts:create'); }
}
```

```js
// src/core/router.js
import Backbone from 'backbone';
import { Region } from '@/common/Region';
import { ContactForm } from '@/modules/contacts/views/ContactForm';
import { eventBus } from '@/core/eventBus';

export class AppRouter extends Backbone.Router {
  initialize() {
    this.main = new Region({ el: '#main' });
    // Navegar cuando la UI dispare la creación
    this.listenTo(eventBus, 'contacts:create', () => this.navigate('contacts/new', { trigger: true }));
  }
  get routes() {
    return { 'contacts/new': 'newContact' };
  }
  newContact() {
    const form = new ContactForm({ model: new Backbone.Model() });
    this.main.show(form);
    this.listenTo(form, 'form:save', (model) => {
      // TODO: persistir (collection.create / model.save)
      this.navigate('contacts', { trigger: true });
    });
    this.listenTo(form, 'form:cancel', () => this.navigate('contacts', { trigger: true }));
  }
}
```

```js
// src/app.js (punto de entrada)
import Backbone from 'backbone';
import { AppRouter } from '@/core/router';

const router = new AppRouter();
Backbone.history.start({ pushState: true });

// HMR opcional
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    // liberar listeners del router
    router.stopListening();
  });
}
```

Notas:

- El `eventBus` desacopla la intención de la UI de la navegación.
- La `Region` garantiza que al cambiar de pantalla se limpien vistas previas.
- Puedes ampliar rutas para `contacts` (listado) reutilizando `ContactListLayout` + `ContactListView`.

### Pruebas de vistas con Vitest y jsdom

Config mín. de Vitest:

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'jsdom',
    alias: { '@': '/src/ui' },
  },
});
```

Prueba básica de `ModelView` renderizando una plantilla con datos del modelo:

```js
// tests/ui/ModelView.spec.js
import { describe, it, expect } from 'vitest';
import Backbone from 'backbone';
import { ModelView } from '@/common/ModelView';

describe('ModelView', () => {
  it('renderiza template con datos del modelo', () => {
    const M = Backbone.Model.extend({});
    const model = new M({ name: 'Ada' });
    class TestView extends ModelView {
      constructor(options) {
        super(options);
        this.template = '<span id="n"><%= name %></span>';
      }
    }
    const view = new TestView({ model });
    view.render();
    expect(view.$('#n').text()).toBe('Ada');
  });
});
```

Sugerencias rápidas:

- Use `onShow()` para inicializar plugins dependientes del DOM real dentro de pruebas (monte la vista en un contenedor `document.body`).
- Para `CollectionView`, verifique que se rendericen los ítems y que al hacer `remove/reset` se limpien (p. ej., `expect(container.querySelectorAll(...).length).toBe(0)`).

#### Pruebas adicionales

```js
// tests/ui/CollectionView.spec.js
import { describe, it, expect, beforeEach } from 'vitest';
import Backbone from 'backbone';
import { CollectionView } from '@/common/CollectionView';
import { ModelView } from '@/common/ModelView';

class ItemView extends ModelView {
  constructor(o){ super(o); this.template = '<li class="it"><%= name %></li>'; }
}

class ListView extends CollectionView {
  constructor(o){ super(o); this.modelView = ItemView; this.tagName = 'ul'; }
}

describe('CollectionView', () => {
  let col, view;
  beforeEach(() => { col = new Backbone.Collection([{name:'A'},{name:'B'}]); view = new ListView({ collection: col }); });
  it('renderiza ítems y limpia al resetear', () => {
    view.render();
    expect(view.el.querySelectorAll('.it').length).toBe(2);
    col.reset([]); // dispara render()
    expect(view.el.querySelectorAll('.it').length).toBe(0);
  });
});
```

```js
// tests/ui/Layout.spec.js
import { describe, it, expect } from 'vitest';
import { Layout } from '@/common/Layout';
import { ModelView } from '@/common/ModelView';

class TestLayout extends Layout {
  constructor(o){ super(o); this.template = '<div id="a"></div><div id="b"></div>'; this.regions = { A:'#a', B:'#b' }; }
}
class Child extends ModelView { constructor(o){ super(o); this.template = '<span id="ok">ok</span>'; } onShow(){ this._shown = true; } }

it('crea regiones y monta vistas llamando onShow', () => {
  const layout = new TestLayout(); layout.render();
  document.body.appendChild(layout.el); // simula DOM real
  layout.getRegion('A').show(new Child());
  expect(layout.$('#ok').length).toBe(1);
});
```

---

### Conclusiones

- Modularice vistas, regiones y layouts con ES Modules y plantillas importadas como texto (`?raw`).
- Encapsule renderizado y limpieza para evitar fugas de memoria y eventos.
- Inicialice plugins de terceros en `onShow()` cuando el nodo ya está en el DOM.
- Con Vite, no use `<script type="text/template">` en `index.html`; prefiera archivos de plantilla por módulo para mejor mantenibilidad y HMR.

En el siguiente capítulo veremos cómo sincronizar datos y validarlos, integrando estos componentes de vista en un flujo moderno con Vite.
