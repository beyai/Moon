import { Poker } from '@/Constraint';
export type { DetectionResult, DetectLabel } from 'react-native-nitro-moon'

/**
 * 检测器状态
 */
export enum DetecterState {
    // 空闲
    IDLE    = "idle",
    // 对牌
    FOCUS   = "focus",
    // 高速检测
    RUNING  = "runing",
    // 分析结果
    ANALYZE = "analyze",
    // 切牌
    CUTING  = "cuting",
    // 完成
    END     = "end",
    // 失败
    FAILURE = "failure",
}

/**
 * 检测记录
 */
export type DetecterLabel = {
    timestamp: number;
    label: Poker.Name;
    confidence: number;
    rect: number[];
    centerX: number;
    centerY: number;
    width: number;
    height: number;
}


/**
 * 事件类型
 */
export enum DetecterEventType {
    FPS     = 'fps',
    CUT     = 'cut',
    STATUS  = 'status',
    RESULT  = 'result',
}

export interface DetecterEventMap {
    // 帧率监听器
    [DetecterEventType.FPS]: (fps: number) => void
    // 切牌次数监听器
    [DetecterEventType.CUT]: (count: number) => void
    // 状态监听器
    [DetecterEventType.STATUS]: (state: DetecterState) => void
    // 检测结果监听器
    [DetecterEventType.RESULT]: (result: Poker.Name[]) => void
}