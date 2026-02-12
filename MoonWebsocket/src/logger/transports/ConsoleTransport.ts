import type { Transport } from './Transport';
import type { LogLevel } from '../types';

// ANSI 颜色代码
const colors = {
    DEBUG: Bun.color("#0AF", "ansi"),
    INFO: Bun.color("#0F0", "ansi"),
    WARN: Bun.color("#FF0", "ansi"),
    ERROR: Bun.color("#F00", "ansi"),
    RESET: '\x1b[0m',
};

export class ConsoleTransport implements Transport {
    log(level: LogLevel, message: string): void {
        const color = colors[level] || colors.RESET;
        const formattedMessage = `${color}${message}${colors.RESET}`;

        switch (level) {
            case 'DEBUG':
                console.debug(formattedMessage);
                break;
            case 'INFO':
                console.info(formattedMessage);
                break;
            case 'WARN':
                console.warn(formattedMessage);
                break;
            case 'ERROR':
                console.error(formattedMessage);
                break;
            default:
                console.log(formattedMessage);
        }
    }
}