import { Controller } from './Controller';
import ExampleService from './ExampleService';

interface PoderesControllerOptions {
    [key: string]: any;
}

export default class ExampleController extends Controller {
    private service: ExampleService;

    constructor(options: PoderesControllerOptions) {
        super(options);
        this.service = new ExampleService({
            api: options.api,
            logger: options.logger,
            app: options.app
        });
    }

    async listar(): Promise<void> {
        try {
            await this.service.__findAll();

            const view = new ExampleView({
                collection: (this.service as any).collections.poderes,
                app: this.app,
                api: this.api,
                logger: this.logger,
                region: this.region,
            });

            this.region.show(view);

            // Conectar eventos con el servicio
            this.listenTo(view, 'remove:poder', this.service.deletePoder.);
            this.listenTo(view, 'edit:poder', this.editarPoder.bind(this));
            this.listenTo(view, 'show:poder', this.mostrarDetalle.bind(this));

        } catch (error: any) {
            this.logger?.error('Error al listar poderes:', error);
            this.app?.trigger('alert:error', error.message || 'Error al cargar poderes');
        }
    }

    /**
     * Limpiar recursos
     */
    destroy(): void {
        this.stopListening();
        this.region.remove();
    }
}
