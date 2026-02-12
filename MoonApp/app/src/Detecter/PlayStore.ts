import { Poker, Cut, Game, Trick } from '@/Constraint';
import { createStore } from '@/Store/BaseStore';
import { DetecterState, type DetecterLabel } from './Constraint'
import { GamePlayData } from '@/Service/interface';
import { GameState } from '@/Store';



export interface GamePlayState extends GamePlayData {
    // 最小检测牌张数
    minCards: number;
    // 对排张数据
    focusNum: number;
    // 是否显示帧率
    displayFps: boolean;
    // 采样帧率
    samplesFps: number[];
    // 当前检测状态
    detectionState: DetecterState;
    // 检测记录
    detectionRecord: Set<DetecterLabel>
    // 切牌记录
    cutingRecord: Poker.Name[];
    // 检测结果
    detectionResult: Set<Poker.Name>
}

const DeafultData: GamePlayState = {
    /** 游戏数据 */
    playId          : undefined,
    gameId          : 0,
    name            : '',
    cutCard         : 'not',
    trick           : 'shuffle',
    useCards        : [ 255, 255, 255, 255, 255, 255, 15  ],
    score           : [ 1,2,3,4,5,6,7,8,9,10,10,10,10,0,0 ],
    people          : 2,
    handCards       : 2,
    isShuffleFull   : false,

    minCards        : 3,
    focusNum        : 1,
    
    /** 检测器 */
    displayFps      : true,
    // displayFps      : __DEV__,
    samplesFps      : [] as number[],
    detectionState  : DetecterState.IDLE,
    detectionRecord : new Set() as Set<DetecterLabel>, // Set 提高性能，Array 卡 UI
    cutingRecord    : [] as Poker.Name[],
    detectionResult : new Set() as Set<Poker.Name>

}

export const {
    state: PlayDataState,
    actions: PlayDataAction,
    useStore: usePlayStore,
    useSnapshot: usePlaySnap
} = createStore({

    name: 'PlayData',
    
    // 数据状态
    state: {
        ...DeafultData
    } as GamePlayState,

    // 计算
    getters: {
        // 获取当前使用的牌
        usedPoker(): Poker.Name[] {
            return Poker.getWeightKeys(this.useCards)
        },

    },

    // 动作
    actions: {

        // 初始化玩法配置数据
        initPlayData(data?: GamePlayState) {
            if (data) {
                const { playId, gameId, name, cutCard, trick, useCards, score, people, handCards, isShuffleFull, minCards, focusNum } = data;
                Object.assign(this, { playId, gameId, name, cutCard, trick, useCards, score, people, handCards, isShuffleFull,  minCards, focusNum })
            } else {
                const { playId, gameId, name, cutCard, trick, useCards, score, people, handCards, isShuffleFull } = DeafultData;
                Object.assign(this, { playId, gameId, name, cutCard, trick, useCards, score, people, handCards, isShuffleFull })
                const defaultGame = GameState.gameAllList[0]
                this.gameId = defaultGame.gameId
                this.name = defaultGame.name
            }
        },
        // 导出玩法数据
        exportPlayData(): GamePlayData {
            const { playId, gameId, name, cutCard, trick, useCards, score, people, handCards, isShuffleFull } = this;
            return {
                playId, gameId, name, cutCard, trick, useCards, score, people, handCards, isShuffleFull
            }
        },

        /** 玩法配置 */

        // 设置数据
        setPlayData<K extends keyof GamePlayState>(key: K, value: typeof PlayDataState[K]) {
            this[key] = value
        },
        // 设置当前使用的牌
        setUsedPoker(cards: Poker.Name[] ) {
            this.useCards =  Poker.getWeightValues(cards)
        },

        /** 检测器 */

        // 设置检测状态
        setDetectionState(state: DetecterState) {
            this.detectionState = state
        },
        // 添加采样帧率
        addSamplesFps(fps: number) {
            let samples = this.samplesFps.slice(-29);
            samples.push(fps)
            this.samplesFps = samples;
        },
        // 添加检测记录
        addDetectionRecord(record: DetecterLabel) {
            this.detectionRecord.add(record)
        },
        // 添加切牌记录
        addCutingRecord(names: Poker.Name[]) {
            this.cutingRecord = this.cutingRecord.concat(names)
        },
        // 设置检测结果
        setDetectionResult(names: Poker.Name[]) {
            this.detectionResult = new Set(names)
        },
        // 重置检测器数据状态 注意：不要重置检测结果
        resetDetecterState() {
            this.detectionRecord.clear()
            this.cutingRecord       = []
        },

    }
})
