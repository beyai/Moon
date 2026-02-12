import dayjs from 'dayjs';
import { format as utilFormat } from 'node:util';
import type { LogLevel } from './types';
import { LogLevelValue } from './types';
import type { Transport } from './transports/Transport';


export function getLogTime() {
    return dayjs().format("YYYY-MM-DD HH:mm:ss,SSS")
}

export type LoggerMethod = 'debug' | 'info' | 'warn' | 'error'

export class Logger {
    private context: string;
    private transport: Transport;
    private minLevelValue: number;

    constructor(transport: Transport, level: LogLevel, context: string = 'app') {
        this.transport = transport;
        this.context = context;
        this.minLevelValue = LogLevelValue[level];
    }

    private formatMessage(level: LogLevel, ...args: any[]): string {
        const message = utilFormat(...args);
        const timestamp = getLogTime()
        return `${timestamp} ${level} [${this.context}] ${message}`;
    }

    private log(level: LogLevel, ...args: any[]): void {
        if (LogLevelValue[level] < this.minLevelValue) {
            return;
        }
        const message = this.formatMessage(level, ...args);
        this.transport.log(level, message);
    }

    debug(...args: any[]): void {
        this.log('DEBUG', ...args);
    }

    info(...args: any[]): void {
        this.log('INFO', ...args);
    }

    warn(...args: any[]): void {
        this.log('WARN', ...args);
    }

    error(...args: any[]): void {
        this.log('ERROR', ...args);
    }
}