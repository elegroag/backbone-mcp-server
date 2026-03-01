import { BackboneModel } from "./Bone";

export default class ExampleModel extends BackboneModel {
    constructor(options: any) {
        super(options);
    }

    initialize() { }

    get idAttribute() {
        return 'id';
    }

    get defaults() {
        return {
            documento: void 0,
            fecha: '',
            nit: void 0,
            estado: 'I',
            email: '',
            phone: 0

        };
    }

    toJSON() {
        const result = BackboneModel.prototype.toJSON.call(this);
        result.phone = result.phone.toString();
        return result;
    }

    validate(attrs: any) {
        const errors: { [key: string]: any }[] = [];
        if (attrs.documento == '') {
            return 'El documento es valor requerido';
        }
        if (attrs.fecha == '') {
            return 'La fecha es valor requerido';
        }
        if (attrs.nit == '') {
            return 'La nit es valor requerido';
        }
        return errors.length ? errors : null;
    }

    invalid(model: any) {
        var errors: string[] = [];
        if (!model.isValid()) {
            errors = model.validationError;
            _.each(errors, function (error: any) {
                console.log(error);
            });
        }
    }
}