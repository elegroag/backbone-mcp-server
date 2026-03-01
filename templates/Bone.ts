import type { AppInstance, ApiService } from '@/types/types';

class BackboneView extends (Backbone.View as any) {
    app: AppInstance | null;
    api: ApiService | null;

    constructor(options: any) {
        super(options);
        this.app = options.app || null;
        this.api = options.api || null;
    }
}

class BackboneModel extends (Backbone.Model as any) {
    constructor(options: any) {
        super(options);
    }
}


class BackboneCollection extends (Backbone.Collection as any) {
    constructor(options: any) {
        super(options);
    }
}


class BackboneRouter extends (Backbone.Router as any) {
    constructor(options?: any) {
        super(options);
    }
}


class BackboneHistory extends (Backbone.History as any) {
    constructor(options: any) {
        super(options);
    }
}

export {
    BackboneView,
    BackboneModel,
    BackboneCollection,
    BackboneRouter,
    BackboneHistory
}
