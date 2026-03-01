# 🏗️ Arquitectura - Component Generator System

## Sistema Completo

```
┌───────────────────────────────────────────────────────────────────┐
│                     MCP SERVER (Backbone)                          │
│                    🖥️  Port 7557                                   │
└──────────────────────────┬──────────────────────────────────────────┘
                           │
           ┌───────────────┼───────────────┐
           ↓               ↓               ↓
    ┌────────────┐  ┌────────────┐  ┌──────────────┐
    │ Resources  │  │   Tools    │  │    Events    │
    │            │  │            │  │              │
    │ Markdown   │  │ 2 Tools    │  │ Listeners    │
    │ Chapters   │  │ Registered │  │              │
    └────────────┘  └──────┬─────┘  └──────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ↓                 ↓                 ↓
    ┌──────────────┐  ┌──────────────┐  ┌─────────────┐
    │   Tool 1     │  │   Tool 2     │  │   Tool 3    │
    │              │  │              │  │ (future)    │
    │ search-      │  │ create-      │  │             │
    │ backbone     │  │ component    │  │             │
    │              │  │              │  │             │
    │ Busca texto  │  │ Crea compo-  │  │             │
    │ en capitulos │  │ nentes desde │  │             │
    │              │  │ templates    │  │             │
    └──────────────┘  └───────┬──────┘  └─────────────┘
                              │
                    ┌─────────┴─────────┐
                    │ 2 Sub-Tools       │
                    ↓                   ↓
            ┌──────────────────┐  ┌────────────────────┐
            │ 2.1 Crear compo  │  │ 2.2 Listar tipos   │
            │                  │  │                    │
            │ Parámetros:      │  │ Sin parámetros     │
            │ - name           │  │                    │
            │ - type           │  │ Respuesta:         │
            │ - path           │  │ - Lista de tipos   │
            │                  │  │                    │
            │ Respuesta:       │  │                    │
            │ - OK + archivo   │  │                    │
            │ - Error + msg    │  │                    │
            └────────┬─────────┘  └────────────────────┘
                     │
         ┌───────────┴──────────┐
         │ COMPONENT-GENERATOR  │
         │ Module (NEW)         │
         └───────────┬──────────┘
                     │
     ┌───────────────┼──────────────┬─────────────────┐
     ↓               ↓              ↓                 ↓
  ┌─────────┐   ┌───────────┐  ┌────────────┐   ┌──────────┐
  │Validar  │   │Mapear     │  │ Reemplazar │   │Escribir  │
  │Nombre   │   │Tipo→      │  │Placeholders│   │Archivo   │
  │         │   │Template   │  │            │   │          │
  │ Regex   │   │           │  │  Example   │   │ File I/O │
  │ Check   │   │14 mapeos  │  │  example   │   │          │
  └─────────┘   │ disponibles│  │ example-   │   └──────────┘
                └───────────┘  └────────────┘
                     │
     ┌───────────────┴──────────────┐
     │ TEMPLATES DIRECTORY          │
     │ /templates                   │
     └───────────────┬──────────────┘
                     │
     ┌───────────────┴──────────────┐
     │ 15 Template Files            │
     │                              │
     ├─ ExampleModel.ts            │
     ├─ ExampleView.ts             │
     ├─ ExampleCollection.ts       │
     ├─ ExampleController.ts       │
     ├─ App.ts                     │
     ├─ Bone.ts                    │
     ├─ CollectionView.ts          │
     ├─ ModelView.ts               │
     ├─ Layout.ts                  │
     ├─ Region.ts                  │
     ├─ RouterExample.ts           │
     ├─ ApiService.ts              │
     ├─ StorageService.ts          │
     ├─ Logger.ts                  │
     └─ Loading.ts                 │
     └──────────────────────────────┘
```

---

## Flujo Detallado: create-component

```
┌──────────────────────────────────────────────────────────────┐
│ CLIENTE (Claude, Copilot, etc.)                              │
│                                                              │
│ create-component({                                           │
│   componentName: "User",                                     │
│   componentType: "model",                                    │
│   outputPath: "src/models/User.ts"                          │
│ })                                                           │
└────────────┬─────────────────────────────────────────────────┘
             │
             ↓ MCP Transport (stdio)
             │
┌────────────┴─────────────────────────────────────────────────┐
│ SERVER (src/server.ts)                                       │
│                                                              │
│ 1. Recibe request de tool                                   │
│ 2. Extrae parámetros                                        │
│ 3. Llama generateComponent()                                │
└────────┬───────────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────────────┐
│ COMPONENT-GENERATOR MODULE (src/component-generator.ts)        │
│                                                                │
│ async generateComponent(options)                              │
│ {                                                             │
│   1. validateOutputPath("src/models/User.ts")               │
│      ✓ Verifica que sea ruta segura                        │
│      ✗ Rechaza "../../../etc/passwd"                       │
│                                                              │
│   2. getTemplatePath("model")                               │
│      ✓ "model" → "ExampleModel.ts"                         │
│                                                              │
│   3. fs.readFile("templates/ExampleModel.ts")              │
│      ✓ Lee contenido de template                           │
│      Contenido: "class ExampleModel { ... }"               │
│                                                              │
│   4. replacePlaceholders(content, "User")                   │
│      ✓ "Example" → "User"                                  │
│      ✓ "example" → "user"                                  │
│      ✓ "example-" → "user-"                                │
│      Resultado: "class UserModel { ... }"                  │
│                                                              │
│   5. fs.mkdir("src/models", { recursive: true })           │
│      ✓ Crea directorio si no existe                        │
│                                                              │
│   6. fs.writeFile("src/models/User.ts", content)           │
│      ✓ Escribe archivo generado                            │
│      Resultado: src/models/User.ts ✨ CREADO              │
│                                                              │
│   7. return "Componente User creado exitosamente"           │
│ }                                                            │
└────────┬───────────────────────────────────────────────────┘
         │
         ↓ Respuesta
         │
┌────────────┴─────────────────────────────────────────────────┐
│ SERVER (src/server.ts) - Formatea respuesta                  │
│                                                              │
│ return {                                                    │
│   content: [{                                              │
│     type: "text",                                          │
│     text: "✅ Componente User (tipo: model) ..."           │
│   }]                                                       │
│ }                                                          │
└────────┬─────────────────────────────────────────────────────┘
         │
         ↓ MCP Transport (stdio)
         │
┌────────────┴─────────────────────────────────────────────────┐
│ CLIENTE recibe respuesta:                                    │
│                                                              │
│ ✅ Componente User (tipo: model) creado                     │
│    exitosamente en src/models/User.ts                       │
│                                                              │
│ src/models/User.ts                                          │
│ ├─ class UserModel { ... }                                 │
│ ├─ constructor(options) { ... }                            │
│ ├─ initialize() { ... }                                    │
│ ├─ get defaults() { ... }                                  │
│ └─ ... (resto de métodos heredados)                        │
└──────────────────────────────────────────────────────────────┘
```

---

## Flujo Detallado: list-component-types

```
┌──────────────────────────────────────────────────────────────┐
│ CLIENTE                                                      │
│                                                              │
│ list-component-types()                                      │
└────────────┬─────────────────────────────────────────────────┘
             │
             ↓ MCP Transport
             │
┌────────────┴─────────────────────────────────────────────────┐
│ SERVER (src/server.ts)                                       │
│                                                              │
│ 1. Recibe request                                           │
│ 2. Llama getAvailableComponentTypes()                       │
└────────┬───────────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────────────┐
│ COMPONENT-GENERATOR MODULE                                    │
│                                                                │
│ getAvailableComponentTypes()                                  │
│ {                                                             │
│   return [                                                    │
│     'model',           ← para models/bases de datos          │
│     'view',            ← para vistas/UI                      │
│     'collection',      ← para colecciones                    │
│     'controller',      ← para controladores                  │
│     'app',             ← app principal                       │
│     'bone',            ← clase base                          │
│     'collectionview',  ← vista de colección                  │
│     'modelview',       ← vista de modelo                     │
│     'layout',          ← layouts                             │
│     'region',          ← regiones                            │
│     'router',          ← router                              │
│     'apiservice',      ← servicio API                        │
│     'storageservice',  ← servicio de storage                 │
│     'logger',          ← logger                              │
│     'loading'          ← componente carga                    │
│   ]                                                          │
│ }                                                            │
└────────┬───────────────────────────────────────────────────┘
         │
         ↓ Respuesta
         │
┌────────────┴─────────────────────────────────────────────────┐
│ SERVER formatea respuesta                                    │
│                                                              │
│ return {                                                    │
│   content: [{                                              │
│     type: "text",                                          │
│     text: "Tipos disponibles:\n• model\n• view\n..."      │
│   }]                                                       │
│ }                                                          │
└────────┬─────────────────────────────────────────────────────┘
         │
         ↓ MCP Transport
         │
┌────────────┴─────────────────────────────────────────────────┐
│ CLIENTE recibe:                                              │
│                                                              │
│ Tipos de componentes disponibles:                           │
│   • model                                                   │
│   • view                                                    │
│   • collection                                              │
│   • controller                                              │
│   • app                                                     │
│   • bone                                                    │
│   • collectionview                                          │
│   • modelview                                               │
│   • layout                                                  │
│   • region                                                  │
│   • router                                                  │
│   • apiservice                                              │
│   • storageservice                                          │
│   • logger                                                  │
│   • loading                                                 │
└──────────────────────────────────────────────────────────────┘
```

---

## Transformación de Nombres

```
Entrada: "Product"

┌──────────────────┐
│  replacePlaceholders()
└────────┬─────────┘
         │
    ┌────┴──────────┬───────────────┐
    ↓               ↓               ↓
PascalCase      camelCase       kebab-case
    │               │               │
    ↓               ↓               ↓
 Product         product        product
    │               │               │
    ├─ En template  ├─ En template ├─ En template
    │  "Example"    │  "example"   │  "example-"
    │               │              │
    ↓               ↓              ↓
"ProductModel"  product        product-url
class           variable       identifier
```

### Ejemplo Real en Template

```
TEMPLATE ORIGINAL:
───────────────────
class ExampleModel { }
const example = new ExampleModel();
const exampleUrl = 'api/example/';

                    ↓ replacePlaceholders("Product")

RESULTADO FINAL:
────────────────
class ProductModel { }      ← "Example" → "Product"
const product = new ProductModel();  ← "example" → "product"
const productUrl = 'api/product/';   ← "example" → "product"
```

---

## Tabla de Mapeos: Tipo → Template → Archivo

```
┌────────────────┬──────────────────────┬──────────────────────────────┐
│     Tipo       │     Template File    │     Uso en Proyecto          │
├────────────────┼──────────────────────┼──────────────────────────────┤
│ model          │ ExampleModel.ts      │ src/models/User.ts           │
│ view           │ ExampleView.ts       │ src/views/Dashboard.ts       │
│ collection     │ ExampleCollection.ts │ src/collections/Orders.ts    │
│ controller     │ ExampleController.ts │ src/controllers/Admin.ts     │
│ app            │ App.ts               │ src/App.ts                   │
│ bone           │ Bone.ts              │ src/Bone.ts                  │
│ collectionview │ CollectionView.ts    │ src/CollectionView.ts        │
│ modelview      │ ModelView.ts         │ src/ModelView.ts             │
│ layout         │ Layout.ts            │ src/layouts/Main.ts          │
│ region         │ Region.ts            │ src/Region.ts                │
│ router         │ RouterExample.ts     │ src/routers/Main.ts          │
│ apiservice     │ ApiService.ts        │ src/services/Api.ts          │
│ storageservice │ StorageService.ts    │ src/services/Storage.ts      │
│ logger         │ Logger.ts            │ src/Logger.ts                │
│ loading        │ Loading.ts           │ src/Loading.ts               │
└────────────────┴──────────────────────┴──────────────────────────────┘
```

---

## Validaciones

```
┌─────────────────────────────────────────────────────────┐
│ VALIDACIONES EN create-component                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ 1. Validar componentName                               │
│    ├─ Regex: /^[a-zA-Z_$][a-zA-Z0-9_$]*$/            │
│    ├─ ✓ "User" → válido                              │
│    ├─ ✓ "_user" → válido                             │
│    ├─ ✗ "123user" → inválido (empieza con número)    │
│    └─ ✗ "user-name" → inválido (contiene guión)      │
│                                                          │
│ 2. Validar componentType                               │
│    ├─ Verificar en getTemplatePath()                 │
│    ├─ ✓ "model" → mapea a ExampleModel.ts            │
│    ├─ ✓ "view" → mapea a ExampleView.ts              │
│    └─ ✗ "unknownType" → error                         │
│                                                          │
│ 3. Validar outputPath                                  │
│    ├─ validateOutputPath()                            │
│    ├─ ✓ "src/models/User.ts" → válido                │
│    ├─ ✓ "./src/User.ts" → válido                     │
│    └─ ✗ "../../../etc/passwd" → rechazado            │
│                                                          │
│ 4. Validar permisos de escritura                       │
│    ├─ fs.mkdir() crea directorio                      │
│    ├─ fs.writeFile() intenta escribir                 │
│    ├─ ✓ Permisos OK → archivo creado                 │
│    └─ ✗ Sin permisos → error EACCES                   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## Estructura Compilada

```
TYPESCRIPT SOURCE
src/
├── component-generator.ts      (117 líneas)
├── server.ts                   (169 líneas)
├── mcp-server.ts
├── markdown-reader.ts
└── types.ts

         ↓ npm run build (tsc)

JAVASCRIPT COMPILADO
dist/
├── component-generator.js      (103 líneas)
├── server.js                   (154 líneas)
├── mcp-server.js
├── markdown-reader.js
└── types.js
```

---

## Flujo de Desarrollo

```
Developer escriba:
create-component("User", "model", "src/models/User.ts")
                    ↓
        Validación de parámetros ✓
                    ↓
        Lectura de template ✓
                    ↓
        Transformación de nombres ✓
                    ↓
        Creación de directorios ✓
                    ↓
        Escritura de archivo ✓
                    ↓
        src/models/User.ts CREADO ✨
                    ↓
        Developer personaliza archivo
                    ↓
        Integra en aplicación
                    ↓
        Refactor + Testing
                    ↓
        Deployment
```

---

Esta arquitectura permite:
✅ Generación rápida de componentes
✅ Consistencia en estructura
✅ Reducción de errores manuales
✅ Escalabilidad fácil
✅ Documentación clara
