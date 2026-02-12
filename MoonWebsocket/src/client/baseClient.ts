import { randomBytes } from "node:crypto";
import { CoreLogger } from "../logger";
import { getRequestIP } from "../utils";

import type { BunRequest, ServerWebSocket } from "bun"
import type Application from "../application"
import type { Logger, LoggerMethod } from "../logger/Logger";
import type { ClientSession } from "../Session/ClientSession";
const CLIENT_LOGGER         = Symbol("ROOM_LOGGER")

class BaseClient {
    
    [CLIENT_LOGGER]: Logger | undefined

    get logger(): Logger {
        if (!this[CLIENT_LOGGER]) {
            const logger =  CoreLogger('Client');
            this[CLIENT_LOGGER] =  new Proxy( logger, {
                get: (target: Logger, prop: LoggerMethod ) => {
                    if (!target[prop]) {
                        throw new Error("Unknown log method name.")
                    }
                    const message =  [ this.clientId ].join(' - ')
                    return (...args: any[]) => {
                        target[prop](message, ...args)
                    }
                }
            })
        }
        return this[CLIENT_LOGGER]
    }
    
    /** 应用 */
    readonly app: Application;
    /** 请求 */
    readonly req: BunRequest
    /** 会话 */
    readonly session: ClientSession
    /** 客户端ID */
    readonly clientId: string

    /** 客户端ip */
    get ip(): string {
        return this.req.headers.get('x-client-ip') ?? ''
    }

    /** 连接时间 */    
    readonly starttime = Date.now()

    /**
     * WebSocket
     */
    ws?: ServerWebSocket<BaseClient> | null

    /**
     * 创建客户端
     * @param req 当前请求
     * @param app 应用
     */
    constructor(app: Application, req: BunRequest,  session: ClientSession) {
        this.app        = app
        this.req        = req.clone()
        this.session    = session
        this.clientId   = randomBytes(6).toHex().toLowerCase()
    }

    /**
     * 连接成功
     * @param ws websocket服务
     */
    onOpen(ws: ServerWebSocket<BaseClient>) {
        this.ws = ws;
        this.logger.debug('连接成功')
    }

    /**
     * 连接关闭
     */
    onClose(code: number, reason?:string) {
        this.logger.debug('断开连接')
    }

    /**
     * 销毁
     */
    destroy() {
        this.ws     = null
    }
}

export default BaseClient