# Capítulo 11 · Migración de un proyecto Backbone (jQuery + Underscore) a TypeScript

Este capítulo guía una migración ordenada y gradual de un proyecto Backbone modular que usa jQuery y Underscore a TypeScript (TS), manteniendo ES Modules (ESM), Vite y los patrones del proyecto (plantillas `?raw` + `_.template`, clases base de vistas, alias `@`).

La estrategia está pensada para que puedas migrar por módulos (productos, clientes, etc.) sin detener el desarrollo, con tipado incremental y mínimo riesgo.

---

## Objetivos

- **Incremental**: migrar por etapas, módulo a módulo.
- **Compatibilidad**: mantener ESM + Vite, Electron y organización actual (`src/ui/...`).
- **Productividad**: tipados útiles para `Backbone.Model`, `Backbone.Collection`, `Backbone.View`, `Backbone.Router`.
- **Integración**: jQuery tipado (`JQuery`) y `_.template` tipado, importación de HBS vía `?raw`.
- **Mínimo dolor**: sin reescrituras masivas; convivir .js y .ts durante la transición.

## Prerrequisitos

- Proyecto ya en ESM con Vite (ver capítulos 2–10).
- Node 18+.
- Conocer clases base del proyecto (`src/ui/common/ModelView.js`, `CollectionView.js`, `Layout.js`, etc.).

## Dependencias de desarrollo

Instala TypeScript y definiciones:

```bash
pnpm add -D typescript @types/backbone @types/jquery @types/underscore
```

Si usas lodash en paralelo, instala `@types/lodash` según corresponda.

> Nota: `@types/backbone` ya referencia tipos de `jquery` y `underscore`, pero mantenerlos explícitos ayuda a los IDEs y a evitar resoluciones ambiguas.

## Configuración TypeScript (tsconfig)

Puedes ampliar tu `tsconfig.json` existente o crear uno específico para la UI (ej. `tsconfig.ui.json`). Recomendado (ajusta paths a tu repo):

```jsonc
{
  "extends": "./tsconfig.json", // si ya tienes base TS
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler", // óptimo con Vite (TS 5+)
    "verbatimModuleSyntax": true,    // recomendado con ESM
    "jsx": "preserve",
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "useDefineForClassFields": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "skipLibCheck": true,            // agiliza migración
    "allowJs": true,                 // permite convivir .js y .ts
    "checkJs": false,                // ponlo en true si quieres avisos en .js
    "lib": ["ES2022", "DOM"],
    "types": ["vite/client"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/ui/*"]
      // "#electron/*": ["src/electron/*"] // opcional, sólo si usas Electron
    }
  },
  "include": ["src/ui/**/*.ts", "src/ui/**/*.d.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### Inicio de history y carga perezosa

En el arranque de la UI, inicia el router con `pushState` cuando el servidor soporte rutas limpias:

```ts
// src/ui/main.ts
import Backbone from 'backbone';
import { ProductsRouter } from '@/modules/products/ProductsRouter';

new ProductsRouter();
Backbone.history.start({ pushState: true });
```

Para dividir el bundle, carga vistas/módulos bajo demanda dentro de handlers:

```ts
// dentro de un handler de router
async list() {
  const { ProductsListView } = await import('./view/ProductsListView');
  const view = new ProductsListView({ el: '#app' });
  view.render();
}
```

Nota: `moduleResolution: "Bundler"` y `verbatimModuleSyntax` requieren TypeScript 5+.

Asegúrate que Vite ya resuelve `@` en `vite.config.ts` (capítulos previos). Si no, añade el alias también ahí para que TS e IDE queden alineados.

### Alineación TS y Vite (ESNext)

Para evitar discrepancias entre el tipo de salida y la resolución de módulos:

- Mantén alias `@` en `tsconfig.ui.json` (`compilerOptions.paths`) y en `vite.config.ts` (`resolve.alias`).
- Es válido usar `target: "ES2022"` en TS (análisis de tipos) y `build.target = 'esnext'` en Vite (salida del bundle moderno).
- Usa el plugin `vite-tsconfig-paths` para alinear rutas de TS con Vite automáticamente.

Ejemplo `vite.config.ts`:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  resolve: { alias: { '@': '/src/ui' } },
  build: { target: 'esnext', sourcemap: true },
  plugins: [tsconfigPaths()],
});
```

## Declaraciones de módulos (plantillas y assets)

Para importar plantillas como texto con `?raw` y que TS no se queje, crea/edita un archivo de tipos global, por ejemplo `types/app.d.ts` (crea la carpeta `types/` si no existe):

```ts
// types/app.d.ts
declare module '*.tpl?raw' {
  const src: string;
  export default src;
}

declare module '*.hbs?raw' {
  const src: string;
  export default src;
}

declare module '*.html?raw' {
  const src: string;
  export default src;
}
```

Si importas estilos o imágenes desde TS, considera añadir declaraciones según sea necesario.

### Plantillas, CSP y precompilación

`_.template()` compila usando `new Function` cuando lo haces en runtime, lo cual puede requerir `'unsafe-eval'` en tu CSP. Recomendación:

- Desarrollo: compilar en runtime (más simple).
- Producción: precompilar plantillas para evitar `'unsafe-eval'`.

Opciones de precompilación:

- Mantener Underscore y precompilar con un script propio (transformar `*.tpl` a funciones en build).
- Migrar plantillas a Handlebars precompilado si el proyecto ya lo usa.

Integra estas decisiones con la CSP del Cap. 9 (Helmet), permitiendo `'unsafe-eval'` solo en desarrollo si fuera necesario.

## Integración de Backbone con jQuery en TS

- Importa `jquery` y asígnalo a Backbone para asegurar el uso consistente:

```ts
import $ from 'jquery';
import Backbone from 'backbone';

Backbone.$ = $; // importante para eventos y selecciones
```

- Usa tipos `JQuery` al interactuar con el DOM:

```ts
const $input: JQuery = this.$('input[name="q"]');
```

## Integración de Underscore con TS

- Importa funciones tipadas de `underscore` (o el default):

```ts
import _, { template } from 'underscore';
```

- Compila plantillas con tipos de contexto:

```ts
import formTplSrc from './view/hbs/productos_form_view.tpl?raw';

type ProductoFormCtx = { titulo: string; producto: ProductoAttrs };
const renderForm = template(formTplSrc) as (ctx: ProductoFormCtx) => string;
```

> En TS, `template()` retorna una función de tipo `(data?: object) => string`. Puedes refinarla con el `as` del contexto esperado.

### Helper para plantillas con tipos

Para evitar repetir `as (ctx: ...) => string` en cada vista, centraliza un helper:

```ts
// src/ui/common/templates.ts
import { template } from 'underscore';
export function compileTpl<C>(src: string) {
  return template(src) as (ctx: C) => string;
}
```

Uso:

```ts
import { compileTpl } from '@/common/templates';
import formTplSrc from './hbs/productos_form_view.tpl?raw';
const renderForm = compileTpl<{ producto: ProductoAttrs }>(formTplSrc);
```

## Patrones de tipado para Backbone

### Model

```ts
// src/ui/modules/products/models/ProductoModel.ts
import Backbone from 'backbone';

export type ProductoAttrs = {
  id?: number;
  nombre: string;
  sku: string;
  precio: number;
  activo: boolean;
};

export class ProductoModel extends Backbone.Model<ProductoAttrs> {
  // claves por defecto
  defaults(): Partial<ProductoAttrs> {
    return { activo: true };
  }

  // idAttribute si no es 'id'
  get idAttribute(): string {
    return 'id';
  }

  // validación básica (puedes integrar tu ValidationUIHandler si aplica)
  validate(attrs: ProductoAttrs) {
    if (!attrs.nombre) return 'nombre requerido';
    if (attrs.precio < 0) return 'precio inválido';
    return undefined;
  }
}
```

### Collection

```ts
// src/ui/modules/products/collections/ProductosCollection.ts
import Backbone from 'backbone';
import { ProductoModel, type ProductoAttrs } from '../models/ProductoModel';

export class ProductosCollection extends Backbone.Collection<ProductoModel> {
  model = ProductoModel;
  url = '/api/productos';

  // ejemplo de método tipado
  activos(): ProductoModel[] {
    return this.filter((m) => m.get('activo'));
  }
}
```

### View

```ts
// src/ui/modules/products/view/ProductsFormView.ts
import Backbone from 'backbone';
import $ from 'jquery';
import { template } from 'underscore';
import formTplSrc from './hbs/productos_form_view.tpl?raw';
import { ProductoModel, type ProductoAttrs } from '../models/ProductoModel';

const renderForm = template(formTplSrc) as (ctx: {
  producto: ProductoAttrs;
}) => string;

export class ProductsFormView extends Backbone.View<ProductoModel> {
  // opcional: refinar el tipo de this.$el
  declare $el: JQuery;

  constructor(options: { model: ProductoModel; el: Element | string }) {
    super(options);
    // Asegura el modelo desde el constructor y vincula render
    this.listenTo(this.model, 'change', this.render);
  }

  events() {
    return {
      'submit form': 'onSubmit',
      'click [data-action="cancel"]': 'onCancel',
    } as Backbone.EventsHash;
  }

  render() {
    const html = renderForm({ producto: this.model.toJSON() });
    this.$el.html(html);
    return this;
  }

  onSubmit(e: JQuery.SubmitEvent) {
    e.preventDefault();
    const $form = $(e.currentTarget);
    const attrs: Partial<ProductoAttrs> = {
      nombre: String($form.find('[name="nombre"]').val() || ''),
      sku: String($form.find('[name="sku"]').val() || ''),
      precio: Number($form.find('[name="precio"]').val() || 0),
      activo: Boolean($form.find('[name="activo"]').prop('checked')),
    };
    this.model.set(attrs);
    if (!this.model.validationError) {
      this.trigger('save:producto', this.model);
    }
  }

  onCancel() {
    this.trigger('cancel');
  }
}
```

### Router

```ts
// src/ui/modules/products/ProductsRouter.ts
import Backbone from 'backbone';
import { ProductsFormView } from './view/ProductsFormView';
import { ProductoModel } from './models/ProductoModel';

export class ProductsRouter extends Backbone.Router {
  routes: Backbone.RouterRoutes = {
    'products/new': 'create',
    'products/:id': 'detail',
  };

  create() {
    const view = new ProductsFormView({
      model: new ProductoModel(),
      el: '#app',
    });
    view.render();
  }

  detail(id: string) {
    const view = new ProductsFormView({
      model: new ProductoModel({ id: Number(id) }),
      el: '#app',
    });
    view.render();
  }
}
```

## Uso de clases base del proyecto

Si tu UI ya usa clases base en `src/ui/common/` (por ejemplo `ModelView`, `CollectionView`, `Layout`), migra esas bases primero a `.ts` para facilitar el tipado en cascada. Ejemplo de `ModelView<TModel extends Backbone.Model<any>>` con genéricos y métodos protegidos para render, bind, etc. Así evitas repetir tipos en todas las vistas.

> Recuerda: las bases manejan validación (p. ej., `ValidationUIHandler`) y convenciones de render. Tiparlas primero reduce fricción en todo el árbol.

## Estrategia de migración por etapas

1. **Infra TS**

   - Añade dependencias y `tsconfig.ui.json` (o extiende el existente).
   - Crea declaraciones `*.hbs?raw` y revisa alias en Vite/TS.

2. **Bases comunes** (`src/ui/common/`)

   - Migra a `.ts` las bases (`ModelView`, `CollectionView`, `Layout`, `ValidationUIHandler`).
   - Exporta tipos auxiliares (p. ej. `RenderContext<T>`).

3. **Modelos y Colecciones** por módulo

   - Cambia `*.js` a `*.ts` en `modules/*/models` y `modules/*/collections`.
   - Define `type Attrs` por entidad y úsalo en `Model<Attrs>`.

4. **Vistas clave**

   - Migra `View`s con menos dependencias primero (formularios simples, listados sin subvistas).
   - Tipa `events()` como `Backbone.EventsHash` y argumentos de handlers con tipos de jQuery.

5. **Routers**

   - Migra routers y declara `routes: Backbone.RouterRoutes`.

6. **Servicios e IPC**

   - Centraliza llamadas en `IpcClient.invoke<T>()` y define interfaces de respuesta/DTO compartidos entre Electron y UI (en `types/` o `src/shared/`).

7. **Modo estricto y limpieza**

- Sube `strictness` progresivamente (`noImplicitAny`, `exactOptionalPropertyTypes` si aplica).
- Recomendadas adicionales:
  - `noUncheckedIndexedAccess: true`
  - `useUnknownInCatchVariables: true`
  - `noPropertyAccessFromIndexSignature: true`
  - Elimina `// @ts-ignore` y añade tipos faltantes.

8.**Build/QA**

- Ajusta scripts para compilar/verificar TS. Con Vite, la transpilación corre en dev; para type-check usa `tsc -p tsconfig.ui.json --noEmit` en CI.

## Pruebas (Vitest + DOM + MSW)

Configura entorno DOM para pruebas de vistas:

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'happy-dom', setupFiles: ['src/ui/test/setup.ts'], globals: true },
});
```

Ejemplo mínimo de prueba de vista:

```ts
// src/ui/modules/products/view/ProductsFormView.spec.ts
import { describe, it, expect } from 'vitest';
import { ProductsFormView } from './ProductsFormView';
import { ProductoModel } from '../models/ProductoModel';

describe('ProductsFormView', () => {
  it('renderiza y emite save al enviar', () => {
    const view = new ProductsFormView({ el: document.createElement('div'), model: new ProductoModel() });
    view.render();
    expect(view.$('form').length).toBe(1);
  });
});
```

Mock de API con MSW en tests de integración (opcional) para colecciones/servicios.

## Calidad: ESLint/Prettier y checker en dev

Añade scripts y, si quieres, integra `vite-plugin-checker` para errores TS/ESLint en caliente.

```ts
// vite.config.ts
import Checker from 'vite-plugin-checker';
// ...
plugins: [tsconfigPaths(), Checker({ typescript: true })];
```

## Ejemplo de importación de plantilla con clases base

```ts
// src/ui/modules/products/view/ProductsDetailView.ts
import { ModelView } from '@/common/ModelView'; // suponiendo que ya migraste esta base a TS
import { template } from 'underscore';
import tplSrc from './hbs/products_detail.tpl?raw';
import { ProductoModel } from '../models/ProductoModel';

const renderTpl = template(tplSrc) as (ctx: {
  model: ReturnType<ProductoModel['toJSON']>;
}) => string;

export class ProductsDetailView extends ModelView<ProductoModel> {
  render() {
    this.$el.html(renderTpl({ model: this.model!.toJSON() }));
    return this;
  }
}
```

## Augmentations y tipos globales del proyecto

- **Backbone.$**: fija una sola vez en tu bootstrap de UI:

```ts
import $ from 'jquery';
import Backbone from 'backbone';
Backbone.$ = $;
```

Ubícalo en el bootstrap de la UI (por ejemplo, `src/ui/main.ts` o en tu `startApp()`).

- Para compatibilidad con plugins legacy que esperan globals:

```ts
// opcional y controlado: sólo si algún plugin lo requiere
(window as any).$ = $;
(window as any).jQuery = $;
```

- **Electron/IPC**: tipa `window.electron` o, preferentemente, usa `IpcClient` con genéricos:

```ts
// services/IpcClient.ts
export async function invoke<T>(
  channel: string,
  payload?: unknown
): Promise<T> {
  /* ... */
}
```

- **Módulos compartidos**: define DTOs en `types/` o `src/shared/` y reutilízalos en Electron y UI.

### Fronteras Electron vs Web (tsconfigs separados)

Mantén tipos de Node/Electron fuera de la UI web usando tsconfigs distintos:

```jsonc
// tsconfig.ui.json
{
  "compilerOptions": { "lib": ["ES2022", "DOM"], "types": ["vite/client"], "allowJs": true }
}
// tsconfig.electron.json
{
  "compilerOptions": { "lib": ["ES2022", "DOM"], "types": ["electron", "node"] }
}
```

Configura builds independientes cuando empaquetes Electron.

### Validación de datos (runtime) en IPC/API

Refuerza contratos usando Zod:

```ts
// services/IpcClient.ts
import { z } from 'zod';

export async function invokeParsed<T>(channel: string, payload: unknown, schema: z.ZodType<T>): Promise<T> {
  const result = await window.electron.invoke(channel, payload);
  return schema.parse(result);
}

// usage
const ProductoDto = z.object({ id: z.number(), nombre: z.string(), sku: z.string(), precio: z.number(), activo: z.boolean() });
const dto = await invokeParsed('productos:get', { id: 1 }, ProductoDto);
```

## Gotchas frecuentes

- **this y eventos**: en métodos de vista usa funciones de instancia, Backbone las vincula. Evita perder `this` en callbacks externos; usa arrow functions o `_.bindAll` si es necesario.
- **Atributos del modelo**: usa `get('campo')` y `set({ campo })` con tipos; evita acceso directo a `this.attributes`.
- **Plantillas**: garantiza que el contexto pasado a `template()` coincide con tu tipo `as (...) => string`.
- **jQuery tipos**: eventos: `JQuery.ClickEvent`, `JQuery.SubmitEvent`, etc.
- **Imports ESM**: no mezclar commonjs `require`. Todo `import`.
- **Paths/alias**: alinear `vite.config.ts` y `tsconfig` en `paths`/`resolve.alias`.

## Checklist de cierre por módulo

- **Model/Collection**: definen `type Attrs` y compilan sin `any`s implícitos.
- **View**: `events()` tipado y handlers con tipos de evento jQuery. Render sin `any`.
- **Router**: `routes` tipado y navegación funcional.
- **Plantillas**: importadas con `?raw` y compiladas; contexto tipado.
- **Servicios**: llamadas tipadas vía `IpcClient.invoke<T>()`.
- **Build**: `tsc --noEmit` sin errores y Vite dev/build correctos.

## Scripts útiles

En `package.json` añade (si no los tienes):

```jsonc
{
  "scripts": {
    "typecheck:ui": "tsc -p tsconfig.ui.json --noEmit",
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "coverage": "vitest run --coverage",
    "lint": "eslint \"src/ui/**/*.{ts,js}\"",
    "format": "prettier -w ."
  }
}
```

Ejecuta `pnpm typecheck:ui` en CI para validar tipos sin emitir archivos.

> Tip: añade `rollup-plugin-visualizer` para inspeccionar tamaño de bundles tras build.

## Tipado estricto

  * Tipos específicos para Backbone.js usando la definicion global
```js

declare global {
    namespace Backbone {

        var emulateHTTP: boolean;
        var emulateJSON: boolean;
        // Events
        interface Events {
            on(eventName: string, callback: Function, context?: any): any;
            off(eventName?: string, callback?: Function, context?: any): any;
            trigger(eventName: string, ...args: any[]): any;
            listenTo(object: Events, eventName: string, callback: Function): any;
            stopListening(object?: Events, eventName?: string, callback?: Function): any;
        }

        // Model
        interface Model extends Events {
            constructor(attributes?: any, options?: any): Model;
            id?: string | number;
            cid: string;
            attributes: any;
            changed: any;
            defaults: any;
            validation: any;
            urlRoot?: string;

            get(attribute: string): any;
            set(attributes: any, options?: any): Model;
            unset(attribute: string, options?: any): Model;
            clear(options?: any): Model;
            has(attribute: string): boolean;
            changedAttributes(diff?: any): any;
            previous(attribute?: string): any;
            previousAttributes(): any;
            fetch(options?: any): Promise<Model>;
            save(attributes?: any, options?: any): Promise<Model>;
            destroy(options?: any): Promise<Model>;
            isValid(): boolean;
            validate(attributes: any, options?: any): any;
            url(): string;
            escape(attribute: string): string;
            hasChanged(attribute?: string): boolean;
            toJSON(options?: any): any;
            clone(): Model;
            isNew(): boolean;
            sync(method: string, model: Model, options?: any): any;
        }

        // Collection
        interface Collection extends Events {
            constructor(models?: Model[], options?: any): Collection;
            models: Model[];
            length: number;
            comparator: any;
            model: typeof Model;

            add(models: Model | Model[], options?: any): Collection;
            remove(models: Model | Model[], options?: any): Collection;
            reset(models?: Model[], options?: any): Collection;
            set(models: Model | Model[], options?: any): Collection;
            get(id: string | number): Model | undefined;
            at(index: number): Model | undefined;
            push(model: Model, options?: any): Model;
            pop(options?: any): Model;
            unshift(model: Model, options?: any): Model;
            shift(options?: any): Model;
            slice(begin?: number, end?: number): Model[];
            sort(options?: any): Collection;
            pluck(attribute: string): any[];
            where(properties: any): Model[];
            findWhere(properties: any): Model | undefined;
            first(): Model | undefined;
            last(): Model | undefined;
            size(): number;
            isEmpty(): boolean;
            fetch(options?: any): Promise<Collection>;
            create(attributes: any, options?: any): Model;
            sync(method: string, collection: Collection, options?: any): any;
            parse(response: any, options?: any): any[];
            toJSON(options?: any): any[];
        }

        // View
        interface View extends Events {
            constructor(options?: any): View;
            el: HTMLElement | string;
            $el: JQuery;
            cid: string;
            model?: Model;
            collection?: Collection;
            template?: string | ((data: any) => string);
            events: any;
            render(): View;
            remove(): View;
            make(tagName: string, attributes?: any, content?: string): HTMLElement;
            setElement(element: HTMLElement | string, delegate?: boolean): View;
            delegate(events: string, selector: string, handler: Function): View;
            undelegate(events?: string, selector?: string, handler?: Function): View;
            delegateEvents(events?: any): View;
            undelegateEvents(): View;
        }

        // Router
        interface Router extends Events {
            constructor(options?: any): Router;
            routes: any;

            route(route: string, name: string, callback?: Function): Router;
            navigate(fragment: string, options?: any): Router;
            execute(callback: Function, args: string[], name: string): Router;
            startHistory(options?: any): boolean;
        }

        // History
        interface History {
            start(options?: any): boolean;
            stop(): void;
            navigate(fragment: string, options?: any): boolean;
            getFragment(fragment?: string): string;
        }

        // Sync
        interface SyncOptions {
            method?: string;
            model?: Model | Collection;
            data?: any;
            url?: string;
            success?: (response: any, textStatus: string, xhr: JQuery.jqXHR) => void;
            error?: (xhr: any, textStatus: string, error: any) => void;
            complete?: (xhr: any, textStatus: string) => void;
            timeout?: number;
            beforeSend?: (xhr: any) => void;
            cache?: boolean;
            processData?: boolean;
            dataType?: string;
            emulateHTTP?: boolean;
            emulateJSON?: boolean;
            type?: string;
            contentType?: boolean | string;
        }

        function ajax(options: SyncOptions): any;
        function sync(method: string, model: Model | Collection, options?: SyncOptions): any;

        const history: History;
    }

    // Constructor types
    const Backbone: {
        Model: new (attributes?: any, options?: any) => Backbone.Model;
        Collection: new (models?: Backbone.Model[], options?: any) => Backbone.Collection;
        View: new (options?: any) => Backbone.View;
        Router: new (options?: any) => Backbone.Router;
        Events: Backbone.Events;
        ajax: (options: Backbone.SyncOptions) => any;
        sync: (method: string, model: Backbone.Model | Backbone.Collection, options?: Backbone.SyncOptions) => any;
        history: Backbone.History;
    };

    type BackboneStatic = typeof Backbone;
}

export { };
```

  * Tipado estricto para jQuery
```js
// Tipos específicos para jQuery extendidos para el proyecto
declare global {
    namespace JQuery {
        interface JQueryXHR extends XMLHttpRequest {
            // Propiedades adicionales de jqXHR
            readyState: number;
            status: number;
            statusText: string;
            responseText: string;
            responseJSON: any;
            responseXML: Document;
            getAllResponseHeaders(): string;
            getResponseHeader(header: string): string | null;
            setRequestHeader(header: string, value: string): void;
            overrideMimeType(mimeType: string): void;
            abort(reason?: string): void;
        }
        // AJAX Settings extendidos
        interface AjaxSettings<TData = any, TResult = any> {
            type?: string;
            url?: string;
            data?: TData;
            dataType?: string;
            contentType?: string;
            processData?: boolean;
            cache?: boolean;
            timeout?: number;
            beforeSend?: (xhr: JQueryXHR) => void;
            success?: (data: TResult, textStatus: string, jqXHR: JQueryXHR) => void;
            error?: (xhr: JQueryXHR, textStatus: string, errorThrown: string) => void;
            complete?: (xhr: JQueryXHR, textStatus: string) => void;
            accepts?: { [key: string]: string };
            async?: boolean;
            crossDomain?: boolean;
            global?: boolean;
            ifModified?: boolean;
            isLocal?: boolean;
            jsonp?: string | boolean;
            jsonpCallback?: string | (() => string);
            password?: string;
            scriptCharset?: string;
            traditional?: boolean;
            username?: string;
            xhr?: () => XMLHttpRequest;
            xhrFields?: { [key: string]: any };
        }

        // AJAX Response Types
        interface SuccessTextStatus {
            responseText: string;
            status: number;
            statusText: string;
        }

        interface ErrorTextStatus {
            responseText: string;
            status: number;
            statusText: string;
        }

        // Event Types extendidos
        interface TriggeredEvent<TTarget = any> extends Event {
            delegateTarget: TTarget;
            currentTarget: TTarget;
            target: TTarget;
            relatedTarget: TTarget;
            which: number;
            pageX: number;
            pageY: number;
            result: any;
        }

        // Element manipulation
        interface JQuery<TElement = HTMLElement> {
            // Métodos comunes del proyecto
            find(selector: string): JQuery;
            closest(selector: string): JQuery;
            parent(selector?: string): JQuery;
            parents(selector?: string): JQuery;
            children(selector?: string): JQuery;
            siblings(selector?: string): JQuery;
            next(selector?: string): JQuery;
            prev(selector?: string): JQuery;

            // Manipulación de contenido
            html(): string;
            html(htmlString: string): JQuery;
            text(): string;
            text(textString: string): JQuery;
            val(): any;
            val(value: any): JQuery;

            // CSS y clases
            css(propertyName: string): any;
            css(propertyName: string, value: any): JQuery;
            css(properties: Object): JQuery;
            addClass(className: string): JQuery;
            removeClass(className?: string): JQuery;
            toggleClass(className: string, add?: boolean): JQuery;
            hasClass(className: string): boolean;

            // Atributos
            attr(attributeName: string): string;
            attr(attributeName: string, value: string): JQuery;
            attr(attributes: Object): JQuery;
            removeAttr(attributeName: string): JQuery;
            prop(propertyName: string): any;
            prop(propertyName: string, value: any): JQuery;
            removeProp(propertyName: string): JQuery;

            // Datos
            data(key: string): any;
            data(key: string, value: any): JQuery;
            data(obj: Object): JQuery;
            removeData(key?: string): JQuery;

            // Eventos
            on(events: string, handler: (eventObject: TriggeredEvent) => void): JQuery;
            on(events: string, selector: string, handler: (eventObject: TriggeredEvent) => void): JQuery;
            on(events: Object): JQuery;
            off(events?: string, handler?: Function): JQuery;
            off(events: string, selector: string, handler?: Function): JQuery;
            trigger(eventType: string, data?: any): JQuery;
            triggerHandler(eventType: string, data?: any): any;

            // Formularios
            serialize(): string;
            serializeArray(): JQuerySerializeArrayElement[];

            // Animaciones
            show(duration?: number, complete?: Function): JQuery;
            hide(duration?: number, complete?: Function): JQuery;
            toggle(duration?: number, complete?: Function): JQuery;
            fadeIn(duration?: number, complete?: Function): JQuery;
            fadeOut(duration?: number, complete?: Function): JQuery;
            fadeToggle(duration?: number, complete?: Function): JQuery;
            slideDown(duration?: number, complete?: Function): JQuery;
            slideUp(duration?: number, complete?: Function): JQuery;
            slideToggle(duration?: number, complete?: Function): JQuery;

            // Manipulación DOM
            append(content: string | Element | JQuery): JQuery;
            prepend(content: string | Element | JQuery): JQuery;
            after(content: string | Element | JQuery): JQuery;
            before(content: string | Element | JQuery): JQuery;
            remove(selector?: string): JQuery;
            empty(): JQuery;
            clone(withDataAndEvents?: boolean, deepWithDataAndEvents?: boolean): JQuery;

            // Dimensiones
            width(): number;
            width(value: number | string): JQuery;
            height(): number;
            height(value: number | string): JQuery;
            innerWidth(): number;
            innerHeight(): number;
            outerWidth(includeMargin?: boolean): number;
            outerHeight(includeMargin?: boolean): number;

            // Posición
            offset(): Coordinates;
            offset(coordinates: Coordinates): JQuery;
            position(): Coordinates;
            scrollTop(): number;
            scrollTop(value: number): JQuery;
            scrollLeft(): number;
            scrollLeft(value: number): JQuery;

            // Iteración
            each(callback: (index: number, element: Element) => boolean | void): JQuery;
            map(callback: (index: number, element: Element) => any): JQuery;

            // Filtrado
            filter(selector: string | Element | JQuery | Function): JQuery;
            not(selector: string | Element | JQuery | Function): JQuery;
            is(selector: string | Element | JQuery | Function): boolean;
            has(selector: string | Element): JQuery;
            eq(index: number): JQuery;
            first(): JQuery;
            last(): JQuery;
            slice(start: number, end?: number): JQuery;

            // Traversing
            add(selector: string | Element | JQuery): JQuery;
            andSelf(): JQuery;
            contents(): JQuery;
            end(): JQuery;
        }

        // Static methods
        interface JQueryStatic {
            // AJAX
            ajax(settings: AjaxSettings): JQueryXHR;
            ajax(url: string, settings: AjaxSettings): JQueryXHR;
            get(url: string, data?: any, success?: Function, dataType?: string): JQueryXHR;
            getJSON(url: string, data?: any, success?: Function): JQueryXHR;
            post(url: string, data?: any, success?: Function, dataType?: string): JQueryXHR;

            // Utilities
            each(collection: any[], callback: (index: number, value: any) => boolean | void): any;
            each(collection: Object, callback: (key: string, value: any) => boolean | void): any;
            extend(deep: boolean, target: any, ...objects: any[]): any;
            extend(target: any, ...objects: any[]): any;
            grep(array: any[], callback: Function, invert?: boolean): any[];
            map(array: any[], callback: Function): any[];
            merge(first: any[], second: any[]): any[];
            inArray(value: any, array: any[], fromIndex?: number): number;
            isArray(obj: any): boolean;
            isEmptyObject(obj: any): boolean;
            isFunction(obj: any): boolean;
            isPlainObject(obj: any): boolean;
            isNumeric(value: any): boolean;
            isWindow(obj: any): boolean;
            isXMLDoc(node: Node): boolean;
            type(obj: any): string;
            makeArray(obj: any): any[];
            now(): number;
            parseJSON(json: string): any;
            parseXML(data: string): XMLDocument;
            proxy(fn: Function, context: any): Function;
            trim(str: string): string;
            fadeIn(str: number, callback: Function);
            fadeOut(str: number, callback: Function);
            serializeArray(): any[];
            serialize(): string;

            // Element creation
            parseHTML(data: string, context?: Document, keepScripts?: boolean): any[];

            // Event helpers
            holdReady(hold: boolean): void;
            ready(handler: Function): JQuery;

            // Deferred
            Deferred(beforeStart?: Function): Deferred<any>;
            when(...deferreds: any[]): Deferred<any>;

            // Callbacks
            Callbacks(flags?: string): Callbacks;

            // Data
            data(element: Element, key: string, value?: any): any;
            removeData(element: Element, key?: string): void;

            // Queue
            queue(element: Element, queueName: string, newQueue?: any[]): any;
            dequeue(element: Element, queueName?: string): void;
            delay(duration: number, queueName?: string): JQuery;

            // Effects
            fx: {
                off: boolean;
                speeds: { [key: string]: number };
                step: { [key: string]: Function };
            };

            // Support
            support: {
                ajax: boolean;
                boxModel: boolean;
                changeBubbles: boolean;
                checkClone: boolean;
                checkOn: boolean;
                cors: boolean;
                cssFloat: boolean;
                hrefNormalized: boolean;
                htmlSerialize: boolean;
                leadingWhitespace: boolean;
                noCloneEvent: boolean;
                noCloneChecked: boolean;
                opacity: boolean;
                optDisabled: boolean;
                optSelected: boolean;
                scriptEval: boolean;
                style: boolean;
                submitBubbles: boolean;
                tbody: boolean;
                html5Clone: boolean;
            };
        }

        // Deferred
        interface Deferred<T> {
            done(callback: Function): Deferred<T>;
            fail(callback: Function): Deferred<T>;
            progress(callback: Function): Deferred<T>;
            then(doneCallback: Function, failCallback?: Function, progressCallback?: Function): Deferred<T>;
            always(callback: Function): Deferred<T>;
            reject(args?: any[]): Deferred<T>;
            rejectWith(context: any, args?: any[]): Deferred<T>;
            resolve(args?: any[]): Deferred<T>;
            resolveWith(context: any, args?: any[]): Deferred<T>;
            notify(args?: any[]): Deferred<T>;
            notifyWith(context: any, args?: any[]): Deferred<T>;
            state(): string;
            promise(): Promise<T>;
        }

        // Callbacks
        interface Callbacks {
            add(callback: Function): Callbacks;
            disable(): Callbacks;
            disabled(): boolean;
            empty(): Callbacks;
            fire(...args: any[]): Callbacks;
            fired(): boolean;
            fireWith(context: any, args?: any[]): Callbacks;
            has(callback: Function): boolean;
            lock(): Callbacks;
            locked(): boolean;
            remove(callback: Function): Callbacks;
        }

        // Coordinates
        interface Coordinates {
            top: number;
            left: number;
        }

        // Serialize Array Element
        interface JQuerySerializeArrayElement {
            name: string;
            value: string;
        }

        // XHR
        interface JQueryXHR extends XMLHttpRequest {
            abort(statusText?: string): JQueryXHR;
            done(callback: Function): JQueryXHR;
            fail(callback: Function): JQueryXHR;
            always(callback: Function): JQueryXHR;
            then(doneCallback: Function, failCallback?: Function, progressCallback?: Function): JQueryXHR;
            promise(): Promise<any>;
            overrideMimeType(mimeType: string): JQueryXHR;
            statusCode(map: Object): JQueryXHR;
        }
    }

    // Constructor type
    const $: JQuery;
    const jQuery: JQueryStatic;
    type JQueryStatic = JQuery.JQueryStatic;
}

export { };

```

  * Tipado para Underscorejs usando la definicion global
```js
// Tipos específicos para Underscore.js
declare global {
    namespace Underscore {
        // Template
        interface TemplateSettings {
            evaluate?: RegExp;
            interpolate?: RegExp;
            escape?: RegExp;
        }

        type TemplateFunction = (data?: any) => string;

        // Iterator functions
        type ListIterator<T, TResult> = (value: T, index: number, list: T[]) => TResult;
        type ObjectIterator<T, TResult> = (value: T, key: string, object: T) => TResult;
        type MemoIterator<T, TResult> = (memo: TResult, value: T, index: number, list: T[]) => TResult;
        type Predicate<T> = (value: T) => boolean;
        type CompareFunction<T> = (a: T, b: T) => number;

        // Collection functions
        function each<T>(list: T[], iterator: ListIterator<T, any>, context?: any): void;
        function each<T>(list: { [key: string]: T }, iterator: ObjectIterator<T, any>, context?: any): void;
        function forEach<T>(list: T[], iterator: ListIterator<T, any>, context?: any): void;
        function forEach<T>(list: { [key: string]: T }, iterator: ObjectIterator<T, any>, context?: any): void;
        
        function map<T, TResult>(list: T[], iterator: ListIterator<T, TResult>, context?: any): TResult[];
        function map<T, TResult>(list: { [key: string]: T }, iterator: ObjectIterator<T, TResult>, context?: any): TResult[];
        function collect<T, TResult>(list: T[], iterator: ListIterator<T, TResult>, context?: any): TResult[];
        
        function reduce<T, TResult>(list: T[], iterator: MemoIterator<T, TResult>, memo: TResult, context?: any): TResult;
        function reduce<T, TResult>(list: T[], iterator: MemoIterator<T, TResult>, context?: any): TResult;
        function foldl<T, TResult>(list: T[], iterator: MemoIterator<T, TResult>, memo: TResult, context?: any): TResult;
        function inject<T, TResult>(list: T[], iterator: MemoIterator<T, TResult>, memo: TResult, context?: any): TResult;
        
        function reduceRight<T, TResult>(list: T[], iterator: MemoIterator<T, TResult>, memo: TResult, context?: any): TResult;
        function foldr<T, TResult>(list: T[], iterator: MemoIterator<T, TResult>, memo: TResult, context?: any): TResult;
        
        function find<T>(list: T[], predicate: Predicate<T>, context?: any): T | undefined;
        function detect<T>(list: T[], predicate: Predicate<T>, context?: any): T | undefined;
        
        function filter<T>(list: T[], predicate: Predicate<T>, context?: any): T[];
        function select<T>(list: T[], predicate: Predicate<T>, context?: any): T[];
        
        function where<T>(list: T[], properties: any): T[];
        function findWhere<T>(list: T[], properties: any): T | undefined;
        
        function reject<T>(list: T[], predicate: Predicate<T>, context?: any): T[];
        
        function every<T>(list: T[], predicate?: Predicate<T>, context?: any): boolean;
        function all<T>(list: T[], predicate?: Predicate<T>, context?: any): boolean;
        
        function some<T>(list: T[], predicate?: Predicate<T>, context?: any): boolean;
        function any<T>(list: T[], predicate?: Predicate<T>, context?: any): boolean;
        
        function contains<T>(list: T[], value: T, fromIndex?: number): boolean;
        function includes<T>(list: T[], value: T, fromIndex?: number): boolean;
        
        function invoke<T>(list: T[], methodName: string, ...args: any[]): any[];
        function pluck<T>(list: T[], propertyName: string): any[];
        
        function max<T>(list: T[], iterator?: ListIterator<T, any>, context?: any): T;
        function min<T>(list: T[], iterator?: ListIterator<T, any>, context?: any): T;
        
        function sortBy<T>(list: T[], iterator?: ListIterator<T, any>, context?: any): T[];
        
        function groupBy<T>(list: T[], iterator: ListIterator<T, any>, context?: any): { [key: string]: T[] };
        function indexBy<T>(list: T[], iterator: ListIterator<T, any>, context?: any): { [key: string]: T };
        function countBy<T>(list: T[], iterator: ListIterator<T, any>, context?: any): { [key: string]: number };
        
        function shuffle<T>(list: T[]): T[];
        function sample<T>(list: T[], n?: number): T | T[];
        
        function toArray<T>(list: T[]): T[];
        function size<T>(list: T[]): number;
        
        function partition<T>(list: T[], predicate: Predicate<T>, context?: any): [T[], T[]];

        // Array functions
        function first<T>(array: T[], n?: number): T | T[];
        function head<T>(array: T[], n?: number): T | T[];
        function take<T>(array: T[], n?: number): T | T[];
        
        function initial<T>(array: T[], n?: number): T[];
        
        function last<T>(array: T[], n?: number): T | T[];
        
        function rest<T>(array: T[], n?: number): T[];
        function tail<T>(array: T[], n?: number): T[];
        function drop<T>(array: T[], n?: number): T[];
        
        function compact<T>(array: (T | null | undefined | false | 0 | '')[]): T[];
        
        function flatten(array: any[], shallow?: boolean): any[];
        
        function without<T>(array: T[], ...values: T[]): T[];
        
        function union<T>(...arrays: T[][]): T[];
        
        function intersection<T>(...arrays: T[][]): T[];
        
        function difference<T>(array: T[], ...others: T[][]): T[];
        
        function uniq<T>(array: T[], isSorted?: boolean, iterator?: ListIterator<T, any>, context?: any): T[];
        function unique<T>(array: T[], isSorted?: boolean, iterator?: ListIterator<T, any>, context?: any): T[];
        
        function zip<T>(...arrays: T[][]): T[][];
        
        function unzip<T>(array: T[][]): T[][];
        
        function object<T>(list: string[], values?: T[]): { [key: string]: T };
        function object(list: any[]): { [key: string]: any };
        
        function indexOf<T>(array: T[], value: T, isSorted?: boolean): number;
        
        function lastIndexOf<T>(array: T[], value: T, fromIndex?: number): number;
        
        function sortedIndex<T>(array: T[], value: T, iterator?: ListIterator<T, any>, context?: any): number;
        
        function findIndex<T>(array: T[], predicate: Predicate<T>, context?: any): number;
        
        function findLastIndex<T>(array: T[], predicate: Predicate<T>, context?: any): number;
        
        function range(start: number, stop?: number, step?: number): number[];

        // Function functions
        function bind(func: Function, ...args: any[]): Function;
        function partial(func: Function, ...args: any[]): Function;
        function bindAll(object: any, ...methodNames: string[]): void;
        function memoize(func: Function, hasher?: Function): Function;
        function delay(func: Function, wait: number, ...args: any[]): number;
        function defer(func: Function, ...args: any[]): number;
        function throttle(func: Function, wait: number, options?: { leading?: boolean; trailing?: boolean }): Function;
        function debounce(func: Function, wait: number, immediate?: boolean): Function;
        function once(func: Function): Function;
        function wrap(func: Function, wrapper: Function): Function;
        function negate(predicate: Function): Function;
        function compose(...functions: Function[]): Function;
        function after(count: number, func: Function): Function;
        function before(count: number, func: Function): Function;
        function restArgs(func: Function): Function;

        // Object functions
        function keys(object: any): string[];
        function allKeys(object: any): string[];
        function values(object: any): any[];
        function mapObject(object: any, iterator: ObjectIterator<any, any>, context?: any): any[];
        function pairs(object: any): [string, any][];
        function invert(object: any): { [key: string]: any };
        function functions(object: any): string[];
        function methods(object: any): string[];
        function extend(object: any, ...sources: any[]): any;
        function extendOwn(object: any, ...sources: any[]): any;
        function assign(object: any, ...sources: any[]): any;
        function findKey(object: any, predicate: Predicate<any>, context?: any): string | undefined;
        function pick(object: any, ...keys: string[]): any;
        function omit(object: any, ...keys: string[]): any;
        function defaults(object: any, ...defaults: any[]): any;
        function clone(object: any): any;
        function tap(object: any, interceptor: Function): any;
        function has(object: any, key: string): boolean;
        function property(key: string): Function;
        function propertyOf(object: any): Function;
        function matcher(attrs: any): Predicate<any>;
        function matches(attrs: any): Predicate<any>;
        function isEqual(a: any, b: any): boolean;
        function isMatch(object: any, properties: any): boolean;
        function isEmpty(value: any): boolean;
        function isElement(value: any): boolean;
        function isArray(value: any): value is any[];
        function isObject(value: any): boolean;
        function isArguments(value: any): boolean;
        function isFunction(value: any): value is Function;
        function isString(value: any): value is string;
        function isNumber(value: any): value is number;
        function isFinite(value: any): boolean;
        function isBoolean(value: any): value is boolean;
        function isDate(value: any): value is Date;
        function isRegExp(value: any): value is RegExp;
        function isError(value: any): value is Error;
        function isSymbol(value: any): boolean;
        function isMap(value: any): boolean;
        function isWeakMap(value: any): boolean;
        function isSet(value: any): boolean;
        function isWeakSet(value: any): boolean;
        function isDataView(value: any): boolean;
        function isArrayBuffer(value: any): boolean;
        function isTypedArray(value: any): boolean;

        // Utility functions
        function noConflict(): UnderscoreStatic;
        function identity<T>(value: T): T;
        function constant<T>(value: T): () => T;
        function noop(): void;
        function property(path: string[]): Function;
        function propertyOf(object: any): Function;
        function matcher(attrs: any): Predicate<any>;
        function matches(attrs: any): Predicate<any>;
        function times<T>(n: number, iterator: (n: number) => T, context?: any): T[];
        function random(min?: number, max?: number): number;
        function mixin(object: any): void;
        function iteratee(value: any, context?: any): Function;
        function uniqueId(prefix?: string): string;
        function escape(string: string): string;
        function unescape(string: string): string;
        function result(object: any, property: string, fallback?: any): any;
        function now(): number;
        function template(templateText: string, settings?: TemplateSettings): TemplateFunction;
    }

    // Constructor type
    const _: UnderscoreStatic;
    type UnderscoreStatic = typeof Underscore;
}

export {};
```

  * Tipado estricto para sweetalert2 usando la definicion global
```js
declare global {

    namespace Swal {
        function fire<T = any>(options: SweetAlertOptions): Promise<SweetAlertResult<Awaited<T>>>
        function fire<T = any>(title?: string, html?: string, icon?: SweetAlertIcon): Promise<SweetAlertResult<Awaited<T>>>
        function mixin(options: SweetAlertOptions): typeof Swal
        function isVisible(): boolean
        function update(options: Pick<SweetAlertOptions, SweetAlertUpdatableParameters>): void
        function close(result?: Partial<SweetAlertResult>): void
        function getContainer(): HTMLElement | null
        function getPopup(): HTMLElement | null
        function getTitle(): HTMLElement | null
        function getProgressSteps(): HTMLElement | null
        function getHtmlContainer(): HTMLElement | null
        function getImage(): HTMLElement | null
        function getCloseButton(): HTMLButtonElement | null
        function getIcon(): HTMLElement | null
        function getIconContent(): HTMLElement | null
        function getConfirmButton(): HTMLButtonElement | null
        function getDenyButton(): HTMLButtonElement | null
        function getCancelButton(): HTMLButtonElement | null
        function getActions(): HTMLElement | null
        function getFooter(): HTMLElement | null
        function getTimerProgressBar(): HTMLElement | null
        function getFocusableElements(): readonly HTMLElement[]
        function enableButtons(): void
        function disableButtons(): void
        function showLoading(buttonToReplace?: HTMLButtonElement | null): void
        function hideLoading(): void
        function isLoading(): boolean
        function clickConfirm(): void
        function clickDeny(): void
        function clickCancel(): void
        function showValidationMessage(validationMessage: string): void
        function resetValidationMessage(): void
        function getInput(): HTMLInputElement | null
        function disableInput(): void
        function enableInput(): void
        function getValidationMessage(): HTMLElement | null
        function getTimerLeft(): number | undefined
        function stopTimer(): number | undefined
        function resumeTimer(): number | undefined
        function toggleTimer(): number | undefined
        function isTimerRunning(): boolean | undefined
        function increaseTimer(ms: number): number | undefined
        function bindClickHandler(attribute?: string): void
        function isValidParameter(paramName: string): paramName is keyof SweetAlertOptions
        function isUpdatableParameter(paramName: string): paramName is SweetAlertUpdatableParameters
        function argsToParams(params: SweetAlertArrayOptions | readonly [SweetAlertOptions]): SweetAlertOptions

        const DismissReason: {
            readonly cancel: 'cancel'
            readonly backdrop: 'backdrop'
            readonly close: 'close'
            readonly esc: 'esc'
            readonly timer: 'timer'
        }

        const version: string
    }

    interface SweetAlertHideShowClass {
        backdrop?: string | readonly string[]
        icon?: string | readonly string[]
        popup?: string | readonly string[]
    }

    type Awaited<T> = T extends Promise<infer U> ? U : T
    type SyncOrAsync<T> = T | Promise<T> | { toPromise: () => T }
    type ValueOrThunk<T> = T | (() => T)

    export type SweetAlertArrayOptions = readonly [string?, string?, SweetAlertIcon?]
    export type SweetAlertGrow = 'row' | 'column' | 'fullscreen' | false
    export type SweetAlertHideClass = SweetAlertHideShowClass
    export type SweetAlertShowClass = Readonly<SweetAlertHideShowClass>
    export type SweetAlertIcon = 'success' | 'error' | 'warning' | 'info' | 'question'
    export type SweetAlertEventName = 'didRender' | 'willOpen' | 'didOpen' | 'willClose' | 'didClose' | 'didDestroy'

    export type SweetAlertInput =
        | 'text' | 'email' | 'password' | 'number' | 'tel' | 'search' | 'range'
        | 'textarea' | 'select' | 'radio' | 'checkbox' | 'file' | 'url'
        | 'date' | 'datetime-local' | 'time' | 'week' | 'month'

    type SweetAlertStringInput = Exclude<SweetAlertInput, 'file'>

    type SweetAlertInputValidator =
        | {
            input?: SweetAlertStringInput
            inputValidator?: (value: string) => SyncOrAsync<string | null | false | void>
        }
        | {
            input: 'file'
            inputValidator?: (file: File | FileList | null) => SyncOrAsync<string | null | false | void>
        }

    export type SweetAlertTheme =
        | 'light' | 'dark' | 'auto' | 'minimal' | 'borderless'
        | 'bootstrap-4' | 'bootstrap-4-light' | 'bootstrap-4-dark'
        | 'bootstrap-5' | 'bootstrap-5-light' | 'bootstrap-5-dark'
        | 'material-ui' | 'material-ui-light' | 'material-ui-dark'
        | 'embed-iframe' | 'bulma' | 'bulma-light' | 'bulma-dark'

    export type SweetAlertPosition =
        | 'top' | 'top-start' | 'top-end' | 'top-left' | 'top-right'
        | 'center' | 'center-start' | 'center-end' | 'center-left' | 'center-right'
        | 'bottom' | 'bottom-start' | 'bottom-end' | 'bottom-left' | 'bottom-right'

    export type SweetAlertUpdatableParameters =
        | 'allowEscapeKey' | 'allowOutsideClick' | 'background' | 'buttonsStyling'
        | 'cancelButtonAriaLabel' | 'cancelButtonColor' | 'cancelButtonText'
        | 'closeButtonAriaLabel' | 'closeButtonHtml' | 'confirmButtonAriaLabel'
        | 'confirmButtonColor' | 'confirmButtonText' | 'currentProgressStep'
        | 'customClass' | 'denyButtonAriaLabel' | 'denyButtonColor' | 'denyButtonText'
        | 'didClose' | 'didDestroy' | 'footer' | 'hideClass' | 'html' | 'icon'
        | 'iconColor' | 'imageAlt' | 'imageHeight' | 'imageUrl' | 'imageWidth'
        | 'preConfirm' | 'preDeny' | 'progressSteps' | 'reverseButtons'
        | 'showCancelButton' | 'showCloseButton' | 'showConfirmButton' | 'showDenyButton'
        | 'text' | 'title' | 'titleText' | 'theme' | 'willClose'

    export type DismissReason = 'cancel' | 'backdrop' | 'close' | 'esc' | 'timer'

    export interface SweetAlertCustomClass {
        container?: string | readonly string[]
        popup?: string | readonly string[]
        title?: string | readonly string[]
        closeButton?: string | readonly string[]
        icon?: string | readonly string[]
        image?: string | readonly string[]
        htmlContainer?: string | readonly string[]
        input?: string | readonly string[]
        inputLabel?: string | readonly string[]
        validationMessage?: string | readonly string[]
        actions?: string | readonly string[]
        confirmButton?: string | readonly string[]
        denyButton?: string | readonly string[]
        cancelButton?: string | readonly string[]
        loader?: string | readonly string[]
        footer?: string | readonly string[]
        timerProgressBar?: string | readonly string[]
    }

    export interface SweetAlertResult<T = any> {
        readonly isConfirmed: boolean
        readonly isDenied: boolean
        readonly isDismissed: boolean
        readonly value?: T
        readonly dismiss?: DismissReason
    }

    export type SweetAlertOptions = SweetAlertInputValidator & {
        title?: string | HTMLElement | JQuery
        titleText?: string
        text?: string
        html?: string | HTMLElement | JQuery
        icon?: SweetAlertIcon
        iconColor?: string
        iconHtml?: string
        footer?: string | HTMLElement | JQuery
        template?: string | HTMLTemplateElement
        backdrop?: boolean | string
        toast?: boolean
        draggable?: boolean
        target?: string | HTMLElement | null
        width?: number | string
        padding?: number | string
        color?: string
        background?: string
        position?: SweetAlertPosition
        grow?: SweetAlertGrow
        animation?: boolean
        theme?: SweetAlertTheme
        showClass?: SweetAlertShowClass
        hideClass?: SweetAlertHideClass
        customClass?: SweetAlertCustomClass
        timer?: number
        timerProgressBar?: boolean
        heightAuto?: boolean
        allowOutsideClick?: ValueOrThunk<boolean>
        allowEscapeKey?: ValueOrThunk<boolean>
        allowEnterKey?: ValueOrThunk<boolean>
        stopKeydownPropagation?: boolean
        keydownListenerCapture?: boolean
        showConfirmButton?: boolean
        showDenyButton?: boolean
        showCancelButton?: boolean
        confirmButtonText?: string
        denyButtonText?: string
        cancelButtonText?: string
        confirmButtonColor?: string
        denyButtonColor?: string
        cancelButtonColor?: string
        confirmButtonAriaLabel?: string
        denyButtonAriaLabel?: string
        cancelButtonAriaLabel?: string
        buttonsStyling?: boolean
        reverseButtons?: boolean
        focusConfirm?: boolean
        focusDeny?: boolean
        focusCancel?: boolean
        returnFocus?: boolean
        showCloseButton?: boolean
        closeButtonHtml?: string
        closeButtonAriaLabel?: string
        loaderHtml?: string
        showLoaderOnConfirm?: boolean
        showLoaderOnDeny?: boolean
        preConfirm?(inputValue: any): SyncOrAsync<any>
        preDeny?(value: any): SyncOrAsync<any | void>
        imageUrl?: string | null
        imageWidth?: number | string
        imageHeight?: number | string
        imageAlt?: string
        inputLabel?: string
        inputPlaceholder?: string
        inputValue?: SyncOrAsync<string | number | File | FileList> | null
        inputOptions?: SyncOrAsync<ReadonlyMap<string, string> | Record<string, any>>
        inputAutoFocus?: boolean
        inputAutoTrim?: boolean
        inputAttributes?: Record<string, string>
        returnInputValueOnDeny?: boolean
        validationMessage?: string
        progressSteps?: readonly string[]
        currentProgressStep?: number
        progressStepsDistance?: number | string
        willOpen?(popup: HTMLElement): void
        didOpen?(popup: HTMLElement): void
        didRender?(popup: HTMLElement): void
        willClose?(popup: HTMLElement): void
        didClose?(): void
        didDestroy?(): void
        on?(event: SweetAlertEventName, handler: () => void): void
        once?(event: SweetAlertEventName, handler: () => void): void
        off?(event?: SweetAlertEventName, handler?: () => void): void
        scrollbarPadding?: boolean
        topLayer?: boolean
    }

}

export = Swal;

```
