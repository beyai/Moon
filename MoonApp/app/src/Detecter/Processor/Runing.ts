import { Poker } from "@/Constraint";
import { PlayDataAction } from "../PlayStore";
import { BaseProcessor } from "./BaseProcessor";
import { DetecterState } from "../Constraint";
import type { DetecterLabel, DetectLabel } from "../Constraint";

export class Runing extends BaseProcessor {
    // 名称
    readonly name = DetecterState.RUNING
    // 最大允许的空结果数（120帧）
    readonly maxEmptyCount = 120
    // 检测结果没有变化时，停留超时时长（ 5秒 ）
    readonly maxStayTimeout = 5000;

    // 连续空结果累计
    private emptyCount: number = 0
    // 上一帧检测到的所有标签权重值
    private lastWeight: number[] = []
    // 上一次停留时间
    private stayTime: number | null = null

    /**
     * 进入
     */
    enter() {
        this.emptyCount = 0
        this.lastWeight = []
        this.stayTime   = null
        console.log('任务', this.name)
    }

    /**
     * 接收数据， 开始处理
     * @param data 
     */
    process(labels: DetectLabel[], timestamp: number ) {
        if (labels.length) {
            this.handlerResult(labels, timestamp)
        } else {
            this.handlerEmptyResult()
        }
    }

    /**
     * 处理空结果
     */
    private handlerEmptyResult() {
        this.emptyCount++
        // 超出连续检测到空结果, 进入：分析状态
        if (this.emptyCount >= this.maxEmptyCount) {
            this.ctx.nextState(DetecterState.ANALYZE)
        }
    }

    /**
     * 处理检测结果
     */
    private handlerResult(labels: DetectLabel[], timestamp: number) {
        this.emptyCount = 0
        // 获取当前帧的权重
        const labelNames = labels.map(item => item.label as Poker.Name )
        const weight = Poker.getWeightValues(labelNames)

        // 初始化检测
        if (this.stayTime == null ) {
            this.lastWeight = weight
            this.stayTime = timestamp
            this.addRecord(labels, timestamp)
            return;
        }

        // 是否结果相同
        const isWeightEqual = Poker.equalWeight(weight, this.lastWeight)
        
        // 画面静止/检测结果未变
        if (isWeightEqual) {
            // 是否停留超时
            const isStayTimeout = (timestamp - this.stayTime >= this.maxStayTimeout)
            // 重新进入：对牌状态
            if (isStayTimeout) {
                this.ctx.nextState(DetecterState.IDLE)
                return
            }
        } else {
            // 检测到变化，重置计时器和对比基准
            this.lastWeight = weight
            this.stayTime   = timestamp    
        }

        // 只要没超时返回，每一帧都会记录数据
        this.addRecord(labels, timestamp)
    }

    /**
     * 追加检测记录
     */
    private addRecord(labels: DetectLabel[], timestamp: number) {
        for (const item of labels) {
            const [ x, y, width, height ] = item.rect
            let centerX = Number( ( x + width  / 2 ).toFixed(5) )
            let centerY = Number( ( y + height / 2 ).toFixed(5) )

            let record = {
                timestamp: timestamp,
                label: item.label,
                confidence: item.confidence,
                rect: item.rect,
                width,
                height,
                centerX,
                centerY
            } as DetecterLabel

            PlayDataAction.addDetectionRecord(record)
        }
    }

}