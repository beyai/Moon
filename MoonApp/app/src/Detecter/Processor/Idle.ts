import { PlayDataState } from "../PlayStore";
import { BaseProcessor } from "./BaseProcessor";
import { DetecterState, DetectLabel } from "../Constraint";
import { Poker } from "@/Constraint";

export class Idle extends BaseProcessor {
    // 名称
    readonly name = DetecterState.IDLE
    
    /**
     * 进入
     */
    enter() {
        this.ctx.reset()
        console.log('任务', this.name)
    }
    
    /**
     * 接收数据， 开始处理
     * @param data 
     */
    process(labels: DetectLabel[], timestamp?: number ) {
        const labelNames = labels.map(item => item.label as Poker.Name )
        // 开始对牌
        if (Poker.uniq(labelNames).length >= PlayDataState.focusNum) {
            this.ctx.nextState(DetecterState.FOCUS)
        }
    }

}