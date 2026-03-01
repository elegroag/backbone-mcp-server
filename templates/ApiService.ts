import { AppInstance } from '@/types/types';

// Interfaz para las respuestas de la API
interface ApiResponse<T = any> {
    success: boolean;
    data: T;
    message?: string;
    pagination?: {
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
}

// Interfaz para errores de API
interface ApiError {
    message: string;
    status: number;
    statusText: string;
}

// Servicio de API con token de Sanctum
class ApiService {

    props: any;
    constructor(props: any) {
        this.props = props;
    }

    /**
     * Obtener token de Sanctum desde las props de Inertia
     */
    getToken(): string | null {
        return this.props?.token || null;
    }

    /**
     * Obtener headers configurados para requests API
     */
    getHeaders(): Record<string, string> {
        const token = this.getToken();
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    /**
     * Manejar errores de API de forma consistente
     */
    private handleError(error: any, url: string): never {
        let errorMessage = 'Error en la solicitud';
        let status = 500;
        let statusText = 'Internal Server Error';

        if (error instanceof Response) {
            status = error.status;
            statusText = error.statusText;

            if (error.status === 401) {
                errorMessage = 'No autorizado - Token inválido o expirado';
                // Redirigir a login si el token expiró
                window.location.href = '/login';
            } else if (error.status === 403) {
                errorMessage = 'Acceso denegado - No tienes permisos para esta acción';
            } else if (error.status === 404) {
                errorMessage = 'Recurso no encontrado';
            } else if (error.status >= 500) {
                errorMessage = 'Error del servidor - Inténtalo más tarde';
            }
        } else if (error.message) {
            errorMessage = error.message;
        }

        const apiError: ApiError = {
            message: errorMessage,
            status,
            statusText
        };

        console.error(`API Error [${status}] ${url}:`, apiError);
        throw apiError;
    }

    /**
     * Request GET
     */
    async get<T = any>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
        try {
            const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
            const response = await fetch(`/api${url}${queryString}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                this.handleError(response, url);
            }

            return await response.json();
        } catch (error) {
            this.handleError(error, url);
        }
    }

    /**
     * Request POST
     */
    async post<T = any>(url: string, data?: Record<string, any>): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`/api${url}`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: data ? JSON.stringify(data) : null
            });

            if (!response.ok) {
                this.handleError(response, url);
            }

            return await response.json();
        } catch (error) {
            this.handleError(error, url);
        }
    }

    /**
     * Request PUT
     */
    async put<T = any>(url: string, data?: Record<string, any>): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`/api${url}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: data ? JSON.stringify(data) : null
            });

            if (!response.ok) {
                this.handleError(response, url);
            }

            return await response.json();
        } catch (error) {
            this.handleError(error, url);
        }
    }

    /**
     * Request PATCH
     */
    async patch<T = any>(url: string, data?: Record<string, any>): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`/api${url}`, {
                method: 'PATCH',
                headers: this.getHeaders(),
                body: data ? JSON.stringify(data) : null
            });

            if (!response.ok) {
                this.handleError(response, url);
            }

            return await response.json();
        } catch (error) {
            this.handleError(error, url);
        }
    }

    /**
     * Request DELETE
     */
    async delete<T = any>(url: string): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(`/api${url}`, {
                method: 'DELETE',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                this.handleError(response, url);
            }

            return await response.json();
        } catch (error) {
            this.handleError(error, url);
        }
    }

    /**
     * Upload de archivos
     */
    async upload<T = any>(url: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse<T>> {
        try {
            const formData = new FormData();
            formData.append('file', file);

            if (additionalData) {
                Object.keys(additionalData).forEach(key => {
                    formData.append(key, additionalData[key]);
                });
            }

            const token = this.getToken();
            const headers: Record<string, string> = {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`/api${url}`, {
                method: 'POST',
                headers,
                body: formData
            });

            if (!response.ok) {
                this.handleError(response, url);
            }

            return await response.json();
        } catch (error) {
            this.handleError(error, url);
        }
    }

    /**
     * Download de archivos
     */
    async download(url: string, filename?: string): Promise<void> {
        try {
            const response = await fetch(`/api${url}`, {
                method: 'GET',
                headers: this.getHeaders()
            });

            if (!response.ok) {
                this.handleError(response, url);
            }

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename || 'download';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
            this.handleError(error, url);
        }
    }

    /**
     * Verificar si hay token disponible
     */
    isAuthenticated(): boolean {
        return this.getToken() !== null;
    }

    /**
     * Obtener información del usuario desde el token
     */
    getUserInfo(): any | null {
        const appElement = document.getElementById('app');
        if (!appElement) return null;

        const pageData = appElement.getAttribute('data-page');
        if (!pageData) return null;

        const page = JSON.parse(pageData);
        return page.props?.auth?.user || null;
    }
}

// Exportar el servicio
export default ApiService;
export type { ApiResponse, ApiError };
