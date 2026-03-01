/**
 * DEMOSTRACIÓN: Cómo quedaría un componente generado
 * 
 * Si ejecutamos:
 *   create-component("Product", "model", "src/models/Product.ts")
 * 
 * Partiendo de la template ExampleModel.ts:
 */

// ============================================
// TEMPLATE ORIGINAL (ExampleModel.ts)
// ============================================
/*
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

    url() {
        const base = this.collection.url || 'api/';
        return base + (this.isNew() ? '' : this.id + '/');
    }

    validate(attributes: any) {
        if (_.isEmpty(attributes.fullname)) {
            return 'Nombre requerido';
        }
    }
}
*/

// ============================================
// COMPONENTE GENERADO (Product.ts)
// ============================================

import { BackboneModel } from "./Bone";

export default class ProductModel extends BackboneModel {
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

    url() {
        const base = this.collection.url || 'api/';
        return base + (this.isNew() ? '' : this.id + '/');
    }

    validate(attributes: any) {
        if (_.isEmpty(attributes.fullname)) {
            return 'Nombre requerido';
        }
    }
}

// ============================================
// CAMBIOS REALIZADOS:
// ============================================
// ExampleModel → ProductModel
// 
// Transformaciones:
// - "Example" → "Product" (PascalCase)
// - "example" → "product" (camelCase) 
// - "example-" → "product-" (kebab-case)
// ============================================
