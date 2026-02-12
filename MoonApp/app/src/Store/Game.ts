import { GameData, GameDictMap, GamePlayData } from "@/Service/interface";
import { createStore } from "./BaseStore";
import { Service } from "@/Service";
import { Poker } from "@/Constraint";

export const {
    state: GameState,
    actions: GameActions,
    useStore: useGameStore,
    useSnapshot: useGameSnapshot,
} = createStore({

    name: 'gameStore',

    state: {
        // 是否刷新中
        isRefresh: true,
        // 游戏字典配置
        gameDict: null as GameDictMap | null,
        // 游戏列表
        gameAllList: [] as GameData[],
        // 游戏玩法列表
        gamePlayList: new Map() as Map<string, GamePlayData>
    },

    getters: {
        /** 是否初始化 */
        isInit() {
            return !!this.gameDict
        },
        /** 游戏类型列表 */
        typeDict() {
            return this.gameDict ? this.gameDict.type : []
        },
        /** 手法类型列表 */
        trickDict() {
            return this.gameDict ? this.gameDict.trick : []
        },
        /** 切牌类型列表 */
        cutCardDict() {
            return this.gameDict ? this.gameDict.cutCard : []
        },

        /** 游戏配置 */
        gameType() {
            return this.gameAllList.map(item => {
                return {
                    label: item.name,
                    value: item.gameId,
                }
            })
        },

        /** 默认游戏ID */
        defaultGameId() {
            if (this.gameAllList[0]) {
                return this.gameAllList[0].gameId
            }
            return 1
        },

        playList() {
            return [...this.gamePlayList.values()]
        }
    },

    actions: {

        /** 初始化加载 */
        async initFetch() {
            const [ { data: gameDict }, { data: gameAll } ] = await Promise.all([
                Service.gameDict(),
                Service.gameAllList()
            ])
            this.gameDict = gameDict;
            this.gameAllList = gameAll;
        },

        /** 加载玩法列表 */
        async getGamePlayList() {
            try {
                this.isRefresh = true
                const { data } = await Service.gamePlayList()
                this.gamePlayList.clear()
                data.forEach(item => {
                    this.gamePlayList.set(item.playId!, item)
                })
            } finally {
                this.isRefresh = false
            }
        },

        /** 创建玩法 */
        async createGamePlay(data: GamePlayData) {
            const { data: playData } = await Service.createGamePlay(data)
            let newList = new Map<string, GamePlayData>([
                [playData.playId!, playData],
                ...this.gamePlayList
            ])
            this.gamePlayList = newList
        },

        /** 更新玩法 */
        async updateGamePlay(data: GamePlayData) {
            const { data: playData } = await Service.updateGamePlay(data)
            let newList = new Map<string, GamePlayData>([
                ...this.gamePlayList,
                [playData.playId!, playData],
            ])
            this.gamePlayList = newList
        },

        /** 删除玩法 */
        async removeGamePlay(playId: string) {
            await Service.removeGamePlay(playId)
            this.gamePlayList.delete(playId)
            this.gamePlayList = new Map([...this.gamePlayList])
        },

        /** 游戏类型名称 */
        typeLabel(value: string) {
            const item = this.typeDict.find(item => item.value === value)
            return item?.label
        },
        /** 手法类型名称 */
        trickLabel(value: string) {
            const item = this.trickDict.find(item => item.value === value)
            return item?.label
        },
        /** 切牌类型名称 */
        cutCardLabel(value: string) {
            const item = this.cutCardDict.find(item => item.value === value)
            return item?.label
        },

        /** 获取游戏名称 */
        gameTypeLabel(gameId: number) {
            const item = this.gameAllList.find(item => item.gameId === gameId)
            return item?.name
        },

        /** 获取游戏信息 */
        getGameData(gameId: number) {
            return this.gameAllList.find(item => item.gameId === gameId)
        },
        
        // 获取当前使用的牌
        getUsedCardSize(useCards: number[]) {
            return Poker.getWeightKeys(useCards).length
        },


    }
})
    