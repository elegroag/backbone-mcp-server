import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { listResources, readResource, searchResources } from './mcp-server.js';
import { generateComponent, getAvailableComponentTypes } from './component-generator.js';
import { z } from 'zod';

const server = new McpServer({
    port: 7557,
    name: "Backbone Doc Resource",
    version: "1.0.0"
});

// Registrar recursos estáticos para cada capítulo Markdown encontrado
const mdIndex = listResources();
for (const r of mdIndex.resources) {
    const chapter = r.metadata?.chapter;
    const chapterStr = typeof chapter === 'number' ? String(chapter).padStart(2, '0') : undefined;
    const name = chapterStr ? `backbone-chapter-${chapterStr}` : `backbone-doc-${r.uri}`;
    // Usamos un esquema propio para URIs MCP válidas
    const resourceUri = chapterStr ? `backbone://chapter/${chapterStr}` : r.uri;

    /* 
    console.log(`Registering resource: ${name} -> ${resourceUri}`);
    console.log(`Metadata: ${JSON.stringify(r.metadata)}`);
    console.log(`Content:`, r.content); 
    */
    server.registerResource(
        name,
        resourceUri,
        {
            title: r.metadata?.title ?? name,
            description: "Documento Markdown de Backbone",
            mimeType: r.content.mimeType
        },
        async (uri) => {
            // Mapear la URI MCP a la URI interna usada por readResource()
            let internalUri = r.uri;
            if (chapterStr) {
                const match = uri.pathname.match(/\/(\d{1,2})$/);
                const num = match ? parseInt(match[1], 10) : (chapter ?? 0);
                internalUri = `backbone/chapter/${num}`;
            }

            const data: any = readResource(internalUri);
            if (data && typeof data.content === 'string') {
                return {
                    contents: [{
                        uri: uri.href,
                        text: data.content
                    }]
                };
            }

            const msg = data?.error ?? 'Recurso no encontrado';
            return {
                contents: [{
                    uri: uri.href,
                    text: `Error: ${msg}`
                }]
            };
        }
    );
}

// Tool: búsqueda de texto en capítulos
server.registerTool(
    "search-backbone",
    {
        title: "Buscar en capítulos Backbone",
        description: "Busca texto en los capítulos Markdown y devuelve enlaces a los capítulos con coincidencias.",
        inputSchema: {
            query: z.string().min(2, 'La consulta debe tener al menos 2 caracteres').describe('Texto a buscar'),
            caseSensitive: z.boolean().optional().describe('Distinguir mayúsculas/minúsculas'),
            maxExcerpts: z.number().int().min(1).max(5).optional().describe('Número de fragmentos por capítulo'),
        }
    },
    async (args) => {
        const query = args.query;
        const caseSensitive = args.caseSensitive;
        const maxExcerpts = args.maxExcerpts;
        const results = searchResources(query, { caseSensitive, maxExcerpts });
        if (!results.length) {
            return {
                content: [
                    { type: "text", text: `Sin coincidencias para "${query}".` }
                ]
            };
        }

        const content: Array<any> = [];
        content.push({ type: "text", text: `Coincidencias: ${results.length} capítulos para "${query}".` });
        for (const r of results) {
            content.push({
                type: "resource_link",
                uri: r.uri,
                name: `Capítulo ${String(r.chapter).padStart(2, '0')} — ${r.title}`,
                mimeType: r.mimeType,
                description: r.excerpts[0] ?? undefined,
            });
        }

        return { content };
    }
);

// Tool: crear componente desde template
server.registerTool(
    "create-component",
    {
        title: "Crear componente desde template",
        description: "Crea un componente Backbone basado en una template disponible",
        inputSchema: {
            componentName: z.string().min(1).describe('Nombre del componente (ej: MyModel, UserController)'),
            componentType: z.string().min(1).describe('Tipo de componente (ej: model, view, controller, collection, etc.)'),
            outputPath: z.string().min(1).describe('Ruta donde guardar el componente (ej: src/models/MyModel.ts)'),
        }
    },
    async (args) => {
        try {
            const componentName = args.componentName as string;
            const componentType = args.componentType as string;
            const outputPath = args.outputPath as string;

            // Validar que el nombre del componente sea válido
            if (!/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(componentName)) {
                return {
                    content: [
                        {
                            type: "text",
                            text: `Error: El nombre del componente "${componentName}" no es válido. Debe empezar con letra, _ o $ y contener solo caracteres alfanuméricos, _ o $.`
                        }
                    ]
                };
            }

            const result = await generateComponent({
                componentName,
                componentType,
                outputPath
            });

            return {
                content: [
                    { type: "text", text: `✅ ${result}` }
                ]
            };
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            return {
                content: [
                    { type: "text", text: `❌ Error: ${errorMsg}` }
                ]
            };
        }
    }
);

// Tool: listar tipos de componentes disponibles
server.registerTool(
    "list-component-types",
    {
        title: "Listar tipos de componentes disponibles",
        description: "Devuelve una lista de todos los tipos de componentes que pueden ser creados desde templates",
        inputSchema: {}
    },
    async () => {
        const types = getAvailableComponentTypes();
        return {
            content: [
                {
                    type: "text",
                    text: `Tipos de componentes disponibles:\n${types.map(t => `  • ${t}`).join('\n')}`
                }
            ]
        };
    }
);

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main();

