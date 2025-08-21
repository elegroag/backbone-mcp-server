# MCP Server: Recursos Markdown de Backbone.js

Servidor MCP (Model Context Protocol) que expone capítulos Markdown de Backbone.js como recursos legibles y añade una tool para búsqueda full‑text sobre dichos capítulos.

## Autoría

- name: Edwin Andrés Legro Agudelo
- email: <elegroag@estudiante.ibero.edu.co>
- GitHub: <https://github.com/elegroag>

## Características

- **Recursos por capítulo**: cada capítulo Markdown se registra como recurso MCP con nombre y URI estable (`backbone://chapter/NN`).
- **Lectura de contenidos**: devuelve el texto plano del capítulo solicitado.
- **Búsqueda**: tool `search-backbone` que busca texto en todos los capítulos y devuelve enlaces a los recursos con coincidencias y un extracto.
- **Tipado y validación**: Zod (v3) para validar argumentos de tools.

## Arquitectura

- `src/server.ts`: arranque del servidor MCP, registro de recursos y tool `search-backbone`.
- `src/mcp-server.ts`: utilidades para listar recursos (`listResources`), leer contenido (`readResource`) y buscar (`searchResources`).
- `src/markdown-reader.ts`: lectura/normalización de archivos Markdown.
- `src/types.ts`: tipos compartidos (por ejemplo, resultados de búsqueda).
- `docs/`: capítulos Markdown de Backbone.js.

## Requisitos

- Node.js 18+ (recomendado 20+)
- pnpm

## Instalación

```bash
pnpm install
pnpm build
```

## Ejecución

- Modo desarrollo (STDIO):

```bash
pnpm start
```

Esto lanza `tsx ./src/server.ts` y expone el servidor por STDIO.

- Con MCP Inspector (UI web) usando STDIO del servidor:

```bash
npx @modelcontextprotocol/inspector npx -y tsx ./src/server.ts
```

Abre el navegador con el Inspector. Desde ahí podrás listar recursos y ejecutar tools.

## Recursos expuestos

- Por cada capítulo detectado en `docs/`:
  - **Nombre**: `backbone-chapter-NN`
  - **URI**: `backbone://chapter/NN`
  - **mimeType**: `text/markdown` (o el deducido por el lector)
- Lectura (`readResource`): devuelve `{ contents: [{ uri, text }] }` con el contenido del capítulo.

## Tools

### search-backbone

- **title**: "Buscar en capítulos Backbone"
- **description**: Busca texto en los capítulos Markdown y devuelve enlaces a los capítulos con coincidencias.
- **inputSchema**:
  - `query: string` (mín. 2)
  - `caseSensitive?: boolean`
  - `maxExcerpts?: number` (1–5)
- **respuesta**:
  - `content`: lista con un bloque `text` (resumen) y múltiples `resource_link` hacia `backbone://chapter/NN` con un primer extracto como `description`.

### Ejemplo de llamada (Inspector)

- Tool: `search-backbone`
- Arguments:

```json
{
  "query": "modelo",
  "caseSensitive": false,
  "maxExcerpts": 3
}
```

## Desarrollo

- Compilar TypeScript:

```bash
pnpm build
```

- Ejecutar pruebas manuales desde Inspector o cualquier cliente MCP compatible.
- Configuración TS relevante (`tsconfig.json`):
  - `module: nodenext`, `strict: true`, `skipLibCheck: true`.

## Solución de problemas

- Error `MCP error -32603: keyValidator._parse is not a function`:
  - Causa: incompatibilidad entre Zod v4 y el SDK/zod-to-json-schema.
  - Solución aplicada: Zod fijado a v3 (`"zod": "^3.23.8"`).
  - Ejecuta `pnpm install && pnpm build` tras el cambio.

## Scripts

- `pnpm build` — compila TypeScript a `dist/`.
- `pnpm start` — ejecuta el servidor MCP por STDIO con `tsx`.

## Buenas prácticas aplicadas

- Diseño modular: separación en `server`, `services/utils` (`mcp-server.ts`), `readers`, y `types`.
- Validación a nivel de borde (Zod v3) para inputs de tools.
- Código limpio y responsabilidad única por módulo.

## Licencia

- MIT. Ver `LICENSE`.
