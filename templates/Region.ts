import { BackboneView } from "./Bone";

// Definir interfaces unificadas para evitar problemas de tipado
export interface RegionOptions {
    el?: string | HTMLElement;
    [key: string]: any;
}

// Interfaz base para todas las vistas
export interface BaseView {
    render(): BaseView;
    remove?(): void;
    onShow?(): void;
    el: HTMLElement;
}

// Tipo unificado para vistas
export type ViewType = BaseView | BackboneView;

export class Region {
    private currentView: ViewType | null = null;
    private currentViews: ViewType[] = [];
    private $el: JQuery<HTMLElement> | null = null;
    private el: string | HTMLElement;

    constructor(options: RegionOptions = {}) {
        _.extend(this, options);
        this.currentViews = [];
        this.el = options.el || '';
    }

    // Closes any active view and render a new one
    show(view: ViewType): void {
        this.closeView(this.currentView);
        this.currentView = view;
        this.openView(view);
    }

    html(el: string): void {
        if (this.$el) this.$el.html(el);
    }

    append(view: ViewType | null): void {
        if (!view) return;

        this.currentViews.push(view);
        this.ensureEl();
        view.render();
        this.$el!.append(view.el);
        if (view.onShow) view.onShow();
    }

    closeView(view: ViewType | null): void {
        // Only remove the view when the remove function
        // is available
        if (view && view.remove) {
            view.remove();
        }
    }

    openView(view: ViewType): void {
        console.log('Region.openView() called');
        // Be sure that this.$el exists
        this.ensureEl();
        console.log('Region.ensureEl() completed, $el:', this.$el?.length);

        // Render the view on the this.$el element
        view.render();
        console.log('View rendered, view.el:', view.el);
        this.$el!.html(view.el);
        console.log('View HTML inserted into region');

        // Callback when the view is in the DOM
        if (view.onShow) view.onShow();
    }

    ensureEl(): void {
        if (!this.$el) {
            if (typeof this.el === 'string') {
                this.$el = $(this.el);
            } else {
                this.$el = $(this.el);
            }
        }
    }

    close(): void {
        // Close the current view
        this.closeView(this.currentView);
        this.currentView = null;

        // Close all appended views
        _.each(this.currentViews, (view: ViewType) => {
            this.closeView(view);
        });
        this.currentViews = [];
    }

    // Remove the region from the DOM
    remove(): void {
        this.close();
        if (this.$el) {
            this.$el.remove();
            this.$el = null;
        }
    }
}

// Exportar tipos para uso en otros módulos
export type { RegionOptions, BaseView, ViewType };
