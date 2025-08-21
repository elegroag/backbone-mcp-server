import { readChapterFiles } from './markdown-reader.js';
import { ListResourcesResponse, ReadResourceResponse, Resource, SearchMatch } from './types.js';

let cachedResources: Resource[] = [];

const loadResources = () => {
    const chapters = readChapterFiles();
    cachedResources = chapters.map(chapter => ({
        uri: chapter.uri,
        content: {
            text: chapter.content,
            mimeType: 'text/markdown',
        },
        metadata: {
            title: chapter.title,
            chapter: chapter.number,
        },
    }));
    //console.log(`✅ ${cachedResources.length} capítulos cargados y ordenados`);
}

export const listResources = () => {
    loadResources();
    const response: ListResourcesResponse = {
        resources: cachedResources.map(r => ({
            uri: r.uri,
            content: { mimeType: r.content.mimeType },
            metadata: r.metadata,
        })),
    };

    return response;
};

export const readResource = (url: string) => {
    loadResources();
    const resource = cachedResources.find(r => r.uri === url);
    if (!resource) {
        return { error: 'Capítulo no encontrado' };
    }

    const response: ReadResourceResponse = {
        content: resource.content.text,
        mimeType: resource.content.mimeType,
    };
    return response;
}

export const searchResources = (
    query: string,
    opts?: { caseSensitive?: boolean; maxExcerpts?: number }
): SearchMatch[] => {
    const q = (query ?? '').trim();
    if (!q) return [];

    loadResources();

    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const flags = opts?.caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(escapeRegExp(q), flags);
    const maxExcerpts = Math.max(1, Math.min(10, opts?.maxExcerpts ?? 3));

    const matches: SearchMatch[] = [];

    for (const r of cachedResources) {
        const text = r.content.text ?? '';
        if (!text) continue;

        let occurrences = 0;
        const excerpts: string[] = [];

        let m: RegExpExecArray | null;
        while ((m = regex.exec(text)) !== null) {
            occurrences++;
            if (excerpts.length < maxExcerpts) {
                const start = Math.max(0, m.index - 60);
                const end = Math.min(text.length, m.index + m[0].length + 60);
                const snippet = `${start > 0 ? '…' : ''}${text
                    .slice(start, end)
                    .replace(/\s+/g, ' ')
                    .trim()}${end < text.length ? '…' : ''}`;
                excerpts.push(snippet);
            }
            if (regex.lastIndex === m.index) regex.lastIndex++; // evitar bucles con coincidencias vacías
        }

        if (occurrences > 0) {
            const chapter = r.metadata?.chapter ?? 0;
            const title = r.metadata?.title ?? `Capítulo ${chapter}`;
            const uri = `backbone://chapter/${String(chapter).padStart(2, '0')}`;
            matches.push({
                chapter,
                title,
                uri,
                mimeType: r.content.mimeType,
                occurrences,
                excerpts,
            });
        }
    }

    return matches.sort((a, b) => b.occurrences - a.occurrences);
}

