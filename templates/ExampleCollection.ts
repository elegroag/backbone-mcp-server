import { BackboneCollection } from "./Bone";
import ExampleModel from "./ExampleModel";
import { route } from "ziggy-js";

export default class ExampleCollection extends BackboneCollection {
    constructor(options?: any) {
        super({ ...options, url: route('ruta.index') });
    }

    get model() {
        return ExampleModel;
    }
}
