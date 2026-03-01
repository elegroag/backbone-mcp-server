# Guía Rápida - Component Generator Tool

## 🎯 Objetivo
Crear componentes Backbone automáticamente a partir de templates, sin necesidad de copiar y editar manualmente.

## ⚡ Inicio Rápido

### Paso 1: Primero, ver tipos disponibles
```
Tool: list-component-types
(sin parámetros)
```

Resultado:
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

---

## 📋 Paso 2: Crear tu primer componente

### Ejemplo 1: Crear un Modelo
```
Tool: create-component

Parámetros:
  componentName: "Product"
  componentType: "model"
  outputPath: "src/models/Product.ts"
```

Resultado esperado:
```
✅ Componente Product (tipo: model) creado exitosamente en src/models/Product.ts
```

### Ejemplo 2: Crear un Controlador
```
Tool: create-component

Parámetros:
  componentName: "UserController"
  componentType: "controller"
  outputPath: "src/controllers/UserController.ts"
```

Resultado esperado:
```
✅ Componente UserController (tipo: controller) creado exitosamente en src/controllers/UserController.ts
```

### Ejemplo 3: Crear una Vista
```
Tool: create-component

Parámetros:
  componentName: "Dashboard"
  componentType: "view"
  outputPath: "src/views/DashboardView.ts"
```

Resultado esperado:
```
✅ Componente Dashboard (tipo: view) creado exitosamente en src/views/DashboardView.ts
```

---

## 🛡️ Validaciones

La herramienta valida automáticamente:

### ❌ Nombre inválido
```
create-component(
  "123invalid",  // ❌ No puede empezar con número
  "model",
  "src/models/123invalid.ts"
)
```
Resultado:
```
❌ Error: El nombre del componente "123invalid" no es válido. 
   Debe empezar con letra, _ o $ y contener solo caracteres alfanuméricos, _ o $.
```

### ❌ Tipo no soportado
```
create-component(
  "MyComponent",
  "unknownType",  // ❌ Tipo no existe
  "src/MyComponent.ts"
)
```
Resultado:
```
❌ Error: Tipo de componente no soportado: unknownType. 
   Tipos disponibles: model, view, collection, controller, ...
```

---

## 🔄 Transformaciones de Nombres

El sistema transforma automáticamente tu nombre:

| Entrada | PascalCase | camelCase | kebab-case |
|---------|-----------|-----------|-----------|
| "user" | User | user | user |
| "productList" | ProductList | productList | product-list |
| "UserController" | UserController | userController | user-controller |

### Ejemplo en template:
```typescript
// Template: ExampleModel
// Entrada: "Product"

// Resultado:
class ProductModel { }  // "Example" → "Product"
const product = new ProductModel();  // "example" → "product"
const url = `api/product-data`;  // "example-" → "product-"
```

---

## 📁 Estructura de Componentes

Después de crear los componentes, tu proyecto podría verse así:

```
src/
├── models/
│   ├── User.ts          (creado con create-component)
│   ├── Product.ts       (creado con create-component)
│   └── Order.ts         (creado con create-component)
├── controllers/
│   ├── UserController.ts        (creado con create-component)
│   └── ProductController.ts     (creado con create-component)
└── views/
    ├── UserView.ts              (creado con create-component)
    └── DashboardView.ts         (creado con create-component)
```

---

## 💡 Casos de Uso Prácticos

### 1️⃣ Crear componentes para una aplicación de e-commerce

```bash
# Crear modelos
create-component("Product", "model", "src/models/Product.ts")
create-component("Cart", "model", "src/models/Cart.ts")
create-component("Order", "model", "src/models/Order.ts")

# Crear controladores
create-component("ProductController", "controller", "src/controllers/ProductController.ts")
create-component("CartController", "controller", "src/controllers/CartController.ts")

# Crear vistas
create-component("ProductView", "view", "src/views/ProductView.ts")
create-component("CartView", "view", "src/views/CartView.ts")

# Crear colecciones
create-component("Product", "collection", "src/collections/ProductCollection.ts")
```

### 2️⃣ Crear componentes para un dashboard administrativo

```bash
# Modelos
create-component("User", "model", "src/models/User.ts")
create-component("Report", "model", "src/models/Report.ts")

# Controllers
create-component("AdminController", "controller", "src/controllers/AdminController.ts")
create-component("ReportController", "controller", "src/controllers/ReportController.ts")

# Views
create-component("AdminDashboard", "view", "src/views/AdminDashboard.ts")
create-component("ReportView", "view", "src/views/ReportView.ts")
```

---

## ⏱️ Tiempo Estimado de Ejecución

| Acción | Tiempo |
|--------|--------|
| Listar tipos | ~10ms |
| Crear componente simple | ~50ms |
| Crear 10 componentes | ~500ms |

---

## 🔐 Seguridad

La herramienta:
- ✅ Valida nombres JavaScript válidos
- ✅ Valida rutas de salida (previene directory traversal)
- ✅ No sobrescribe archivos por accidente (busca existentes primero)
- ✅ Crea directorios con permisos estándar

---

## 📞 Solución de Problemas

### Problema: "Error: EACCES: permission denied"
**Solución**: Asegúrate de tener permisos de escritura en el directorio

```bash
chmod 755 src/
chmod 755 src/models/
```

### Problema: "Error: Tipo de componente no soportado"
**Solución**: Usa `list-component-types` para ver los tipos válidos

```
Tool: list-component-types
```

### Problema: El archivo no se crea
**Solución**: Verifica que:
1. El nombre sea válido (inicia con letra, _, o $)
2. La ruta sea accesible
3. Tengas permisos de escritura

---

## 🎓 Siguiente Paso

Después de crear tus componentes:

1. Abre el archivo generado
2. Revisa y personaliza el código según necesites
3. Ajusta tipos, atributos, métodos
4. Integra con tu aplicación

¡Y listo! Ya tienes un componente Backbone completamente funcional y listo para personalizarse.
