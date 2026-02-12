import { Cut, Poker } from "@/Constraint";
import { PlayDataState, PlayDataAction } from "../PlayStore";
import { BaseProcessor } from "./BaseProcessor";
import { DetecterState } from "../Constraint";
import { calculateShuffleOrder } from '../Arithmetic'

export class Analyze extends BaseProcessor {

    // 名称
    readonly name = DetecterState.ANALYZE
    
    /**
     * 进入
     */
    enter() {
        console.log('任务', this.name)
        this.analyzeRecord()
    }

    /**
     * 分析检测记录
     */
    private analyzeRecord() {
        // 获取所有检测记录
        const records = [...PlayDataState.detectionRecord]
        
        // 分析检测结果
        const result:Poker.Name[] = calculateShuffleOrder(records)
        // console.log("检测结果", result.join(', '))

        // 设置检测结果
        PlayDataAction.setDetectionResult(result)
        
        let isCheckPass = true

        const resultSet = new Set(result)
        // 验证所有已设用牌是否都存在
        if (PlayDataState.isShuffleFull) {
            const usedPoker = PlayDataState.usedPoker
            for (const card of usedPoker) {
                if (!resultSet.has(card)) {
                    isCheckPass = false
                    break;
                }
            }
        }
        // 验证最少检测牌张数
        else if (result.length < PlayDataState.minCards) {
            isCheckPass = false
        }

        // 检测不通过
        if (!isCheckPass) {
            this.ctx.nextState(DetecterState.FAILURE)
            return;
        }

        // 切牌
        if (PlayDataState.cutCard == Cut.not) {
            this.ctx.nextState(DetecterState.END)
            return
        } else {
            this.ctx.nextState(DetecterState.CUTING)
        }
    }




}