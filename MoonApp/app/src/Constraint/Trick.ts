enum Trick {
    // 洗牌
    shuffle = 'shuffle',
    // 拨到顶
    pokeTop = 'pokeTop',
    // 拨到中间
    pokeMiddle = 'pokeMiddle',
    // 洗牌+拨到顶
    shufflePokeTop = 'shufflePokeTop',
    // 洗牌+拨到中间
    shufflePokeMiddle = 'shufflePokeMiddle',
}

interface TrickData {
    label: string;
    value: Trick
}

namespace Trick {
    
    // 游戏分类数据
    export const data: TrickData[] = [
        { label: '洗牌', value: Trick.shuffle  },
        // { label: '拨到顶', value: Trick.pokeTop  },
        // { label: '拨到中间', value: Trick.pokeMiddle  },
        // { label: '洗牌+拨到顶', value: Trick.shufflePokeTop  },
        // { label: '洗牌+拨到中间', value: Trick.shufflePokeMiddle  },
    ]

    // 获取当前游戏标签
    export function getLabel(type: Trick): string {
        for (const item of data) {
            if (type == item.value) {
                return item.label
            }
        }
        return ''
    }
}


export {
    Trick
}