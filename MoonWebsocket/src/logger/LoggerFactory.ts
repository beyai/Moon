import path from 'node:path';
import type { LoggerFactoryOptions, LogLevel } from './types';
import type { Transport } from './transports/Transport';
import { ConsoleTransport } from './transports/ConsoleTransport';
import { FileTransport } from './transports/FileTransport';
import { Logger } from './Logger';

export class LoggerFactory {
    private readonly transport: Transport;
    private readonly level: LogLevel;
    private readonly loggers = new Map<string, Logger>();

    constructor(options: LoggerFactoryOptions = {}) {
        const env = process.env.NODE_ENV || 'development';
        this.level = options.level || (env === 'production' ? 'INFO' : 'DEBUG');
        if (env === 'production') {
            const appName = options.appName || 'bun-app';
            const logPath = options.logPath || path.join(process.cwd(), 'logs');
            this.transport = new FileTransport(logPath, appName);
        } else {
            this.transport = new ConsoleTransport();
        }
    }

    /**
     * 获取一个带有上下文的 Logger 实例
     * @param context - 日志上下文，通常是模块名或类名
     */
    getLogger(context: string = 'app'): Logger {
        if (this.loggers.has(context)) {
            return this.loggers.get(context)!;
        }

        const logger = new Logger(this.transport, this.level, context);
        this.loggers.set(context, logger);
        return logger;
    }
}