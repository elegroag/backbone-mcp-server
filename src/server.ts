import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { listResources, readResource, searchResources } from './mcp-server.js';
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
    } as any,
    async (args: any) => {
        const query = args?.query as string;
        const caseSensitive = args?.caseSensitive as boolean | undefined;
        const maxExcerpts = args?.maxExcerpts as number | undefined;
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

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main();

