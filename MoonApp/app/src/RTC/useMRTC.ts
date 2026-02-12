import {  useEffect, useRef } from "react";
import { MRTC, MRTCDataChannelMessage,  MRTCIceCandidate, MRTCPeer,MRTCSessionDescription, RemoveListener } from "react-native-nitro-moon";
import { UseSignalProps } from "./useSignal";
import { RoomMember } from "./interface";
import { RTCActions, useRtcStore } from "./RTCStore";
import { DeviceActions, useDeviceStore } from "@/Store";
import { usePlayStore } from "@/Detecter/PlayStore";
import { DetecterState } from "@/Detecter";

export type DataChannelMessageHandler = (message: MRTCDataChannelMessage) => void
export type DataChannelCallback = (callback: DataChannelMessageHandler) => () => void


export function useMRTC(signal: UseSignalProps) {

    const peerRef = useRef<MRTCPeer | null>(null)
    const peerConfigListener         = useRef<RemoveListener | null>(null)
    const peerStateListener          = useRef<RemoveListener | null>(null)
    const localDescriptionListener   = useRef<RemoveListener | null>(null)
    const localCandidateListener     = useRef<RemoveListener | null>(null)
    const dataChannelStateListener   = useRef<RemoveListener | null>(null)
    const dataChannelMessageListener = useRef<RemoveListener | null>(null)
    
    // 移出全部事件监听 
    function removeAllListener() {
        peerConfigListener.current?.()
        peerStateListener.current?.()
        localDescriptionListener.current?.()
        localCandidateListener.current?.()
        dataChannelStateListener.current?.()
        dataChannelMessageListener.current?.()
    }

    // 处理 RTC 消息
    function handleSignalMessage(data: MRTCSessionDescription | MRTCIceCandidate) {
        if (data.type === 'answer') {
            let desc = data as MRTCSessionDescription
            peerRef.current?.addRemoteDescription(desc)
        } else if (data.type == 'candidate') {
            let candidate = data as MRTCIceCandidate
            peerRef.current?.addIceCandidate(candidate)
        }
    }

    // 创建
    async function createPeer() {
        if (peerRef.current) return peerRef.current;
        const peer = MRTC.createPeer()
        peerConfigListener.current          = peer.onPeerConfig(config => signal.publishMessage(config))
        localDescriptionListener.current    = peer.onLocalDescription(desc => signal.publishMessage(desc) )
        localCandidateListener.current      = peer.onLocalCandidate(candidate => signal.publishMessage(candidate) )
        peerStateListener.current           = peer.onPeerStateChange(state => RTCActions.setPeerState(state))
        dataChannelStateListener.current    = peer.onDataChannelStateChange(state => RTCActions.setDataChannelState(state))

        // 接收数据通道消息
        dataChannelMessageListener.current  = peer.onDataChannelMessage(message => {
            // 设置画面属性
            if (message.action == 'setProperty') {
                const { key , value } = message.data
                switch (key) {
                    case 'orientation': 
                        return DeviceActions.rotateOrientation()
                    case 'position': 
                        return DeviceActions.filpCamera()
                    case "zoom":
                    case "exposure":
                    case "focus":
                    case "fps":
                    case "brightness":
                        return DeviceActions.setCamera(key, value as number)
                }
            }
        })

        peerRef.current = peer
        await peer.start()
    }

    // 关闭
    async function closePeer() {
        removeAllListener()
        if (peerRef.current){
            await peerRef.current.close()
            RTCActions.setPeerState(null)
            RTCActions.setDataChannelState(null)
            peerRef.current.dispose()
            peerRef.current = null
        }
    }

    // 处理房间成员
    async function handlerRoomMembers(members: RoomMember[]) {
        const hasAudience = members.some(member => member.role == 'audience')
        if (!hasAudience) {
            return await closePeer()
        }
        try {
            await closePeer();
            await createPeer()
        } catch(error: any) {
            console.log(error)
        }
    }

    // 发送数据通道消息
    function sendDataChannelMessage(message: MRTCDataChannelMessage) {
        peerRef.current?.sendDataChannelMessage(message)
    }

    // 同步更新设备属性
    const { dataChannelState } = useRtcStore()
    const { zoom, exposure, focus, fps, brightness, position, orientation, battery } = useDeviceStore();
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
    useEffect(() => {
        timer.current && clearTimeout(timer.current)
        if (dataChannelState == 'open') {
            timer.current = setTimeout(() => {
                let data = {
                    action: 'propertys',
                    data: { position, orientation, zoom, exposure, focus, fps, brightness, battery }
                } as MRTCDataChannelMessage
                peerRef.current?.sendDataChannelMessage(data)
            }, 200)
        }
        return () => {
            timer.current && clearTimeout(timer.current)
        }
    }, [
        dataChannelState,
        position, orientation, zoom, exposure, focus, fps, brightness, battery
    ])

    // 监听检测结果
    const { detectionState, detectionResult} = usePlayStore()
    useEffect(() => {
        if (detectionState == DetecterState.END ) {
            let data = {
                action: 'detectResult',
                data: { result: Array.from(detectionResult) }
            } as MRTCDataChannelMessage
            peerRef.current?.sendDataChannelMessage(data)
        }
    }, [ detectionState, detectionResult ])

    // 接收房间消息
    useEffect(() => {
        const unsubscribe = signal.onRoomMessage((message) => {
            if (message.type == 'members') {
                handlerRoomMembers(message.data)
            }
            else if (message.type == 'message') {
                handleSignalMessage(message.data)
            }
            else if (message.type == 'kickout') {
                closePeer()
            }
        })
        return unsubscribe
    }, [])

    // 组件卸载时释放 Peer 和监听器
    useEffect(() => {
        return () => {
            closePeer()
        }
    }, [])

    return {
        sendDataChannelMessage,
    }
}