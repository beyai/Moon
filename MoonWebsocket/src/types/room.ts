import type { base64String, RequestFrom, RoleType } from "./request";

export enum RoomMessageType {
    KICKOUT = 'kickout',
    MESSAGE = 'message',
    MEMBERS = 'members',
}

export type Member = {
    clientId: string;
    from: RequestFrom;
    role: RoleType,
}

/** 房间踢出 */
export type RoomKickoutBody = {
    type: RoomMessageType.KICKOUT
}

/** 房间成员 */
export type RoomMembersBody = {
    type: RoomMessageType.MEMBERS;
    data: Member[]
}

/** 房间消息 */
export type RoomPublishBody = {
    type: RoomMessageType.MESSAGE;
    data: any
}

/** 房间消息 */
export type RoomMessageBody = RoomKickoutBody | RoomMembersBody | RoomPublishBody

/** 房间消息 */
export type RoomMessage = {
    room: string;
    body: RoomMessageBody;
    timestamp?: number;
    deviceUID?: string;
}