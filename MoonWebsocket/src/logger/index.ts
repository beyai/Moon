import type { Logger } from './Logger';
import { LoggerFactory } from './LoggerFactory';

const loggerFactory = new LoggerFactory({
    appName: 'Bun',
    logPath: './logs'
})

export function CoreLogger(name:string): Logger  {
    return loggerFactory.getLogger(name)
}