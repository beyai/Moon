import { DeviceActiveLevel } from "./Device";

// 设备采集格式
export interface DeviceFormat {
    width: number;
    height: number;
    maxFps: number;
}

// WebRTC 视频流配置
export interface LiveStream {
    // 视频宽度
    width: number;
    // 视频高度
    height: number;
    // 最大帧率
    framerate: number;
    // 码率
    bitrate: number;
    // 码率优先级 高 > 1 < 低
    bitratePriority?: number;
    // 分层模式
    scalabilityMode?: 'L1T2' | 'L1T3';
    //  网络优先级
    networkPriority?: 'low' | 'medium' | 'high';
    // 偏好
    preference?: 'balanced' | 'maintainResolution' | 'maintainFramerate' | 'disabled';
}

// 激活等级码率配置
export interface LiveStreamLeave {
    framerate: number;
    bitrate: number
}

export interface LiveStreamLevels {
    [DeviceActiveLevel.LOW]: LiveStreamLeave
    [DeviceActiveLevel.MEDIUM]: LiveStreamLeave
    [DeviceActiveLevel.HIGH]: LiveStreamLeave
}

// TURN 服务器配置
export interface IceServer {
    urls: string[];
    username?: string;
    credential?: string;
}

