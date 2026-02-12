import { MRTCIceCandidate, MRTCSessionDescription } from "react-native-nitro-moon";

// 信令消息来源
export type SignalFrom      = 'device' | 'client'
// 房间角色类型
export type RoomRole        = 'anchor' | 'audience'
// 信令消息类型
export type RoomMessageType = 'kickout' | 'message' | 'members'

// 信令消息响应 Body
export interface SignalResponseBody<T> {
    code: number;
    message: string;
    data?: T
}

// 登录
export interface SignalLogin {
    type: 'login',
    data: {
        from: SignalFrom,
        token?: string
    }
}

// 加入房间
export interface SignalJoin {
    type: "join",
    // 角色
    role: RoomRole,
    // 房间名
    room: string
}

// 离开房间
export interface SignalLeave {
    type: 'leave',
    // 房间名
    room: string
}

// 推送消息
export interface SignalPublish<T> {
    type: 'publish',
    // 房间名
    room: string,
    // 消息内容
    data: T
}

// 登录响应数据
export type SignalLoginResponse = {
    clientId: string
}

// 加入房间响应数据
export type SignalJoinResponse = {
    clientId: string;
    room: string;
    role: RoomRole
}

// 房间成员数据
export type RoomMember = {
    clientId: string;
    role: RoomRole;
    from: SignalFrom;
    jonedAt: number
}

// 房间成员列表
export type RoomMemberMessage = {
    type: 'members',
    data: RoomMember[]
}

// 踢出房间
export type RoomKickoutMessage = {
    type: 'kickout'
}

// 房间通用
export type RoomCommonMessage = {
    type: 'message',
    data: MRTCSessionDescription | MRTCIceCandidate
}

// 房间消息
export type SignalRoomMessage =  RoomMemberMessage | RoomKickoutMessage | RoomCommonMessage