import { BaseProcessor } from "./BaseProcessor";
import { DetecterState, DetectLabel } from "../Constraint";
import { Poker } from "@/Constraint";

export class Focus extends BaseProcessor {
    // 名称
    readonly name = DetecterState.FOCUS
    // 最大允许的空结果次数（30帧）
    readonly maxEmptyCount = 30
    // 最小对牌次数（3帧）
    readonly minFocusCount = 3;

    // 连续空结果累计
    private emptyCount = 0
    // 检测结果累计
    private count = 0
    // 上一帧检测到的所有标签权重值
    private lastWeight: number[] = []

    /**
     * 进入
     */
    enter() {
        this.emptyCount = 0
        this.count      = 0
        this.lastWeight = []
        console.log('任务', this.name)
    }

    /**
     * 接收数据， 开始处理
     * @param data 
     */
    process(labels: DetectLabel[], timestamp?: number ) {
        if (labels.length) {
            this.handlerResult(labels)
        } else {
            this.handlerEmptyResult()
        }
    }

    /**
     * 处理空结果
     */
    private handlerEmptyResult() {
        this.emptyCount++
        // 超出连续检测到空结果, 回退到：空闲状态
        if (this.emptyCount >= this.maxEmptyCount) {
            this.ctx.nextState(DetecterState.IDLE)
        }
    }

    /**
     * 处理检测结果
     */
    private handlerResult(labels: DetectLabel[]) {
        this.emptyCount = 0
        
        // 获取当前帧的权重
        const labelNames = labels.map(item => item.label as Poker.Name )
        const weight = Poker.getWeightValues(labelNames)

        // 是否结果相同
        const isWeightEqual = Poker.equalWeight(weight, this.lastWeight)
        // 对比上一次与当前权重值是否相同
        if (isWeightEqual) {
            this.count++
            // 达到连续最小对牌结果，进入：正式检测状态
            if (this.count >= this.minFocusCount) {
                this.ctx.nextState(DetecterState.RUNING)
            }
        } else {
            // 不相同时重置状态
            this.count = 1
            this.lastWeight = weight
        }

    }

}