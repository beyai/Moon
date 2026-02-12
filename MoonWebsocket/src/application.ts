import { createError, extend, getRequestIP } from "./utils";
import RedisCache from "./cache";
import { Client } from "./client";

import type { BunRequest, Server, WebSocketHandler, ServerWebSocket } from "bun"
import type { ApplicationOptions, RedisCacheOptions } from "./config";
import { CoreLogger } from "./logger";
import { WebhookLaunch } from "./webhook";

const logger = CoreLogger('App')

class Application {

    /** 应用配置  */
    config: ApplicationOptions
    
    /** HttpSever */ 
    server!: Server<Client>

    /** 缓存 */
    cache!: RedisCache
    
    constructor(options: ApplicationOptions) {
        this.config = extend(true, {
            development: false,
            hostname: '0.0.0.0',
            port: 3000,
            route: '/',
            idleTimeout: 60,
            sendPings: true,
            publishToSelf: false,
            redis: {
                uri: "redis://127.0.0.1:6379/0",
            }
        }, options) as ApplicationOptions
    }

    /** 创建 websocket 处理器  */
    private createWebsocketHandler(): WebSocketHandler<Client> {
        const { idleTimeout, sendPings, publishToSelf } = this.config
        return {
            idleTimeout,
            sendPings,
            publishToSelf,
            open(ws: ServerWebSocket<Client>) {
                let client = ws.data;
                client.onOpen && client.onOpen(ws)
            },

            close(ws: ServerWebSocket<Client>, code: number, reason?:string) {
                let client = ws.data;
                client.onClose && client.onClose(code, reason)
            },

            message(ws: ServerWebSocket<Client>, message: string | Buffer) {
                let client = ws.data;
                client.onMessage && client.onMessage(message)
            },

            pong(ws: ServerWebSocket<Client>) {
                let client = ws.data;
                client.onPong && client.onPong()
            },
        }
    }

    /** 创建上下文件 */
    private async createClient(req: BunRequest, server: Server<Client>) {
        req.headers.set("x-client-ip", getRequestIP(req, this.server))
        try {
            let success = false
            if (req.method === "GET" && req.headers.get("Upgrade")?.toLowerCase() === "websocket") {
                let data = await Client.create(req, this)
                success = server.upgrade(req, { data })
            }
            return success ? undefined : new Response('Not Found!', { status: 404 })
        } catch(error) {
            let err = error as createError
            return new Response( err.message || "Not Found!", { status: err.code || 404 })
        }
    }

    /** 创建缓存 */
    private async createCache() {
        const { redis } = this.config
        const cache = new RedisCache(redis as RedisCacheOptions)
        await cache.connect();
        this.cache = cache
        logger.info('redis success connected to ' + redis?.uri)
    }

    /** 创建服务 */
    private createServer() {
        const { hostname, port, development, route } = this.config
        this.server = Bun.serve<Client>({
            hostname,
            port,
            development,
            routes: {
                [route]: (req:BunRequest, server: Server<Client>) => {
                    return this.createClient(req, server)
                }
            },
            fetch() {
                return new Response("Not Found.", { status: 404 })
            },
            websocket: this.createWebsocketHandler()
        })
        logger.info('runing by ' + this.server.url)
    }

    /** 启动服务 */
    async start() {
        if (this.server) {
            throw new Error('服务已运行')
        }
        await WebhookLaunch();
        await this.createCache()
        this.createServer();
    }
}

export default Application