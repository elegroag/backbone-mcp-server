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

## Conclusión

Migrar Backbone a TypeScript en este stack es directo si se sigue por capas: bases comunes, modelos/colecciones, vistas y routers. Mantén `?raw` + `_.template`, define tipos de atributos por entidad y tipa tus servicios IPC. Así obtienes autocompletado, seguridad de tipos y menos errores en tiempo de ejecución, sin reescrituras masivas.
