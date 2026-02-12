import { BaseProcessor } from "./BaseProcessor";
import { DetecterState, DetectLabel } from "../Constraint";
import { PlayDataAction, PlayDataState } from "../PlayStore";

export class End extends BaseProcessor {
    // 名称
    readonly name = DetecterState.END
    // 连续空闲时长（1秒）后回到 IDLE
    readonly minIdleTimeout = 1000
    // 记录空闲开始的时间点
    private idleStartTime: number | null = null

    /**
     * 进入
     */
    enter() {
        this.idleStartTime = null
        this.handlerComplete()
        console.log('任务', this.name)
    }

    /**
     * 接收数据， 开始处理
     * @param data 
     */
    process(labels: DetectLabel[], timestamp: number ) {
        let isEmpty = (labels.length === 0)
        if (isEmpty) {
            // 发现空闲，初始化计时起点
            if (this.idleStartTime == null) {
                this.idleStartTime = timestamp
                return
            }
            // 检查空闲时长是否达标
            if (timestamp - this.idleStartTime >= this.minIdleTimeout) {
                this.ctx.nextState(DetecterState.IDLE)
                return
            }
        } else {
            // 画面中又出现了东西，重置计时器
            this.idleStartTime = null
        }
    }

    /**
     * 处理完成
     */
    private handlerComplete() {
        // 分析后的结果
        let result = [...PlayDataState.detectionResult]
        
        // 按切牌顺序上下交换位置
        for (let label of [...PlayDataState.cutingRecord]) {
            let index   = result.indexOf(label)
            let arr     = result.splice(0, index + 1)
            result      = result.concat(arr)
        }

        // 更新后终结果
        PlayDataAction.setDetectionResult(result)
    }

}