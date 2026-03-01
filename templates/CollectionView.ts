import { BackboneView } from "./Bone";

export class CollectionView extends BackboneView {
    private children: Record<string, Backbone.View | undefined> = {};
    private modelView: new (options: { model: Backbone.Model }) => Backbone.View;

    /**
     * @override
     */
    constructor(options?: { modelView?: new (options: { model: Backbone.Model }) => Backbone.View }) {
        super(options);

        // Keep track of rendered items
        this.children = {};

        // Set modelView class if provided
        if (options?.modelView) {
            this.modelView = options.modelView;
        } else {
            // Provide a default view if none is specified
            this.modelView = BackboneView as any;
        }

        // Bind collection events to automatically insert
        // and remove items in the view
        if (this.collection) {
            this.listenTo(this.collection, 'add', this.modelAdded);
            this.listenTo(this.collection, 'remove', this.modelRemoved);
            this.listenTo(this.collection, 'reset', this.render);
        }
    }

    /**
     * @override
     */
    initialize(options?: any): void {
        // Keep track of rendered items
        this.children = {};

        // Set modelView class if provided
        if (options?.modelView) {
            this.modelView = options.modelView;
        }

        // Bind collection events to automatically insert
        // and remove items in the view
        if (this.collection) {
            this.listenTo(this.collection, 'add', this.modelAdded);
            this.listenTo(this.collection, 'remove', this.modelRemoved);
            this.listenTo(this.collection, 'reset', this.render);
        }
    }

    // Render a model when is added to the collection
    modelAdded(model: Backbone.Model): void {
        const view = this.renderModel(model);
        this.$el.append(view.$el);
    }

    // Close view of model when is removed from the collection
    modelRemoved(model: Backbone.Model): void {
        if (!model) return;

        const view = this.children[model.cid];
        this.closeChildView(view);
    }

    /**
     * @override
     */
    render(): this {
        // Clean up any previous elements rendered
        this.closeChildren();

        // Render a view for each model in the collection
        if (this.collection) {
            const fragment = document.createDocumentFragment();

            this.collection.each((model: Backbone.Model) => {
                const view = this.renderModel(model);
                fragment.appendChild(view.el);
            });

            // Put the rendered items in the DOM
            this.$el.html(fragment);
        }
        return this;
    }

    renderModel(model: Backbone.Model): Backbone.View {
        // Create a new view instance, modelView should be
        // redefined as a subclass of Backbone.View
        const view = new this.modelView({ model: model });

        // Keep track of which view belongs to a model
        this.children[model.cid] = view;

        // Re-trigger all events in the children views, so that
        // you can listen events of the children views from the
        // collection view
        this.listenTo(view, 'all', function (this: CollectionView, eventName: string) {
            this.trigger.apply(this, ['child:' + eventName].concat(_.rest(arguments)));
        }.bind(this));

        return view;
    }

    // Close all the live childrens
    closeChildren(): void {
        const children = this.children || {};
        _.each(children, (child: Backbone.View | undefined) => {
            if (child) this.closeChildView(child);
        });
    }

    // Close a single children at time
    closeChildView(view: Backbone.View | undefined): void {
        if (!view) return;

        // Stop listening to events from the child view
        this.stopListening(view);

        // Remove the child view from the DOM
        view.remove();

        // Remove reference to the child view
        if (view.model) {
            delete this.children[view.model.cid];
        }
    }
}
