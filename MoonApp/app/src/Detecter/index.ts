import { DetecterEvent } from './Event'
import { Analyze, Cuting, End, Failure, Focus, Idle, Runing } from "./Processor";
import { DetecterEventType, DetecterState } from "./Constraint";
import { PlayDataAction, PlayDataState } from "./PlayStore";

import type { DetectionResult } from "./Constraint";

export { DetecterEventType, DetecterState }

export default class Detecter extends DetecterEvent {

    // 任务处理器
    private taskProcessor = {
        [DetecterState.IDLE]    : new Idle(this),
        [DetecterState.FOCUS]   : new Focus(this),
        [DetecterState.RUNING]  : new Runing(this),
        [DetecterState.ANALYZE] : new Analyze(this),
        [DetecterState.CUTING]  : new Cuting(this),
        [DetecterState.END]     : new End(this),
        [DetecterState.FAILURE] : new Failure(this),
    }

    // 任务名
    private taskName: DetecterState = DetecterState.IDLE

    // 当前任务
    get task() {
        return this.taskProcessor[this.taskName]
    }
    
    // 采样统计
    private sampleCount = 0
    // 上一次采样统计
    private sampleCountByLast = 0
    // 采样计时器
    private sampleTimer: ReturnType<typeof setInterval> | null = null

    constructor() {
        super()
        this.startSample()
        this.task.enter()
    }

    // 开始采样
    private startSample() {
        if (PlayDataState.displayFps) {
            this.sampleTimer = setInterval(() => {
                const fps = this.sampleCount - this.sampleCountByLast
                this.sampleCountByLast = this.sampleCount
                PlayDataAction.addSamplesFps(fps)
            }, 1000)
        }
    }

    /**
     * 重置数据
     */
    reset() {
        PlayDataAction.resetDetecterState()
    }

    /**
     * 切换到下一状态
     * @param state
     */
    nextState(state: DetecterState) {
        PlayDataAction.setDetectionState(state)
        // 触发状态变化
        this.emit(DetecterEventType.STATUS, state)
        // 进入任务
        this.taskName = state
        this.task.enter()
    }

    /**
     * 处理帧数据
     * @param frameData 
     */
    processFrame(frameData: DetectionResult) {
        this.sampleCount++;
        this.task.process(frameData.data, frameData.timestamp)
    }

    /**
     * 销毁
     */
    destroy() {
        if (this.sampleTimer != null ) {
            clearInterval(this.sampleTimer)
        }
        this.removeAllListener()
    }
}