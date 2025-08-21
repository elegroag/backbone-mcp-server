## Capítulo 8. Pruebas de aplicaciones Backbone con ES Modules (ES2024) y Vite

Probar tu aplicación no es opcional si buscas calidad, confianza y facilidad para refactorizar. En este capítulo actualizamos el enfoque de pruebas a un stack moderno basado en módulos ES (ES2024) y Vite, usando Vitest como test runner por su integración nativa con Vite. También incluimos breves equivalencias para Jest si ya lo usas en otra parte del proyecto.

En este capítulo verás:

- Qué herramientas modernas usar (Vitest + jsdom, y equivalentes con Jest)
- Cómo estructurar y ejecutar pruebas de unidades y de UI (Backbone Views)
- Cómo simular dependencias y llamadas de red con `vi.mock` y espías
- Mejores prácticas para controladores y subaplicaciones (fachadas)

---

### Herramientas de prueba modernas

- **Runner y aserciones**: Vitest (integrado con Vite). Alternativa: Jest.
- **Entorno DOM**: jsdom (Vitest: `environment: 'jsdom'`).
- **Mocks/Stubs/Spies**: `vi.mock`, `vi.fn`, `vi.spyOn` (o `jest.mock`, `jest.fn`, `jest.spyOn`).
- **Utilidades DOM (opcional)**: Testing Library (`@testing-library/dom`, `@testing-library/user-event`) para interactuar con el DOM de forma más fiable que inspeccionar HTML.
- **Cobertura**: `vitest --coverage` o `jest --coverage`.

Recomendado para Vite: Vitest. Si ya tienes Jest en el proyecto para otros ámbitos (por ejemplo, Node/TypeScript en `src/electron/`), puedes mantenerlo en paralelo y usar Vitest para UI.

---

### Configuración con Vite + Vitest

1. Instala dependencias de test:

```sh
pnpm add -D vitest jsdom @testing-library/dom @testing-library/user-event @testing-library/jest-dom
```

2. Añade el bloque `test` a tu `vite.config.ts` para Vitest:

```ts
// vite.config.ts (añade la sección test)
import { defineConfig } from 'vite';
import { join } from 'path';

export default defineConfig({
	// ...tu configuración actual
	test: {
		environment: 'jsdom',
		setupFiles: ['./src/test/setup.ts'],
		globals: true,
		coverage: {
			provider: 'v8',
			reportsDirectory: 'coverage-ui',
		},
	},
});
```

3. Crea `src/test/setup.ts` con inicialización de entorno para Backbone:

```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import $ from 'jquery';
import Backbone from 'backbone';

// Backbone usa jQuery para eventos y AJAX por defecto
(Backbone as any).$ = $;

// Opcional: polyfills o globals adicionales
// globalThis.fetch = ... (si deseas stub global por defecto)
```

4. Scripts sugeridos (opcional):

```json
{
	"scripts": {
		"test:ui": "vitest",
		"test:ui:watch": "vitest --watch",
		"test:ui:coverage": "vitest run --coverage"
	}
}
```

Ejecuta:

```sh
pnpm run test:ui
```

> Nota: Si prefieres Jest para UI, configura `testEnvironment: 'jsdom'` y un `setupFilesAfterEnv` con `@testing-library/jest-dom`. Las APIs de `describe/it/expect` son equivalentes.

---

## Primeros pasos con Vitest (ESM)

#### Especificaciones y suites

En Vitest, igual que en Jasmine/Jest, usas `describe()` para agrupar y `it()`/`test()` para casos. Aserciones con `expect`.

```ts
// src/test/math.spec.ts
import { describe, it, expect } from 'vitest';
import { sum, subtract, divide } from '@/utils/math';

describe('Math utils', () => {
	it('suma 2 + 2 = 4', () => {
		expect(sum(2, 2)).toBe(4);
	});

	it('resta 3 - 2 = 1', () => {
		expect(subtract(3, 2)).toBe(1);
	});

	it('divide 9 / 3 = 3', () => {
		expect(divide(9, 3)).toBe(3);
	});

	it('lanza error al dividir por 0', () => {
		expect(() => divide(1, 0)).toThrowError();
	});
});
```

Código ESM correspondiente:

```ts
// src/ui/utils/math.ts (ESM + ES2024)
export const sum = (a: number, b: number) => a + b;
export const subtract = (a: number, b: number) => a - b;
export const divide = (a: number, b: number) => {
	if (b === 0) throw new Error('Can not divide by zero');
	return a / b;
};

export const asyncSum = (a: number, b: number) =>
	new Promise<number>((resolve) => setTimeout(() => resolve(a + b), 1500));
```

#### Código asíncrono (sin `done`)

Usa `async/await` y timers falsos cuando aplique.

```ts
import { describe, it, expect, vi } from 'vitest';
import { asyncSum } from '@/utils/math';

describe('asyncSum', () => {
	it('resuelve 4 tras 1500ms', async () => {
		vi.useFakeTimers();
		const promise = asyncSum(2, 2);
		vi.advanceTimersByTime(1500);
		await expect(promise).resolves.toBe(4);
		vi.useRealTimers();
	});
});
```

---

## Probando Modelos y Colecciones (Backbone)

En modelos y colecciones validamos defaults, `url`/`urlRoot` y reglas de negocio. Ejemplo ESM:

```ts
// src/ui/modules/contacts/models/ContactModel.ts
import Backbone from 'backbone';

export default class Contact extends Backbone.Model {
	defaults() {
		return {
			name: '',
			phone: '',
			email: '',
			address1: '',
			address2: '',
			avatar: null as Blob | null,
		};
	}
	url() {
		return '/api/contacts';
	}
}
```

```ts
// src/test/ui/contacts/contact.model.spec.ts
import { describe, it, expect } from 'vitest';
import Contact from '@/modules/contacts/models/ContactModel';

describe('Contact model', () => {
	it('tiene valores por defecto', () => {
		const contact = new Contact();
		expect(contact.get('name')).toBe('');
		expect(contact.get('avatar')).toBeNull();
	});

	it('tiene la url correcta', () => {
		const contact = new Contact();
		expect(contact.url()).toBe('/api/contacts');
	});
});
```

Para colecciones, valida `url` y el `model` asociado.

---

## Probando Vistas (Backbone Views) con jsdom

Objetivo: verificar renderizado, manejo de eventos DOM y sincronización ante cambios del modelo. Puedes usar directamente jQuery en la vista (`view.$`) o Testing Library para queries más robustas.

```ts
// src/ui/modules/contacts/views/ContactFormView.ts
import Backbone from 'backbone';
import _ from 'underscore';
import templateRaw from '../view/hbs/contact_form.hbs?raw';

export default class ContactFormView extends Backbone.View<Backbone.Model> {
	className = 'form-horizontal';
	template = _.template(templateRaw);

	events() {
		return { 'click #save': 'onSave' };
	}

	render() {
		this.$el.html(this.template(this.model?.toJSON() ?? {}));
		return this;
	}

	onSave() {
		this.trigger('form:save', this.model);
	}
}
```

Pruebas de la vista:

```ts
// src/test/ui/contacts/contact-form.view.spec.ts
import { describe, it, expect, vi } from 'vitest';
import Backbone from 'backbone';
import ContactFormView from '@/modules/contacts/views/ContactFormView';

describe('ContactFormView', () => {
	let fakeContact: Backbone.Model;

	beforeEach(() => {
		fakeContact = new Backbone.Model({
			name: 'John Doe',
			twitter: '@john.doe',
			github: 'https://github.com/johndoe',
		});
	});

	it('tiene la clase CSS correcta', () => {
		const view = new ContactFormView({ model: fakeContact });
		expect(view.className).toBe('form-horizontal');
	});

	it('renderiza el HTML con datos del modelo', () => {
		const view = new ContactFormView({ model: fakeContact });
		view.render();
		expect(view.$el.html()).toContain('John Doe');
		expect(view.$el.html()).toContain('@john.doe');
	});

	it('emite form:save al pulsar guardar', () => {
		const view = new ContactFormView({ model: fakeContact });
		const spy = vi.fn();
		view.on('form:save', spy);
		view.render();
		view.$('#save').trigger('click');
		expect(spy).toHaveBeenCalledWith(fakeContact);
	});
});
```

> Consejo: Testing Library (opcional) permite assertions y eventos más cercanos al usuario (`screen.getByLabelText`, `userEvent.click`).

---

## Simulación de dependencias (mocks) en ESM

Sustituye `proxyquireify`/Browserify por `vi.mock()` en Vitest. Esto te permite aislar módulos (vistas hijas, colecciones, etc.) en pruebas de controladores.

```ts
// src/test/ui/contacts/contact-editor.controller.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Backbone from 'backbone';

vi.mock('@/modules/contacts/views/ContactPreview', () => ({
	default: class extends Backbone.View {},
}));
vi.mock('@/modules/contacts/views/PhoneListView', () => ({
	default: class extends Backbone.View {},
}));
vi.mock('@/modules/contacts/views/EmailListView', () => ({
	default: class extends Backbone.View {},
}));

// Ejemplo de un Layout falso minimalista
class FakeFormLayout extends Backbone.View {
	regions = { phones: null as any, emails: null as any, form: null as any, preview: null as any };
	getRegion(name: keyof FakeFormLayout['regions']) {
		return { show: (_v: any) => {} };
	}
}

vi.mock('@/modules/contacts/views/ContactForm', () => ({ default: FakeFormLayout }));

// Importa tras definir los mocks
import ContactEditor from '@/modules/contacts/ContactEditor';

describe('ContactEditor', () => {
	let editor: any;
	let region: { show: (v: any) => void };
	let fakeContact: Backbone.Model;

	beforeEach(() => {
		region = { show: vi.fn() };
		editor = new ContactEditor({ region });
		fakeContact = new Backbone.Model({ name: 'John Doe' });
	});

	it('renderiza el editor en la región dada', () => {
		const spy = vi.spyOn(region, 'show');
		editor.showEditor(fakeContact);
		expect(spy).toHaveBeenCalled();
	});

	it('asigna avatarSelected al seleccionar imagen en el preview', () => {
		const blob = new Blob(['text'], { type: 'text/plain' });
		editor.showEditor(fakeContact);
		editor.uploadAvatar = vi.fn(); // evitar efectos
		// La vista preview fue mockeada; simula el evento si el controlador reexpone la instancia
		editor.contactPreview?.trigger?.('avatar:selected', blob);
		expect(editor.avatarSelected).toEqual(blob);
	});
});
```

Patrones recomendados para controladores:

- Expón instancias de vistas como propiedades (`this.contactPreview`, `this.contactForm`, etc.) para facilitar pruebas.
- Centraliza listeners con `this.listenTo(...)` y emite eventos del controlador cuando corresponda.

---

## Simular llamadas de red

Evita dependencias frágiles en `XMLHttpRequest` o plugins específicos. Con Backbone, es común stubear `Backbone.sync` o `fetch` global:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Backbone from 'backbone';

describe('Guardado de contacto', () => {
	let syncSpy: any;
	beforeEach(() => {
		// Devuelve éxito inmediato y ejecuta callbacks sin realizar red real
		syncSpy = vi.spyOn(Backbone, 'sync').mockImplementation((method, model, options: any) => {
			options?.success?.({});
			return Promise.resolve({});
		});
	});

	it('muestra mensaje de éxito y navega tras guardar', async () => {
		// asume que editor.saveContact(model) invoca model.save => Backbone.sync
		// y que App/Router emite notificaciones/navegación
		// Aquí puedes espiar notify/navigate en tu App fake
		expect(syncSpy).toBeDefined();
	});
});
```

Alternativas:

- **MSW (Mock Service Worker)** para simular endpoints HTTP a nivel de red.
- Espiar `window.fetch` si tu stack usa fetch en lugar de `Backbone.sync`/jQuery.

---

## Probando la fachada (subaplicación)

La fachada (Façade) prepara datos y el controlador adecuado para renderizar. Prueba que:

- Solicita datos al endpoint correcto
- Emite eventos de carga `loading:start` / `loading:stop`
- Instancia el controlador con el modelo esperado y ejecuta su flujo (por ejemplo, `showEditor`)

Ejemplo (modelo ESM y Vitest):

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Backbone from 'backbone';

// Mocks de dependencias
import App from '@/App';
vi.spyOn(App, 'trigger');

import ContactsApp from '@/modules/contacts/AppFacade';

describe('Contacts facade', () => {
	let app: any;

	beforeEach(() => {
		vi.spyOn(Backbone, 'sync').mockImplementation((_m, _mod, options: any) => {
			options?.success?.({ id: '1', name: 'John Doe' });
			return Promise.resolve({});
		});
		app = new ContactsApp({ region: { show: () => {} } });
	});

	it('emite eventos de loading alrededor del fetch', async () => {
		await app.showContactEditorById('1');
		expect(App.trigger).toHaveBeenCalledWith('loading:start');
		expect(App.trigger).toHaveBeenCalledWith('loading:stop');
	});
});
```

---

## Migración rápida desde Jasmine/Karma/Browserify

- **Runner**: Karma/Jasmine → Vitest (o Jest)
- **Módulos**: `require/module.exports` → `import/export`
- **Spies**: `jasmine.createSpy` → `vi.fn()` / `jest.fn()`
- **Ajax**: `jasmine-ajax` → stub de `Backbone.sync`/`fetch`/MSW
- **Proxyquireify**: `proxyquireify` → `vi.mock()` / `jest.mock()`
- **Asíncrono**: `done()` → `async/await` + timers falsos (`vi.useFakeTimers`)

---

## Resumen

- Integra pruebas de UI con Vitest y Vite para un flujo rápido y moderno.
- Escribe módulos ESM, usa `import/export` y elimina dependencias de Browserify/Karma.
- Usa `vi.mock` para aislar dependencias y `Backbone.sync`/`fetch` stub para red.
- Prefiere `async/await` y utilidades DOM (Testing Library) para pruebas robustas.

Con esta base, podrás mantener una batería de pruebas fiable para modelos, vistas, controladores y fachadas en tu aplicación Backbone moderna.
