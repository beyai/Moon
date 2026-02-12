import type { LogLevel } from '../types';

export interface Transport {
    log(level: LogLevel, message: string): void;
}