import path from 'node:path'
import config  from './config';
import { createError } from './utils';

import type { Member } from './room';
import type { LoginData } from './types/request';

export type ApiResponse = {
    code: number;
    message: string;
    data?: Record<string, any>
}

/**
 * 发送请求
 */
async function sendRequest(url: string, body?: object, headers: Record<string, string> = {} ): Promise<ApiResponse> {
    const uri = new URL(config.hook.baseURL)
    uri.pathname = path.join(uri.pathname, url);
    const options = {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': config.hook.apiKey,
            ...headers
        },
        body: body ? JSON.stringify(body) : undefined,
    }
    try {
        const response = await fetch(uri.toString(), options)
        const data = await response.json() as ApiResponse
        if (data && data.code === 0) {
            return data
        }
        const err = new createError(data.code || response.status, data.message || response.statusText);
        return Promise.reject(err)
    } catch(err) {
        throw new createError(400, "请求失败，请稍后再试")
    }
    
}


/**
 * 服务启动
 */
export async function WebhookLaunch() {
    await sendRequest('/launch')
}

/**
 * 登录回调
 */
export async function WebhookLogin(data: LoginData): Promise<void> {
    const token = data.token;
    if (!token) {
        throw new createError(401, 'Token 无效')   
    }
    await sendRequest('/auth', { token })
}

/**
 * 加入房间回调
 * - 验证设备是否激活、禁用、并同时更新在线状态
 */
export type JoinResult = {
    isActive: boolean
}

export async function WebhookJoinRoom(member: Member): Promise<JoinResult> {
    const { role, from, roomName, ip } = member
    const result = await sendRequest('/join', {
        room: roomName,
        role, 
        from,
        timestamp: Date.now()
    }, {
        'x-forwarded-for': ip
    })
    return result.data as JoinResult
}

/**
 * 离开房间回调
 * - 客户端离开、踢出房间，更新在线状态
 */
export async function WebhookLeaveRoom(member: Member): Promise<void> {
    const { role, from, roomName, ip } = member
    await sendRequest('/leave', {
        room: roomName,
        role, 
        from,
        timestamp: Date.now()
    }, {
        'x-forwarded-for': ip
    }).catch(err => {
        console.error(err)
    })
}