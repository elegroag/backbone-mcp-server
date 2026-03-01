import type { AppInstance, ApiService, ControllerOptions, Region, Layout } from "@/types/types";
import Logger from "./Logger";

export class Controller {
    app: AppInstance | null = null;
    currentController: any = null;
    region: Region | any;
    layout: Layout | null = null;
    router: { [key: string]: any } = {};
    logger: Logger | any;
    api: ApiService;
    trigger: any;
    props: any;

    constructor(options: ControllerOptions) {
        this.currentController = undefined;
        this.api = options.api;
        _.extend(this, options);
    }

    // Backbone Events methods
    listenTo(object: any, event: string, callback: (...args: any[]) => void): void {
        (Backbone as any).Events.listenTo.call(this, object, event, callback);
    }

    stopListening(object?: any, event?: string, callback?: (...args: any[]) => void): void {
        (Backbone as any).Events.stopListening.call(this, object, event, callback);
    }

    startController(ControllerClass: new (options: any) => any): any {
        if (this.currentController && this.currentController instanceof ControllerClass) {
            return this.currentController;
        }

        if (this.currentController && this.currentController.destroy) {
            this.currentController.destroy();
        }

        this.currentController = new ControllerClass({
            region: this.region,
            api: this.api,
            props: this.props,
            logger: this.logger,
            router: this.router
        });

        _.extend(this.currentController, (Backbone as any).Events);

        return this.currentController;
    }
}
