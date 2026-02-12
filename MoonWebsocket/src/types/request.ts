export type base64String = string;

/** 请求消息类型 */
export enum RequestMessageType {
    LOGIN = "login",
    JOIN = "join",
    LEAVE = "leave",
    PUBLISH = "publish"
}

/** 客户端来源 */
export enum RequestFrom {
    DEVICE = "device",
    CLIENT = "client"
}

/** 角色 */
export enum RoleType {
    ANCHOR = "anchor",
    AUDIENCE = "audience"
}

export type LoginData = {
    from: RequestFrom;
    token?: string;
}

export type JoinData = {
    room: string;
    role: RoleType
}

export type LeaveData = {
    room: string;
}

/** 登录消息 */
export interface LoginMessageBody {
    type: RequestMessageType.LOGIN;
    data: LoginData
}

/** 加入房间消息 */
export interface JoinMessageBody extends JoinData {
    type: RequestMessageType.JOIN;
}

/** 离开房间 */
export interface LeaveMessageBody extends LeaveData {
    type: RequestMessageType.LEAVE;
}

/** 推送消息 */
export interface PublishMessageBody {
    type: RequestMessageType.PUBLISH;
    room: string;
    data: Record<string, any>
}

/** 客户端消息内容 */
export type RequestMessageBody = LoginMessageBody | JoinMessageBody | LeaveMessageBody | PublishMessageBody

/** 客户端请求消息 */
export interface RequestMessage {
    requestId: string;
    body: RequestMessageBody
}


/** 响应成功 */
export type ResponseSuccess<T = any> = {
    code: 0;
    message: string;
    data?: T
}

/** 响应失败 */
export type ResponseError = {
    code: 400 | 401 | 403 | 412 | 415 | 500
    message: string
}

export type ResponseBody = ResponseSuccess | ResponseError

/** 响应消息 */
export interface ResponseMessage  {
    requestId: string;
    body: ResponseBody;
    timestamp?: number;
    deviceUID?: string;
}