import { BackboneRouter } from "./Bone";
import ExampleController from "./ExampleController";
import type { AppInstance } from "@/types/types";

interface RouterOptions {
    app: AppInstance;
}

export default class RouterExample extends BackboneRouter {
    private app: AppInstance;

    constructor(options: RouterOptions) {
        super({
            routes: {
                '': 'listar',
                'listar': 'listar',
                'buscar': 'buscar',
                'crear': 'crear',
                'mostrar/:id': 'mostrar',
                'error': 'error'
            },
            ...options,
        });
        this.app = options.app;
        this._bindRoutes();
    }

    private init(): ExampleController {
        return this.app.startSubApplication(ExampleController);
    }

    error() {
        const controller = this.init();
        if (controller && typeof controller.error === 'function') {
            controller.error();
        }
    }

    listar() {
        const controller = this.init();
        if (controller && typeof controller.listar === 'function') {
            controller.listar();
        }
    }

    buscar() {
        const controller = this.init();
        if (controller && typeof controller.buscar === 'function') {
            controller.buscar();
        }
    }

    crear() {
        const controller = this.init();
        if (controller && typeof controller.crearPoder === 'function') {
            controller.crearPoder();
        }
    }

    mostrar(id: string) {
        const controller = this.init();
        if (controller && typeof controller.mostrar === 'function') {
            controller.mostrar(id);
        }
    }

}
