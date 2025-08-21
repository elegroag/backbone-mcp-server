# Capítulo 3. Enlace de modelos (ESNext + ES Modules + Vite)

Mantener los modelos sincronizados con las vistas es clave para una UI coherente. En este capítulo migramos todos los ejemplos a ES Modules (ESM), plantillas externas importadas como texto (`?raw`) y ejecutándose en Vite. Usaremos las clases base del proyecto: `ModelView`, `CollectionView` y `Layout` ubicadas en `src/ui/common/`.

- Backbone, Underscore y jQuery se importan como módulos ESM.
- Las plantillas se importan como texto y se compilan con `_.template` en tiempo de ejecución.
- La inicialización de controles que tocan el DOM se hace en `onRender`/`onShow` (cuando el elemento ya está en el DOM real).

## Enlace manual: formulario y vista previa

Estructura mínima del módulo:

```js
// apps/contacts/contactEditor.js
import Backbone from 'backbone';
import _ from 'underscore';
import $ from 'jquery';

import { ModelView } from '@/common/ModelView';
import { Layout } from '@/common/Layout';

import formTplText from './templates/contact_form.hbs?raw';
import previewTplText from './templates/contact_preview.hbs?raw';

const formTpl = _.template(formTplText);
const previewTpl = _.template(previewTplText);

// Modelo base
const contact = new Backbone.Model({
  name: 'John Doe',
  phone: '555555555',
  email: 'john.doe@example.com',
});

// Vista de formulario: escribe en el modelo al guardar
class ContactFormView extends ModelView {
  constructor(options) {
    super(options);
    this.model = contact;
    this.template = formTpl;
  }

  events() {
    return {
      "click button[type='submit']": 'saveContact',
      'keyup input': 'inputChanged',
      'change input': 'inputChanged',
    };
  }

  saveContact(e) {
    e.preventDefault();
    this.model.set({
      name: this.$('#name').val(),
      phone: this.$('#phone').val(),
      email: this.$('#email').val(),
    });
  }

  // Enlace bidireccional (DOM -> Modelo)
  inputChanged(e) {
    const $target = $(e.target);
    const id = $target.attr('id');
    this.model.set(id, $target.val());
  }
}

// Vista de vista previa: reacciona a cambios del modelo
class ContactPreviewView extends ModelView {
  constructor(options) {
    super(options);
    this.model = contact;
    this.template = previewTpl;
    this.listenTo(this.model, 'change', this.render);
  }
}

// Layout opcional para componer regiones (form + preview)
class ContactEditorLayout extends Layout {
  constructor(options) {
    super(options);
    this.template = () => `
      <div class="row">
        <div class="col-md-6"><div class="region-form"></div></div>
        <div class="col-md-6"><div class="region-preview"></div></div>
      </div>`;
    this.regions = {
      form: '.region-form',
      preview: '.region-preview',
    };
  }
}

// Bootstrap del ejemplo
const layout = new ContactEditorLayout({ el: '#app' });
layout.render();

const formView = new ContactFormView({ el: document.createElement('div') });
formView.render();
layout.getRegion('form').show(formView);

const previewView = new ContactPreviewView({
  el: document.createElement('div'),
});
previewView.render();
layout.getRegion('preview').show(previewView);
```

Plantillas `./templates/contact_form.hbs` y `./templates/contact_preview.hbs` como archivos externos:

```hbs
<!-- contact_form.hbs -->
<form>
  <div class='form-group'>
    <label for='name'>Name</label>
    <input id='name' class='form-control' type='text' value='<%= name %>' />
  </div>
  <div class='form-group'>
    <label for='phone'>Phone</label>
    <input id='phone' class='form-control' type='text' value='<%= phone %>' />
  </div>
  <div class='form-group'>
    <label for='email'>Email</label>
    <input id='email' class='form-control' type='text' value='<%= email %>' />
  </div>
  <button type='submit' class='btn btn-primary'>Save now</button>
</form>
```

```hbs
<!-- contact_preview.hbs -->
<h3 id="name"><%= name %></h3>
<ul>
  <li id="phone"><%= phone %></li>
  <li id="email"><%= email %></li>
</ul>
```

Notas:

- Para optimizar, puedes reemplazar el re-render completo por una actualización selectiva usando el `change` event y `event.changed` del modelo.

Ejemplo de actualización selectiva:

```js
this.listenTo(this.model, 'change', (event) => {
  const changed = _.keys(event.changed);
  changed.forEach((key) => {
    const $el = this.$('#' + key);
    if ($el && $el.length) $el.html(event.changed[key]);
  });
});
```

## 2) Enlace bidireccional (DOM ↔ Modelo)

Backbone no trae 2-way binding de fábrica; sin embargo, con eventos `keyup/change` y los eventos `change` del modelo logramos una sincronización simple:

- DOM → Modelo: ya mostrado con `inputChanged`.
- Modelo → DOM: escucha `change` y actualiza campos/preview. Si quieres reflejar cambios del modelo en inputs, setea `.val()` de cada input afectado en el handler.

## 3) Listas incrustadas: estrategia con colecciones

Para arreglos embebidos (teléfonos, emails) no uses arrays crudos en el modelo; usa `Backbone.Collection` para aprovechar sus eventos y render incremental con `CollectionView`.

Modelos y colecciones:

```js
// apps/contacts/models/phone.js
import Backbone from 'backbone';

export class Phone extends Backbone.Model {
  defaults() {
    return { description: '', phone: '' };
  }
}

export class PhoneCollection extends Backbone.Collection {
  get model() {
    return Phone;
  }
}
```

Vistas de ítem y lista:

```js
// apps/contacts/phoneList.js
import _ from 'underscore';
import { ModelView } from '@/common/ModelView';
import { CollectionView } from '@/common/CollectionView';

import phoneItemTplText from './templates/phone_item.hbs?raw';
const phoneItemTpl = _.template(phoneItemTplText);

export class PhoneListItemView extends ModelView {
  constructor(options) {
    super(options);
    this.template = phoneItemTpl;
    this.className = 'form-group row';
  }
  events() {
    return {
      'change .description': 'updateDescription',
      'change .phone': 'updatePhone',
      'click .delete': 'deletePhone',
    };
  }
  updateDescription() {
    this.model.set('description', this.$('.description').val());
  }
  updatePhone() {
    this.model.set('phone', this.$('.phone').val());
  }
  deletePhone(e) {
    e.preventDefault();
    this.trigger('phone:deleted', this.model);
  }
}

export class PhoneListView extends CollectionView {
  constructor(options) {
    super(options);
    this.modelView = PhoneListItemView;
  }
}
```

Plantilla del ítem:

```hbs
<!-- phone_item.hbs -->
<div class='col-sm-4 col-md-2'>
  <input
    type='text'
    class='form-control description'
    placeholder='home, office, mobile'
    value='<%= description %>'
  />
</div>
<div class='col-sm-6 col-md-8'>
  <input
    type='text'
    class='form-control phone'
    placeholder='(123) 456 7890'
    value='<%= phone %>'
  />
</div>
<div class='col-sm-2 col-md-2 action-links'>
  <a href='#' class='pull-right delete'>delete</a>
</div>
```

Layout del formulario con regiones para listas:

```js
// apps/contacts/contactFormLayout.js
import { Layout } from '@/common/Layout';

export class ContactFormLayout extends Layout {
  constructor(options) {
    super(options);
    this.template = () => `
      <div class="panel panel-simple">
        <div class="panel-heading">
          Phones <button id="new-phone" class="btn btn-primary btn-sm pull-right">New</button>
        </div>
        <div class="panel-body"><form class="form-horizontal phone-list-container"></form></div>
      </div>
      <div class="panel panel-simple">
        <div class="panel-heading">
          Emails <button id="new-email" class="btn btn-primary btn-sm pull-right">New</button>
        </div>
        <div class="panel-body"><form class="form-horizontal email-list-container"></form></div>
      </div>`;
    this.regions = {
      phones: '.phone-list-container',
      emails: '.email-list-container',
    };
  }
  events() {
    return {
      'click #new-phone': 'addPhone',
      'click #new-email': 'addEmail',
      'click #save': 'saveContact',
      'click #cancel': 'cancel',
    };
  }
  addPhone() {
    this.trigger('phone:add');
  }
  addEmail() {
    this.trigger('email:add');
  }
}
```

Orquestación (controlador ligero):

```js
// apps/contacts/contactEditor.js (continuación)
import { PhoneCollection } from './models/phone';
import { PhoneListView } from './phoneList';
import { ContactFormLayout } from './contactFormLayout';

class ContactEditor {
  showEditor(contactModel) {
    // Crear colecciones desde el modelo principal
    const phones = new PhoneCollection(contactModel.get('phones') || []);
    const emails = new Backbone.Collection(contactModel.get('emails') || []); // análogo a PhoneCollection

    // Vistas
    const layout = new ContactFormLayout({ el: '#editor' });
    layout.render();

    const phonesView = new PhoneListView({
      collection: phones,
      el: document.createElement('div'),
    });
    phonesView.render();

    const emailsView = new PhoneListView({
      collection: emails,
      el: document.createElement('div'),
    });
    emailsView.render();

    layout.getRegion('phones').show(phonesView);
    layout.getRegion('emails').show(emailsView);

    // Alta/baja
    layout.listenTo(layout, 'phone:add', () => phones.add({}));
    layout.listenTo(layout, 'email:add', () => emails.add({}));

    layout.listenTo(phonesView, 'item:phone:deleted', (_view, phone) =>
      phones.remove(phone)
    );
    layout.listenTo(emailsView, 'item:email:deleted', (_view, email) =>
      emails.remove(email)
    );

    // Guardar (serializa colecciones a atributos del modelo)
    layout.saveContact = () => {
      contactModel.set({ phones: phones.toJSON(), emails: emails.toJSON() });
      contactModel.save?.();
    };
  }
}
```

Esta estrategia evita gestionar arrays crudos, delega el render a `CollectionView` y permite añadir/eliminar elementos con mínimo código.

## 4) Validación de datos del modelo

### 4.1 Validación nativa de Backbone

Usa `validate`, `isValid` e `invalid` para validar a nivel de modelo:

```js
class Contact extends Backbone.Model {
  validate(attrs) {
    if (_.isEmpty(attrs.name)) {
      return { attr: 'name', message: 'name is required' };
    }
  }
}

const model = new Contact();
model.on('invalid', (m, error) => {
  // Muestra error en UI (ver sección siguiente)
});

if (!model.isValid()) {
  console.warn(model.validationError);
}
```

### 4.2 Manejo de UI con el validador propio

El proyecto incluye un sistema de validación y helpers de UI en `@/common/ValidationUIHandler` que desacopla reglas de la presentación:

```js
import {
  FormValidator,
  ValidationUIHandler,
} from '@/common/ValidationUIHandler';

// Reglas declarativas
const rules = {
  name: { required: true, minlength: 3, label: 'Nombre' },
  email: { email: true, label: 'Email' },
};

// Datos (por ejemplo, antes de guardar)
const data = {
  name: formView.$('#name').val(),
  email: formView.$('#email').val(),
};

const errors = FormValidator.validate(rules, data);
if (errors) {
  // UI ya es gestionada por ValidationUIHandler.showError()
  return; // cancelar guardado
}

// Guardar si todo ok
model.save?.();
```

Si prefieres la validación 100% nativa de Backbone, puedes mostrar errores en `invalid` usando `ValidationUIHandler`:

```js
model.on('invalid', (_m, error) => {
  // error = { attr, message }
  ValidationUIHandler.showError(error.attr, error.message, true);
});
```

### 4.3 Complemento Backbone.Validation (opcional con Vite/ESM)

Backbone.Validation simplifica la validación con reglas declarativas. En este proyecto, el enfoque recomendado es el validador propio (`@/common/ValidationUIHandler`). Si prefieres usar el plugin:

- Verifica compatibilidad con ESM/Vite. Evita etiquetas `<script>`; instala el paquete desde NPM y cárgalo en tu entry ESM.
- Define reglas en el modelo y haz el bind en la vista.

```js
// Modelo con reglas declarativas
class Contact extends Backbone.Model {
  get validation() {
    return {
      name: { required: true, minLength: 3 },
    };
  }
}

// Vista: activar el plugin
class ContactForm extends Layout {
  // ...
  onRender() {
    Backbone.Validation.bind(this);
  }
}

// Guardado con validación
formLayout.on('save:contact', function () {
  if (!contact.isValid(true)) {
    return; // muestra errores según callbacks
  }
  contact.unset('phones', { silent: true });
  contact.set('phones', phoneCollection.toJSON());
});

// Callbacks de UI (opcional, personaliza según tu markup)
_.extend(Backbone.Validation.callbacks, {
  valid(view, attr) {
    let $el = view.$('#' + attr);
    if ($el.length === 0) $el = view.$('[name~=' + attr + ']');
    if ($el.parent().hasClass('input-group')) $el = $el.parent();
    const $group = $el.closest('.form-group');
    $group.removeClass('has-error').addClass('has-success');
    let $helpBlock = $el.next('.help-block');
    if ($helpBlock.length === 0) $helpBlock = $el.children('.help-block');
    $helpBlock.slideUp({
      done() {
        $helpBlock.remove();
      },
    });
  },
  invalid(view, attr, error) {
    let $el = view.$('#' + attr);
    if ($el.length === 0) $el = view.$('[name~=' + attr + ']');
    $el.focus();
    const $group = $el.closest('.form-group');
    $group.removeClass('has-success').addClass('has-error');
    if ($el.parent().hasClass('input-group')) $el = $el.parent();
    if ($el.next('.help-block').length !== 0) {
      $el.next('.help-block')[0].innerText = error;
    } else if ($el.children('.help-block').length !== 0) {
      $el.children('.help-block')[0].innerText = error;
    } else {
      const $error = $('<div>').addClass('help-block').html(error).hide();
      if ($el.prop('tagName') === 'div' && !$el.hasClass('input-group')) {
        $el.append($error);
      } else {
        $el.after($error);
      }
      $error.slideDown();
    }
  },
});
```

En el próximo capítulo, modularizaremos la aplicación de contactos con ES Modules y gestionaremos dependencias con Vite. Veremos el flujo dev/build/preview y el empaquetado optimizado de Vite.

---

## 5) Sincronización con servidor (fetch, save, destroy)

Backbone integra sincronización REST a través de `Backbone.sync`. Con ES Modules y Vite, puedes usar jQuery como backend AJAX (por defecto) o proveer `Backbone.ajax = window.fetch` con un adaptador. Usaremos los eventos `request/sync/error` para estados de UI.

```js
import Backbone from 'backbone';
import $ from 'jquery';

Backbone.$ = $; // si usas jQuery como backend de AJAX

class Contact extends Backbone.Model {
  get urlRoot() { return '/api/contacts'; }
}

class ContactCollection extends Backbone.Collection {
  get model() { return Contact; }
  get url() { return '/api/contacts'; }
}

// Fetch de un modelo
const c = new Contact({ id: 10 });
c.on('request', () => view.setLoading?.(true));
c.on('sync', () => view.setLoading?.(false));
c.on('error', (_m, xhr) => view.setError?.(xhr?.responseText || 'Error'));
c.fetch();

// Guardar con PATCH (parcial) o PUT (completo)
c.save({ phone: '999-999' }, { patch: true }); // PATCH /api/contacts/10

// Crear en colección
const col = new ContactCollection();
col.fetch({ reset: true }); // GET /api/contacts
col.create({ name: 'Jane' }, { wait: true }); // POST y agrega tras éxito

// Eliminar
c.destroy({ wait: true }); // DELETE /api/contacts/10
```

Opciones útiles:

- `wait: true`: difiere mutación local hasta confirmación del servidor.
- `patch: true`: envía solo atributos cambiados (PATCH).
- `emulateHTTP / emulateJSON`: compatibilidad con APIs legacy.

## 6) Estados de red y UI (request/sync/error)

Integra estados de red con tus vistas (p. ej., `StatefulCollectionView`).

```js
// En una vista que muestra una colección
this.listenTo(this.collection, 'request', () => this.setLoading(true));
this.listenTo(this.collection, 'sync', () => this.setLoading(false));
this.listenTo(this.collection, 'error', (_c, xhr) => this.setError(xhr?.statusText || 'Error'));

// Paginación via query params
this.collection.fetch({ reset: true, data: { page: 1, size: 20 } });
```

## 7) `parse` de modelo/colección y metadatos

Usa `parse` para adaptar payloads `{ data, meta }` sin ensuciar tu lógica de UI.

```js
class Contacts extends Backbone.Collection {
  get url() { return '/api/contacts'; }
  parse(resp) {
    this.total = resp.meta?.total;
    return resp.data; // devuelve array de modelos
  }
}

class Contact extends Backbone.Model {
  parse(attrs) {
    // normaliza atributos al entrar
    if (attrs.full_name && !attrs.name) attrs.name = attrs.full_name;
    return attrs;
  }
}
```

## 8) UI optimista y rollback

Dos estrategias comunes:

- __Optimista__: agrega primero, revierte si falla.

```js
  const m = new Contact({ name: 'Temp' });
  col.add(m);
  m.save(null, {
    error: () => col.remove(m), // rollback
  });
```

- __Con `wait: true`__: agrega tras éxito.

```js
  col.create({ name: 'Jane' }, { wait: true });
```

Para updates, muestra estado deshabilitado/spinner en el ítem y restaura si hay `error`.

## 9) Proxy de desarrollo en Vite (evitar CORS)

Configura un proxy para `/api` en `vite.config.ts`.

```ts
// vite.config.ts
import { defineConfig } from 'vite';
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
```

## 10) Manejo de errores estandarizado

Centraliza el mapeo de códigos HTTP a mensajes y validaciones.

```js
function handleHttpError(xhr, { onValidation, onAuth, onGeneric }) {
  const status = xhr?.status;
  if (status === 400 && xhr.responseJSON?.errors) return onValidation?.(xhr.responseJSON.errors);
  if (status === 401) return onAuth?.();
  return onGeneric?.(xhr?.statusText || 'Unexpected error');
}
```

En `invalid` o en `error` invoca tu `ValidationUIHandler` para reflejar errores en el formulario.

## 11) Pruebas de sincronización (Vitest + MSW)

Usa [MSW](https://mswjs.io/) para interceptar peticiones de `fetch`/XHR en pruebas.

```ts
// tests/setup/msw.ts
import { setupServer } from 'msw/node';
import { rest } from 'msw';

export const server = setupServer(
  rest.get('/api/contacts', (_req, res, ctx) => res(
    ctx.json({ data: [{ id: 1, name: 'A' }], meta: { total: 1 } })
  )),
  rest.post('/api/contacts', async (req, res, ctx) => {
    const body = await req.json();
    return res(ctx.status(201), ctx.json({ id: 2, ...body }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

```js
// tests/contacts/sync.spec.js
import { describe, it, expect, beforeEach } from 'vitest';
import Backbone from 'backbone';

class Contact extends Backbone.Model { get urlRoot() { return '/api/contacts'; } }
class Contacts extends Backbone.Collection {
  get model() { return Contact; }
  get url() { return '/api/contacts'; }
  parse(r) { this.total = r.meta.total; return r.data; }
}

describe('sync', () => {
  let col;
  beforeEach(() => { col = new Contacts(); });

  it('fetch popula colección y meta', async () => {
    await col.fetch({ reset: true });
    expect(col.length).toBe(1);
    expect(col.total).toBe(1);
  });

  it('create con wait:true agrega tras éxito', async () => {
    const m = await col.create({ name: 'B' }, { wait: true });
    expect(m.id).toBe(2);
    expect(col.get(2)).toBeTruthy();
  });
});
```

---

### Conclusiones del capítulo 3

- Sincroniza modelos/colecciones con REST usando `fetch/save/destroy` y eventos `request/sync/error` para estados de UI.
- Usa `parse` para adaptar payloads y `wait/patch` para controlar mutaciones y payloads parciales.
- Configura proxy en Vite para un DX fluido y tests con MSW para endpoints REST.
