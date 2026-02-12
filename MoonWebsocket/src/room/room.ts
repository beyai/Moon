import Conf from "../config"
import { createError } from "../utils"
import { CoreLogger } from "../logger";
import { Member } from "./member"
import { RoomManager } from "./manager"
import { WebhookJoinRoom, WebhookLeaveRoom } from "../webhook"
import { RoleType } from "../types/request"
import { RoomMessageType } from "../types/room"
import type { Client } from "../client"
import type { PublishMessageBody } from "../types/request"
import type { RoomKickoutBody, RoomMembersBody, RoomMessage, RoomMessageBody, RoomPublishBody } from "../types/room"
import type { Logger, LoggerMethod } from "../logger/Logger";

const ROOM_LOGGER = Symbol("ROOM_LOGGER")

export class Room {

    [ROOM_LOGGER]: Logger | undefined
    get logger(): Logger {
        if (!this[ROOM_LOGGER]) {
            const logger =  CoreLogger('Room');
            this[ROOM_LOGGER] =  new Proxy( logger, {
                get: (target: Logger, prop: LoggerMethod ) => {
                    if (!target[prop]) {
                        throw new Error("Unknown log method name.")
                    }
                    const message =  [ this.name ].join(' - ')
                    return (...args: any[]) => {
                        target[prop](message, ...args)
                    }
                }
            })
        }
        return this[ROOM_LOGGER]
    }

    /**
     * @param name 房间名称
     */
    constructor(name: string) {
        this.name = name;
        this.logger.debug('创建')
    }

    /** 房间名 */
    name: string

    /**
     * 房间内成员
     */
    members = new Map<string, Member>()

    /** 成员人数 */
    get count(): number {
        return this.members.size
    }

    /**
     * 统计角色人数
     * @param role 角色
     */
    private countByRole(role: RoleType): number {
        return Array.from(this.members.values()).filter(member => member.role == role).length
    }

    /**
     * 根据角色获取第一个加入的成员
     * @param role 角色
     */
    private findOneByRole(role: RoleType): Member | undefined {
        return Array.from(this.members.values()).find(member => member.role == role)
    }

    /**
     * 查询成员
     * @param role 角色
     */
    private findAll(role?: RoleType): Member[] {
        const members = Array.from(this.members.values());
        if (!role) {
            return members.map(item => {
                return item.toJSON() as Member
            })
        } else {
            return members.filter(member => member.role == role)
        }
    }

    /**
     * 广播消息
     * @param body 消息内容
     * @param role 角色，未定义时发送给所有成员
     * @param exclude 排除客户端
     */
    private broadcast(body: RoomMessageBody, role?: RoleType, exclude: string | string[] = []) {
        if (typeof exclude == 'string') {
            exclude = [ exclude ]
        } else if (!Array.isArray(exclude)) {
            exclude = []
        }
        const message: RoomMessage = { room: this.name, body: body }
        this.members.forEach(member => {
            if (exclude.includes(member.clientId)) return;
            if (!role) {
                return member.send(message)
            }
            if (member.role == role) {
                return member.send(message)
            }
        })
    }

    /**
     * 发送消息到指定成员
     * @param clientId 客户端ID
     * @param body 消息内容
     */
    private sendToMember(clientId: string, body: RoomMessageBody) {
        try {
            const member = this.members.get(clientId)
            if (!member) {
                throw new createError(400, '成员不存在')
            }
            const message: RoomMessage = { room: this.name, body: body }
            member.send(message)
        } catch(err) {
            this.logger.error(err)
        }
    }

    /**
     * 添加成员
     * @param member 成员信息
     */
    add(member: Member): Room {
        this.members.set(member.clientId, member)
        this.sendMemberList()
        return this
    }

    /**
     * 成员是否存在
     * @param clientId 客户端ID
      */
    has(clientId: string): boolean {
        return this.members.has(clientId)
    }

    /**
     * 删除成员
     * @param clientId 客户端ID
     */
    remove(clientId: string): boolean {
        const member = this.members.get(clientId)
        if (!member) return false;
        const success = this.members.delete(clientId)

        // 上报离线
        WebhookLeaveRoom(member).catch((error) => {
            this.logger.error(error.message)
        })
        
        // 销毁成员
        member.destroy(); 
        
        if (this.count > 0) {
            // 发送最新的成员列表给房间内所有成员
            this.sendMemberList()
        } else {
            // 销毁
            this.destroy()
        }
        return success
    }

    /**
     * 获取房间成员
     * @param clientId 客户端ID
     */
    get(clientId: string): Member | undefined {
        return this.members.get(clientId)
    }

    /**
     * 加入房间
     * @param client 客户端
     * @param role 角色
     */
    async join(client: Client, role: RoleType): Promise<void> {
        if (this.has(client.clientId)) {
            throw new createError(400, `您已加入该房间(${ this.name }), 不可重复加入`)
        }
        // 验证成员
        const member = new Member(client, this.name, role)
        const result = await WebhookJoinRoom(member)
        // 未激活
        if (!result.isActive) {
            // 设置房间最大停留时长 (秒)
            member.setMaxStay(Conf.room.unActiveMaxStay)
        }

        // 统计当前角色人数
        const count = this.countByRole(role)
        // 踢人
        if (count > 0 ) {
            // 主播
            if (role == RoleType.ANCHOR) {
                const anchor = this.findOneByRole(role)
                anchor && this.kickout(anchor)
            }
            // 观众
            else if (role == RoleType.AUDIENCE && count >= Conf.room.maxAudienceSize ) {
                const audience = this.findOneByRole(role)
                audience && this.kickout(audience)
            }
        }
        // 添加新成员
        this.add(member)
        member.logger.info('加入')
    }

    /**
     * 离开房间
     * - 客户端主动离开
     * @param clientId 客户端ID
     */
    leave(clientId: string) {
        const member = this.get(clientId)
        if (!member) return;
        member.logger.info('离开')
        this.remove(clientId)
    }

    /**
     * 将成员踢出房间
     * - 客户端被动离开
     * @param member 成员
     */
    kickout(member: Member) {
        if (!member) return;
        // 发送踢出房间消息到当前成员
        let body: RoomKickoutBody = { type: RoomMessageType.KICKOUT }
        this.sendToMember(member.clientId, body)
        // 从房间中删除
        member.logger.info('踢出')
        this.remove(member.clientId)
    }

    /**
     * 推送消息
     * @param clientId 消息来源客户端ID
     * @param body 消息内容
     */
    publish(clientId: string, message: PublishMessageBody) {
        const from = this.get(clientId)
        if (!from) {
            throw new createError(400, `您未加入该房间(${ this.name })`)
        }

        const body: RoomPublishBody = { 
            type: RoomMessageType.MESSAGE, 
            data: message.data 
        }

        // 转发消息给指定角色的所有成员
        if (from.role == RoleType.ANCHOR) {
            this.broadcast(body, RoleType.AUDIENCE, from.clientId)
        } else if (from.role == RoleType.AUDIENCE) {
            this.broadcast(body, RoleType.ANCHOR, from.clientId)
        }
    }

    /**
     * 发送成员列表
     */
    private _sendMemberListTimer: Timer | null = null
    sendMemberList() {
        if (this._sendMemberListTimer) {
            clearTimeout(this._sendMemberListTimer)
        }
        // 延迟发送成员列表
        this._sendMemberListTimer = setTimeout(() => {
            const members = this.findAll()
            const body: RoomMembersBody = { 
                type: RoomMessageType.MEMBERS, 
                data: members
            }
            this.broadcast(body)
        }, 100)
    }

    /**
     * 销毁房间
     */
    destroy() {
        if (this._sendMemberListTimer) {
            clearTimeout(this._sendMemberListTimer)
            this._sendMemberListTimer = null
        }
        this.members.clear();
        RoomManager.remove(this.name)
        this.logger.debug('销毁')
    }
}