import { promises as fs } from 'fs';
import path from 'path';

export interface ComponentGeneratorOptions {
    componentName: string;
    componentType: string;
    outputPath: string;
}

/**
 * Obtiene la ruta de la template basada en el tipo de componente
 */
const getTemplatePath = (componentType: string): string => {
    const normalizedType = componentType.toLowerCase();
    const templateMap: { [key: string]: string } = {
        'model': 'ExampleModel.ts',
        'view': 'ExampleView.ts',
        'collection': 'ExampleCollection.ts',
        'controller': 'ExampleController.ts',
        'app': 'App.ts',
        'bone': 'Bone.ts',
        'collectionview': 'CollectionView.ts',
        'modelview': 'ModelView.ts',
        'layout': 'Layout.ts',
        'region': 'Region.ts',
        'router': 'RouterExample.ts',
        'apiservice': 'ApiService.ts',
        'storageservice': 'StorageService.ts',
        'logger': 'Logger.ts',
        'loading': 'Loading.ts'
    };

    const templateFile = templateMap[normalizedType];
    if (!templateFile) {
        throw new Error(`Tipo de componente no soportado: ${componentType}. Tipos disponibles: ${Object.keys(templateMap).join(', ')}`);
    }

    return templateFile;
};

/**
 * Reemplaza placeholders en el contenido de la template
 */
const replacePlaceholders = (content: string, componentName: string): string => {
    // Convertir nombre a diferentes formatos
    const pascalCase = componentName.charAt(0).toUpperCase() + componentName.slice(1);
    const camelCase = componentName.charAt(0).toLowerCase() + componentName.slice(1);
    const kebabCase = componentName.replace(/([A-Z])/g, '-$1').toLowerCase().replace(/^-/, '');

    let result = content;

    // Reemplazar placeholders comunes
    result = result.replace(/Example/g, pascalCase);
    result = result.replace(/example/g, camelCase);
    result = result.replace(/example-/g, kebabCase + '-');

    return result;
};

/**
 * Verifica que la ruta de salida sea válida
 */
const validateOutputPath = (outputPath: string): void => {
    // Asegurar que solo se cree dentro de directorios permitidos
    const normalizedPath = path.normalize(outputPath);

    if (normalizedPath.includes('..') && normalizedPath.split('..').length > 2) {
        throw new Error('Ruta de salida contiene navegación de directorio peligrosa');
    }
};

/**
 * Genera un componente basado en una template
 */
export const generateComponent = async (options: ComponentGeneratorOptions): Promise<string> => {
    try {
        validateOutputPath(options.outputPath);

        const templateFile = getTemplatePath(options.componentType);
        // Ruta a templates desde el proyecto raíz
        const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
        const templatePath = path.join(projectRoot, 'templates', templateFile);

        // Leer la template
        const templateContent = await fs.readFile(templatePath, 'utf-8');

        // Reemplazar placeholders
        const generatedContent = replacePlaceholders(templateContent, options.componentName);

        // Crear directorio si no existe
        const outputDir = path.dirname(options.outputPath);
        await fs.mkdir(outputDir, { recursive: true });

        // Escribir el archivo
        await fs.writeFile(options.outputPath, generatedContent, 'utf-8');

        return `Componente ${options.componentName} (tipo: ${options.componentType}) creado exitosamente en ${options.outputPath}`;
    } catch (error) {
        throw new Error(`Error al generar componente: ${error instanceof Error ? error.message : String(error)}`);
    }
};

/**
 * Lista los tipos de componentes disponibles
 */
export const getAvailableComponentTypes = (): string[] => {
    return [
        'model',
        'view',
        'collection',
        'controller',
        'app',
        'bone',
        'collectionview',
        'modelview',
        'layout',
        'region',
        'router',
        'apiservice',
        'storageservice',
        'logger',
        'loading'
    ];
};
