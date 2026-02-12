import type { AnyMap, HybridObject } from 'react-native-nitro-modules'
// 信令状态类型
export type SignalState = 'connecting' | 'connected' | 'disconnected' 

// 信令请求消息
export interface SignalRequest {
    // 请求ID
    requestId: string;
    // 消息体
    body: AnyMap;
}

// 信令响应消息
export interface SignalResponse {
    // 请求ID
    requestId?: string;
    // 房间消息
    room?: string;
    // 消息体
    body: AnyMap;
}

/** 移除监听器 */
export type RemoveListener = () => void;

export interface Signal extends HybridObject<{ ios: 'swift' }> {
    /** 打开连接 */
    open(): Promise<void>;
    /** 关闭信令连接 */
    close(): void;
    /** 发送信令请求 */
    send(message: SignalRequest): Promise<void>;
    /** 状态监听 */
    onStatus(listener: (state: SignalState) => void): RemoveListener;
    /** 响应监听 */   
    onResponse(listener: (data: SignalResponse) => void): RemoveListener;
    /** 错误监听 */
    onError(listener: (error: string) => void): RemoveListener;
}