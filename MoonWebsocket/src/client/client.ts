import cbor from 'cbor'
import BaseClient from "./baseClient";
import { createError } from "../utils";
import { RequestMessageType, RequestFrom } from "../types/request";
import { WebhookLogin } from "../webhook";
import { Room, RoomManager } from "../room";
import { ClientSession, SessionBody } from '../Session';

import type { BunRequest } from "bun"
import type Application from "../application"
import type { RoomMessage } from "../types/room";
import type { 
    JoinMessageBody, LeaveMessageBody, LoginMessageBody, PublishMessageBody, 
    RequestMessage, RequestMessageBody, ResponseError, ResponseMessage,
    ResponseSuccess, 
} from '../types/request'


export class Client extends BaseClient {

    /**
     * 创建客户端
     */
    static async create(req: BunRequest, app: Application): Promise<Client> {
        const deviceUID = req.headers.get('sec-websocket-protocol')
        if (!deviceUID) {
            throw new createError(402, '无法获取设备唯一标识')
        }
        // 创建会话
        const session = new ClientSession(deviceUID)
        // 加载会话
        await session.load(app)
        // 创建客户端
        const client = new Client(app, req, session)
        return client
    }

    /** 连接来源  */
    from: RequestFrom = RequestFrom.CLIENT
    
    /** 是否已登录 */
    private isLogin: boolean = false

    /** 已加入的房间 */ 
    private joined = new Map<string, Room>()

    /**
     * 加密消息
     * @param data 消息内容
     */
    private async encryptMessage(data: ResponseMessage | RoomMessage): Promise<Buffer> {
        try {
            const encodeData = await this.session.encode(data)
            return cbor.encode(encodeData)
        } catch(error: any) {
            this.logger.error(error.message)
            throw new createError(402, '消息编码失败')
        }
    }

    /**
     * 消息解码
     * @param message 消息内容
     */
    private async decryptMessage(message: Buffer): Promise<RequestMessage> {
        try {
            const body = SessionBody.fromJSON(cbor.decode(message))
            const json = await this.session.decode(body)
            this.session.verify(json)
            return json as RequestMessage
        } catch(error: any) {
            this.logger.error(error.message)
            throw error
        }
    }

    /**
     * 获取房间
     * @param roomName 房间名
     */
    private getRoom(roomName: string): Room {
        const room = this.joined.get(roomName)
        if (!room) {
            throw new createError(400, `您未加入该房间(${ roomName })`)
        }
        return room
    }

    /**
     * 发送信息
     */
    async send(data: ResponseMessage | RoomMessage) {
        try {
            if (!this.ws) {
                this.logger.warn('当前客户端实例已销毁')
                return;
            }
            const encrypted = await this.encryptMessage(data)
            this.ws.sendBinary(encrypted)
        } catch(err) {
            this.logger.error(err)
        }
    }

    /**
     * 连接关闭
     */
    override onClose(code: number, reason?:string) {
        super.onClose(code, reason)
        this.destroy()
    }

    /** 
     * 接收心跳回馈
     */
    onPong() {
        this.joined.forEach(room => {
            const member = room.get(this.clientId)
            member?.handlerStay()
        })
    }

    /**
     * 监听离开房间
     * @param roomName 房间名
     */
    onLeaveRoom(roomName: string) {
        this.joined.delete(roomName)
    }

    /**
     * 验证消息格式
     */
    isRequestMessageBody(body: any): body is RequestMessageBody {
        return (
            body &&
            !Array.isArray(body) && 
            typeof body === 'object' &&
            typeof body.type === 'string'
        )
    }

    /**
     * 接收消息
     */
    async onMessage(message: string | Buffer) {
        if (typeof message == 'string') {
            this.ws?.close(1000, '不支持的消息格式')
            return;
        }

        try {
            const { requestId, body } = await this.decryptMessage(message as Buffer)
            if (!requestId || typeof requestId !== 'string') {
                throw new createError(400, '消息格式不正确')
            }

            if (!this.isRequestMessageBody(body)) {
                throw new createError(400, '消息格式不正确')
            }

            // 响应消息
            const responseBody: ResponseSuccess      = { code: 0, message: "success" }
            const responseResult: ResponseMessage    = { requestId: requestId, body: responseBody }
            try {
                
                // 初始化登录
                if (!this.isLogin && body.type == RequestMessageType.LOGIN) {
                    await this.handlerLogin(body)
                    responseBody.data = { 
                        clientId: this.clientId
                    }
                }

                // 加入房间
                else if (body.type == RequestMessageType.JOIN) {
                    try {
                        await this.handlerJoin(body)
                    } catch(err: any) {
                        // 加入房间失败, 延迟断开连接，保证错误消息发送到客户端
                        setTimeout(() => this.ws?.close(1000,  err.message), 100)
                        throw err
                    }
                    responseBody.data = {
                        clientId: this.clientId,
                        from: this.from,
                        role: body.role,
                    }
                }

                // 离开房间
                else if (body.type == RequestMessageType.LEAVE) {
                    await this.handlerLeave(body)
                }

                // 推送
                else if (body.type == RequestMessageType.PUBLISH) {
                    await this.handlerPublish(body)
                }

                // 异常消息
                else {
                    throw new createError(400, '不支持的消息类型')
                }


            } catch (error: any) {
                // 统一错误消息回复
                responseResult.body = {
                    code: error.code || 500,
                    message: error.message || 'Internal error'
                }
            }
            return this.send(responseResult)
        } catch(error: any) {
            console.log(error)
            this.ws?.close(1000,  error.message)
        }
    }


    /**
     * 登录
     */
    private async handlerLogin(body: LoginMessageBody) {
        // 调用 webhook 验证请求
        await WebhookLogin(body.data)
        this.from       = body.data.from;
        this.isLogin    = true;
        this.logger.debug("登录成功", this.from)
    }

    /**
     * 加入房间
     */
    private async handlerJoin(body: JoinMessageBody) { 
        let room = RoomManager.get(body.room)
        if (!room) {
            room = RoomManager.create(body.room)
        }
        await room.join(this, body.role)
        this.joined.set(room.name, room)
    }

    /**
     * 离开房间
     */
    private async handlerLeave(body: LeaveMessageBody) {
        let room = this.getRoom(body.room)
        room.leave(this.clientId)
    }

    /**
     * 消息推送
     */
    private async handlerPublish(body: PublishMessageBody) {
        let room = this.getRoom(body.room)
        room.publish(this.clientId, body)
    }

    /**
     * 销毁
     */
    override destroy() {
        super.destroy()
        // 离开所有房间
        this.joined.forEach((room) => {
            try {
                room.leave(this.clientId)
            } catch(err) {
                this.logger.error(err)
            }
        })
        // 清空已加入房间
        this.joined.clear();
    }
}