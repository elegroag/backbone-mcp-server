import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DOCS_FOLDER = path.resolve(__dirname, '../docs');
const CHAPTER_REGEX = /Backbone-cap-(\d{2})\.md$/;

export interface Chapter {
    number: number;
    title: string;
    content: string;
    filename: string;
    uri: string;
}

export function readChapterFiles(): Chapter[] {
    const chapters: Chapter[] = [];

    if (!fs.existsSync(DOCS_FOLDER)) {
        console.warn(`Carpeta docs no encontrada: ${DOCS_FOLDER}`);
        return chapters;
    }

    const files = fs.readdirSync(DOCS_FOLDER).filter(file => CHAPTER_REGEX.test(file));

    // Extraer número y ordenar
    files
        .map(file => {
            const match = file.match(CHAPTER_REGEX);
            return {
                file,
                number: match ? parseInt(match[1], 10) : Infinity,
            };
        })
        .sort((a, b) => a.number - b.number)
        .forEach(({ file, number }) => {
            const filePath = path.join(DOCS_FOLDER, file);
            const content = fs.readFileSync(filePath, 'utf-8');

            // Intentar extraer el título del primer encabezado H1
            const titleMatch = content.trim().match(/^#\s+(.+)$/m);
            const title = titleMatch ? titleMatch[1].trim() : `Capítulo ${number}`;

            chapters.push({
                number,
                title,
                content,
                filename: file,
                uri: `backbone/chapter/${number}`,
            });
        });

    return chapters;
}