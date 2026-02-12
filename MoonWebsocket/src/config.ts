import { join } from 'node:path';
import { readFileSync } from 'node:fs'
import { extend } from './utils'
import { TOML } from 'bun';


export interface RedisCacheOptions {
    uri: string;
    prefix?: string
}

export type ApplicationOptions = {
    development?: boolean;
    hostname?: string;
    port?: number;
    route: '/',
    idleTimeout?: number;
    sendPings?: boolean;
    publishToSelf?: boolean;
    redis?: RedisCacheOptions;
}

export type JwtOptions = {
    secretKey: string;
}

export type RoomOptions = {
    maxAudienceSize: number;
    unActiveMaxStay: number;
    unActiveMaxUseSec: number;
}

export type HookOptions = {
    baseURL: string;
    apiKey: string;
}

export interface config {
    app: ApplicationOptions;
    logger: string;
    room: RoomOptions;
    jwt: JwtOptions,
    hook: HookOptions
}

const filePath      = join(process.cwd(), './config.toml');
const configFile    = readFileSync(filePath, 'utf-8')
const content       = TOML.parse(configFile)

export default extend(true, {
    app: {
        port: 3000,
        route: "/io",
        redis: {
            uri: 'redis://127.0.0.1:6379/0',
            prefix: 'sec'
        }
    },
    room: {
        maxAudienceSize: 1,
    },
    jwt: {
        secretKey: "K9mP2vX8qL7nR4wE6tY3uI0oA5sD1fG9",
    },
    hook: {
        baseURL: "https://127.0.0.1:7001/api/hooks/io",
        apiKey: "5a8a1b2c-3d4e-4f5a-6b7c-8d9e0f1a2b3c",
    },
}, content ) as config
