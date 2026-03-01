import { Region } from './Region';
import Loading from './Loading';
import ApiService from './ApiService';
import {
    SubApplicationOptions,
    SyncroRequest,
    ModalTransfer,
    ConfirmTransfer,
    AlertTransfer,
    DownloadTransfer,
    UploadTransfer,
    RegionOptions,
    AppInstance
} from '@/types/types';

import Logger from './Logger';

const $App: AppInstance = {
    Models: {},
    Collections: {},
    router: null,
    currentSubapp: null,
    Modal: null,
    layout: null,
    Collection: new Array<any>(),
    el: null,
    mainRegion: null,
    props: null,

    startApp(RouterModule: new (options?: any) => any, options: { defaultRoute: string; mainRegion: Region; props: any }): void {
        this.props = options.props;
        this.mainRegion = options.mainRegion;

        _.extend(this, (Backbone as any).Events);

        this.listenTo(this, 'confirma', this.confirmaApp);
        this.listenTo(this, 'syncro', this.syncroRequest);
        this.listenTo(this, 'ajax', this.ajaxKumbia);
        this.listenTo(this, 'show:modal', this.renderModal);
        this.listenTo(this, 'hide:modal', this.closeModal);
        this.listenTo(this, 'down', this.downLoadFile);
        this.listenTo(this, 'upload', this.uploadFile);
        this.listenTo(this, 'notify', this.notify);

        const alertTypes = ['error', 'warning', 'success', 'info'];

        alertTypes.forEach((type) => {
            this.listenTo(this, `noty:${type}`, (message: string) => this.notify(type, message));
            this.listenTo(this, `alert:${type}`, (transfer: string | AlertTransfer) => this.alert(type, transfer));
        });

        this.router = new RouterModule({ app: this });
        if (!Backbone.history.start()) {
            this.router.navigate(options.defaultRoute, { trigger: true });
        }
    },

    notify(type: string, message: string): void {
        this.showNoty(type, message.toString(), type === 'error' ? 10000 : 6000);
    },

    alert(type: string, transfer: string | AlertTransfer): void {
        let title = 'Notificación';
        let message = 'Nota no hay respuesta de la solicitud';
        let timer = 8200;

        if (typeof transfer === 'string') {
            // Si es string, usarlo como mensaje
            message = transfer;
        } else {
            // Si es objeto, extraer propiedades
            ({ title = 'Notificación', message = 'Nota no hay respuesta de la solicitud', timer = 8200 } = transfer);
        }

        this.showAlert(title, message, type, timer);
    },

    showNoty(type: string, message: string, timeout: number): void {
        new window.Noty({
            text: message,
            layout: 'topRight',
            theme: 'relax',
            type: type,
            timeout: timeout,
        }).show();
    },

    showAlert(title: string = '', text: string = '', icon: string = '', timer: number): void {
        Swal.fire(<SweetAlertOptions>{
            title,
            html: text,
            icon,
            showConfirmButton: false,
            confirmButtonText: 'Continuar',
            timer,
        });
    },

    startSubApplication(
        SubApplication: new (options: SubApplicationOptions) => any
    ): any {

        const providedApi = (this.props && (this.props as any).api) ? (this.props as any).api : new ApiService(this.props);
        const providedLogger = (this.props && (this.props as any).logger) ? (this.props as any).logger : new Logger();

        this.currentSubapp = new SubApplication({
            region: this.mainRegion,
            api: providedApi,
            props: this.props,
            logger: providedLogger,
            router: this.router,
            app: this
        });

        _.extend(this.currentSubapp, (Backbone as any).Events);
        return this.currentSubapp;
    },

    confirmaApp(transfer: ConfirmTransfer): void {
        const { message, callback, title = '¿Confirmar?', icon = 'warning' } = transfer;
        Swal.fire(<SweetAlertOptions>{
            title: title,
            text: message,
            icon: icon,
            showCancelButton: true,
            confirmButtonColor: '#2dce89',
            cancelButtonColor: '#fc8c72',
            confirmButtonText: 'SI, Continuar!',
        }).then((result: any) => {
            callback(result.isConfirmed);
        });
    },

    syncroRequest(transfer: SyncroRequest): void {
        const { url, data = {}, callback, silent = false } = transfer;
        const csrf = document.querySelector("[name='csrf-token']")?.getAttribute('content') || '';

        Backbone.ajax({
            type: 'POST',
            dataType: 'json',
            url: url,
            data: data,
            cache: false,
            contentType: 'application/x-www-form-urlencoded',
            processData: true,
            timeout: 52400,
            beforeSend: (xhr: any) => {
                if (silent === false) Loading.show();
                xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                if (csrf.length > 0) {
                    xhr.setRequestHeader('X-CSRF-TOKEN', csrf);
                    xhr.setRequestHeader('Authorization', 'Bearer ' + csrf);
                }
            },
            success: (response: any, textStatus: string, xhr: any) => {
                if (silent === false) Loading.hide();
                console.log('Status Text:', textStatus);
                console.log('HTTP Status Code:', xhr.status);
                if (xhr.status >= 200 && xhr.status <= 210) {
                    return callback(response);
                } else {
                    throw new Error('Error ' + textStatus);
                }
            },
            error: (xhr: any, textStatus: string, errorThrown: any) => {
                if (silent === false) Loading.hide();
                console.log('Status Text:', textStatus);
                console.log('HTTP Status Code:', xhr.status);
                console.log('Response Text:', xhr.responseText);
                if (xhr.status > 210) {
                    this.trigger('alert:error', { message: xhr.responseText });
                } else {
                    this.trigger('alert:error', { message: errorThrown });
                }
                return callback(false);
            },
        });
    },

    renderModal(transfer: ModalTransfer): void {
    },

    closeModal(view?: any): void {
    },

    ajaxKumbia(transfer: Partial<SyncroRequest> = {}): void {
        const { url, data = {}, callback, silent = false } = transfer;
        const csrf = document.querySelector("[name='csrf-token']")?.getAttribute('content') || '';

        $.ajax({
            type: 'POST',
            dataType: 'json',
            url: url,
            data: Qs.stringify(data),
            processData: false,
            contentType: 'application/x-www-form-urlencoded',
            cache: false,
            beforeSend: (xhr: any) => {
                if (silent === false) Loading.show();
                xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                if (csrf.length > 0) {
                    xhr.setRequestHeader('X-CSRF-TOKEN', csrf);
                    xhr.setRequestHeader('Authorization', 'Bearer ' + csrf);
                }
            },
        })
            .done((response: any, textStatus: string, xhr: any) => {
                if (silent === false) Loading.hide();
                if (xhr.status >= 200 && xhr.status <= 210) {
                    return callback?.(response);
                } else {
                    throw new Error('Error ' + textStatus);
                }
            })
            .fail((err: any) => {
                if (silent === false) Loading.hide();
                this.trigger('alert:error', { message: err.responseText });
                return callback?.(false);
            })
            .always(() => {
                if (silent === false) Loading.hide();
            });
    },

    downLoadFile(transfer: DownloadTransfer): void {
        const { url, filename } = transfer;
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        console.log(link);
        link.click();
    },

    uploadFile(transfer: UploadTransfer): void {
        const { url, data, callback, silent = false } = transfer;
        let formData: FormData;

        if (data instanceof FormData) {
            formData = data;
        } else {
            formData = new FormData();
            formData.append(data.name, data.file);
        }
        const csrf = document.querySelector("[name='csrf-token']")?.getAttribute('content') || '';
        Backbone.ajax({
            url: url,
            type: 'POST',
            dataType: 'json',
            data: formData,
            cache: false,
            contentType: false,
            processData: false,
            beforeSend: (xhr: JQuery.JQueryXHR) => {
                if (silent === false) Loading.show();
                xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                if (csrf.length > 0) {
                    xhr.setRequestHeader('X-CSRF-TOKEN', csrf);
                    xhr.setRequestHeader('Authorization', 'Bearer ' + csrf);
                }
            },
            success: (response: any) => {
                if (silent === false) Loading.hide();
                return callback(response);
            },
            error: (err: any) => {
                const keys = Object.keys(err);
                console.log(err);
                if (silent === false) Loading.hide();
                if (window._.indexOf(keys, 'responseText') !== -1) {
                    this.trigger('alert:error', { message: err.responseText });
                } else {
                    this.trigger('alert:error', { message: 'Error al subir archivo' });
                }
                return callback(false);
            },
        });
    },

    // Alias methods for backward compatibility
    confirma: function (transfer: ConfirmTransfer): void {
        return this.confirmaApp(transfer);
    },
    syncro: function (transfer: SyncroRequest): void {
        return this.syncroRequest(transfer);
    },
    ajax: function (transfer: any): void {
        return this.ajaxKumbia(transfer);
    },
    show_modal: function (transfer: ModalTransfer): void {
        return this.renderModal(transfer);
    },
    hide_modal: function (): void {
        return this.closeModal();
    },
    download: function (transfer: DownloadTransfer): void {
        return this.downLoadFile(transfer);
    },
    upload: function (transfer: UploadTransfer): void {
        return this.uploadFile(transfer);
    },
    // Backbone Events methods
    listenTo: function (object: any, event: string, callback: (...args: any[]) => void): void {
        window.Backbone.Events.listenTo.call(this, object, event, callback);
    },

    trigger: function (event: string, ...args: any[]): void {
        window.Backbone.Events.trigger.apply(this, [event, ...args]);
    }
};


export default $App;
