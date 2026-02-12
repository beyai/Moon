import { Alert } from "react-native";
import { useCallback, useEffect, useRef } from "react";
import { SignalModule } from "react-native-nitro-moon";
import { useToast } from "@/Components/Toast";
import { AuthState } from "@/Store";
import { Service } from "@/Service";
import { RTCActions } from "./RTCStore";
import { SignalRequest } from "./SignalRequest";
import { SignalJoin, SignalJoinResponse, SignalLeave, SignalLogin, SignalLoginResponse, SignalPublish, SignalResponseBody, SignalRoomMessage } from "./interface";

type RoomMessageHandler = (message: SignalRoomMessage) => void
type RoomMessageCallback = (callback: RoomMessageHandler) => () => void

export interface UseSignalProps {
    onRoomMessage: RoomMessageCallback;
    publishMessage<T>(data: T): Promise<any>
}

export function useSignal(deviceCode: string) {
    
    const toast = useToast()

    // 信令消息请求发送管理
    const requestRef = useRef<SignalRequest | null>(null)
    if (!requestRef.current) {
        requestRef.current = new SignalRequest()
    }
    const signalRequest = requestRef.current

    // 房间消息监听
    const roomMesaageRef = useRef<RoomMessageHandler | null>(null)
    const onRoomMessage: RoomMessageCallback = useCallback((callback: RoomMessageHandler) => {
        roomMesaageRef.current = callback
        return () => {
            if (roomMesaageRef.current == callback) {
                roomMesaageRef.current = null
            }
        }
    }, [])

    // 发送消息
    async function publishMessage<T>(data: T) {
        const body: SignalPublish<T> = { type: 'publish', room: deviceCode, data }
        return createSignalRequest(body)
    }

    // 登录
    async function handlerLogin() {
        const body: SignalLogin = {
            type: 'login',
            data: { from: 'device', token: AuthState.accessToken }
        }
        return createSignalRequest<SignalLoginResponse>(body)
    }

    // 加入房间
    async function handlerJoinRoom() {
        const body: SignalJoin = { type: 'join', room: deviceCode, role: 'anchor' }
        return createSignalRequest<SignalJoinResponse>(body)
    }

    // 离开房间
    async function handlerLeaveRoom() {
        const body: SignalLeave = { type: 'leave', room: deviceCode }
        return createSignalRequest(body)
    }

    // 处理连接成功
    async function handlerConnected() {
        try {
            await handlerLogin()
            await handlerJoinRoom()
        } catch (error: any) {
            // Token 过期，刷新访问 Token 并重新登录
            if (error.code == 401) {
                try {
                    await Service.refreshToken()
                    await handlerConnected()
                } catch(error) {
                    toast.error('登录已过期，请重新登录')
                }
            } else {
                Alert.alert("提示", error.message || '连接失败')
            }
        }
    }

    // 连接状态监听
    useEffect(() => {
        const unsubscribe = SignalModule.onStatus((state) => {
            RTCActions.setSignalState(state)
            if (state == 'connecting') {
                toast.loading('连接中...')
            }
            else if (state == 'disconnected') {
                toast.info('连接已断开', { duration: 1000 })
            }
            else if (state == 'connected') {
                toast.success('连接成功', { duration: 1000 })
                handlerConnected()
            }
        })
        return () => {
            unsubscribe()
            RTCActions.setSignalState(null)
        }
    }, [])

    // 创建请求
    async function createSignalRequest<T>(body: any) {
        const { requestId, promise } = signalRequest.request<SignalResponseBody<T>>()
        const message = { requestId, body }
        try {
            await SignalModule.send(message)
            return await promise
        } catch (error) {
            signalRequest.cancel(requestId)
            throw error
        }
    }
    
    // 接收房间消息
    useEffect(() => {
        const responseListener = SignalModule.onResponse((data) => {
            const { requestId, room, body } = data
            if (requestId != undefined) {
                signalRequest.response(requestId, body)
            } else if (room === deviceCode) {
                roomMesaageRef.current?.(body as SignalRoomMessage)
            }
        })
        return responseListener
    }, [])

    // 打开信令连接
    useEffect(() => {
        SignalModule.open()
        return () => SignalModule.close()
    }, [])

    return {
        onRoomMessage,
        publishMessage
    }
}


