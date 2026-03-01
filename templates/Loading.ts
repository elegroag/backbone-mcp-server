interface LoadingOptions {
    addClass?: string;
}

interface LoadingInstance {
    hide(out?: boolean): void;
    show(out?: boolean, options?: LoadingOptions): void;
}

const Loading = (() => {
    let status: boolean | undefined;
    let element: HTMLElement | undefined;
    let loader: HTMLElement | undefined;
    let template: (() => string) | undefined;

    const show = (out: boolean = false, options?: LoadingOptions): void => {
        if (out) {
            element = document.createElement('div');
            element.setAttribute('id', 'loading_msj');
            (window as any).$(element).html(
                "<div class='loading_msj'><p class='text-warning'>Procesando datos de busqueda...</p></div>",
            );
            const appElement = document.getElementById('app');
            if (appElement) {
                appElement.appendChild(element);
            }
        }

        if (!status) {
            template = _.template(`<div class="loader-inner">
                <div class='loader-text'>Sistema procesando....</div>
                <div class="loader-line-wrap">
                        <div class="loader-line"></div>
                </div>
                <div class="loader-line-wrap">
                        <div class="loader-line"></div>
                </div>
                <div class="loader-line-wrap">
                        <div class="loader-line"></div>
                </div>
                <div class="loader-line-wrap">
                        <div class="loader-line"></div>
                </div>
                <div class="loader-line-wrap">
                        <div class="loader-line"></div>
                </div>
                </div>
            `);

            loader = document.createElement('div');
            loader.setAttribute('class', 'loader');
            loader.setAttribute('id', 'loader');
            (window as any).$(loader).append(template!());
            document.body.appendChild(loader);
            loader.setAttribute('style', 'display:block');

            if (_.isObject(options) === true) {
                if (options?.addClass) {
                    (window as any)('.loader').addClass(options.addClass);
                }
            }

            loader.addEventListener('dblclick', (e: MouseEvent) => {
                e.preventDefault();
                hide();
            });
        }
        status = true;
    };

    const hide = (out: boolean = false): void => {
        if (out && element) {
            element.remove();
        }
        if (status && loader) {
            loader.remove();
        }
        status = undefined;
    };

    return {
        hide,
        show,
    } as LoadingInstance;
})();

export default Loading;
