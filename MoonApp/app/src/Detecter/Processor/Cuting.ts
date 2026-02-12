import { PlayDataAction, PlayDataState } from "../PlayStore";
import { Cut, Poker } from "@/Constraint";
import { BaseProcessor } from "./BaseProcessor";
import { DetecterEventType, DetecterState, DetectLabel } from "../Constraint";

export class Cuting extends BaseProcessor {
    // 名称
    readonly name = DetecterState.CUTING

    // 首次切牌最大停留时长（ 10秒 ），超出该时长进入：失败状态
    readonly firstStayTimeout = 10000
    // 最大静止超时 (10秒)，超出该时长进入：失败状态
    readonly maxStaticTimeout = 10000
    // 切牌后最大停留时长（ 3秒 ），超出该时长进入：完成状态
    readonly nextStayTimeout = 3000
    // 切牌确定是等待 300ms 进入下一轮切牌


    // 最小确认次数：连续 n次 检测都一样时才算正确
    readonly minConfirmCount = 5

    // 切牌次数
    private total  = 0
    // 当前帧结果的连续确认计数
    private confirmCount = 0
    // 上次切牌结果
    private lastWeight: number[] = []
    // 上一帧时间
    private stayTime: number | null = null
    // 进入时间
    private enterTime: number | null = null
    // 画面静止时间
    private staticTime: number | null = null
    

    /**
     * 进入
     */
    enter() {
        this.total = 0
        this.confirmCount = 0
        this.lastWeight = []
        this.stayTime   = null
        this.enterTime  = null

        console.log('任务', this.name)
        // 不切牌, 进入：完成状态
        if (PlayDataState.cutCard == Cut.not) {
            this.ctx.nextState(DetecterState.END)
        }
    }

    /**
     * 接收数据， 开始处理
     * @param data 
     */
    process(labels: DetectLabel[], timestamp: number ) {
        // 设置进入时间
        if (this.enterTime == null) {
            this.enterTime = timestamp
        }
        if (labels.length) {
            this.handlerResult(labels, timestamp)
        } else {
            this.handlerEmptyResult(timestamp)
        }
    }

    /**
     * 处理空结果
     */
    private handlerEmptyResult(timestamp: number) {
        // 如果从来没看到过牌
        if (this.stayTime == null ) {
            // 未切牌：超时 -> 失败状态
            if (timestamp - (this.enterTime!) >= this.firstStayTimeout) {
                this.ctx.nextState(DetecterState.FAILURE)
            }
        }
        // 如果曾经看到过牌，但现在牌没了
        else {
            // 切牌等待：超时 -> 完成状态
            if (timestamp - this.stayTime >= this.nextStayTimeout) {
                this.ctx.nextState(DetecterState.END)
            }
        }
    }

    /**
     * 处理检测结果
     */
    private handlerResult(labels: DetectLabel[], timestamp: number) {
        this.stayTime = timestamp

        // 获取当前帧的权重
        const labelNames    = labels.map(item => item.label as Poker.Name )
        const weight        = Poker.getWeightValues(labelNames)
        const isWeightEqual = Poker.equalWeight(weight, this.lastWeight)
        
        if (isWeightEqual) {
            this.confirmCount++

            // 画面静止：超出时间 -> 完成状态
            if (this.staticTime != null && (timestamp - this.staticTime >= this.maxStaticTimeout) ) {
                this.ctx.nextState(DetecterState.END)
                return
            }
            // 确认切牌：只有在达到确认次数的那一帧，才处理业务逻辑（防止抖动）
            if (this.confirmCount === this.minConfirmCount) {
                this.onConfirmed()
            }
        } else {
            this.confirmCount = 1
            this.lastWeight = weight
            this.staticTime = timestamp
        }
    }

    /**
     * 切牌确认
     */
    private onConfirmed() {
        this.total++
        let currentCard = Poker.getWeightKeys(this.lastWeight)
        PlayDataAction.addCutingRecord(currentCard)
        this.ctx.emit(DetecterEventType.CUT, this.total)
        console.log("本次切牌", currentCard)
    }

}