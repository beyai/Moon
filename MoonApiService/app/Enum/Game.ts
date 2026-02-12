
interface LabelData<T> {
    label: string;
    value: T
}

function getDataLabel<T>( data: LabelData<T>[], value: T ): string {
    for (const item of data) {
        if (value === item.value) {
            return item.label
        }
    }
    return ''
}

/** 游戏状态 */
export enum GameStatus {
    NORMAL      = 1,
    DISABLED    = 0
}

// 游戏
export enum GameType {
    dezhou = 'dezhou',
    jinhua = 'jinhua',
    baijiale = 'baijiale',
    sangong = 'sangong',
}

export namespace GameType {
    
    export function getDict(): LabelData<GameType>[] {
        return [
            { label: '德州', value: GameType.dezhou  },
            { label: '金花', value: GameType.jinhua  },
            { label: '百家乐', value: GameType.baijiale  },
            { label: '三公', value: GameType.sangong  },
        ]
    }

    export function getLabel(value: GameType): string {
        return getDataLabel(getDict(), value)
    }
}


// 手法
export enum GameTrick {
    shuffle = 'shuffle', // 洗牌
    pokeTop = 'pokeTop', // 拨到顶
    pokeMiddle = 'pokeMiddle', // 拨到中间
    shufflePokeTop = 'shufflePokeTop', // 洗牌+拨到顶
    shufflePokeMiddle = 'shufflePokeMiddle', // 洗牌+拨到中间
}

export namespace GameTrick {
    export function getDict(): LabelData<GameTrick>[] {
        return [
            { label: '洗牌', value: GameTrick.shuffle  },
            // { label: '拨到顶', value: GameTrick.pokeTop  },
            // { label: '拨到中间', value: GameTrick.pokeMiddle  },
            // { label: '洗牌+拨到顶', value: GameTrick.shufflePokeTop  },
            // { label: '洗牌+拨到中间', value: GameTrick.shufflePokeMiddle  },
        ]
    }
    export  function getLabel(value: GameTrick): string {
        return getDataLabel(getDict(), value)
    }
}
/**
 * 切牌
 */
export enum GameCutCard {
    not = 'not', // 不切牌
    continue = 'continue', // 连续切牌
    seeBottom = 'seeBottom', // 看底
    seeTop = 'seeTop', // 看顶
    seeHand = 'seeHand', // 看手牌
}

export namespace GameCutCard {
    export function getDict(): LabelData<GameCutCard>[] {
        return [
            { label: '不切牌', value: GameCutCard.not  },
            { label: '连续切牌', value: GameCutCard.continue },
            // { label: '看底', value: GameCutCard.seeBottom },
            // { label: '看顶', value: GameCutCard.seeTop },
            // { label: '看手牌', value: GameCutCard.seeHand },
        ]
    }
    export  function getLabel(value: GameCutCard): string {
        return getDataLabel(getDict(), value)
    }
}


/**
 * 发牌方式
 */
export interface GameDealWay {
    direction: 'forward' | 'backward',
    size: number
}