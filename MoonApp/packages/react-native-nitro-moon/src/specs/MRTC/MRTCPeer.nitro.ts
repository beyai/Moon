import type { AnyMap, HybridObject } from 'react-native-nitro-modules'
import type { MRTCIceServer } from './MRTC.nitro';

/** 移除监听器 */
type RemoveListener = () => void;

/** 对等体状态类型 */
export type MRTCPeerState           = 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed' | 'closed' | 'negotiate'
/** 数据通道状态类型 */
export type MRTCDataChannelState    = 'connecting' | 'open' | 'closing' | 'closed'
/** 动作类型 */
export type MRTCActionTypes         = 'propertys' | 'detectResult' | 'detectState' | 'setProperty'

/** 消息类型 */
export type MRTCMessageType = 'config' | 'offer' | 'answer' | 'candidate' 
export interface MRTCPeerConfig {
    type: MRTCMessageType
    iceServers: MRTCIceServer[];
}

/** SDP 类型 */
export type MRTCSdpType = 'offer' | 'answer'
export interface MRTCSessionDescription {
    type: MRTCSdpType;
    sdp: string;
}

export interface MRTCIceCandidate {
    type: MRTCMessageType;
    candidate: string;
    sdpMid: string;
    sdpMLineIndex: number;
}

// 数据消息
export interface MRTCDataChannelMessage {
    action: MRTCActionTypes;
    data: AnyMap;
}

export interface MRTCPeer extends HybridObject<{ ios: 'swift' }> {

    /** 开始 */
    start(): Promise<void>;

    /** 关闭 */
    close(): Promise<void>;
    
    /** 添加 remote description */
    addRemoteDescription(desc: MRTCSessionDescription): void;
    /** 添加 ice candidate */
    addIceCandidate(candidate: MRTCIceCandidate): void;
    /** 发送数据通道消息 */
    sendDataChannelMessage(message: MRTCDataChannelMessage): void;

    /** 监听配置消息 */
    onPeerConfig( listener: (config: MRTCPeerConfig) => void) : RemoveListener
    /** 监听状态变化 */
    onPeerStateChange( listener: (state: MRTCPeerState) => void) : RemoveListener
    /** 监听本地描述 */
    onLocalDescription( listener: (desc: MRTCSessionDescription) => void) : RemoveListener
    /** 监听本地候选 */
    onLocalCandidate( listener: (candidate: MRTCIceCandidate) => void) : RemoveListener
    // 数据通道状态变化
    onDataChannelStateChange( listener: (state: MRTCDataChannelState) => void) : RemoveListener
    // 数据通道消息
    onDataChannelMessage( listener: (message: MRTCDataChannelMessage) => void) : RemoveListener

}