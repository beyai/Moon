import type { Client } from "../client";
import { durationTime } from "../utils";
import config from "../config";
import { RoomManager } from "./manager";
import { CoreLogger } from "../logger";
import { RoleType, RequestFrom } from "../types/request";
import type { RoomMessage } from "../types/room";
import type { Logger, LoggerMethod } from "../logger/Logger";


const MEMBER_LOGGER = Symbol("MEMBER_LOGGER")

export class Member {
    [MEMBER_LOGGER]: Logger | undefined

    get logger(): Logger {
        if (!this[MEMBER_LOGGER]) {
            const logger =  CoreLogger('RoomMember');
            this[MEMBER_LOGGER] =  new Proxy( logger, {
                get: (target: Logger, prop: LoggerMethod ) => {
                    if (!target[prop]) {
                        throw new Error("Unknown log method name.")
                    }
                    const { clientId, roomName, role, from, joinedAt,  ip } = this;
                    const message =  [ clientId, ip, from, roomName, role,  durationTime(joinedAt) ].join(' - ')
                    return (...args: any[]) => {
                        target[prop](message, ...args)
                    }
                }
            })
        }
        return this[MEMBER_LOGGER]
    }

    /**
     * 创建房间成员
     * @param client 客户端
     */
    constructor(client: Client, roomName: string, role: RoleType) {
        this.client     = client
        this.roomName   = roomName;
        this.role       = role;
    }
    
    /** 当前客户端  */
    client: Client;

    /** 房间名 */
    roomName: string;

    /** 角色 */
    role: RoleType = RoleType.AUDIENCE

    /** 加入时间 */
    joinedAt: number = Date.now()

    /** 连接IP */
    get ip(): string {
        return this.client.ip
    }

    /** 上次心跳时间 */
    private lastStayAt: number = Date.now()

    /** 未激活最大停留时长（秒） */
    private unActiveMaxStay: number = Infinity;

    /** 未激活使用累积时长（秒 */
    private unActiveMaxUseSec: number = config.room.unActiveMaxUseSec || 1500

    /** 客户端ID  */
    get clientId(): string {
        return this.client.clientId
    }

    /** 来源 */
    get from(): RequestFrom {
        return this.client.from
    }

    /** 
     * 设置最大停留时长（秒）
     */
    setMaxStay(value: number) {
        this.unActiveMaxStay = value;
    }

    /**
     * 发送消息
     */
    send(data: RoomMessage) {
        return this.client.send(data)
    }

    /**
     * 设置加计时间 
     */
    private async setUseSec(value: number): Promise<number> {
        return this.client.app.cache.increment(`use:${this.roomName}`, value, 3600)
    }

    /**
     * 处理停留时间
      */
    async handlerStay() {
        if ( this.from != RequestFrom.DEVICE || this.unActiveMaxStay == Infinity) return;
        const room = RoomManager.get(this.roomName)
        if (!room) return;

        const member = room.get(this.clientId)
        if (!member) {
            return;
        }

        // 检测是否超出连接时长限制
        const now = Date.now()
        const diff = Math.ceil( (now - this.joinedAt) / 1000 )

        // 更新累计时间
        const value =  Math.ceil( (now - this.lastStayAt ) / 1000 )
        const count = await this.setUseSec(value)
        this.lastStayAt = now
        
        // 超过最大停留时长，踢出房间
        if (diff >= this.unActiveMaxStay || count > this.unActiveMaxUseSec) {
            room.kickout(member)
        }
    }

    /**
     * 销毁
     */
    destroy() {
        this.client.onLeaveRoom(this.roomName)
        this.logger.debug('销毁')
        // @ts-ignore
        this.client = null;
    }

    /**
     * 转换成JSON对象
     */
    toJSON(): object {
        return {
            clientId: this.clientId,
            role: this.role,
            from: this.from,
            joinedAt: this.joinedAt,
        }
    }
}