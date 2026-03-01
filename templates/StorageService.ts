// Interfaz para las opciones de almacenamiento
interface StorageOptions {
    prefix?: string;
    expiration?: number; // en segundos
    encrypt?: boolean;
}

// Interfaz para los datos almacenados
interface StorageItem<T = any> {
    data: T;
    timestamp: number;
    expiration?: number;
    encrypted?: boolean;
}

// Servicio para gestión de almacenamiento local
class StorageService {
    private prefix: string;
    private defaultExpiration: number;
    private encrypt: boolean;

    constructor(options: StorageOptions = {}) {
        this.prefix = options.prefix || 'app_';
        this.defaultExpiration = options.expiration || 3600; // 1 hora por defecto
        this.encrypt = options.encrypt || false;
    }

    /**
     * Generar clave completa con prefijo
     */
    private getKey(key: string): string {
        return `${this.prefix}${key}`;
    }

    /**
     * Encriptar datos (simple base64 para demostración)
     */
    private encryptData(data: string): string {
        if (!this.encrypt) return data;
        return btoa(data);
    }

    /**
     * Desencriptar datos
     */
    private decryptData(data: string): string {
        if (!this.encrypt) return data;
        try {
            return atob(data);
        } catch {
            return data;
        }
    }

    /**
     * Verificar si un item ha expirado
     */
    private isExpired(item: StorageItem): boolean {
        if (!item.expiration) return false;
        return Date.now() > item.expiration;
    }

    /**
     * Guardar datos en localStorage
     */
    set<T>(key: string, data: T, expiration?: number): boolean {
        try {
            const fullKey = this.getKey(key);
            const item: StorageItem<T> = {
                data,
                timestamp: Date.now(),
                expiration: expiration ? Date.now() + (expiration * 1000) : undefined,
                encrypted: this.encrypt
            };

            const serialized = JSON.stringify(item);
            const encrypted = this.encryptData(serialized);

            localStorage.setItem(fullKey, encrypted);
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    /**
     * Obtener datos desde localStorage
     */
    get<T>(key: string, defaultValue?: T): T | null {
        try {
            const fullKey = this.getKey(key);
            const encrypted = localStorage.getItem(fullKey);

            if (!encrypted) return defaultValue || null;

            const decrypted = this.decryptData(encrypted);
            const item: StorageItem<T> = JSON.parse(decrypted);

            // Verificar expiración
            if (this.isExpired(item)) {
                this.remove(key);
                return defaultValue || null;
            }

            return item.data;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue || null;
        }
    }

    /**
     * Eliminar un item del localStorage
     */
    remove(key: string): boolean {
        try {
            const fullKey = this.getKey(key);
            localStorage.removeItem(fullKey);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }

    /**
     * Verificar si existe un item
     */
    has(key: string): boolean {
        const fullKey = this.getKey(key);
        return localStorage.getItem(fullKey) !== null;
    }

    /**
     * Limpiar todos los items con el prefijo
     */
    clear(): boolean {
        try {
            const keys = this.keys();
            keys.forEach(key => this.remove(key));
            return true;
        } catch (error) {
            console.error('Error clearing localStorage:', error);
            return false;
        }
    }

    /**
     * Obtener todas las claves con el prefijo
     */
    keys(): string[] {
        const keys: string[] = [];
        const prefix = this.prefix;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(prefix)) {
                keys.push(key.replace(prefix, ''));
            }
        }

        return keys;
    }

    /**
     * Obtener tamaño total de almacenamiento usado
     */
    size(): number {
        let total = 0;
        const keys = this.keys();

        keys.forEach(key => {
            const fullKey = this.getKey(key);
            const item = localStorage.getItem(fullKey);
            if (item) {
                total += item.length;
            }
        });

        return total;
    }

    /**
     * Limpiar items expirados
     */
    cleanExpired(): number {
        let cleaned = 0;
        const keys = this.keys();

        keys.forEach(key => {
            const fullKey = this.getKey(key);
            const encrypted = localStorage.getItem(fullKey);

            if (encrypted) {
                try {
                    const decrypted = this.decryptData(encrypted);
                    const item: StorageItem = JSON.parse(decrypted);

                    if (this.isExpired(item)) {
                        this.remove(key);
                        cleaned++;
                    }
                } catch {
                    // Si no puede parsear, eliminar
                    this.remove(key);
                    cleaned++;
                }
            }
        });

        return cleaned;
    }

    /**
     * Guardar objeto con auto-expiración
     */
    setWithTTL<T>(key: string, data: T, ttl: number): boolean {
        return this.set(key, data, ttl);
    }

    /**
     * Obtener información de un item
     */
    getInfo(key: string): { exists: boolean; size?: number; timestamp?: number; expiration?: number } | null {
        try {
            const fullKey = this.getKey(key);
            const encrypted = localStorage.getItem(fullKey);

            if (!encrypted) {
                return { exists: false };
            }

            const decrypted = this.decryptData(encrypted);
            const item: StorageItem = JSON.parse(decrypted);

            return {
                exists: true,
                size: encrypted.length,
                timestamp: item.timestamp,
                expiration: item.expiration
            };
        } catch (error) {
            console.error('Error getting item info:', error);
            return null;
        }
    }

    /**
     * Verificar espacio disponible
     */
    getAvailableSpace(): number {
        try {
            // Intentar guardar un item de prueba para verificar espacio
            const testKey = this.getKey('__space_test__');
            const testData = 'x'.repeat(1024); // 1KB

            let total = 0;
            let count = 0;

            while (count < 1000) { // Máximo 1MB de prueba
                try {
                    localStorage.setItem(testKey + count, testData);
                    total += 1024;
                    count++;
                } catch {
                    break;
                }
            }

            // Limpiar datos de prueba
            for (let i = 0; i < count; i++) {
                localStorage.removeItem(testKey + i);
            }

            return total;
        } catch {
            return 0;
        }
    }

    /**
     * Exportar todos los datos
     */
    export(): Record<string, any> {
        const data: Record<string, any> = {};
        const keys = this.keys();

        keys.forEach(key => {
            const value = this.get(key);
            if (value !== null) {
                data[key] = value;
            }
        });

        return data;
    }

    /**
     * Importar datos
     */
    import(data: Record<string, any>, options: { overwrite?: boolean; merge?: boolean } = {}): boolean {
        try {
            const { overwrite = true, merge = true } = options;

            if (!merge) {
                this.clear();
            }

            Object.keys(data).forEach(key => {
                if (overwrite || !this.has(key)) {
                    this.set(key, data[key]);
                }
            });

            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}

// Instancia por defecto
const defaultStorage = new StorageService({
    prefix: 'app_',
    expiration: 3600, // 1 hora
    encrypt: false
});

// Exportar el servicio y la instancia por defecto
export default StorageService;
export { defaultStorage };
export type { StorageOptions, StorageItem };
