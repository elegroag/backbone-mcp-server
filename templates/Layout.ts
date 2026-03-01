// Importar Region y tipos del módulo local
import { ModelView } from './ModelView';
import { Region } from './Region';
import type { RegionOptions, ViewType } from './Region';

// Definir interfaces localmente para evitar problemas de importación
export interface LayoutOptions extends RegionOptions {
    regions?: Record<string, string>;
}

/**
 * Layout class que extiende ModelView para manejar layouts con regiones
 */
export class Layout extends ModelView {
    private regions: Record<string, Region> = {};

    constructor(options?: LayoutOptions) {
        super(options);

        // Configurar regiones si se proporcionan
        if (options?.regions) {
            this.configureRegions(options.regions);
        }
    }

    /**
     * Configura las regiones del layout
     */
    configureRegions(regions: Record<string, string>): void {
        _.each(regions, (selector: string, name: string) => {
            this.addRegion(name, selector);
        });
    }

    /**
     * Agrega una región al layout
     */
    addRegion(name: string, selector: string): void {
        const region = new Region({ el: selector });
        this.regions[name] = region;
    }

    /**
     * Obtiene una región por nombre
     */
    getRegion(name: string): Region | undefined {
        return this.regions[name];
    }

    /**
     * Muestra una vista en una región específica
     */
    showRegion(name: string, view: ViewType): void {
        const region = this.getRegion(name);
        if (region) {
            region.show(view);
        }
    }

    /**
     * Cierra una región específica
     */
    closeRegion(name: string): void {
        const region = this.getRegion(name);
        if (region) {
            region.close();
        }
    }

    /**
     * @override
     * Cierra el layout y todas sus regiones
     */
    close(): void {
        // Cerrar todas las regiones
        _.each(this.regions, (region: Region) => {
            region.close();
        });
        this.regions = {};

        // Cerrar el layout principal
        super.close();
    }
}
