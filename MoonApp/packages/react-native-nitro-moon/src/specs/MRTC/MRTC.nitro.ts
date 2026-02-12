import type { HybridObject } from 'react-native-nitro-modules'
import type { MRTCPeer } from './MRTCPeer.nitro'

export type MRTCNetworkPriority = 'low' | 'medium' | 'high'
export type MRTCPreference = 'balanced' | 'maintainResolution' | 'maintainFramerate' | 'disabled'

export interface MRTCLiveStream {
    /** 视频宽度 */
    width: number;
    /** 视频高度 */
    height: number;
    /** 视频帧率 */
    framerate: number;
    /** 视频码率 */
    bitrate: number;
    /** 视频 scalability mode */
    scalabilityMode?: string;
    /** 码率优先级 */
    bitratePriority?: number;
    /** 网络优先级 */
    networkPriority?: MRTCNetworkPriority;
    /** 偏好 */
    preference?: MRTCPreference;
}

export interface MRTCIceServer {
    urls: string[];
    username?: string;
    credential?: string;
}

export interface MRTC extends HybridObject<{ ios: 'swift' }> {
    /** 设置直播流 */
    setLiveStream(stream: MRTCLiveStream): void;
    /** 设置 ice servers */
    setIceServers(servers: MRTCIceServer[]): void;
    /** 创建 peer connection */
    createPeer(): MRTCPeer;
}