interface LogEntry {
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    data: any;
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export default class Logger {
    private static instance: Logger | null = null;
    private logs: LogEntry[] = [];
    private maxLogs: number = 1000;

    constructor() {
        if (Logger.instance) {
            return Logger.instance;
        }
        Logger.instance = this;
    }

    log(level: LogLevel, message: string, data: any = null): void {
        const logEntry: LogEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data: data ? this.structuredClone(data) : null,
        };

        this.logs.push(logEntry);

        // Mantener solo los últimos logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        console.log(message, data);
    }

    info(message: string, data?: any): void {
        this.log('info', message, data);
    }

    warn(message: string, data?: any): void {
        this.log('warn', message, data);
    }

    error(message: string, data?: any): void {
        this.log('error', message, data);
    }

    debug(message: string, data?: any): void {
        this.log('debug', message, data);
    }

    getLogs(level: LogLevel | null = null): LogEntry[] {
        return level ? this.logs.filter((log) => log.level === level) : [...this.logs];
    }

    clear(): void {
        this.logs = [];
    }

    structuredClone(data: any): any {
        return JSON.parse(JSON.stringify(data));
    }
}