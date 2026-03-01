# Resumen de Cambios - Component Generator Tool para MCP

## 📋 Descripción General

Se ha implementado una nueva herramienta (tool) en el servidor MCP de Backbone que permite crear componentes automáticamente basados en las templates disponibles. Esto acelera significativamente el desarrollo al automatizar la creación de nuevos componentes.

## 📁 Archivos Modificados/Creados

### 1. **src/component-generator.ts** ✨ (NUEVO)
   - **Propósito**: Módulo generador de componentes
   - **Funcionalidades principales**:
     - `generateComponent()`: Crea un componente a partir de una template
     - `getTemplatePath()`: Mapea tipos de componentes a archivos de template
     - `replacePlaceholders()`: Reemplaza "Example" y "example" por el nombre del componente
     - `getAvailableComponentTypes()`: Devuelve lista de tipos soportados
     - `validateOutputPath()`: Valida la ruta de salida por seguridad
   
   - **Tipos de componentes soportados**: 14
     - model, view, collection, controller, app, bone, collectionview, modelview, layout, region, router, apiservice, storageservice, logger, loading

### 2. **src/server.ts** 🔧 (MODIFICADO)
   - **Cambios**:
     - Agregada importación: `import { generateComponent, getAvailableComponentTypes } from './component-generator.js';`
     - **Nueva Tool 1**: `create-component`
       - Parámetros: componentName, componentType, outputPath
       - Validación: nombre válido de JavaScript
       - Respuesta: confirmación de creación o mensaje de error
     
     - **Nueva Tool 2**: `list-component-types`
       - Sin parámetros
       - Devuelve: lista de tipos de componentes disponibles

### 3. **COMPONENT_GENERATOR_README.md** 📖 (NUEVO)
   - Documentación completa de las nuevas tools
   - Mapeo de tipos a templates
   - Ejemplos de uso
   - Manejo de errores
   - Detalles de transformaciones de nombres

### 4. **examples/component-generator-usage.ts** 📚 (NUEVO)
   - Archivo de ejemplo completo
   - 7 ejemplos prácticos:
     1. Listar tipos de componentes
     2. Crear un modelo
     3. Crear un controlador
     4. Crear una vista
     5. Crear una colección
     6. Error con nombre inválido
     7. Error con tipo no soportado

## 🚀 Cómo Usar

### Tool 1: create-component

```
Tool: create-component

Parámetros requeridos:
  - componentName: "MyModel" (nombre del componente)
  - componentType: "model" (tipo de componente)
  - outputPath: "src/models/MyModel.ts" (ruta de salida)
```

**Ejemplo de uso:**
```
Entrada:
  componentName: "User"
  componentType: "model"
  outputPath: "src/models/User.ts"

Salida:
  ✅ Componente User (tipo: model) creado exitosamente en src/models/User.ts
```

### Tool 2: list-component-types

```
Tool: list-component-types

Sin parámetros
```

**Salida:**
```
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

## 🔄 Flujo de Generación

```
┌─────────────────────────────────────┐
│ 1. Validar nombre (JavaScript ID)   │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 2. Mapear tipo → template file      │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 3. Leer contenido de template       │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 4. Reemplazar placeholders:         │
│    - Example → ComponentName        │
│    - example → componentName        │
│    - example- → component-name      │
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 5. Crear directorio (si es necesario)
└──────────┬──────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│ 6. Escribir archivo en outputPath   │
└─────────────────────────────────────┘
```

## ✅ Compilación

```bash
cd /home/elegro/Mcp/Backbone
npm run build
```

Genera:
- dist/component-generator.js
- dist/server.js (actualizado)

## 🎯 Casos de Uso

### 1. Crear modelo de Usuario
```
create-component(
  "User",
  "model",
  "src/models/User.ts"
)
```

### 2. Crear controlador de Productos
```
create-component(
  "ProductController",
  "controller",
  "src/controllers/ProductController.ts"
)
```

### 3. Crear vista de Dashboard
```
create-component(
  "Dashboard",
  "view",
  "src/views/DashboardView.ts"
)
```

### 4. Crear colección de Órdenes
```
create-component(
  "Order",
  "collection",
  "src/collections/OrderCollection.ts"
)
```

## ⚠️ Validaciones y Errores

### Error: Nombre inválido
```
❌ Error: El nombre del componente "123Invalid" no es válido. 
   Debe empezar con letra, _ o $ y contener solo caracteres alfanuméricos, _ o $.
```

### Error: Tipo no soportado
```
❌ Error: Tipo de componente no soportado: unknownType. 
   Tipos disponibles: model, view, collection, controller, ...
```

### Error: Permiso denegado
```
❌ Error: EACCES: permission denied, open '/ruta/protegida/archivo.ts'
```

## 📊 Beneficios

✅ **Automatización**: Elimina la necesidad de copiar y editar templates manualmente
✅ **Consistencia**: Todos los componentes siguen la misma estructura
✅ **Velocidad**: Crea nuevos componentes en milisegundos
✅ **Seguridad**: Valida nombres y rutas antes de crear archivos
✅ **Flexibilidad**: Soporta 14 tipos diferentes de componentes
✅ **Escalabilidad**: Fácil agregar nuevos tipos de componentes

## 🔗 Integración con Clientes MCP

Los clientes MCP (como Claude, Copilot, etc.) pueden usar estas tools automáticamente al conectarse al servidor.

Ejemplo en Python:
```python
# Usando cliente MCP
client.call_tool("create-component", {
    "componentName": "User",
    "componentType": "model",
    "outputPath": "src/models/User.ts"
})
```

Ejemplo en Node.js:
```typescript
// Usando cliente MCP
await client.callTool("create-component", {
    componentName: "User",
    componentType: "model",
    outputPath: "src/models/User.ts"
});
```

## 📝 Notas Importantes

1. **Reemplazo de placeholders**: El sistema reemplaza automáticamente:
   - `Example` → nombre en PascalCase
   - `example` → nombre en camelCase
   - `example-` → nombre en kebab-case

2. **Creación de directorios**: Si el directorio no existe, se crea automáticamente

3. **Validación**: Se valida:
   - Que el nombre sea un identificador JavaScript válido
   - Que la ruta no contenga navegación peligrosa

4. **Permisos**: El archivo se crea con permisos estándar del usuario

## 🚀 Próximas Mejoras Sugeridas

- [ ] Agregar opción para personalizar placeholders
- [ ] Agregar soporte para templates en archivos separados
- [ ] Agregar opción para regenerar/actualizar componentes existentes
- [ ] Agregar validación de AST para mejor reemplazo de identificadores
- [ ] Crear interfaz gráfica para seleccionar tipo de componente
- [ ] Agregar opciones de formateo (prettier, eslint)
