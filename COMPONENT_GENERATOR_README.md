# Component Generator Tool - Documentación

## Descripción

Se han agregado dos nuevas tools al servidor MCP para facilitar la creación de componentes Backbone:

### 1. **create-component**
Crea un nuevo componente basado en las templates disponibles.

#### Parámetros:
- **componentName** (string, requerido): Nombre del componente que se va a crear
  - Ejemplo: `MyModel`, `UserController`, `ProductView`
  - Requisitos: Debe ser un nombre válido de JavaScript (alfanuméricos, _ y $)

- **componentType** (string, requerido): Tipo de componente
  - Tipos disponibles: model, view, collection, controller, app, bone, collectionview, modelview, layout, region, router, apiservice, storageservice, logger, loading

- **outputPath** (string, requerido): Ruta donde guardar el archivo generado
  - Ejemplo: `src/models/MyModel.ts`, `src/controllers/UserController.ts`

#### Ejemplo de uso:
```
Tool: create-component
Parámetros:
  - componentName: "User"
  - componentType: "model"
  - outputPath: "src/models/User.ts"

Respuesta:
  ✅ Componente User (tipo: model) creado exitosamente en src/models/User.ts
```

### 2. **list-component-types**
Devuelve una lista de todos los tipos de componentes disponibles.

#### Parámetros:
Ninguno

#### Ejemplo de uso:
```
Tool: list-component-types

Respuesta:
  Tipos de componentes disponibles:
  • model
  • view
  • collection
  • controller
  • app
  • bone
  • collectionview
  • modelview
  • layout
  • region
  • router
  • apiservice
  • storageservice
  • logger
  • loading
```

## Cómo funciona

### Flujo de generación:
1. **Validación**: Se valida que el nombre del componente sea un identificador válido de JavaScript
2. **Búsqueda de template**: Se busca la template correspondiente al tipo de componente en `/templates/`
3. **Reemplazo de placeholders**: 
   - Se buscan instancias de "Example" en la template y se reemplazan por el nombre del componente
   - Se buscan instancias de "example" (minúscula) y se reemplazan por el nombre en camelCase
   - Se buscan instancias de "example-" y se reemplazan por el nombre en kebab-case
4. **Creación de directorio**: Se crea el directorio de salida si no existe
5. **Escritura del archivo**: Se escribe el componente generado en la ruta especificada

### Mapeo de tipos a templates:

| Tipo | Template |
|------|----------|
| model | ExampleModel.ts |
| view | ExampleView.ts |
| collection | ExampleCollection.ts |
| controller | ExampleController.ts |
| app | App.ts |
| bone | Bone.ts |
| collectionview | CollectionView.ts |
| modelview | ModelView.ts |
| layout | Layout.ts |
| region | Region.ts |
| router | RouterExample.ts |
| apiservice | ApiService.ts |
| storageservice | StorageService.ts |
| logger | Logger.ts |
| loading | Loading.ts |

## Ejemplos prácticos

### Crear un modelo de usuario:
```
Tool: create-component
Parámetros:
  - componentName: "User"
  - componentType: "model"
  - outputPath: "src/models/User.ts"
```

### Crear un controlador de productos:
```
Tool: create-component
Parámetros:
  - componentName: "ProductController"
  - componentType: "controller"
  - outputPath: "src/controllers/ProductController.ts"
```

### Crear una vista de dashboard:
```
Tool: create-component
Parámetros:
  - componentName: "Dashboard"
  - componentType: "view"
  - outputPath: "src/views/Dashboard.ts"
```

### Crear una colección de órdenes:
```
Tool: create-component
Parámetros:
  - componentName: "Order"
  - componentType: "collection"
  - outputPath: "src/collections/Orders.ts"
```

## Manejo de errores

### Error: Nombre de componente inválido
```
Entrada: componentName = "123Invalid"
Salida: ❌ Error: El nombre del componente "123Invalid" no es válido. 
        Debe empezar con letra, _ o $ y contener solo caracteres alfanuméricos, _ o $.
```

### Error: Tipo de componente no soportado
```
Entrada: componentType = "invalid"
Salida: ❌ Error: Tipo de componente no soportado: invalid. 
        Tipos disponibles: model, view, collection, ...
```

### Error: No se puede escribir en la ruta especificada
```
Entrada: outputPath = "/sistema/archivo/protegido.ts"
Salida: ❌ Error: EACCES: permission denied, open '/sistema/archivo/protegido.ts'
```

## Notas importantes

- Los nombres de componentes se transforman automáticamente según su uso:
  - PascalCase: Para nombres de clases y archivos
  - camelCase: Para variables e instancias
  - kebab-case: Para identificadores y URLs

- La template se copia tal cual está en `/templates/`, luego se reemplazan los placeholders
- Se recomienda revisar el archivo generado después de crearlo para asegurarse de que sea correcto
- Los comentarios en las templates se mantienen en el archivo generado
