import { BackboneView } from "./Bone";
import tmp_example from "./tmp_example.hbs?raw";

interface ExampleViewOptions {
    api?: any;
    logger?: any;
    app?: any;
    storage?: any;
    region?: any;
    router?: any;
    [key: string]: any;
}

export default class ExampleView extends BackboneView {
    modal: any;
    api: any;
    logger: any;
    app: any;
    storage: any;
    region: any;
    router: any;

    constructor(options: ExampleViewOptions) {
        super(options);
        this.modal = void 0;
        this.api = options.api;
        this.logger = options.logger;
        this.app = options.app;
        this.storage = options.storage;
        this.region = options.region;
        this.router = options.router;
    }

    render() {
        let template = _.template(tmp_example);
        this.$el.html(template());
        return this;
    }

    get events() {
        return {
            'click #btn_back_list': 'cancelar',
        };
    }

    cancelar(e: Event) {
        e.preventDefault();
        this.remove();
        this.router.navigate('listar', { trigger: true, replace: true });
        return false;
    }
}
